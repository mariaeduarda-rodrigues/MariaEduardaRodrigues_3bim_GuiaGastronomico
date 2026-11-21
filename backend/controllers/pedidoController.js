const { query, pool } = require('../database');

// Retorna nome e endereço do usuário logado para preencher o formulário
exports.dadosCliente = async (req, res) => {
  try {
    const cpf = req.usuarioCpf;
    const result = await query(
      'SELECT nome_usuario, endereco_usuario FROM usuario WHERE cpf_usuario = $1',
      [cpf]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'nao_encontrado', mensagem: 'Usuário não encontrado.' });
    }

    res.json({
      status: 'ok',
      nome: result.rows[0].nome_usuario,
      endereco: result.rows[0].endereco_usuario || ''
    });
  } catch (err) {
    console.error('Erro ao buscar dados do cliente:', err);
    res.status(500).json({ status: 'erro', mensagem: 'Erro interno do servidor.' });
  }
};

// Grava pedido, itens, pagamento, forma de pagamento e baixa o estoque
exports.finalizarPedido = async (req, res) => {
  const cpf = req.usuarioCpf;
  const { endereco_entrega, id_forma_pagamento, itens } = req.body;

  if (!endereco_entrega || !String(endereco_entrega).trim()) {
    return res.status(400).json({ status: 'dados_invalidos', mensagem: 'Informe o endereço de entrega.' });
  }

  if (!id_forma_pagamento || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ status: 'dados_invalidos', mensagem: 'Carrinho vazio ou pagamento inválido.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Garante que o usuário exista na tabela cliente (caso seja funcionário comprando)
    await client.query(
      `INSERT INTO cliente (usuario_cpf_usuario, renda_cliente, data_cadastro_cliente)
       VALUES ($1, 0, CURRENT_DATE)
       ON CONFLICT (usuario_cpf_usuario) DO NOTHING`,
      [cpf]
    );

    // Atualiza o endereço do usuário para facilitar os próximos pedidos
    await client.query(
      'UPDATE usuario SET endereco_usuario = $1 WHERE cpf_usuario = $2',
      [String(endereco_entrega).trim(), cpf]
    );

    // Sincroniza a sequence de pedido para evitar conflito de ID
    await client.query(
      `SELECT setval('pedido_id_pedido_seq', COALESCE((SELECT MAX(id_pedido) FROM pedido), 0) + 1, false)`
    );

    // Cria o pedido online do cliente
    const pedidoRes = await client.query(
      `INSERT INTO pedido (data_pedido, cliente_usuario_cpf_usuario, funcionario_usuario_cpf_usuario)
       VALUES (CURRENT_DATE, $1, NULL)
       RETURNING id_pedido`,
      [cpf]
    );
    const idPedido = pedidoRes.rows[0].id_pedido;

    let valorTotal = 0;

    for (const item of itens) {
      const idPrato = Number(item.id_prato);
      const qtd = Number(item.quantidade);

      if (!idPrato || qtd <= 0) {
        throw new Error('Item inválido no carrinho.');
      }

      const pratoRes = await client.query(
        'SELECT nome_prato, preco_unitario_prato, COALESCE(quantidade_estoque_prato, 0) AS estoque FROM prato WHERE id_prato = $1 FOR UPDATE',
        [idPrato]
      );

      if (pratoRes.rows.length === 0) {
        throw new Error(`Prato #${idPrato} não encontrado.`);
      }

      const prato = pratoRes.rows[0];

      if (Number(prato.estoque) < qtd) {
        throw new Error(`Estoque insuficiente para "${prato.nome_prato}".`);
      }

      const precoUnitario = Number(prato.preco_unitario_prato);
      valorTotal += precoUnitario * qtd;

      await client.query(
        `INSERT INTO pedido_has_prato (prato_id_prato, pedido_id_pedido, quantidade, preco_unitario)
         VALUES ($1, $2, $3, $4)`,
        [idPrato, idPedido, qtd, precoUnitario]
      );

      await client.query(
        'UPDATE prato SET quantidade_estoque_prato = COALESCE(quantidade_estoque_prato, 0) - $1 WHERE id_prato = $2',
        [qtd, idPrato]
      );
    }

    valorTotal = Number(valorTotal.toFixed(2));

    // Registra o pagamento e a forma escolhida
    await client.query(
      `INSERT INTO pagamento (pedido_id_pedido, data_pagamento, valor_total_pagamento)
       VALUES ($1, NOW(), $2)`,
      [idPedido, valorTotal]
    );

    await client.query(
      `INSERT INTO pagamento_has_forma_pagamento (pagamento_id_pedido, forma_pagamento_id_forma_pagamento, valor_pago)
       VALUES ($1, $2, $3)`,
      [idPedido, Number(id_forma_pagamento), valorTotal]
    );

    await client.query('COMMIT');

    res.status(201).json({
      status: 'ok',
      id_pedido: idPedido,
      valor_total: valorTotal
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao finalizar pedido:', err);
    res.status(400).json({
      status: 'erro',
      mensagem: err.message || 'Não foi possível concluir o pedido.'
    });
  } finally {
    client.release();
  }
};