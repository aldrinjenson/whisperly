# Whisperly FastAPI Backend

This is a simple FastAPI backend for audio transcription using OpenAI Whisper.

## Features
- Accepts audio file uploads via `/transcribe/` endpoint
- Sends audio to OpenAI Whisper for transcription
- Returns the transcription as JSON

## Requirements
- Python 3.8+
- An OpenAI API key ([get one here](https://platform.openai.com/account/api-keys))

## Installation

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Environment Variables

Set your OpenAI API key as an environment variable:

```bash
export OPENAI_API_KEY=your_openai_api_key_here
```

## Running the Server

```bash
uvicorn main:app --reload
```

## Usage

Send a POST request to `/transcribe/` with an audio file (e.g., mp3, wav) as form-data under the key `file`.

Example using `curl`:

```bash
curl -X POST "http://localhost:8000/transcribe/" -F "file=@your_audio_file.mp3"
```

## Notes
- Only audio files are accepted.
- The transcription is returned as JSON: `{ "transcription": "..." }` 