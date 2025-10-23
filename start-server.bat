@echo off
echo Cleaning up old FastAPI processes...
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul

echo Starting FastAPI server...
cd /d "C:\Users\Administrator\Music\jona-demo\server"
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
