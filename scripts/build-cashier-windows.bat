@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0.."

set SERVER_HOST=111.88.132.126
set SERVER_PORT=8080
set CSC_IDENTITY_AUTO_DISCOVERY=false
set WIN_CSC_LINK=
set CSC_LINK=

echo ============================================
echo   Aurent Cashier - сборка для Windows
echo ============================================
echo.

echo ==^> 1/4 Frontend...
cd web-frontend
call npm.cmd install
if errorlevel 1 goto :error
set VITE_API_URL=/api/v1
call npm.cmd run build
if errorlevel 1 goto :error
cd ..

echo ==^> 2/4 web-dist...
if exist desktop-cashier\web-dist rmdir /s /q desktop-cashier\web-dist
xcopy /E /I /Q web-frontend\dist desktop-cashier\web-dist

echo ==^> 3/4 server.default.json...
(
echo {
echo   "host": "%SERVER_HOST%",
echo   "port": "%SERVER_PORT%"
echo }
) > desktop-cashier\server.default.json

echo ==^> 4/4 electron-builder...
if exist "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign" rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign"

cd desktop-cashier
call npm.cmd install
if errorlevel 1 goto :error

call npm.cmd run dist:win
if not errorlevel 1 goto :success

echo.
echo [!] NSIS не собрался (symlink / winCodeSign). Пробуем папку win-unpacked...
echo.

call npm.cmd run dist:win:dir
if errorlevel 1 goto :symlink_help

cd ..
if not exist "dist" mkdir dist
powershell -NoProfile -Command "Compress-Archive -Path 'desktop-cashier\release\win-unpacked\*' -DestinationPath 'dist\Aurent-Cashier-Windows-portable.zip' -Force"
echo.
echo Готово (portable ZIP, без установщика):
echo   dist\Aurent-Cashier-Windows-portable.zip
echo Распаковать на кассе и запустить Aurent Cashier.exe
goto :end

:success
cd ..
echo.
echo Готово (установщик):
echo   desktop-cashier\release\Aurent-Cashier-Setup-1.0.0-x64.exe
goto :end

:symlink_help
echo.
echo ============================================
echo   ОШИБКА symbolic link (winCodeSign)
echo ============================================
echo.
echo Сделайте ОДНО из этого:
echo   1. Параметры Windows - Для разработчиков - Режим разработчика ВКЛ
echo   2. Запустите этот bat ПКМ - От имени администратора
echo   3. Соберите на Mac: ./scripts/build-cashier.sh (только .dmg)
echo.
goto :error

:error
exit /b 1

:end
pause
