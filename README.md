# Concat Videos - Fusion et Compression de Vidéos MP4

Script Node.js pour fusionner et compresser automatiquement des fichiers vidéo MP4 en utilisant FFmpeg.

## 📋 Fonctionnalités

- ✅ Détection automatique de tous les fichiers MP4 dans le répertoire
- 📅 Tri automatique par date de création (du plus ancien au plus récent)
- 🔧 **Normalisation automatique de toutes les vidéos** (résolution, framerate, codec)
- 🔄 **Rotation automatique des vidéos verticales en format horizontal**
- 🎬 Fusion des vidéos en un seul fichier `output.mp4`
- 🗜️ Compression H.264 avec qualité optimale (CRF 23, preset medium)
- 🔊 Audio AAC optimisé (192kbps, 48kHz)
- 📊 Affichage de la progression en temps réel
- 🧹 Nettoyage automatique des fichiers temporaires
- 🛡️ Gestion des erreurs robuste
- 🇫🇷 Interface en français

## 🔧 Prérequis

### FFmpeg

Le script nécessite FFmpeg installé sur votre système.

**Télécharger FFmpeg :**
- Windows : https://www.gyan.dev/ffmpeg/builds/ (télécharger "ffmpeg-release-essentials.zip")
- Site officiel : https://ffmpeg.org/download.html

**Installation sur Windows :**
1. Téléchargez FFmpeg (version "essentials" suffit)
2. Extrayez l'archive
3. Ajoutez le dossier `bin` au PATH système :
   - Ouvrez les "Paramètres système avancés"
   - Cliquez sur "Variables d'environnement"
   - Dans "Variables système", sélectionnez "Path" et cliquez sur "Modifier"
   - Ajoutez le chemin vers le dossier `bin` de FFmpeg (ex: `C:\ffmpeg\bin`)
   - Cliquez sur "OK" pour valider
4. Redémarrez votre terminal/invite de commande
5. Vérifiez l'installation : `ffmpeg -version`

### Pour la compilation (optionnel)

Si vous souhaitez compiler le script en .exe :

- Node.js 14+ : https://nodejs.org/
- npm (inclus avec Node.js)

## 🚀 Utilisation

### Option 1 : Utiliser l'exécutable (.exe)

**Le plus simple - Aucune installation Node.js requise !**

1. Téléchargez le fichier `concat-videos.exe` depuis le dossier `dist/`
2. Copiez `concat-videos.exe` dans le dossier contenant vos vidéos MP4
3. Double-cliquez sur `concat-videos.exe`
4. Le script va :
   - Détecter tous les fichiers MP4
   - Les trier par date de création
   - Les fusionner dans `output.mp4`
   - Afficher la progression
5. Une fois terminé, trouvez votre vidéo finale : `output.mp4`

**⚠️ Important :** FFmpeg doit être installé et dans le PATH système !

### Option 2 : Utiliser le script Node.js

Si vous avez Node.js installé :

```bash
# Installer les dépendances (première fois uniquement)
npm install

# Exécuter le script
npm start
```

Ou directement :

```bash
node concat-videos.js
```

## 🛠️ Compilation en .exe

Si vous souhaitez recompiler l'exécutable :

### Méthode 1 : Utiliser le fichier batch

```batch
build.bat
```

### Méthode 2 : Commandes manuelles

```bash
# Installer les dépendances
npm install

# Installer pkg globalement (si pas déjà fait)
npm install -g pkg

# Compiler pour Windows x64
npm run build

# Ou compiler pour plusieurs plateformes
npm run build:all
```

L'exécutable sera créé dans le dossier `dist/` :
- `dist/concat-videos.exe` (Windows 64-bit)

## 📁 Structure du Projet

```
mergevideos/
│
├── concat-videos.js    # Script principal
├── package.json        # Configuration Node.js et pkg
├── README.md          # Ce fichier
├── build.bat          # Script de compilation Windows
│
└── dist/              # Dossier de sortie (après compilation)
    └── concat-videos.exe
```

## ⚙️ Paramètres de Compression

Le script utilise les paramètres FFmpeg suivants :

- **Codec vidéo** : H.264 (libx264)
- **CRF** : 23 (qualité élevée, 0=lossless, 51=pire qualité)
- **Preset** : medium (bon compromis vitesse/qualité)
- **Codec audio** : copy (pas de réencodage)

### Modifier les paramètres

Pour ajuster la qualité ou la vitesse, éditez les paramètres FFmpeg dans `concat-videos.js` (fonction `mergeVideos`) :

```javascript
const ffmpegArgs = [
    '-f', 'concat',
    '-safe', '0',
    '-i', concatFile,
    '-c:v', 'libx264',
    '-preset', 'medium',    // Options : ultrafast, fast, medium, slow, veryslow
    '-crf', '23',           // Valeur : 0-51 (18=haute qualité, 28=qualité moyenne)
    '-c:a', 'copy',
    '-y',
    outputPath
];
```

**Presets disponibles :**
- `ultrafast` : Très rapide, fichier plus gros
- `fast` : Rapide
- `medium` : Équilibré (par défaut)
- `slow` : Lent, meilleure compression
- `veryslow` : Très lent, compression optimale

**Valeurs CRF recommandées :**
- `18` : Qualité visuelle très élevée
- `23` : Qualité élevée (par défaut, recommandé)
- `28` : Qualité moyenne, fichier plus petit

## 🔄 Normalisation et Rotation Automatique des Vidéos

