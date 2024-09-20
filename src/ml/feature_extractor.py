# src/ml/feature_extractor.py

from feature_extraction import FeatureExtraction
import sys
import json

def extract_features(url):
    extractor = FeatureExtraction(url)
    features = extractor.getFeaturesList()
    feature_names = [
        "UsingIp", "longUrl", "shortUrl", "symbol", "redirecting", "prefixSuffix", "SubDomains", "Hppts",
        "DomainRegLen", "Favicon", "NonStdPort", "HTTPSDomainURL", "RequestURL", "AnchorURL", "LinksInScriptTags",
        "ServerFormHandler", "InfoEmail", "AbnormalURL", "WebsiteForwarding", "StatusBarCust", "DisableRightClick",
        "UsingPopupWindow", "IframeRedirection", "AgeofDomain", "DNSRecording", "WebsiteTraffic", "PageRank",
        "GoogleIndex", "LinksPointingToPage", "StatsReport"
    ]

    feature_dict = dict(zip(feature_names, features))

    # Преобразуем значения в более понятный формат
    for feature, value in feature_dict.items():
        if feature in ["UsingIp", "shortUrl", "symbol", "redirecting", "prefixSuffix", "NonStdPort", "AbnormalURL", "WebsiteForwarding", "StatusBarCust", "DisableRightClick", "UsingPopupWindow", "IframeRedirection"]:
            feature_dict[feature] = "bad" if value == 1 else "good"
        elif feature in ["longUrl", "SubDomains", "Hppts", "DomainRegLen", "Favicon", "HTTPSDomainURL", "RequestURL", "AnchorURL", "LinksInScriptTags", "ServerFormHandler", "InfoEmail", "AgeofDomain", "DNSRecording", "WebsiteTraffic", "PageRank", "GoogleIndex", "LinksPointingToPage", "StatsReport"]:
            feature_dict[feature] = "good" if value == 1 else "bad"

    return feature_dict

if __name__ == "__main__":
    url = sys.argv[1]
    features = extract_features(url)
    print(json.dumps(features))