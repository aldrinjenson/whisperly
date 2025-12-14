# Whisperly 🎙️

**Voice-to-text transcription app with AI-powered text formatting.**

Whisperly is a mobile app that transcribes your voice recordings using OpenAI Whisper and can format the output for emails, Slack messages, or fix grammar — all in one tap.

> *Record → Transcribe → Format → Copy. That simple.*

---

## ✨ Features

- **🎤 One-Tap Recording** — Press and hold to record, release to transcribe
- **⚡ Fast Transcription** — Powered by OpenAI Whisper for accurate speech-to-text
- **📝 Smart Formatting** — Transform transcriptions into:
  - 📧 Professional emails
  - 💬 Slack messages
  - ✅ Grammar-corrected text
  - 🎯 Custom instructions
- **🏷️ Keyword Hints** — Add names/terms to improve transcription accuracy
- **📋 Auto-Copy** — Transcription is automatically copied to clipboard

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Mobile App** | React Native + Expo |
| **Backend API** | FastAPI (Python) |
| **Transcription** | OpenAI Whisper |
| **Text Formatting** | GPT-3.5-Turbo |
| **Deployment** | Fly.io |

---

## 📁 Project Structure

```
whisperly/
├── ui/                  # React Native Expo app
│   ├── app/             # Main app screens
│   ├── components/      # UI components
│   └── assets/          # Images & fonts
└── backend/             # FastAPI server
    ├── main.py          # API endpoints
    └── Dockerfile       # Container config
```

---

## 🚀 Quick Start

### Backend

```bash
cd backend
poetry install
cp .env.example .env  # Add your OPENAI_API_KEY
poetry run uvicorn main:app --reload
```

### Mobile App

```bash
cd ui
npm install
npm start  # Opens Expo dev server
```

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/transcribe` | POST | Upload audio file → get transcription |
| `/format` | POST | Format text as email/slack/grammar/custom |
| `/health` | GET | Health check |

---

## 📝 License

MIT License

---

## 👤 Author

**Aldrin Jenson** — [@aldrinjenson](https://twitter.com/aldrinjenson)

[GitHub](https://github.com/aldrinjenson) • [Twitter](https://twitter.com/aldrinjenson) • [LinkedIn](https://linkedin.com/in/aldrinjenson)

