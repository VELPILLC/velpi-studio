@echo off
title Velpi Studio
cd /d "C:\Users\angel\velpi-studio"
echo ============================================
echo   VELPI STUDIO
echo ============================================
echo Starting the server...
echo When you see "Ready", open:  http://localhost:3000
echo Keep THIS window open while you use the app.
echo Press Ctrl+C (then Y) to stop it.
echo --------------------------------------------
echo.
call npm run dev
echo.
echo Server stopped. Press any key to close this window.
pause >nul
