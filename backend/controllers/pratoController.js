const { query } = require('../database');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Listar todos os pratos
exports.listarPratos = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM public.prato ORDER BY id_prato'
    );

    res.json({
      sucesso: true,
      pratos: result.rows
    });
  } catch (error) {
    console.error('Erro ao listar pratos:', error);

    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar pratos.'
    });
  }
};

// Obter prato por ID
exports.obterPrato = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'ID inválido.'
      });
    }

    const result = await query(
      'SELECT * FROM public.prato WHERE id_prato = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Prato não encontrado.'
      });
    }

    res.json({
      sucesso: true,
      prato: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao obter prato:', error);

    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor.'
    });
  }
};

// Criar prato
exports.criarPrato = async (req, res) => {
    try {
        const {
            id_prato,
            nome_prato,
            id_medida,
            id_categoria,
            quantidade_estoque_prato,
            preco_unitario_prato
        } = req.body;

        if (!nome_prato) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'O nome do prato é obrigatório.'
            });
        }

        const result = await query(`
            INSERT INTO prato
            (id_prato, nome_prato, id_medida, id_categoria,
             quantidade_estoque_prato, preco_unitario_prato)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [
            id_prato,
            nome_prato,
            id_medida || null,
            id_categoria || null,
            quantidade_estoque_prato || 0,
            preco_unitario_prato || 0
        ]);

        res.status(201).json({
            sucesso: true,
            mensagem: 'Prato inserido com sucesso!',
            prato: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao criar prato:', error);

        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao inserir prato no banco de dados.'
        });
    }
};
// Atualizar prato
exports.atualizarPrato = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const {
            nome_prato,
            id_medida,
            id_categoria,
            quantidade_estoque_prato,
            preco_unitario_prato
        } = req.body;

        const result = await query(`
            UPDATE prato
            SET nome_prato = $1,
                id_medida = $2,
                id_categoria = $3,
                quantidade_estoque_prato = $4,
                preco_unitario_prato = $5
            WHERE id_prato = $6
            RETURNING *
        `, [
            nome_prato,
            id_medida || null,
            id_categoria || null,
            quantidade_estoque_prato || 0,
            preco_unitario_prato || 0,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Prato não encontrado.'
            });
        }

        res.json({
            sucesso: true,
            mensagem: 'Prato alterado com sucesso!',
            prato: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar prato:', error);

        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao atualizar prato.'
        });
    }
};

// Upload e salvamento de imagem
exports.uploadImagem = async (req, res) => {
  try {
    const id = req.params.id;

    if (!req.file) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Nenhum arquivo enviado.'
      });
    }

    const pastaImagens = path.join(__dirname, '../../imagens');

    if (!fs.existsSync(pastaImagens)) {
      fs.mkdirSync(pastaImagens, {
        recursive: true
      });
    }

    const caminhoDestino = path.join(
      pastaImagens,
      `${id}.jpg`
    );

    await sharp(req.file.buffer)
      .resize(300, 300, {
        fit: 'cover'
      })
      .toFormat('jpg')
      .toFile(caminhoDestino);

    res.json({
      sucesso: true,
      mensagem: 'Imagem salva com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao salvar imagem:', error);

    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao processar imagem.'
    });
  }
};

// Deletar prato
exports.deletarPrato = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    await query(
      'DELETE FROM public.prato WHERE id_prato = $1',
      [id]
    );

    const imgPath = path.join(
      __dirname,
      '../../imagens',
      `${id}.jpg`
    );

    if (fs.existsSync(imgPath)) {
      fs.unlinkSync(imgPath);
    }

    res.json({
      sucesso: true,
      mensagem: 'Prato excluído com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao deletar prato:', error);

    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao excluir prato.'
    });
  }
};