const { query } = require('../database');
const path = require('path');

// Abrir CRUD de Funcionários
exports.abrirCrudFuncionario = (req, res) => {
  res.sendFile(
    path.join(__dirname, '../../frontend/funcionario/funcionario.html')
  );
};

// Listar funcionários
exports.listarFuncionarios = async (req, res) => {
  try {
    const result = await query(`
      SELECT
        f.usuario_cpf_usuario,
        u.nome_usuario,
        f.categoria_id_categoria
      FROM funcionario f, usuario u
      WHERE f.usuario_cpf_usuario = u.cpf_usuario
      ORDER BY f.usuario_cpf_usuario
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar funcionários:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Criar funcionário
exports.criarFuncionario = async (req, res) => {
  try {
    const {
      usuario_cpf_usuario,
      categoria_id_categoria
    } = req.body;

    if (!usuario_cpf_usuario || !categoria_id_categoria) {
      return res.status(400).json({
        error: 'CPF do usuário e categoria são obrigatórios'
      });
    }

    const result = await query(
      `
      INSERT INTO funcionario
      (usuario_cpf_usuario, categoria_id_categoria)
      VALUES ($1, $2)
      RETURNING *
      `,
      [
        usuario_cpf_usuario,
        categoria_id_categoria
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar funcionário:', error);

    if (error.code === '23505') {
      return res.status(400).json({
        error: 'Este funcionário já está cadastrado'
      });
    }

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Usuário ou categoria não encontrada'
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Obter funcionário
exports.obterFuncionario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'ID deve ser um número válido'
      });
    }

    const result = await query(
      `
      SELECT
        f.usuario_cpf_usuario,
        u.nome_usuario,
        f.categoria_id_categoria
      FROM funcionario f, usuario u
      WHERE f.usuario_cpf_usuario = u.cpf_usuario
        AND f.usuario_cpf_usuario = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Funcionário não encontrado'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter funcionário:', error);

    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Atualizar funcionário
exports.atualizarFuncionario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const {
      categoria_id_categoria
    } = req.body;

    const resultado = await query(
      `
      UPDATE funcionario
      SET categoria_id_categoria = $1
      WHERE usuario_cpf_usuario = $2
      RETURNING *
      `,
      [
        categoria_id_categoria,
        id
      ]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        error: 'Funcionário não encontrado'
      });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error);

    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Deletar funcionário
exports.deletarFuncionario = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const funcionarioExistente = await query(
      'SELECT * FROM funcionario WHERE usuario_cpf_usuario = $1',
      [id]
    );

    if (funcionarioExistente.rows.length === 0) {
      return res.status(404).json({
        error: 'Funcionário não encontrado'
      });
    }

    await query(
      'DELETE FROM funcionario WHERE usuario_cpf_usuario = $1',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json({
        error:
          'Erro de integridade referencial - o funcionário não pode ser excluído, pois está associado a outras entidades.'
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor ao tentar excluir o funcionário.'
    });
  }
};