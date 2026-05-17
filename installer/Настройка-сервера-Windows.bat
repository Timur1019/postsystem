@echo off
chcp 65001 >nul
set CONFIG_DIR=%APPDATA%\masterpiece-pos-cashier-desktop
set CONFIG_FILE=%CONFIG_DIR%\config.json

echo.
echo === Aurent Cashier - адрес сервера ===
echo.
set /p HOST=IP или домен сервера [111.88.132.126]: 
set /p PORT=Порт API [8080]: 
if "%HOST%"=="" set HOST=111.88.132.126
if "%PORT%"=="" set PORT=8080

if not exist "%CONFIG_DIR%" mkdir "%CONFIG_DIR%"

(
echo {
echo   "backendOrigin": "http://%HOST%:%PORT%",
echo   "apiHealthUrl": "http://%HOST%:%PORT%/api/v1/actuator/health"
echo }
) > "%CONFIG_FILE%"

echo.
echo Сохранено: %CONFIG_FILE%
echo Теперь откройте Aurent Cashier.
pause
