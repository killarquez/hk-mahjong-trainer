import os
import sys
from pydub import AudioSegment
import speech_recognition as sr

# Set up ffmpeg paths explicitly
ffmpeg_bin = r"C:\Users\alfre\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin"
os.environ["PATH"] += os.pathsep + ffmpeg_bin
AudioSegment.converter = os.path.join(ffmpeg_bin, "ffmpeg.exe")
AudioSegment.ffprobe = os.path.join(ffmpeg_bin, "ffprobe.exe")

def transcribe_audio(file_path):
    print(f"Loading audio file: {file_path}")
    if not os.path.exists(file_path):
        print("Error: File not found.")
        return

    # Load audio
    audio = AudioSegment.from_file(file_path)
    duration_secs = len(audio) / 1000.0
    print(f"Audio duration: {duration_secs:.2f} seconds")

    # Export to a temporary wav file
    temp_wav = "temp_converted.wav"
    print("Converting to WAV format...")
    audio.export(temp_wav, format="wav")

    # Initialize recognizer
    recognizer = sr.Recognizer()

    # Split into 30 second chunks
    chunk_length_ms = 30000  # 30 seconds
    chunks = [audio[i:i + chunk_length_ms] for i in range(0, len(audio), chunk_length_ms)]
    print(f"Split audio into {len(chunks)} chunk(s). Transcribing...")

    # Let's try transcribing the first chunk to detect language if possible,
    # or we can default to English (en-US) and Spanish (es-ES).
    # Since we don't know the language, we'll try to transcribe with English first.
    # We can also attempt a spanish transcription if it fails or if the output looks like spanish.
    
    full_text_en = []
    full_text_es = []
    
    for idx, chunk in enumerate(chunks):
        chunk_file = f"temp_chunk_{idx}.wav"
        chunk.export(chunk_file, format="wav")
        
        with sr.AudioFile(chunk_file) as source:
            audio_data = recognizer.record(source)
            
            # Try English (en-US)
            try:
                text_en = recognizer.recognize_google(audio_data, language="en-US")
                full_text_en.append(text_en)
            except sr.UnknownValueError:
                full_text_en.append("[Unrecognized]")
            except sr.RequestError as e:
                full_text_en.append(f"[Error: {e}]")
                
            # Try Spanish (es-ES)
            try:
                text_es = recognizer.recognize_google(audio_data, language="es-ES")
                full_text_es.append(text_es)
            except sr.UnknownValueError:
                full_text_es.append("[Unrecognized]")
            except sr.RequestError as e:
                full_text_es.append(f"[Error: {e}]")
                
        # Clean up chunk file
        try:
            os.remove(chunk_file)
        except Exception:
            pass

    # Clean up main temp wav
    try:
        os.remove(temp_wav)
    except Exception:
        pass

    print("\n--- Transcription Results ---")
    print("\n[English (en-US) Transcription]")
    en_result = " ".join(full_text_en)
    print(en_result)
    
    print("\n[Spanish (es-ES) Transcription]")
    es_result = " ".join(full_text_es)
    print(es_result)

if __name__ == "__main__":
    file_to_transcribe = r"C:\Users\alfre\Downloads\WhatsApp Audio 2026-06-11 at 11.36.06 AM.mp3"
    if len(sys.argv) > 1:
        file_to_transcribe = sys.argv[1]
    transcribe_audio(file_to_transcribe)
