export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Faheem Video Transcriber',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    hasApiKey: !!process.env.GEMINI_API_KEY
  });
}
