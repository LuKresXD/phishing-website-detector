/**
 * In-process phishing classifier — a faithful TypeScript port of the former
 * Python ML server (ml/scripts/server.py + preprocess.py).
 *
 * It extracts the same 22 URL features, scales them with the trained
 * StandardScaler, and runs the trained LogisticRegression in-process, so the
 * site no longer depends on an always-on Python/Flask sidecar and can run on
 * Vercel's serverless runtime.
 *
 * Model artifacts (coefficients, intercept, scaler mean/scale) were exported
 * from ml/models/logistic_model.pkl + scaler.pkl (sklearn 1.2.2). The decision
 * math (sigmoid(coef·x_scaled + intercept)) is version-stable.
 *
 * Network-dependent features (DNS, WHOIS, page content, redirects) are fetched
 * behind an SSRF guard that blocks private/reserved IP ranges on every redirect
 * hop, since these requests target user-supplied URLs.
 */
import * as dns from 'dns';
import * as net from 'net';
import { load as loadHtml } from 'cheerio';

// ── Trained model artifacts (logistic_model.pkl + scaler.pkl) ──────────────
// Feature order is the column order produced by preprocess.extract_features.
const FEATURE_NAMES = [
    'using_ip', 'shortened_url', 'at_symbol', 'double_slash_redirect',
    'prefix_suffix', 'sub_domains', 'special_chars', 'https', 'domain_length',
    'suspicious_tld', 'entropy', 'domain_registration_length', 'dns_record',
    'favicon', 'request_url', 'anchor_url', 'links_in_scripts',
    'server_form_handler', 'iframe_redirection', 'status_bar_customization',
    'disable_right_click', 'website_forwarding',
] as const;

const COEF = [
    -0.03762606601596, -0.0006045584080078054, -0.31213818445651614,
    -0.4693013146162244, -0.5038444704341462, 0.8483248540368175,
    -3.899760112603124, 4.155205356647961, -0.9663930973551308,
    -0.29011948682958677, -0.22103173182869557, 1.2438533476289937,
    0.918586984529548, -0.167061344251264, 0.19551721760847532,
    -0.3937646297356586, 0.510003504490182, 0.8268880785030297,
    0.4873177073228751, 0.4286418022780973, 0.06797695681576178,
    -0.25842726854918374,
];
const INTERCEPT = -1.7483365399887023;
const SCALER_MEAN = [
    0.0025, 0.044, 0.006666666666666667, 0.005, 0.1935, 1.1568333333333334,
    1.1223333333333334, 0.7436666666666667, 21.916333333333334,
    0.019833333333333335, 3.4905326579326, 3664.3986666666665,
    0.7876666666666666, 0.1095, 0.3147238787103077, 0.4087184288444307,
    0.17395596489413112, 0.16666666666666666, 0.12316666666666666,
    0.08533333333333333, 0.00016666666666666666, -0.194,
];
const SCALER_SCALE = [
    0.04993746088859545, 0.20509509989270833, 0.08137703743822468,
    0.07053367989832943, 0.39504145352101977, 0.6331692550618323,
    1.170911847901265, 0.4366080113277304, 9.655085010270783,
    0.13942730084966223, 0.4129604392931135, 3858.0398979790534,
    0.4089595198658284, 0.312265512024623, 0.44427868326940206,
    0.45277039517927287, 0.281646559017124, 0.37267799624996495,
    0.32862842069560705, 0.279377084879121, 0.012908868613820842,
    0.6413766444141851,
];

const SUSPICIOUS_TLDS = new Set(['.tk', '.ml', '.ga', '.cf', '.gq']);

