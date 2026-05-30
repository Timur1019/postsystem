@echo off
chcp 65001 >nul
set CONFIG_DIR=%APPDATA%\masterpiece-pos-cashier-desktop
set CONFIG_FILE=%CONFIG_DIR%\config.json

echo.
echo ============================================
echo   Aurent Касса - смена адреса сервера
echo ============================================
echo.
set /p HOST=Адрес сервера (IP или домен, без http://) [111.88.132.126]: 
set /p PORT=Порт API [8081]: 
if "%HOST%"=="" set HOST=111.88.132.126
if "%PORT%"=="" set PORT=8081

rem HTTPS для 443/8443 (как в мастере первого запуска)
set BACKEND=http://%HOST%:%PORT%
set HEALTH=%BACKEND%/api/v1/actuator/health
if "%PORT%"=="443" (
  set BACKEND=https://%HOST%
  set HEALTH=https://%HOST%/api/v1/actuator/health
)
if "%PORT%"=="8443" (
  set BACKEND=https://%HOST%:8443
  set HEALTH=https://%HOST%:8443/api/v1/actuator/health
)

if not exist "%CONFIG_DIR%" mkdir "%CONFIG_DIR%"

(
echo {
echo   "useRemoteUi": false,
echo   "cashierUrl": "http://127.0.0.1:5199",
echo   "backendOrigin": "%BACKEND%",
echo   "apiHealthUrl": "%HEALTH%",
echo   "webPort": "%PORT%",
echo   "apiPort": "%PORT%",
echo   "embeddedPort": 5199
echo }
) > "%CONFIG_FILE%"

echo.
echo Сохранено: %BACKEND%
echo Проверка в браузере: %HEALTH%
echo   Должно быть: {"status":"UP"}
echo.
echo Закройте Aurent Касса полностью и откройте снова.
echo.
pause
