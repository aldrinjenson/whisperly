import os
from datetime import datetime
import logging
from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from tempfile import NamedTemporaryFile
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()  # Load environment variables from .env

app = FastAPI(title="Whisperly API", 
              description="Audio transcription API for Whisperly",
              version="1.0.0")

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

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

@app.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    keywords: str = Form(None)
):
    """Transcribe audio from file upload, with optional keywords for prompt"""
    # Validate file type
    valid_audio_types = ["audio/", "video/", "application/octet-stream"]
    is_valid = any(file.content_type.startswith(prefix) for prefix in valid_audio_types)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"Invalid file type: {file.content_type}. Please upload an audio file.")
    
    try:
        # Save the uploaded file to a temporary file
        file_extension = ".mp3"  # Default extension
        if "m4a" in file.content_type or file.filename.endswith(".m4a"):
            file_extension = ".m4a"
        
        with NamedTemporaryFile(delete=False, suffix=file_extension) as tmp:
            contents = await file.read()
            
            if len(contents) == 0:
                raise HTTPException(status_code=400, detail="Uploaded file is empty")
                
            tmp.write(contents)
            tmp_path = tmp.name
        
        # Send to OpenAI
        with open(tmp_path, "rb") as audio_file:
            try:
                whisper_args = {
                    "model": "whisper-1",
                    "file": audio_file
                }
                if keywords:
                    whisper_args["prompt"] = keywords
                transcript = client.audio.transcriptions.create(**whisper_args)
                transcription_text = transcript.text
                print("timestamp, transcription_text", datetime.now(), transcript.text)
            except Exception as whisper_error:
                logger.error(f"OpenAI API error: {str(whisper_error)}")
                raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(whisper_error)}")
        
        os.remove(tmp_path)
        
        return JSONResponse({"transcription": transcription_text})
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error during transcription: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 