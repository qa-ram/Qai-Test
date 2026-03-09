@echo off
echo Starting Qai Test Platform...
echo Please wait while the local server initializes.
cd /d "%~dp0qa-platform"
start http://localhost:3000
npm run dev
