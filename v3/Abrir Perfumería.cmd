@echo off
rem Abre la v3 en este ordenador: Docker, Supabase y PowerSync locales, y la app en el navegador.
rem Doble clic. Para cerrarla, cierra esta ventana (Docker puede seguir abierto).
setlocal
cd /d "%~dp0"
set "PATH=%PATH%;C:\Program Files\nodejs;C:\Program Files\Docker\Docker\resources\bin"
title Perfumeria v3

rem Si la app ya esta en marcha, solo se abre el navegador.
netstat -ano | findstr /r /c:":5173 .*LISTENING" >nul && (
  echo La app ya estaba en marcha: abro el navegador.
  start "" http://localhost:5173
  timeout /t 3 >nul
  exit /b 0
)

rem 1. Docker Desktop: si no esta abierto, se abre y se espera.
docker info >nul 2>&1 || (
  echo Abriendo Docker Desktop...
  start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
)
:esperar_docker
docker info >nul 2>&1 || (
  timeout /t 3 >nul
  goto esperar_docker
)
echo Docker, listo.

rem 2. Supabase y PowerSync locales (si ya estaban en marcha, no pasa nada).
echo Arrancando Supabase local...
call npm run -s db:start >nul 2>&1
echo Arrancando PowerSync local...
call npm run -s sync:start
if errorlevel 1 (
  echo No se pudo arrancar PowerSync. Mira el mensaje de arriba.
  pause
  exit /b 1
)

rem 3. La app, que abre el navegador sola cuando esta lista.
echo Abriendo la app en http://localhost:5173 ...
call npm run dev -- --open --strictPort
pause
