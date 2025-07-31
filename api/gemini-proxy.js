// Disable body parsing completely for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 300, // 5 minutes
}

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

  console.log(`[Gemini Proxy] ${req.method} ${req.headers['x-gemini-path']}`);
  console.log('Content-Type:', req.headers['content-type']);

  try {
    // Get the target path from headers
    const geminiPath = req.headers['x-gemini-path'];
    if (!geminiPath) {
      console.error('Missing x-gemini-path header');
      return res.status(400).json({ error: 'Missing x-gemini-path header' });
    }

    // Get API key
    const apiKey = req.headers['x-goog-api-key'];
    if (!apiKey) {
      console.error('Missing API key');
      return res.status(400).json({ error: 'Missing x-goog-api-key header' });
    }
    
    // Validate API key format
    if (!apiKey.startsWith('AIza')) {
      console.error('Invalid API key format');
      return res.status(400).json({ error: 'Invalid API key format' });
    }

    // Construct the full Google API URL
    const geminiUrl = `https://generativelanguage.googleapis.com${geminiPath}`;
    console.log('Proxying to:', geminiUrl);
    
    // Prepare headers for Google API
    const headers = {
      'x-goog-api-key': apiKey,
    };
    
    // Set Content-Type if provided
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'];
    }

    // Prepare the request body
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.headers['content-type']?.includes('application/json')) {
        // For JSON requests, read and parse the body
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const rawBody = Buffer.concat(chunks).toString();
        body = rawBody;
        console.log('Using JSON body, size:', body.length);
        console.log('JSON body preview:', body.substring(0, 200) + '...');
      } else {
        // For file uploads, stream the raw body
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        body = Buffer.concat(chunks);
        console.log('Using raw body for file upload, size:', body.length);
      }
    }

    // Make the request to Google API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
    
    try {
      const response = await fetch(geminiUrl, {
        method: req.method,
        headers: headers,
        body: body,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log('Google API response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Forward all important headers from Google API response
      const headersToForward = ['location', 'content-type', 'content-length', 'cache-control', 'etag'];
      headersToForward.forEach(headerName => {
        const headerValue = response.headers.get(headerName);
        if (headerValue) {
          res.setHeader(headerName, headerValue);
          console.log(`Forwarding header ${headerName}:`, headerValue);
        }
      });
      
      // Handle different response types safely
      const contentType = response.headers.get('content-type') || 'application/json';
      
      // Read response text once
      const responseText = await response.text();
      console.log('Response text length:', responseText.length);
      
      try {
        if (contentType.includes('application/json')) {
          if (responseText.trim()) {
            const data = JSON.parse(responseText);
            res.status(response.status).json(data);
          } else {
            // Empty response - this is normal for resumable upload initiation
            console.log('Empty JSON response received (normal for resumable upload)');
            res.status(response.status).end();
          }
        } else {
          res.status(response.status).send(responseText);
        }
      } catch (parseError) {
        console.error('Response parsing error:', parseError.message);
        console.error('Raw response text:', responseText.substring(0, 500) + '...');
        
        res.status(response.status)
          .setHeader('Content-Type', 'text/plain')
          .send(responseText);
      }
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Request timeout');
        return res.status(408).json({ error: 'Request timeout' });
      }
      
      console.error('Fetch error:', fetchError.message);
      throw fetchError;
    }

  } catch (error) {
    console.error('Gemini proxy error:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
