/* eslint-disable no-trailing-spaces */
/* eslint-disable no-shadow */
/* eslint-disable max-len */
/* eslint-disable consistent-return */
/* eslint-disable no-unused-vars */
/* eslint-disable no-tabs */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-underscore-dangle */
const fs = require('fs');
const Book = require('../models/Books');

exports.createBook = (req, res, next) => { // On créé la fonction de création de livre
  const bookObject = JSON.parse(req.body.book);

  delete bookObject._id; // On supprime le potentiel id pour pouvoir le générer via la BDD plus tard
  delete bookObject.userId; // On supprime le potentiel userId pour l'associer avec un nouveau sécurisé grâce au token

  const book = new Book({ // On créé l'objet Book avec les données du schema
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`, // L'utilisateur de Multer permet d'indiquer la présence de notre image ici
    averageRating: bookObject.ratings[0].grade,
  });

  const filename = book.imageUrl.split('/images/')[1];

  book.save()
    .then(() => res.status(201).json({ message: 'Objet enregistré' }))
    .catch((error) => {
      fs.unlink(`images/${filename}`, (err) => { // Si la requête est incorrecte, on supprime l'image de la requête pour ne pas qu'elle prenne d'espace inutile
        if (err) console.log(err);
      });
      console.log(error);
      res.status(400).json({ error });
    });
};

exports.modifyBook = (req, res) => { // On créé la fonction pour modifier un livre déjà existant
  const bookObject = req.file ? { // On vérifiie si le corps de la requête contient une image, sinon on intègre le body dans bookObject
    ...JSON.parse(req.body.book),
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
  } : { ...req.body };

  delete bookObject.userId; // même principe que pour la création de book, on supprime le userId pour en générer un qui fonctionne via le token d'authentification
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId !== req.auth.userId) {
        res.status(400).json({ message: 'Non-Autorisé' });
      } else {
        let previousImage = '';
        if (req.file) {
          previousImage = book.imageUrl.split('/images/')[1]; // On récupère le lien de l'image avant validation de la modification, pour la supprimer en cas d'erreur
        }
        Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
          .then(() => {
            fs.unlink(`images/${previousImage}`, (error) => {
              if (error) {
                console.log(error);
              }
            });
            res.status(200).json({ message: 'Objet Modifié !' });
  	      })
          .catch((error) => {
            fs.unlink(`images/${req.file.previousImage}`, (err) => { // On supprime l'image que l'on n'a finalement pas upload
              if (err) {
                console.log(err);
              }
            });
            res.status(401).json({ error });
          });
      }
    })
    .catch((error) => res.status(400).json({ error }));
};

exports.deleteBook = (req, res) => { // Fonction pour supprimer un livre
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId !== req.auth.userId) { // Si le livre que l'on veut supprimé n'a pas été publié par le userId qui veut le supprimer
        res.status(400).json({ message: 'Non-autorisé' }); // Alors on renvoie un message d'erreur
      } else {
        const filename = book.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: 'Objet supprimé' });
            })
            .catch((error) => {
              res.status(400).json({ error });
            });
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getOneBook = (req, res) => { // On récupère un livre uniquement
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

exports.getAllBooks = (req, res) => { // On récupère tous les livres présents sur la BDD
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

exports.getBestRatingBooks = (req, res, next) => { // Fonction pour générer les 3 livres les mieux notés de la BDD
  Book.find()
    .sort({ averageRating: -1 }) // On trie pas ordre décroissant
    .limit(3) // On se limite à 3 objets maximum
    .then((books) => res.status(200).json(books)) // Puis en réponse on envoie nos livres, limités à 3, dans l'ordre décroissant donc de la meilleure note à la pire
    .catch((error) => res.status(400).json({ error }));
};

exports.setBookRating = (req, res) => { // Fonctione pour qu'un User ajoute une note à un autre livre que le(s) sien(s)
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      const userHasRated = book.ratings.find((rating) => rating.userId === req.auth.userId);

      if (userHasRated) { // On vérifie avec le userId que l'utilisateur n'a pas déjà noté le livre
        return res.status(400).json({ message: 'Vous avez déjà noté ce livre.' });
      }
      
      book.ratings.push({ userId: req.auth.userId, grade: req.body.rating }); // Sinon on vient push le userId pour confirmer quel utilisateur émet la note

      const ratings = book.ratings.map((rating) => rating.grade);

      let averageRating = ratings.reduce((previous, current) => previous + current, 0) / ratings.length;
      averageRating = averageRating.toFixed(1); // On utilise .toFixed pour arrondir le résultat à une décimale (pour éviter des valeurs comme 4.277775/5)

      Book.findByIdAndUpdate(
        { _id: req.params.id },
        { ratings: book.ratings, averageRating },
        { new: true },
      )
        .then((book) => res.status(200).json(book))
        .catch((error) => res.status(401).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};
