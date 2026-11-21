const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');
const { verificaAutenticacao } = require('../middlewares/authMiddleware');

router.get('/dadosCliente', verificaAutenticacao, pedidoController.dadosCliente);
router.post('/finalizar', verificaAutenticacao, pedidoController.finalizarPedido);

module.exports = router;