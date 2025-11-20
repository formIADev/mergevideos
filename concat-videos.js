#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Fonction pour effacer la console
function clearConsole() {
    console.clear();
}

// Fonction pour afficher un en-tête
function printHeader() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║     Fusion et Compression de Vidéos MP4          ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
}

// Fonction pour vérifier si FFmpeg est installé
function checkFFmpeg() {
    try {
        execSync('ffmpeg -version', { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
    }
}

// Fonction pour obtenir le répertoire de travail
function getWorkingDirectory() {
    // Si exécuté depuis un .exe compilé avec pkg
    if (process.pkg) {
        return path.dirname(process.execPath);
    }
    // Sinon, utiliser le répertoire courant
    return process.cwd();
}

// Fonction pour trouver tous les fichiers MP4
function findMP4Files(directory) {
    try {
        const files = fs.readdirSync(directory);
        const mp4Files = files.filter(file =>
            file.toLowerCase().endsWith('.mp4') &&
            file.toLowerCase() !== 'output.mp4'
        );

        // Récupérer les informations de création pour chaque fichier
        const filesWithStats = mp4Files.map(file => {
            const filePath = path.join(directory, file);
            const stats = fs.statSync(filePath);
            return {
                name: file,
                path: filePath,
                birthtime: stats.birthtime,
                mtime: stats.mtime
            };
        });

        // Trier par date de création (birthtime) ou date de modification si birthtime n'est pas disponible
        filesWithStats.sort((a, b) => {
            const dateA = a.birthtime || a.mtime;
            const dateB = b.birthtime || b.mtime;
            return dateA - dateB;
        });

        return filesWithStats;
    } catch (error) {
        console.error('❌ Erreur lors de la recherche des fichiers:', error.message);
        return [];
    }
}

// Fonction pour obtenir les informations complètes d'une vidéo
function getVideoInfo(filePath) {
    try {
        const output = execSync(
            `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,codec_name -of json "${filePath}"`,
            { encoding: 'utf8' }
        );
        const data = JSON.parse(output);
        const stream = data.streams[0];

        // Calculer le framerate
        let fps = 30; // valeur par défaut
        if (stream.r_frame_rate) {
            const [num, den] = stream.r_frame_rate.split('/').map(Number);
            if (den && den !== 0) {
                fps = Math.round(num / den);
            }
        }

        return {
            width: stream.width,
            height: stream.height,
            fps: fps,
            codec: stream.codec_name
        };
    } catch (error) {
        console.error(`❌ Erreur lors de la lecture des infos de ${path.basename(filePath)}:`, error.message);
        return null;
    }
}

// Fonction pour normaliser une vidéo (avec fond flou pour les vidéos verticales)
function normalizeVideo(inputPath, outputPath, targetWidth, targetHeight, targetFps, isVertical, index, total) {
    return new Promise((resolve, reject) => {
        const fileName = path.basename(inputPath);
        const action = isVertical ? 'Normalisation avec fond flou' : 'Normalisation';
        console.log(`   🔧 ${action} de "${fileName}" (${index}/${total})...`);

        let vf;

        if (isVertical) {
            // Pour les vidéos verticales : effet fond flou style TikTok/YouTube
            // 1. Créer le fond : agrandir et flouter
            // 2. Créer le premier plan : redimensionner pour s'adapter
            // 3. Superposer le premier plan centré sur le fond
            vf = `[0:v]scale=${targetWidth}:-1:flags=bicubic,boxblur=20:1[bg];` +
                 `[0:v]scale=-1:${targetHeight}:flags=bicubic[fg];` +
                 `[bg][fg]overlay=(W-w)/2:(H-h)/2,fps=${targetFps},format=yuv420p`;
        } else {
            // Pour les vidéos horizontales : padding noir classique
            vf = `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2,fps=${targetFps},format=yuv420p`;
        }

        const ffmpegArgs = [
            '-i', inputPath,
            '-filter_complex', vf,
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-ar', '48000',
            '-y',
            outputPath
        ];

        const ffmpeg = spawn('ffmpeg', ffmpegArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

        let lastProgress = '';

        ffmpeg.stderr.on('data', (data) => {
            const output = data.toString();
            const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2})/);

            if (timeMatch) {
                const hours = parseInt(timeMatch[1]);
                const minutes = parseInt(timeMatch[2]);
                const seconds = parseInt(timeMatch[3]);
                const totalSeconds = hours * 3600 + minutes * 60 + seconds;
                const progressLine = `      ⏳ ${formatDuration(totalSeconds)}`;

                if (lastProgress) {
                    process.stdout.write('\r' + ' '.repeat(lastProgress.length) + '\r');
                }
                process.stdout.write(progressLine);
                lastProgress = progressLine;
            }
        });

        ffmpeg.on('close', (code) => {
            if (lastProgress) {
                process.stdout.write('\r' + ' '.repeat(lastProgress.length) + '\r');
            }

            if (code === 0) {
                console.log(`      ✅ Terminée`);
                resolve();
            } else {
                reject(new Error(`FFmpeg s'est terminé avec le code ${code}`));
            }
        });

        ffmpeg.on('error', (error) => {
            reject(error);
        });
    });
}

