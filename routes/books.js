const express = require('express');
const auth = require('../middlewares/auth');
const multer = require('../middlewares/multer-config');

const router = express.Router();

const bookController = require('../controllers/books');

router.get('/', multer, bookController.getAllBooks);
router.post('/', auth, multer, bookController.createBook);
router.get('/bestrating', multer, bookController.getBestRatingBooks);
router.post('/:id/rating', auth, multer, bookController.setBookRating);
router.get('/:id', multer, bookController.getOneBook);
router.put('/:id', auth, multer, bookController.modifyBook);
router.delete('/:id', auth, multer, bookController.deleteBook);

module.exports = router;
