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

const app = express();

app.use(cors());
app.use(express.json());

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
app.use('/prato', pratoRoutes);
app.use('/medida', medidaRoutes);
app.use('/categoria', categoriaRoutes);
app.use('/cliente', clienteRoutes);
app.use('/funcionario', funcionarioRoutes);
app.use('/usuario', usuarioRoutes);

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