const SHORTENERS = /(bit\.ly|goo\.gl|shorte\.st|go2l\.ink|x\.co|ow\.ly|t\.co|tinyurl|tr\.im|is\.gd|cli\.gs|yfrog\.com|migre\.me|ff\.im|tiny\.cc|url4\.eu|twit\.ac|su\.pr|tweetburner|tiny\.pl|bit\.do|bc\.vc|j\.mp|short\.ly|budurl\.com|ping\.fm|post\.ly|just\.as|bkite\.com|snipr\.com|fic\.kr|loopt\.us|qik\.ly|redir\.ec|deep\.ai|flic\.kr|plurl\.me|qr\.net|url\.ie|twiturl\.de|vzturl\.com|cutt\.ly|u\.to|bitly\.com|lnkd\.in|db\.tt|qr\.ae|adf\.ly|shorturl\.at)/;
const SPECIAL_CHARS = /[!#$%^&*(),?":{}|<>]/g;

export interface ScanResult {
    url: string;
    safetyScore: number;
    result: 'Safe' | 'Moderate' | 'Dangerous';
    probabilities: { phishing: number; legitimate: number };
    prediction: 'Legitimate' | 'Phishing';
}

// ── urlparse-compatible netloc (host, incl. port + userinfo, like Python) ──
function getNetloc(u: URL): string {
    const userinfo = u.username ? u.username + (u.password ? ':' + u.password : '') + '@' : '';
    return userinfo + u.host;
}

function isIpv4Literal(s: string): boolean {
    const m = s.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!m) return false;
    return m.slice(1).every((o) => Number(o) <= 255);
}

function shannonEntropy(s: string): number {
    if (s.length === 0) return 0;
    const counts: Record<string, number> = {};
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        counts[ch] = (counts[ch] ?? 0) + 1;
    }
    const len = s.length;
    let h = 0;
    for (const key in counts) {
        const p = counts[key] / len;
        h -= p * Math.log2(p);
    }
    return h;
}

// ── SSRF guard: block private/reserved destinations ────────────────────────
function ipv4IsPrivate(ip: string): boolean {
    const p = ip.split('.').map(Number);
    if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
    const [a, b] = p;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true; // link-local incl. 169.254.169.254 metadata
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a === 192 && b === 0) return true; // 192.0.0.0/24 + 192.0.2.0/24
    if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
    if (a >= 224) return true; // multicast + reserved
    return false;
}

function ipIsPrivate(ip: string): boolean {
    if (net.isIPv4(ip)) return ipv4IsPrivate(ip);
    // IPv6
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fe80') || lower.startsWith('fc') || lower.startsWith('fd')) return true;
    // IPv4-mapped (::ffff:a.b.c.d)
    const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return ipv4IsPrivate(mapped[1]);
    return false;
}

async function resolvesToPublic(hostname: string): Promise<boolean> {
    // A bare IP literal: validate directly.
    if (net.isIP(hostname)) return !ipIsPrivate(hostname);
    let addrs: dns.LookupAddress[];
    try {
        addrs = await dns.promises.lookup(hostname, { all: true });
    } catch {
        return false;
    }
    if (addrs.length === 0) return false;
    return addrs.every((a) => !ipIsPrivate(a.address));
}

// ── WHOIS over raw TCP (best-effort; -1 on any failure, matching Python) ────
//
// Behavior note: the legacy Python server's `whois.whois()` call returns -1 for
// every domain on the production host (verified: port-43 lookups fail there), so
// the deployed model has effectively never used the domain-age feature. To keep
// scores identical to the live site — and because raw port-43 TCP from a
// serverless function is slow and frequently blocked — WHOIS is OFF by default
// and `domainRegistrationLength` returns -1. Flip ENABLE_WHOIS to restore the
// (now-working) lookup; this makes the model more accurate but shifts scores
// upward for established domains, so treat it as a deliberate model change.
const ENABLE_WHOIS = false;

const WHOIS_SERVERS: Record<string, string> = {
    com: 'whois.verisign-grs.com', net: 'whois.verisign-grs.com',
    org: 'whois.pir.org', info: 'whois.afilias.net', io: 'whois.nic.io',
    dev: 'whois.nic.google', app: 'whois.nic.google', ai: 'whois.nic.ai',
    co: 'whois.nic.co', me: 'whois.nic.me', xyz: 'whois.nic.xyz',
    tech: 'whois.nic.tech', online: 'whois.nic.online',
};

function whoisQuery(server: string, query: string, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const socket = net.connect(43, server);
        let data = '';
        const done = (err?: Error) => {
            socket.destroy();
            if (err) reject(err);
            else resolve(data);
        };
        socket.setTimeout(timeoutMs);
        socket.on('connect', () => socket.write(query + '\r\n'));
        socket.on('data', (chunk) => { data += chunk.toString(); if (data.length > 200_000) done(); });
        socket.on('end', () => done());
        socket.on('timeout', () => done(new Error('whois timeout')));
        socket.on('error', (e) => done(e));
    });
}

