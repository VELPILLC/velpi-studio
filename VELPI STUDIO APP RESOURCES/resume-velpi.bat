@echo off
title Velpi Studio - Resume Session
cd /d "C:\Users\angel"
echo ============================================
echo   VELPI STUDIO - RESUME SESSION
echo ============================================
echo Resuming session 10eb6ae2-301d-459a-be97-0982d9b2b9da with remote control...
echo --------------------------------------------
echo.
call claude --resume 10eb6ae2-301d-459a-be97-0982d9b2b9da --remote-control
echo.
echo Session ended. Press any key to close this window.
pause >nul
