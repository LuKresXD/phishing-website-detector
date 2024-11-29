import axios from 'axios';

const apiUrl = 'https://www.virustotal.com/api/v3';
const headers = {
  'x-apikey': process.env.VIRUSTOTAL_API_KEY,
  'Content-Type': 'application/x-www-form-urlencoded'
};

// Create axios instance with default config
const vtApi = axios.create({
  timeout: 55000, // 55 seconds timeout (slightly less than Vercel's 60s limit)
  headers
});

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const response = await vtApi.post(
          `${apiUrl}/urls`,
          `url=${encodeURIComponent(req.body.url)}`
      );

      if (response.data?.data?.id) {
        res.status(200).json(response.data);
      } else {
        throw new Error('Invalid response from VirusTotal API');
      }

    } else if (req.method === 'GET' && req.query.id) {
      const response = await vtApi.get(
          `${apiUrl}/analyses/${req.query.id}`
      );
      res.status(200).json(response.data);

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Proxy error:', error.response?.data || error.message);

    if (error.code === 'ECONNABORTED') {
      res.status(504).json({
        error: 'Request timed out. The server might be busy, please try again.'
      });
      return;
    }

    if (error.response) {
      switch (error.response.status) {
        case 400:
          res.status(400).json({
            error: 'Bad request. Please check your input and try again.'
          });
          break;
        case 401:
          res.status(401).json({
            error: 'Unauthorized. Please check your API key.'
          });
          break;
        case 429:
          res.status(429).json({
            error: 'Rate limit exceeded. Please try again later.'
          });
          break;
        default:
          res.status(500).json({
            error: `An error occurred: ${error.message}. Please try again later.`
          });
      }
    } else {
      res.status(500).json({
        error: 'Network error. Please check your connection and try again.'
      });
    }
  }
}