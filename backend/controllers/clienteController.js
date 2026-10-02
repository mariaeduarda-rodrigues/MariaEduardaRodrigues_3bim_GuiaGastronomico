const { query } = require('../database');
const path = require('path');

exports.abrirCrudCliente = (req, res) => {
  res.sendFile(
    path.join(__dirname, '../../frontend/cliente/cliente.html')
  );
};

exports.listarClientes = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        cli.usuario_cpf_usuario,
        u.nome_usuario,
        cli.renda_cliente,
        cli.data_cadastro_cliente
      FROM cliente cli, usuario u
      WHERE cli.usuario_cpf_usuario = u.cpf_usuario
      ORDER BY cli.usuario_cpf_usuario
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

exports.criarCliente = async (req, res) => {
  try {
    const {
      usuario_cpf_usuario,
      renda_cliente,
      data_cadastro_cliente
    } = req.body;

    if (!renda_cliente) {
      return res.status(400).json({
        error: 'A renda do cliente é obrigatória'
      });
    }

    const result = await query(
      `
      INSERT INTO cliente
      (usuario_cpf_usuario, renda_cliente, data_cadastro_cliente)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [
        usuario_cpf_usuario,
        renda_cliente,
        data_cadastro_cliente
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);

    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

exports.obterCliente = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID deve ser um número válido'
      });
    }

    const result = await query(
      'SELECT * FROM cliente WHERE usuario_cpf_usuario = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Cliente não encontrado'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter cliente:', error);

    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

exports.atualizarCliente = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const {
      renda_cliente,
      data_cadastro_cliente
    } = req.body;

    const camposAtualizados = {
      renda_cliente,
      data_cadastro_cliente
    };

    const resultado = await query(
      `
      UPDATE cliente
      SET renda_cliente = $1,
          data_cadastro_cliente = $2
      WHERE usuario_cpf_usuario = $3
      RETURNING *
      `,
      [
        camposAtualizados.renda_cliente,
        camposAtualizados.data_cadastro_cliente,
        id
      ]
    );

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);

    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

exports.deletarCliente = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const clienteExistente = await query(
      'SELECT * FROM cliente WHERE usuario_cpf_usuario = $1',
      [id]
    );

    if (clienteExistente.rows.length === 0) {
      return res.status(404).json({
        error: 'Cliente não encontrado'
      });
    }

    await query(
      'DELETE FROM cliente WHERE usuario_cpf_usuario = $1',
      [id]
    );

    res.status(204).send();

  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json({
        error:
          'Erro de integridade referencial - o cliente não pode ser excluído, pois está associado a outras entidades.'
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor ao tentar excluir o cliente.'
    });
  }
};