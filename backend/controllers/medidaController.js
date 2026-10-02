const { query } = require('../database');

// Listar todas as medidas
exports.listarMedidas = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM public.medida ORDER BY id_medida'
    );

    res.json({
      sucesso: true,
      medidas: result.rows
    });
  } catch (error) {
    console.error('Erro ao listar medidas:', error);

    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar medidas.'
    });
  }
};

// Obter medida por ID
exports.obterMedida = async (req, res) => {
  try {
    const id = req.params.id
      ? req.params.id.trim().toUpperCase()
      : '';

    if (!id || id.length > 2) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'ID inválido (deve ter até 2 caracteres).'
      });
    }

    const result = await query(
      'SELECT * FROM public.medida WHERE id_medida = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Medida não encontrada.'
      });
    }

    res.json({
      sucesso: true,
      medida: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao obter medida:', error);

    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor'
    });
  }
};

// Criar medida
exports.criarMedida = async (req, res) => {
  try {
    const {
      id_medida,
      nome_medida
    } = req.body;

    const id = id_medida
      ? id_medida.trim().toUpperCase()
      : '';

    if (!id || id.length > 2) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'A sigla/ID deve ter até 2 caracteres.'
      });
    }

    if (!nome_medida) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'O nome da medida é obrigatório.'
      });
    }

    const sql = `
      INSERT INTO public.medida
      (id_medida, nome_medida)
      VALUES ($1, $2)
      RETURNING *
    `;

    const result = await query(
      sql,
      [id, nome_medida]
    );

    res.status(201).json({
      sucesso: true,
      mensagem: 'Medida inserida com sucesso!',
      medida: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar medida:', error);

    if (error.code === '23505') {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Esta sigla de medida já está cadastrada.'
      });
    }

    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao inserir medida no banco de dados.'
    });
  }
};

// Atualizar medida
exports.atualizarMedida = async (req, res) => {
  try {
    const id = req.params.id
      ? req.params.id.trim().toUpperCase()
      : '';

    const {
      nome_medida
    } = req.body;

    if (!id || id.length > 2) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'ID inválido.'
      });
    }

    const sql = `
      UPDATE public.medida
      SET nome_medida = $1
      WHERE id_medida = $2
      RETURNING *
    `;

    const result = await query(
      sql,
      [nome_medida, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Medida não encontrada.'
      });
    }

    res.json({
      sucesso: true,
      mensagem: 'Medida alterada com sucesso!',
      medida: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar medida:', error);

    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar medida.'
    });
  }
};

// Deletar medida
exports.deletarMedida = async (req, res) => {
  try {
    const id = req.params.id
      ? req.params.id.trim().toUpperCase()
      : '';

    if (!id || id.length > 2) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'ID inválido.'
      });
    }

    await query(
      'DELETE FROM public.medida WHERE id_medida = $1',
      [id]
    );

    res.json({
      sucesso: true,
      mensagem: 'Medida excluída com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao deletar medida:', error);

    if (error.code === '23503') {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Não é possível excluir: existem pratos associados a esta medida.'
      });
    }

    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao excluir medida.'
    });
  }
};