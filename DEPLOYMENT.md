# Deployment Guide - Faheem Video Transcriber

## 🚀 Quick Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Step 1: Fork/Clone Repository
```bash
git clone https://github.com/appenzaStudio/faheem-video-transcriber.git
cd faheem-video-transcriber
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import from GitHub: `appenzaStudio/faheem-video-transcriber`
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Environment Variables
Add the following environment variable in Vercel:
- **Name**: `GEMINI_API_KEY`
- **Value**: Your Google Gemini API key

### Step 4: Deploy
Click "Deploy" and wait for the build to complete.

## 🔧 Local Development

### Setup
```bash
npm install
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY
npm run dev
```

### Build for Production
```bash
npm run build
npm run preview
```

## 🌐 Architecture

### Frontend
- **React 19** with TypeScript
- **Vite** for build tooling
- **Arabic UI** for Egyptian users

### Backend
- **Vercel Serverless Functions** for API proxying
- **Google Gemini AI** for video transcription
- **CORS-enabled** proxy at `/api/gemini-proxy`

### API Flow
1. Frontend uploads video → Vercel proxy → Google Gemini API
2. Proxy handles CORS and authentication
3. Real-time transcription streaming back to frontend

## 🐛 Troubleshooting

### Common Issues

**Environment Variable Error**
```
Error: متغير البيئة API_KEY غير معين
```
**Solution**: Add `GEMINI_API_KEY` to Vercel environment variables

**CORS/Failed to Fetch Error**
```
Error: Failed to fetch
```
**Solution**: Ensure `/api/gemini-proxy.js` is deployed and working

**Build Errors**
- Check that all dependencies are in `package.json`
- Verify TypeScript configuration
- Ensure all imports are correct

### Logs
- **Vercel**: Check function logs in Vercel dashboard
- **Browser**: Open DevTools → Console for client-side errors

## 📊 Performance

### Optimization Tips
- Videos up to 500MB supported
- Transcription time varies by video length
- Real-time progress updates
- Automatic error handling and retry logic

### Monitoring
- Monitor API usage in Google AI Studio
- Check Vercel function execution time
- Track user engagement in Vercel Analytics

## 🔒 Security

### Best Practices
- API key stored securely in environment variables
- CORS properly configured
- No sensitive data in client-side code
- File upload validation

### API Limits
- Respect Google Gemini API rate limits
- Monitor usage to avoid quota exceeded errors
- Implement proper error handling

## 📞 Support

For issues or questions:
- Check the [GitHub Issues](https://github.com/appenzaStudio/faheem-video-transcriber/issues)
- Contact [Appenza Studio](https://github.com/appenzaStudio)

---

**Last Updated**: January 2025
**Version**: 1.0.0
