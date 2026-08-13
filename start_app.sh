#!/bin/bash

echo "Starting SEO Blog App..."

if [ -z "$GEMINI_API_KEY" ]; then
    echo "Warning: GEMINI_API_KEY environment variable is not set."
    echo "The AI generation features will not work without it."
    echo "You can set it by running: export GEMINI_API_KEY='your_api_key_here'"
fi

# Start Backend
echo "Starting Django Backend on port 8000..."
cd backend
source ../venv/bin/activate
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "Starting Next.js Frontend on port 3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Both servers are running!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8000"
echo "Press Ctrl+C to stop both servers."

# Wait for user interrupt
trap "echo 'Stopping servers...'; kill $BACKEND_PID; kill $FRONTEND_PID; exit" SIGINT SIGTERM
wait
