import axios from 'axios';

const apiUrl = 'https://www.virustotal.com/api/v3';
const headers = {
  'x-apikey': process.env.VIRUSTOTAL_API_KEY,
  'Content-Type': 'application/x-www-form-urlencoded'
};

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const response = await axios.post(`${apiUrl}/urls`, `url=${encodeURIComponent(req.body.url)}`, { headers, timeout: 10000 });
      if (response.data && response.data.data && response.data.data.id) {
        res.status(200).json(response.data);
      } else {
        throw new Error('Invalid response from VirusTotal API');
      }
    } else if (req.method === 'GET' && req.query.id) {
      const response = await axios.get(`${apiUrl}/analyses/${req.query.id}`, { headers, timeout: 10000 });
      res.status(200).json(response.data);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Proxy error:', error.response ? error.response.data : error.message);

    if (error.response) {
      switch (error.response.status) {
        case 400:
          res.status(400).json({ error: 'Bad request. Please check your input and try again.' });
          break;
        case 401:
          res.status(401).json({ error: 'Unauthorized. Please check your API key.' });
          break;
        case 403:
          res.status(403).json({ error: 'Forbidden. You don\'t have permission to access this resource.' });
          break;
        case 404:
          res.status(404).json({ error: 'Resource not found. Please check your request and try again.' });
          break;
        case 429:
          res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
          break;
        default:
          res.status(500).json({ error: `An unexpected error occurred on the VirusTotal server: ${error.response.status}. Please try again later.` });
      }
    } else if (error.code === 'ECONNABORTED') {
      res.status(504).json({ error: 'Request to VirusTotal timed out. Please try again later.' });
    } else {
      res.status(500).json({ error: `An unexpected error occurred: ${error.message}. Please try again later.` });
    }
  }
}