@echo off
echo ╔══════════════════════════════════════════════════╗
echo ║     Compilation de concat-videos.exe             ║
echo ╚══════════════════════════════════════════════════╝
echo.

REM Vérifier si Node.js est installé
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js n'est pas installé !
    echo    Téléchargez-le depuis https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js trouvé
echo.

REM Vérifier si npm est installé
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm n'est pas installé !
    echo.
    pause
    exit /b 1
)

echo ✅ npm trouvé
echo.

REM Installer les dépendances
echo 📦 Installation des dépendances...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur lors de l'installation des dépendances
    echo.
    pause
    exit /b 1
)
echo.

REM Vérifier si pkg est installé globalement
where pkg >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 📦 Installation de pkg globalement...
    call npm install -g pkg
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Erreur lors de l'installation de pkg
        echo.
        pause
        exit /b 1
    )
)

echo ✅ pkg trouvé
echo.

REM Créer le dossier dist s'il n'existe pas
if not exist "dist" (
    mkdir dist
)

REM Compiler l'application
echo 🔨 Compilation en cours...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erreur lors de la compilation
    echo.
    pause
    exit /b 1
)
echo.

echo ✅ Compilation terminée avec succès !
echo.
echo 📁 L'exécutable se trouve dans : dist\concat-videos.exe
echo.
echo 🎉 Vous pouvez maintenant copier concat-videos.exe dans un dossier
echo    contenant des vidéos MP4 et double-cliquer dessus pour fusionner
echo    les vidéos.
echo.

pause