Le script **normalise automatiquement** toutes les vidéos pour garantir une compatibilité parfaite lors de la fusion, et **garantit une sortie en format horizontal**.

### Comment ça fonctionne ?

1. **Analyse complète** : Le script analyse chaque vidéo (dimensions, framerate, codec)
2. **Détection d'orientation** : Les vidéos verticales (hauteur > largeur) sont identifiées
3. **Détermination des paramètres cibles** :
   - Résolution : La plus grande résolution trouvée (minimum 1920x1080)
   - FPS : Le framerate le plus commun parmi toutes les vidéos
4. **Normalisation** : TOUTES les vidéos sont converties au même format :
   - Rotation automatique des vidéos verticales (90° sens horaire)
   - Mise à l'échelle avec padding noir pour conserver le ratio d'aspect
   - Uniformisation du framerate
   - Encodage H.264 avec audio AAC
5. **Fusion** : Les vidéos normalisées sont fusionnées sans problème de compatibilité

### Exemple

```
Entrée :
- video1.mp4 (1920x1080, 30fps, h264) → Normalisée
- video2.mp4 (1080x1920, 60fps, hevc) → Verticale + différent codec → Rotation + normalisation 🔄
- video3.mp4 (1280x720, 25fps, h264)  → Différente résolution/fps → Normalisée

Résolution cible déterminée : 1920x1080 à 30fps

Sortie :
- output.mp4 → 1920x1080, 30fps, 100% horizontal, parfaitement compatible
```

### Pourquoi normaliser TOUTES les vidéos ?

**Problème résolu** : Sans normalisation, si vos vidéos ont des caractéristiques différentes (résolution, codec, fps), seule la première vidéo s'affiche correctement, les autres sont noires ou ne fonctionnent pas.

La normalisation garantit que toutes les vidéos ont :
- ✅ Même résolution
- ✅ Même framerate
- ✅ Même codec vidéo (H.264)
- ✅ Même codec audio (AAC)
- ✅ Même format de pixel (yuv420p)

### Avantages

- ✅ **Compatibilité garantie** : Fusionne des vidéos de sources différentes sans problème
- ✅ **Automatique** : Aucune intervention manuelle nécessaire
- ✅ **Intelligent** : Détecte automatiquement les meilleurs paramètres
- ✅ **Cohérent** : Sortie garantie en format paysage uniforme
- ✅ **Propre** : Les fichiers temporaires sont automatiquement supprimés

### Notes techniques

- La rotation utilise le filtre FFmpeg `transpose=1` (90° sens horaire)
- Le scaling utilise `scale` avec `pad` pour ajouter des bandes noires si nécessaire
- Les fichiers originaux ne sont jamais modifiés
- Les vidéos normalisées sont stockées temporairement puis supprimées après la fusion
- Encodage vidéo : H.264, CRF 23, preset medium
- Encodage audio : AAC, 192kbps, 48kHz

## 🐛 Dépannage

### "FFmpeg n'est pas installé ou n'est pas dans le PATH"

- Vérifiez que FFmpeg est installé : `ffmpeg -version` dans le terminal
- Assurez-vous que le dossier `bin` de FFmpeg est dans le PATH
- Redémarrez votre terminal/ordinateur après l'ajout au PATH

### "Aucun fichier MP4 trouvé"

- Vérifiez que vous avez bien des fichiers `.mp4` dans le dossier
- Le fichier `output.mp4` est automatiquement exclu

### "Un seul fichier MP4 trouvé"

- Le script nécessite au moins 2 fichiers MP4 pour effectuer une fusion
- Si vous avez un seul fichier et souhaitez seulement le compresser, utilisez FFmpeg directement

### L'exécutable ne se lance pas

- Assurez-vous que FFmpeg est installé et dans le PATH
- Essayez d'exécuter l'exe depuis un terminal pour voir les messages d'erreur :
  ```cmd
  concat-videos.exe
  ```

## 📝 Exemples d'Utilisation

### Exemple 1 : Fusionner des vidéos de vacances

```
dossier-vacances/
├── video_001.mp4  (01/07/2024)
├── video_002.mp4  (02/07/2024)
├── video_003.mp4  (03/07/2024)
└── concat-videos.exe
```

Résultat : `output.mp4` contenant les 3 vidéos dans l'ordre chronologique

### Exemple 2 : Fusionner des clips de gameplay

```
gameplay/
├── clip_1.mp4
├── clip_2.mp4
├── clip_3.mp4
├── clip_4.mp4
└── concat-videos.exe
```

Double-cliquez sur l'exe, attendez, et récupérez votre vidéo complète !

## 📄 Licence

MIT License - Libre d'utilisation et de modification

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Soumettre des pull requests

## 📞 Support

En cas de problème :
1. Vérifiez que FFmpeg est correctement installé
2. Consultez la section "Dépannage" ci-dessus
3. Vérifiez que vos fichiers MP4 ne sont pas corrompus

## 🎯 Roadmap

Fonctionnalités futures possibles :
- [ ] Support des autres formats vidéo (AVI, MKV, MOV, etc.)
- [ ] Interface graphique (GUI)
- [ ] Sélection manuelle des fichiers à fusionner
- [ ] Prévisualisation avant fusion
- [ ] Support du glisser-déposer
- [ ] Options de compression personnalisables via interface
- [ ] Support des sous-titres

---

**Fait avec ❤️ pour simplifier la fusion de vidéos**
