const express = require('express');
const router = express.Router();

const medidaController = require('../controllers/medidaController');

// CRUD de Medidas
router.get('/listar', medidaController.listarMedidas);
router.get('/:id', medidaController.obterMedida);
router.post('/', medidaController.criarMedida);
router.put('/:id', medidaController.atualizarMedida);
router.delete('/:id', medidaController.deletarMedida);

module.exports = router;