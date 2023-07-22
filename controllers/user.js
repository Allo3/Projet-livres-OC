/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

require('dotenv').config(); // Ceci est l'appel du fichier .env à la racine pour récupérer le token de connexion

exports.signup = (req, res, next) => {
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // L'adresse mail doit suivre le format texte@texte.com
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/; // Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et doit contenir au minimum 8 caractères

    if (!emailRegex.test(req.body.email)) { // Booléen qui retourne une réponse si l'adresse mail est au bon format au non
      res.status(400).json({ message: 'Adresse email non valide' });
    } else if (!passwordRegex.test(req.body.password)) { // Booléen qui retourne une réponse si le mot de passe n'est pas au bon format
      res.status(400).json({ message: 'Mot de passe invalide' });
    } else { // Si l'email et le mot de passe sont au bon format, alors on exécute la suite
      bcrypt
        .hash(req.body.password, 10) // On vient crypter le password en le hashant 10 fois
        .then((hash) => { // Puis on vient créer un nouveau User avec l'email de la requête et le mot de passe crypté
          const user = new User({
            email: req.body.email,
            password: hash,
          });
          user.save() // Et on envoie ce nouveau User à la BDD
            .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
            .catch((error) => res.status(400).json({ error }));
        })
        .catch((error) => res.status(500).json({ error }));
    }
  } catch (error) {
    res.status(500).json({ error });
  }
};

exports.login = (req, res) => {
  User.findOne({ email: req.body.email }) // On récupère dans la BDD le User qui correspond à l'email de la requête de connexion
    .then((user) => {
      if (user === null) {
        res.status(401).json({ message: 'Paire identifiants/mot de passe incorrecte' });
      } else {
        bcrypt.compare(req.body.password, user.password) // On compare le mot de passe de connexion avec le mot de passe crypté de la BDD
          .then((valid) => {
            if (!valid) {
              res.status(401).json({ message: 'Paire identifiants/mot de passe incorrecte' });
            } else {
              res.status(200).json({
                userId: user._id,
                token: jwt.sign(
                  { userId: user._id },
                  process.env.TOKEN,
                  { expiresIn: '24h' },
                ),
              });
            }
          })
          .catch((error) => res.status(500).json({ error }));
      }
    })
    .catch((error) => res.status(500).json({ error }));
};
