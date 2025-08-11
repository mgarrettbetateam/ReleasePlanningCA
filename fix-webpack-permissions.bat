@echo off
REM Windows Permission Fix for Webpack Development
REM Run this script if you encounter EPERM errors

echo Fixing Windows file permissions for webpack...

REM Stop any running Node processes
echo Stopping Node processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im Code.exe 2>nul

REM Remove and recreate dist directory
echo Recreating dist directory structure...
if exist "dist" (
    rmdir /s /q "dist" 2>nul
)

mkdir "dist\static\fonts" 2>nul
mkdir "dist\static\images" 2>nul

echo Directory structure created:
dir dist /s

echo.
echo Fix complete! You can now run:
echo   npm run serve
echo.
pause
