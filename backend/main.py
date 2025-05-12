import os
import logging
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import openai
from tempfile import NamedTemporaryFile
from typing import Optional
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()  # Load environment variables from .env

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY environment variable not set.")
openai.api_key = OPENAI_API_KEY

@app.post("/transcribe/")
async def transcribe_audio(file: UploadFile = File(...)):
    logger.info(f"Received file: {file.filename}, content_type: {file.content_type}")
    
    if not file.content_type.startswith("audio/"):
        error_msg = f"Invalid file type: {file.content_type}. Please upload an audio file."
        logger.error(error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    
    try:
        # Save the uploaded file to a temporary file
        with NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            logger.info(f"Saving uploaded file to temporary file: {tmp.name}")
            contents = await file.read()
            logger.info(f"File size: {len(contents)} bytes")
            tmp.write(contents)
            tmp_path = tmp.name
        
        # Send to OpenAI Whisper
        logger.info("Sending file to OpenAI Whisper API")
        with open(tmp_path, "rb") as audio_file:
            transcript = openai.Audio.transcribe("whisper-1", audio_file)
        
        logger.info("Received transcription from OpenAI")
        os.remove(tmp_path)
        logger.info("Temporary file removed")
        
        return JSONResponse({"transcription": transcript["text"]})
    except Exception as e:
        logger.error(f"Error during transcription: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok"} 