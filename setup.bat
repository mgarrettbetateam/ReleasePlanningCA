@echo off
echo ====================================
echo Widget Development Template Setup
echo ====================================
echo.

echo Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js version:
node --version

echo.
echo Checking if npm is available...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available
    echo Please ensure npm is installed with Node.js
    echo.
    pause
    exit /b 1
)

echo npm version:
npm --version

echo.
echo Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install dependencies
    echo Please check your internet connection and try again
    echo.
    pause
    exit /b 1
)

echo.
echo Verifying webpack installation...
npx webpack --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Webpack not found, installing webpack-cli...
    npm install --save-dev webpack-cli
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install webpack-cli
        pause
        exit /b 1
    )
)

echo.
echo Testing build configuration...
npm run build >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Build test failed, but setup will continue
    echo You may need to configure your build settings
)

echo.
echo ====================================
echo Setup completed successfully!
echo ====================================
echo.
echo You can now start development with:
echo   npm start        - Start development server
echo   npm run build    - Build for production
echo   npm run lint     - Run linting
echo.
echo For more information, see README.md and documentation/
echo.
pause
