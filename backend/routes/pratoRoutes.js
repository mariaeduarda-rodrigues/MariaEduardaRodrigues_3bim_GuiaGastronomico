const express = require('express');
const multer = require('multer');

const router = express.Router();

const pratoController = require('../controllers/pratoController');

const upload = multer({
  storage: multer.memoryStorage()
});

// CRUD de Pratos
router.get('/listar', pratoController.listarPratos);
router.get('/:id', pratoController.obterPrato);
router.post('/', pratoController.criarPrato);
router.put('/:id', pratoController.atualizarPrato);
router.delete('/:id', pratoController.deletarPrato);

// Upload da imagem do prato
router.post(
  '/upload/:id',
  upload.single('imagem'),
  pratoController.uploadImagem
);

module.exports = router;