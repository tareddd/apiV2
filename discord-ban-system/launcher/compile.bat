@echo off
title FNLauncher - Compilation MSVC
echo.
echo  ============================================
echo   FN Private Launcher - Compilation MSVC
echo  ============================================
echo.

REM ── Ferme le launcher s'il tourne ──
taskkill /F /IM FNPrivateLauncher.exe >nul 2>&1
timeout /t 1 /nobreak >nul

REM ── Supprime l'ancien exe ──
if exist FNPrivateLauncher.exe del /F FNPrivateLauncher.exe

REM ── Cherche vcvarsall.bat pour initialiser l'environnement MSVC ──
set VCVARS=""

if exist "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" (
    set VCVARS="C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat"
    goto :found
)
if exist "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat" (
    set VCVARS="C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat"
    goto :found
)
if exist "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" (
    set VCVARS="C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\VC\Auxiliary\Build\vcvarsall.bat"
    goto :found
)
if exist "C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Auxiliary\Build\vcvarsall.bat" (
    set VCVARS="C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Auxiliary\Build\vcvarsall.bat"
    goto :found
)

echo  [!] Visual Studio Build Tools introuvable.
echo.
echo  Installe-le ici :
echo  https://visualstudio.microsoft.com/fr/visual-cpp-build-tools/
echo.
echo  Coche : "Developpement Desktop en C++"
echo  Puis relance ce .bat
echo.
pause
exit /b 1

:found
echo  [*] MSVC trouve : %VCVARS%
echo  [*] Initialisation de l'environnement...
call %VCVARS% x64 >nul 2>&1

echo  [*] Compilation en cours...
cl /EHsc /O2 /W3 /nologo ^
   /Fe:FNPrivateLauncher.exe ^
   FNLauncher.cpp ^
   wininet.lib user32.lib gdi32.lib comdlg32.lib comctl32.lib ole32.lib shell32.lib dwmapi.lib ^
   /link /SUBSYSTEM:WINDOWS

if exist FNPrivateLauncher.exe (
    echo.
    echo  [OK] FNPrivateLauncher.exe compile avec succes !
    echo.
) else (
    echo.
    echo  [ERREUR] Compilation echouee. Lis les erreurs ci-dessus.
    echo.
)
pause
