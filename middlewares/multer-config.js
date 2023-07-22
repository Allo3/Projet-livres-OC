/* eslint-disable no-multi-spaces */
/* eslint-disable max-len */
/* eslint-disable indent */
const multer = require('multer');            // sharp-multer permet de modifier le format de notre fichier directement,
const sharpMulter = require('sharp-multer'); // et la possibilité de changer sa taille directement dans sa définition

// Définition des fichiers que l'on prend en compte avec Multer
const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const storage = sharpMulter({
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  imageOptions: {
    fileFormat: 'webp', // On convertit le fichier à l'arrivée en .webp pour gagner en espace
    quality: 80, // On réduit la qualité de celui-ci pour économiser en espace
    resize: { width: 500, height: 700, resizeMode: 'inside' }, // Et on le resize tout en le maintenant correctement dans le cadre grâce à resizeMode
    useTimestamp: true,
  },
});

// On effectue une vérification du type de fichier pour refuser les mauvais formats
const extensionFilter = (req, file, callback) => {
  if (!MIME_TYPES[file.mimetype]) {
    callback(new Error('Veuillez passer un fichier valide'));
  } else {
    callback(null, true);
  }
};

module.exports = multer({ storage, extensionFilter }).single('image');