// Fonction pour créer le fichier de concaténation
function createConcatFile(files, directory) {
    const concatFilePath = path.join(directory, 'concat_list.txt');
    const content = files.map(file => `file '${file.path.replace(/\\/g, '/')}'`).join('\n');

    try {
        fs.writeFileSync(concatFilePath, content, 'utf8');
        return concatFilePath;
    } catch (error) {
        console.error('❌ Erreur lors de la création du fichier de concaténation:', error.message);
        return null;
    }
}

// Fonction pour formater la durée
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

// Fonction principale de fusion
function mergeVideos(concatFile, outputPath) {
    return new Promise((resolve, reject) => {
        console.log('\n🎬 Démarrage de la fusion et compression...\n');

        const ffmpegArgs = [
            '-f', 'concat',
            '-safe', '0',
            '-i', concatFile,
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '23',
            '-c:a', 'copy',
            '-y',
            outputPath
        ];

        const ffmpeg = spawn('ffmpeg', ffmpegArgs);

        let lastProgress = '';

        ffmpeg.stderr.on('data', (data) => {
            const output = data.toString();

            // Extraire les informations de progression
            const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2})/);
            const speedMatch = output.match(/speed=\s*(\d+\.?\d*)x/);
            const fpsMatch = output.match(/fps=\s*(\d+)/);

            if (timeMatch || speedMatch) {
                let progressLine = '⏳ Progression: ';

                if (timeMatch) {
                    const hours = parseInt(timeMatch[1]);
                    const minutes = parseInt(timeMatch[2]);
                    const seconds = parseInt(timeMatch[3]);
                    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
                    progressLine += `Temps: ${formatDuration(totalSeconds)}`;
                }

                if (fpsMatch) {
                    progressLine += ` | FPS: ${fpsMatch[1]}`;
                }

                if (speedMatch) {
                    progressLine += ` | Vitesse: ${speedMatch[1]}x`;
                }

                // Effacer la ligne précédente et afficher la nouvelle
                if (lastProgress) {
                    process.stdout.write('\r' + ' '.repeat(lastProgress.length) + '\r');
                }
                process.stdout.write(progressLine);
                lastProgress = progressLine;
            }
        });

        ffmpeg.on('close', (code) => {
            if (lastProgress) {
                console.log(''); // Nouvelle ligne après la progression
            }

            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`FFmpeg s'est terminé avec le code ${code}`));
            }
        });

        ffmpeg.on('error', (error) => {
            reject(error);
        });
    });
}

// Fonction pour nettoyer les fichiers temporaires
function cleanup(concatFile, normalizedFiles = []) {
    try {
        if (fs.existsSync(concatFile)) {
            fs.unlinkSync(concatFile);
        }

        // Nettoyer les fichiers normalisés temporaires
        normalizedFiles.forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        });

        if (concatFile || normalizedFiles.length > 0) {
            console.log('🧹 Fichiers temporaires nettoyés');
        }
    } catch (error) {
        console.warn('⚠️  Impossible de nettoyer les fichiers temporaires:', error.message);
    }
}

// Fonction pour obtenir la taille du fichier en format lisible
function getFileSize(filePath) {
    const stats = fs.statSync(filePath);
    const bytes = stats.size;
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    return `${mb} MB`;
}

