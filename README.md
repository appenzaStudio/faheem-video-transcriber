# Faheem - AI Video Transcriber 🎥📝

A React-based video transcription application that uses Google's Gemini AI to transcribe video files with Arabic interface support, specifically designed for Egyptian educational content.

## Features ✨

- 🎬 **Video Upload**: Support for multiple video files up to 500MB each
- 🤖 **AI Transcription**: Powered by Google Gemini AI for accurate transcription
- 🇪🇬 **Arabic Interface**: Fully localized Arabic UI for Egyptian users
- 📚 **Educational Focus**: Optimized for Egyptian curriculum content
- ⚡ **Real-time Updates**: Live transcription progress with streaming responses
- 📊 **Status Tracking**: Monitor file processing stages (queued, preparing, transcribing, completed)
- 🎯 **Modern UI**: Built with React 19 and TypeScript for optimal performance

## Technology Stack 🛠️

- **Frontend**: React 19 + TypeScript + Vite
- **AI Service**: Google Gemini AI (GenAI SDK)
- **Styling**: Modern CSS with responsive design
- **Build Tool**: Vite for fast development and building

## Prerequisites 📋

- Node.js (v18 or higher)
- Google Gemini API key

## Installation & Setup 🚀

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Appenza-Studio/faheem-video-transcriber.git
   cd faheem-video-transcriber
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5173`

## Build for Production 🏗️

```bash
npm run build
npm run preview
```

## Deployment 🌐

This project is configured for easy deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your `VITE_GEMINI_API_KEY` environment variable in Vercel dashboard
4. Deploy!

## Project Structure 📁

```
faheem-video-transcriber/
├── components/          # React components
├── services/           # API services (Gemini integration)
├── App.tsx            # Main application component
├── index.tsx          # Application entry point
├── metadata.json      # Egyptian curriculum metadata
├── vercel.json        # Vercel deployment configuration
└── vite.config.ts     # Vite configuration
```

## Usage 📖

1. **Upload Videos**: Click the upload area or drag & drop video files
2. **Monitor Progress**: Watch real-time transcription status updates
3. **View Results**: Access completed transcriptions with educational metadata
4. **Manage Files**: Track multiple video processing simultaneously

## API Integration 🔌

The application integrates with Google Gemini AI API for:
- File upload and processing
- Real-time transcription streaming
- Status polling and updates
- Error handling and retry logic

## Contributing 🤝

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License.

## Support 💬

For support and questions, please contact [Appenza Studio](https://github.com/Appenza-Studio).
# faheem-video-transcriber