function parseWhoisDate(text: string, patterns: RegExp[]): number | null {
    for (const re of patterns) {
        const m = text.match(re);
        if (m && m[1]) {
            const t = Date.parse(m[1].trim());
            if (!Number.isNaN(t)) return t;
        }
    }
    return null;
}

async function domainRegistrationLength(hostname: string): Promise<number> {
    if (!ENABLE_WHOIS) return -1; // preserve live behavior (see note above)
    try {
        const labels = hostname.split('.');
        if (labels.length < 2) return -1;
        const tld = labels[labels.length - 1].toLowerCase();
        let server = WHOIS_SERVERS[tld];
        if (!server) {
            // Discover the TLD's whois server via IANA.
            const iana = await whoisQuery('whois.iana.org', tld, 4000);
            const ref = iana.match(/refer:\s*(\S+)/i);
            if (!ref) return -1;
            server = ref[1];
        }
        const registrable = labels.slice(-2).join('.');
        const text = await whoisQuery(server, registrable, 4000);
        const created = parseWhoisDate(text, [
            /Creation Date:\s*(.+)/i, /Created On:\s*(.+)/i,
            /created:\s*(.+)/i, /Registration Time:\s*(.+)/i,
        ]);
        const expires = parseWhoisDate(text, [
            /Registry Expiry Date:\s*(.+)/i, /Expiration Date:\s*(.+)/i,
            /Registrar Registration Expiration Date:\s*(.+)/i,
            /paid-till:\s*(.+)/i, /expire:\s*(.+)/i, /expires:\s*(.+)/i,
        ]);
        if (created !== null && expires !== null) {
            return Math.round((expires - created) / 86_400_000);
        }
        return -1;
    } catch {
        return -1;
    }
}

async function hasDnsRecord(hostname: string): Promise<number> {
    try {
        const addrs = await dns.promises.resolve4(hostname);
        return addrs.length > 0 ? 1 : 0;
    } catch {
        return 0;
    }
}

// ── Fetch page HTML following redirects, SSRF-checked on every hop ──────────
interface FetchResult { html: string | null; redirects: number }

async function safeFetchHtml(startUrl: string, maxRedirects = 8): Promise<FetchResult> {
    let current = startUrl;
    let redirects = 0;
    try {
        for (let hop = 0; hop <= maxRedirects; hop++) {
            const u = new URL(current);
            if (u.protocol !== 'http:' && u.protocol !== 'https:') return { html: null, redirects: -1 };
            if (!(await resolvesToPublic(u.hostname))) return { html: null, redirects: -1 };

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 5000);
            let resp: Response;
            try {
                resp = await fetch(current, {
                    redirect: 'manual',
                    signal: controller.signal,
                    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; lukres-phishing-scanner/1.0)' },
                });
            } finally {
                clearTimeout(timer);
            }

            if (resp.status >= 300 && resp.status < 400) {
                const loc = resp.headers.get('location');
                if (!loc) return { html: null, redirects };
                current = new URL(loc, current).toString();
                redirects++;
                continue;
            }
            if (!resp.ok) return { html: null, redirects };
            // Cap body to ~2MB to bound memory/time.
            const declaredLen = Number(resp.headers.get('content-length') || 0);
            if (declaredLen > 2_000_000) return { html: null, redirects };
            const text = await resp.text();
            return { html: text.length > 2_000_000 ? text.slice(0, 2_000_000) : text, redirects };
        }
        return { html: null, redirects }; // too many redirects
    } catch {
        return { html: null, redirects: -1 };
    }
}

