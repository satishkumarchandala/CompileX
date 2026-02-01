@echo off
REM Startup script for Compiler Learning Platform
REM This script helps you start all components easily

echo ========================================
echo  Compiler Learning Platform Launcher
echo ========================================
echo.

:menu
echo Please select what to start:
echo.
echo 1. Backend Only
echo 2. Web Frontend Only
echo 3. Mobile App Only
echo 4. Backend + Web Frontend
echo 5. All Components (Backend + Web + Mobile)
echo 6. Run System Validation
echo 7. Exit
echo.

set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto backend
if "%choice%"=="2" goto frontend
if "%choice%"=="3" goto mobile
if "%choice%"=="4" goto backend_web
if "%choice%"=="5" goto all
if "%choice%"=="6" goto validate
if "%choice%"=="7" goto end

echo Invalid choice. Please try again.
echo.
goto menu

:backend
echo.
echo Starting Backend...
echo.
cd backend
start cmd /k "python app.py"
echo Backend started in new window
echo.
pause
goto menu

:frontend
echo.
echo Starting Web Frontend...
echo.
cd frontend
start cmd /k "npm run dev"
echo Web Frontend started in new window
echo.
pause
goto menu

:mobile
echo.
echo Starting Mobile App...
echo.
echo IMPORTANT: Make sure to configure BASE_URL in mobile/src/api/client.js
echo.
cd mobile
start cmd /k "npm start"
echo Mobile App started in new window
echo.
pause
goto menu

:backend_web
echo.
echo Starting Backend and Web Frontend...
echo.
cd backend
start cmd /k "python app.py"
timeout /t 2 /nobreak >nul
cd ..\frontend
start cmd /k "npm run dev"
echo.
echo Both components started in separate windows
echo Backend: http://localhost:5000
echo Web App: http://localhost:5173
echo.
pause
goto menu

:all
echo.
echo Starting All Components...
echo.
cd backend
start cmd /k "python app.py"
timeout /t 2 /nobreak >nul
cd ..\frontend
start cmd /k "npm run dev"
timeout /t 2 /nobreak >nul
cd ..\mobile
start cmd /k "npm start"
echo.
echo All components started in separate windows
echo Backend: http://localhost:5000
echo Web App: http://localhost:5173
echo Mobile: Check Expo Dev Tools
echo.
echo REMINDER: Configure mobile/src/api/client.js with correct BASE_URL
echo.
pause
goto menu

:validate
echo.
echo Running System Validation...
echo.
python validate_system.py
echo.
pause
goto menu

:end
echo.
echo Thank you for using Compiler Learning Platform!
echo.
exit
