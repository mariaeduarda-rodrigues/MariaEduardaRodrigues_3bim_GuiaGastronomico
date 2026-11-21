const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');
const recuperacaoController = require('../controllers/recuperacaoController');

router.post('/verificarEmail', loginController.verificarEmail);
router.post('/verificarSenha', loginController.verificarSenha);
router.post('/logout', loginController.logout);
router.get('/verificaLogado', loginController.verificaSeUsuarioEstaLogado);
router.post('/cadastrar', loginController.cadastrar);

// Recuperação de senha por e-mail
router.post('/esqueciSenha', recuperacaoController.esqueciSenha);
router.post('/redefinirSenha', recuperacaoController.redefinirSenha);

module.exports = router;