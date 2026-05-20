@echo off
chcp 65001 >nul
set CONFIG_DIR=%APPDATA%\masterpiece-pos-cashier-desktop
set CONFIG_FILE=%CONFIG_DIR%\config.json

echo.
echo ============================================
echo   Aurent Касса - смена адреса сервера
echo ============================================
echo.
set /p HOST=Адрес сервера (IP или домен) [111.88.132.126]: 
set /p PORT=Порт [80]: 
if "%HOST%"=="" set HOST=111.88.132.126
if "%PORT%"=="" set PORT=80

if not exist "%CONFIG_DIR%" mkdir "%CONFIG_DIR%"

(
echo {
echo   "useRemoteUi": false,
echo   "cashierUrl": "http://127.0.0.1:5199",
echo   "backendOrigin": "http://%HOST%:%PORT%",
echo   "apiHealthUrl": "http://%HOST%:%PORT%/api/v1/actuator/health",
echo   "webPort": "80",
echo   "apiPort": "%PORT%",
echo   "embeddedPort": 5199
echo }
) > "%CONFIG_FILE%"

echo.
echo Готово. Закройте Aurent Касса и откройте снова.
echo.
pause
