# Concat Videos - Fusion et Compression de Vidéos MP4

Script Node.js pour fusionner et compresser automatiquement des fichiers vidéo MP4 en utilisant FFmpeg.

## 📋 Fonctionnalités

- ✅ Détection automatique de tous les fichiers MP4 dans le répertoire
- 📅 Tri automatique par date de création (du plus ancien au plus récent)
- 🔧 **Normalisation automatique de toutes les vidéos** (résolution, framerate, codec)
- 🎨 **Fond flou automatique pour vidéos verticales** (style TikTok/YouTube)
- 📐 **Préserve l'orientation originale** (verticale ou horizontale)
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
    '-crf', '18',           // Valeur : 0-51 (18=haute qualité, 28=qualité moyenne)
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

## 🔄 Normalisation Automatique des Vidéos

Le script **normalise automatiquement** toutes les vidéos pour garantir une compatibilité parfaite lors de la fusion, **tout en préservant leur orientation originale** (verticale ou horizontale).

### Comment ça fonctionne ?

1. **Analyse complète** : Le script analyse chaque vidéo (dimensions, framerate, codec, orientation)
2. **Détection d'orientation** : Les vidéos verticales (hauteur > largeur) et horizontales sont identifiées
3. **Détermination des paramètres cibles** :
   - Résolution : La plus grande largeur ET la plus grande hauteur trouvées (minimum 1920x1080)
   - FPS : Le framerate le plus commun parmi toutes les vidéos
4. **Normalisation** : TOUTES les vidéos sont converties au même format :
   - **Vidéos verticales** : Fond flou automatique (style TikTok/YouTube) + vidéo centrée
   - **Vidéos horizontales** : Padding noir classique pour conserver le ratio d'aspect
   - Uniformisation du framerate
   - Encodage H.264 avec audio AAC
5. **Fusion** : Les vidéos normalisées sont fusionnées sans problème de compatibilité

## 🎨 Effet Fond Flou pour Vidéos Verticales

Les vidéos verticales (format smartphone) bénéficient automatiquement d'un **effet de fond flou** professionnel, identique à celui utilisé sur TikTok et YouTube.

### Comment ça fonctionne ?

Pour chaque vidéo verticale, le script crée automatiquement :

1. **Le fond (background)** :
   - La vidéo est agrandie pour remplir toute la largeur de la résolution cible
   - Un flou gaussien intense (blur 20) est appliqué
   - Résultat : Un fond esthétique qui reprend les couleurs de la vidéo

2. **Le premier plan (foreground)** :
   - La vidéo originale est redimensionnée pour s'adapter à la hauteur cible
   - Elle reste nette et non déformée
   - Son ratio d'aspect est parfaitement préservé

3. **La composition** :
   - Le premier plan est superposé centré sur le fond flou
   - Résultat : Une vidéo au format horizontal avec la vidéo verticale centrée sur son propre fond flouté

### Exemple visuel

```
Avant (vidéo verticale 1080x1920) :
┌────────┐
│        │
│ Vidéo  │
│ Vertic.│
│        │
└────────┘

Après (sortie horizontale 1920x1080 avec fond flou) :
┌──────────────────────────────────────────┐
│ [Fond flou]  ┌────────┐  [Fond flou]    │
│ [de la vidéo]│        │  [de la vidéo]  │
│ [agrandie]   │ Vidéo  │  [agrandie]     │
│ [et floutée] │ Vertic.│  [et floutée]   │
│              │        │                  │
│              └────────┘                  │
└──────────────────────────────────────────┘
```

### Paramètres FFmpeg utilisés

Le script utilise un filtre complexe FFmpeg :

```bash
# Créer le fond flou
[0:v]scale=1920:-1:flags=bicubic,boxblur=30:2[bg]

# Préparer la vidéo originale
[0:v]scale=-1:1080:flags=bicubic[fg]

# Superposer la vidéo centrée sur le fond
[bg][fg]overlay=(W-w)/2:(H-h)/2
```

- `scale=1920:-1` : Agrandit la vidéo à la largeur cible (auto-hauteur)
- `boxblur=30:2` : Applique un flou gaussien avec rayon 30
- `scale=-1:1080` : Redimensionne la vidéo originale à la hauteur cible (auto-largeur)
- `overlay=(W-w)/2:(H-h)/2` : Centre la vidéo horizontalement et verticalement

### Avantages

- ✅ **Professionnel** : Rendu identique aux vidéos TikTok/YouTube
- ✅ **Automatique** : Aucune configuration nécessaire
- ✅ **Esthétique** : Le fond reprend les couleurs de la vidéo
- ✅ **Pas de distorsion** : La vidéo originale garde son ratio exact
- ✅ **Remplissage intelligent** : Pas de bandes noires disgracieuses

### Exemple complet

```
Entrée :
- video1.mp4 (1920x1080, 30fps, h264) horizontale → Normalisée (padding noir)
- video2.mp4 (1080x1920, 60fps, hevc) verticale → Fond flou automatique appliqué 🎨
- video3.mp4 (1280x720, 25fps, h264) horizontale → Normalisée (padding noir)

maxWidth = 1920, maxHeight = 1920
→ Résolution cible : 1920x1920 à 30fps

Sortie :
- output.mp4 →
  * video1 : horizontale avec padding noir en haut/bas
  * video2 : verticale centrée sur fond flou de la même vidéo
  * video3 : horizontale avec padding noir en haut/bas
```

### Gestion des Orientations Mixtes

Lorsque vous mélangez des vidéos verticales et horizontales :
- La résolution cible sera **carrée** ou **rectangulaire** selon la plus grande dimension trouvée
- Les vidéos **verticales** ont un **fond flou** (pas de bandes noires)
- Les vidéos **horizontales** ont des **bandes noires** (letterbox/pillarbox) classiques
- Chaque vidéo **conserve son ratio d'aspect et son orientation originale**

### Pourquoi normaliser TOUTES les vidéos ?

**Problème résolu** : Sans normalisation, si vos vidéos ont des caractéristiques différentes (résolution, codec, fps), seule la première vidéo s'affiche correctement, les autres sont noires ou ne fonctionnent pas.

La normalisation garantit que toutes les vidéos ont :
- ✅ Même résolution cible (avec padding si nécessaire)
- ✅ Même framerate
- ✅ Même codec vidéo (H.264)
- ✅ Même codec audio (AAC)
- ✅ Même format de pixel (yuv420p)
- ✅ **Orientation originale préservée**

### Avantages

- ✅ **Compatibilité garantie** : Fusionne des vidéos de sources différentes sans problème
- ✅ **Automatique** : Aucune intervention manuelle nécessaire
- ✅ **Intelligent** : Détecte automatiquement les meilleurs paramètres
- ✅ **Respectueux** : Préserve l'orientation originale de chaque vidéo
- ✅ **Propre** : Les fichiers temporaires sont automatiquement supprimés

### Notes techniques

- **Vidéos verticales** : Utilise un filtre complexe FFmpeg avec `scale`, `boxblur` et `overlay`
- **Vidéos horizontales** : Utilise `scale` avec `pad` pour ajouter des bandes noires
- Les fichiers originaux ne sont jamais modifiés
- Les vidéos normalisées sont stockées temporairement puis supprimées après la fusion
- Encodage vidéo : H.264, CRF 23, preset medium
- Encodage audio : AAC, 192kbps, 48kHz
- Fond flou : rayon 20, algorithme bicubic pour le scaling
- Padding/overlay centré horizontalement et verticalement

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
