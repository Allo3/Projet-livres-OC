require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.TOKEN); // On prend en token le credential défini dans le fichier .env
    const { userId } = decodedToken; // Si le token correspond à celui de la requête, alors on envoie en réponse l'userId
    req.auth = {
      userId,
    };
    next();
  } catch (error) {
    res.status(401).json({ error });
  }
};
