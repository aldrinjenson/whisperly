import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import openai
from tempfile import NamedTemporaryFile
from typing import Optional

app = FastAPI()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY environment variable not set.")
openai.api_key = OPENAI_API_KEY

@app.post("/transcribe/")
async def transcribe_audio(file: UploadFile = File(...)):
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an audio file.")
    try:
        # Save the uploaded file to a temporary file
        with NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name
        # Send to OpenAI Whisper
        with open(tmp_path, "rb") as audio_file:
            transcript = openai.Audio.transcribe("whisper-1", audio_file)
        os.remove(tmp_path)
        return JSONResponse({"transcription": transcript["text"]})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 