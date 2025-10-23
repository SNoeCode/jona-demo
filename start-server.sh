#!/bin/bash

echo "Cleaning up old FastAPI processes..."
pkill -f "uvicorn main:app" 2>/dev/null
sleep 2

# echo "Starting FastAPI server..."
# cd "$(dirname "$0")/server"
# uvicorn main:app --host 127.0.0.1 --port 8000 --reload