// Fonction principale
async function main() {
    clearConsole();
    printHeader();

    // Vérifier FFmpeg
    console.log('🔍 Vérification de FFmpeg...');
    if (!checkFFmpeg()) {
        console.error('❌ FFmpeg n\'est pas installé ou n\'est pas dans le PATH.');
        console.error('   Veuillez installer FFmpeg depuis https://ffmpeg.org/download.html');
        console.log('\n📝 Appuyez sur une touche pour quitter...');
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.once('data', () => process.exit(1));
        return;
    }
    console.log('✅ FFmpeg trouvé\n');

    // Obtenir le répertoire de travail
    const workingDir = getWorkingDirectory();
    console.log(`📁 Répertoire de travail: ${workingDir}\n`);

    // Trouver les fichiers MP4
    console.log('🔍 Recherche des fichiers MP4...');
    const mp4Files = findMP4Files(workingDir);

    if (mp4Files.length === 0) {
        console.error('❌ Aucun fichier MP4 trouvé dans le répertoire.');
        console.log('\n📝 Appuyez sur une touche pour quitter...');
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.once('data', () => process.exit(1));
        return;
    }

    if (mp4Files.length === 1) {
        console.warn('⚠️  Un seul fichier MP4 trouvé. Au moins 2 fichiers sont nécessaires pour la fusion.');
        console.log('\n📝 Appuyez sur une touche pour quitter...');
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.once('data', () => process.exit(1));
        return;
    }

    console.log(`✅ ${mp4Files.length} fichiers trouvés (triés par date de création):\n`);
    mp4Files.forEach((file, index) => {
        const dateStr = file.birthtime ? file.birthtime.toLocaleString('fr-FR') : 'Date inconnue';
        console.log(`   ${index + 1}. ${file.name} (${dateStr})`);
    });

    // Analyser toutes les vidéos pour obtenir leurs caractéristiques
    console.log('\n🔍 Analyse des caractéristiques des vidéos...');
    const videosToProcess = [];
    let verticalCount = 0;
    let maxWidth = 0;
    let maxHeight = 0;
    const fpsValues = [];

    for (const file of mp4Files) {
        const info = getVideoInfo(file.path);
        if (!info) {
            console.error(`❌ Impossible d'analyser ${file.name}`);
            console.log('\n📝 Appuyez sur une touche pour quitter...');
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.once('data', () => process.exit(1));
            return;
        }

        const isVertical = info.height > info.width;
        // Toujours utiliser les dimensions réelles (pas de rotation)
        maxWidth = Math.max(maxWidth, info.width);
        maxHeight = Math.max(maxHeight, info.height);

        if (isVertical) {
            verticalCount++;
            console.log(`   📱 "${file.name}" - Verticale (${info.width}x${info.height}, ${info.fps}fps) - Fond flou activé`);
        } else {
            console.log(`   🖥️  "${file.name}" - Horizontale (${info.width}x${info.height}, ${info.fps}fps)`);
        }

        fpsValues.push(info.fps);

        videosToProcess.push({
            ...file,
            info,
            isVertical
        });
    }

    // Déterminer la résolution cible (on prend la plus grande, ou 1920x1080 si c'est plus petit)
    let targetWidth = Math.max(maxWidth, 1920);
    let targetHeight = Math.max(maxHeight, 1080);

    // Si toutes les vidéos sont plus petites que 1920x1080, on utilise la plus grande résolution trouvée
    if (maxWidth < 1920 && maxHeight < 1080) {
        targetWidth = maxWidth;
        targetHeight = maxHeight;
    }

    // Déterminer le FPS cible (le plus commun, ou 30 par défaut)
    const fpsCount = {};
    fpsValues.forEach(fps => {
        fpsCount[fps] = (fpsCount[fps] || 0) + 1;
    });
    const targetFps = Object.keys(fpsCount).reduce((a, b) => fpsCount[a] > fpsCount[b] ? a : b, 30);

    console.log(`\n📊 Résolution cible: ${targetWidth}x${targetHeight} à ${targetFps}fps`);

    // Normaliser TOUTES les vidéos pour garantir la compatibilité
    console.log(`\n🔧 Normalisation de ${mp4Files.length} vidéo(s) au même format...\n`);

    const normalizedFiles = [];
    let processedCount = 0;

    for (const video of videosToProcess) {
        processedCount++;
        const normalizedPath = path.join(workingDir, `temp_normalized_${Date.now()}_${processedCount}.mp4`);
        normalizedFiles.push(normalizedPath);

        try {
            await normalizeVideo(
                video.path,
                normalizedPath,
                targetWidth,
                targetHeight,
                targetFps,
                video.isVertical,
                processedCount,
                mp4Files.length
            );
            video.path = normalizedPath; // Utiliser le fichier normalisé
        } catch (error) {
            console.error(`\n❌ Erreur lors de la normalisation de ${video.name}:`, error.message);
            cleanup(null, normalizedFiles);
            console.log('\n📝 Appuyez sur une touche pour quitter...');
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.once('data', () => process.exit(1));
            return;
        }
    }

    console.log(`\n✅ Toutes les vidéos sont maintenant au même format (${targetWidth}x${targetHeight}, ${targetFps}fps)`);

    // Créer le fichier de concaténation
    console.log('\n📝 Création du fichier de concaténation...');
    const concatFile = createConcatFile(videosToProcess, workingDir);
    if (!concatFile) {
        console.error('❌ Impossible de créer le fichier de concaténation.');
        cleanup(null, normalizedFiles);
        console.log('\n📝 Appuyez sur une touche pour quitter...');
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.once('data', () => process.exit(1));
        return;
    }
    console.log('✅ Fichier de concaténation créé');

    // Fusionner les vidéos
    const outputPath = path.join(workingDir, 'output.mp4');

    try {
        await mergeVideos(concatFile, outputPath);

        console.log('\n✅ Fusion terminée avec succès!');
        console.log(`📹 Fichier de sortie: output.mp4`);
        console.log(`📦 Taille: ${getFileSize(outputPath)}`);

        // Nettoyer
        cleanup(concatFile, normalizedFiles);

        console.log('\n✨ Processus terminé avec succès!');
        console.log('\n📝 Appuyez sur une touche pour quitter...');
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.once('data', () => process.exit(0));

    } catch (error) {
        console.error('\n❌ Erreur lors de la fusion:', error.message);
        cleanup(concatFile, normalizedFiles);
        console.log('\n📝 Appuyez sur une touche pour quitter...');
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.once('data', () => process.exit(1));
    }
}

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
    console.error('\n❌ Erreur inattendue:', error.message);
    console.log('\n📝 Appuyez sur une touche pour quitter...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => process.exit(1));
});

// Lancer le script
main();