// ── Page-content features (port of extract_web_content_features) ───────────
function contentFeatures(html: string | null, hostname: string) {
    const f = {
        favicon: 0, request_url: 0, anchor_url: 0, links_in_scripts: 0,
        server_form_handler: 0, iframe_redirection: 0,
        status_bar_customization: 0, disable_right_click: 0,
    };
    if (!html) return f;
    try {
        const $ = loadHtml(html);

        const favicon = $('link[rel="shortcut icon"]').attr('href');
        if (favicon && !favicon.includes(hostname)) f.favicon = 1;

        const imgs = $('img').toArray();
        if (imgs.length > 0) {
            const ext = imgs.filter((e) => { const s = $(e).attr('src'); return !!s && !s.includes(hostname); }).length;
            f.request_url = ext / imgs.length;
        }

        const anchors = $('a').toArray();
        if (anchors.length > 0) {
            const ext = anchors.filter((e) => { const h = $(e).attr('href'); return !!h && !h.includes(hostname); }).length;
            f.anchor_url = ext / anchors.length;
        }

        const scripts = $('script').toArray();
        if (scripts.length > 0) {
            const ext = scripts.filter((e) => { const s = $(e).attr('src'); return !!s && !s.includes(hostname); }).length;
            f.links_in_scripts = ext / scripts.length;
        }

        let emptyAction = false, externalAction = false;
        $('form').toArray().forEach((e) => {
            const action = $(e).attr('action');
            if (action === '' || action === 'about:blank' || action === undefined) emptyAction = true;
            else if (!action.includes(hostname)) externalAction = true;
        });
        if (emptyAction || externalAction) f.server_form_handler = 1;

        if ($('iframe').length > 0) f.iframe_redirection = 1;

        scripts.forEach((e) => {
            const text = ($(e).contents().text() || '').toLowerCase();
            if (text.includes('status')) f.status_bar_customization = 1;
            if (text.includes('event.button==2') || text.includes('event.button == 2')) f.disable_right_click = 1;
        });
    } catch {
        // leave defaults (0) on parse failure, matching the Python try/except
    }
    return f;
}

// ── Full feature vector (port of extract_features) ─────────────────────────
export async function extractFeatures(rawUrl: string): Promise<number[]> {
    try {
        const u = new URL(rawUrl);
        const netloc = getNetloc(u);
        const hostname = u.hostname;

        // Network-bound features run concurrently (Python ran them serially).
        const [reg, dnsRec, page] = await Promise.all([
            domainRegistrationLength(hostname),
            hasDnsRecord(hostname),
            safeFetchHtml(rawUrl),
        ]);
        const content = contentFeatures(page.html, hostname);

        const byName: Record<string, number> = {
            using_ip: isIpv4Literal(netloc) ? 1 : 0,
            shortened_url: SHORTENERS.test(rawUrl) ? 1 : 0,
            at_symbol: rawUrl.includes('@') ? 1 : 0,
            double_slash_redirect: rawUrl.lastIndexOf('//') > 7 ? 1 : 0,
            prefix_suffix: netloc.includes('-') ? 1 : 0,
            sub_domains: (netloc.match(/\./g)?.length ?? 0) - 1,
            special_chars: rawUrl.match(SPECIAL_CHARS)?.length ?? 0,
            https: u.protocol === 'https:' ? 1 : 0,
            domain_length: netloc.length,
            suspicious_tld: SUSPICIOUS_TLDS.has('.' + netloc.split('.').pop()) ? 1 : 0,
            entropy: shannonEntropy(netloc),
            domain_registration_length: reg,
            dns_record: dnsRec,
            favicon: content.favicon,
            request_url: content.request_url,
            anchor_url: content.anchor_url,
            links_in_scripts: content.links_in_scripts,
            server_form_handler: content.server_form_handler,
            iframe_redirection: content.iframe_redirection,
            status_bar_customization: content.status_bar_customization,
            disable_right_click: content.disable_right_click,
            website_forwarding: page.redirects,
        };
        return FEATURE_NAMES.map((n) => {
            const v = byName[n];
            return Number.isFinite(v) ? v : -1; // replace inf/NaN with -1, as Python does
        });
    } catch {
        // Total failure → all features -1 (matches preprocess.extract_features).
        return FEATURE_NAMES.map(() => -1);
    }
}

function sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-z));
}

/** Run the trained model on a URL. Mirrors server.py's /api/customScan. */
export async function analyzeUrl(rawUrl: string): Promise<ScanResult> {
    const x = await extractFeatures(rawUrl);
    let z = INTERCEPT;
    for (let i = 0; i < COEF.length; i++) {
        const scaled = (x[i] - SCALER_MEAN[i]) / SCALER_SCALE[i];
        z += COEF[i] * scaled;
    }
    const pLegit = sigmoid(z); // P(class 1 = legitimate)
    const pPhish = 1 - pLegit;

    const safetyScore = Math.max(0.1, Math.floor(pLegit * 100));
    const result: ScanResult['result'] =
        safetyScore >= 70 ? 'Safe' : safetyScore >= 40 ? 'Moderate' : 'Dangerous';

    return {
        url: rawUrl,
        safetyScore,
        result,
        probabilities: { phishing: pPhish, legitimate: pLegit },
        prediction: pLegit >= 0.5 ? 'Legitimate' : 'Phishing',
    };
}
