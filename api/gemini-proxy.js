export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-goog-api-key, x-gemini-path');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Log request for debugging
  console.log(`[Gemini Proxy] ${req.method} ${req.headers['x-gemini-path']}`);

  try {
    // Get the target path from headers
    const geminiPath = req.headers['x-gemini-path'];
    if (!geminiPath) {
      return res.status(400).json({ error: 'Missing x-gemini-path header' });
    }

    // Get API key
    const apiKey = req.headers['x-goog-api-key'];
    if (!apiKey) {
      return res.status(400).json({ error: 'Missing x-goog-api-key header' });
    }

    // Construct the full Google API URL
    const geminiUrl = `https://generativelanguage.googleapis.com${geminiPath}`;
    
    // Prepare headers for Google API
    const headers = {
      'Content-Type': req.headers['content-type'] || 'application/json',
      'x-goog-api-key': apiKey,
    };

    // Make the request to Google API
    const response = await fetch(geminiUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    // Get response data
    const data = await response.text();
    
    // Return the response
    res.status(response.status);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.send(data);

  } catch (error) {
    console.error('Gemini proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to proxy request to Gemini API',
      details: error.message 
    });
  }
}
