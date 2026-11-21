const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { query } = require('./database');

// Importa as rotas
const pratoRoutes = require('./routes/pratoRoutes');
const medidaRoutes = require('./routes/medidaRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const funcionarioRoutes = require('./routes/funcionarioRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const loginRoutes = require('./routes/loginRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const cookieParser = require('cookie-parser');
const {
  verificaFuncionarioApi,
  verificaFuncionarioPagina,
  leituraPublica
} = require('./middlewares/authMiddleware');

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser(process.env.SESSION_SECRET || 'devora-troque-este-segredo')); // lê os cookies (assinados)

// Não expõe o código do servidor nem o script do banco pelo navegador
app.use(['/backend', '/guia_gastronomico.sql'], (req, res) => res.status(404).end());

// Telas de administração: só funcionário logado acessa
app.use(
  ['/frontend/admin', '/frontend/menu', '/frontend/usuario', '/frontend/prato',
   '/frontend/categoria', '/frontend/medida', '/frontend/funcionario'],
  verificaFuncionarioPagina
);

// Servir todos os arquivos do projeto
app.use(express.static(path.join(__dirname, '..')));

// Abrir a página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Servir imagens
app.use(
  '/imagens',
  express.static(path.join(__dirname, '../imagens'))
);

// Rotas
app.use('/login', loginRoutes);
app.use('/prato', leituraPublica, pratoRoutes);
app.use('/medida', leituraPublica, medidaRoutes);
app.use('/categoria', leituraPublica, categoriaRoutes);
app.use('/cliente', verificaFuncionarioApi, clienteRoutes);
app.use('/funcionario', verificaFuncionarioApi, funcionarioRoutes);
app.use('/usuario', verificaFuncionarioApi, usuarioRoutes);
app.use('/pedido', pedidoRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log('\n=================================');
  console.log(`🚀 Servidor executando na porta ${PORT}`);

  try {
    await query('SELECT 1');

    console.log(
      `✅ Banco de Dados ${process.env.DB_NAME} conectado com sucesso!`
    );
  } catch (error) {
    console.error(
      '❌ FALHA NA CONEXÃO COM O BANCO DE DADOS:'
    );

    console.error(`   Motivo: ${error.message}`);

    console.error(
      '👉 Ajuste o arquivo .env com a senha correta do PostgreSQL.'
    );
  }

  console.log('=================================\n');
});