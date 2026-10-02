const { query } = require('../database');
const path = require('path');

// Abrir CRUD de Usuários
exports.abrirCrudUsuario = (req, res) => {
  res.sendFile(
    path.join(__dirname, '../../frontend/usuario/usuario.html')
  );
};

// Listar usuários
exports.listarUsuarios = async (req, res) => {
  try {
    const result = await query(`
      SELECT
        cpf_usuario,
        nome_usuario,
        email_usuario
      FROM usuario
      ORDER BY cpf_usuario
    `);

    res.json({
      sucesso: true,
      usuarios: result.rows
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);

    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor'
    });
  }
};

// Criar usuário
exports.criarUsuario = async (req, res) => {
  try {
    const {
      cpf_usuario,
      nome_usuario,
      data_nascimento_usuario,
      endereco_usuario,
      senha_usuario,
      email_usuario
    } = req.body;

    if (!cpf_usuario || !nome_usuario || !senha_usuario || !email_usuario) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'CPF, nome, senha e email são obrigatórios'
      });
    }

    const result = await query(
      `
      INSERT INTO usuario
      (
        cpf_usuario,
        nome_usuario,
        data_nascimento_usuario,
        endereco_usuario,
        senha_usuario,
        email_usuario
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        cpf_usuario,
        nome_usuario,
        data_nascimento_usuario,
        endereco_usuario,
        senha_usuario,
        email_usuario
      ]
    );

    res.status(201).json({
      sucesso: true,
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);

    if (error.code === '23505') {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Este CPF ou email já está cadastrado'
      });
    }

    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor'
    });
  }
};

// Obter usuário
exports.obterUsuario = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await query(
      `
      SELECT *
      FROM usuario
      WHERE cpf_usuario = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }

    res.json({
      sucesso: true,
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao obter usuário:', error);

    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor'
    });
  }
};

// Atualizar usuário
exports.atualizarUsuario = async (req, res) => {
  try {
    const id = req.params.id;

    const {
      nome_usuario,
      data_nascimento_usuario,
      endereco_usuario,
      senha_usuario,
      email_usuario
    } = req.body;

    const resultado = await query(
      `
      UPDATE usuario
      SET nome_usuario = $1,
          data_nascimento_usuario = $2,
          endereco_usuario = $3,
          senha_usuario = $4,
          email_usuario = $5
      WHERE cpf_usuario = $6
      RETURNING *
      `,
      [
        nome_usuario,
        data_nascimento_usuario,
        endereco_usuario,
        senha_usuario,
        email_usuario,
        id
      ]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }

    res.json({
      sucesso: true,
      usuario: resultado.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);

    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor'
    });
  }
};

// Deletar usuário
exports.deletarUsuario = async (req, res) => {
  try {
    const id = req.params.id;

    const usuarioExistente = await query(
      'SELECT * FROM usuario WHERE cpf_usuario = $1',
      [id]
    );

    if (usuarioExistente.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }

    await query(
      'DELETE FROM usuario WHERE cpf_usuario = $1',
      [id]
    );

    res.json({
      sucesso: true,
      mensagem: 'Usuário excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);

    if (error.code === '23503') {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Não é possível excluir este usuário porque ele está associado a outras entidades'
      });
    }

    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor'
    });
  }
};