require('dotenv').config();

const rateLimit = require('express-rate-limit');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const helmet = require('helmet'); // helmet vient sécuriser les Headers su site
const mongoSanitize = require('express-mongo-sanitize'); // express-mongo-sanitize vient lui supprimer les requêtes non désirées ou malveillantes

const booksRoutes = require('./routes/books');
const userRoutes = require('./routes/user');

// On vient se connecter à la BDD avec les credentials définis dans notre .env
mongoose.connect(`mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.9vnyqfr.mongodb.net/?retryWrites=true&w=majority`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

const app = express();

// L'utilisation de express-rate-limit pour limiter le nombre de requêtes par ip dans un temps donné
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Ici on limite le nombre de requêtes à 40 maximum sur un délai de 15 minutes
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,

});

app.use('/api/auth', limiter); // express-rate-limit sera uniquement utilisé pour la route /api/auth qui prend en compre la création de compte et l'inscription

// On supprime la propriété crossOriginResourcePolicy parce qu'elle est gérée de notre côté avec les CORS
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);
// Définition des CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

app.use(express.json()); // On vient convertir les données transmises en listes de données au format json (pour être lu via JavaScript)

app.use(mongoSanitize()); // On utilise mongoSanitize afin de supprimer les requêtes non désirées et/ou malveillantes

app.use('/api/auth', userRoutes);
app.use('/api/books', booksRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;
