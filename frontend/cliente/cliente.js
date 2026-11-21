const API = '';

const listaPratos = document.getElementById('listaPratos');
const filtros = document.getElementById('filtrosCategorias');
const busca = document.getElementById('buscaPrato');
const modal = document.getElementById('modalAcesso');
const formCadastro = document.getElementById('formCadastro');
const inputDataNascimento = document.getElementById('dataNascimentoCadastro');
const mensagemForm = document.getElementById('mensagemForm');

let pratos = [];
let carrinho = [];
let timerAvisoEstoque = null;

try {
  carrinho = JSON.parse(localStorage.getItem('devoraCarrinho')) || [];
} catch {
  carrinho = [];
}
let categoriaSelecionada = 'todos';

function moeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatarDataInput(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function configurarLimiteDataNascimento() {
  if (!inputDataNascimento) return;
  const hoje = new Date();
  const limite16Anos = new Date(
    hoje.getFullYear() - 16,
    hoje.getMonth(),
    hoje.getDate()
  );
  inputDataNascimento.max = formatarDataInput(limite16Anos);
}

function validarDataNascimento(dataStr) {
  if (!dataStr || !/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
    return 'Informe uma data de nascimento válida.';
  }

  const [ano, mes, dia] = dataStr.split('-').map(Number);
  const nascimento = new Date(ano, mes - 1, dia);

  if (
    nascimento.getFullYear() !== ano ||
    nascimento.getMonth() !== mes - 1 ||
    nascimento.getDate() !== dia
  ) {
    return 'Data de nascimento inválida.';
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (nascimento > hoje) {
    return 'A data de nascimento não pode ser futura.';
  }

  const limite16Anos = new Date(
    hoje.getFullYear() - 16,
    hoje.getMonth(),
    hoje.getDate()
  );

  if (nascimento > limite16Anos) {
    return 'É necessário ter 16 anos ou mais para criar uma conta.';
  }

  return null;
}

configurarLimiteDataNascimento();

function abrirModal() {
  configurarLimiteDataNascimento();
  modal.classList.add('aberto');
  modal.setAttribute('aria-hidden', 'false');
  mensagemForm.textContent = '';
}

function fecharModal() {
  modal.classList.remove('aberto');
  modal.setAttribute('aria-hidden', 'true');
}

function irParaLogin(voltarAoCarrinho) {
  window.location.href = '/frontend/login/login.html' +
    (voltarAoCarrinho ? '?voltar=carrinho' : '');
}

// Exibe o aviso sempre que adicionar um prato com estoque baixo (<= 3)
function avisarEstoque(texto, limiteAtingido = false) {
  let aviso = document.getElementById('avisoEstoqueToast');

  if (!aviso) {
    aviso = document.createElement('div');
    aviso.id = 'avisoEstoqueToast';
    aviso.setAttribute('role', 'status');
    document.body.appendChild(aviso);
  }

  aviso.className = 'aviso-estoque' + (limiteAtingido ? ' limite' : '');
  aviso.innerHTML = `
    <span class="aviso-estoque-icone">!</span>
    <div>
      <strong>${limiteAtingido ? 'Limite de estoque' : 'Estoque baixo'}</strong>
      <p>${escapar(texto)}</p>
    </div>
  `;

  aviso.classList.remove('visivel');
  void aviso.offsetWidth;
  aviso.classList.add('visivel');

  clearTimeout(timerAvisoEstoque);
  timerAvisoEstoque = setTimeout(() => {
    aviso.classList.remove('visivel');
  }, 4000);
}

async function carregarPratos() {
  try {
    const resposta = await fetch(`${API}/prato/listar`);

    if (!resposta.ok) {
      throw new Error('Não foi possível consultar o cardápio.');
    }

    const dados = await resposta.json();

    pratos = (dados.pratos || []).filter(
      prato => Number(prato.quantidade_estoque_prato ?? 0) > 0
    );

    carrinho = carrinho
      .map(item => {
        const pratoAtual = pratos.find(p => Number(p.id_prato) === item.id);
        if (!pratoAtual) return null;
        const maxEstoque = Number(pratoAtual.quantidade_estoque_prato);
        return {
          ...item,
          quantidade: Math.min(item.quantidade, maxEstoque)
        };
      })
      .filter(Boolean);

    montarFiltros();
    renderizarPratos();
    renderizarCarrinho();

  } catch (erro) {
    listaPratos.innerHTML =
      '<p class="estado-lista">Não foi possível carregar o cardápio. Confira se o servidor está ligado.</p>';
  }
}

function montarFiltros() {
  const categorias = [
    ...new Set(pratos.map(p => p.nome_categoria).filter(Boolean))
  ];

  filtros.innerHTML =
    '<button class="filtro ativo" data-categoria="todos">Todos</button>' +
    categorias.map(c =>
      `<button class="filtro" data-categoria="${escapar(c)}">${escapar(c)}</button>`
    ).join('');

  filtros.querySelectorAll('button').forEach(botao => {
    botao.addEventListener('click', () => {
      categoriaSelecionada = botao.dataset.categoria;

      filtros.querySelectorAll('button').forEach(b =>
        b.classList.toggle('ativo', b === botao)
      );

      renderizarPratos();
    });
  });
}

function escapar(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function renderizarPratos() {
  const termo = busca.value.trim().toLocaleLowerCase('pt-BR');

  const filtrados = pratos.filter(p =>
    (categoriaSelecionada === 'todos' ||
      p.nome_categoria === categoriaSelecionada) &&
    String(p.nome_prato || '').toLocaleLowerCase('pt-BR').includes(termo)
  );

  if (!filtrados.length) {
    listaPratos.innerHTML =
      '<p class="estado-lista">Nenhum prato encontrado nessa seleção.</p>';
    return;
  }

  listaPratos.innerHTML = filtrados.map(p => {
    const id = Number(p.id_prato);
    const nome = escapar(p.nome_prato);
    const categoria = escapar(p.nome_categoria || 'Especialidade');
    const estoque = Number(p.quantidade_estoque_prato ?? 0);
    const imagem = `../../imagens/${encodeURIComponent(id)}.jpg`;
    const seloEstoque = estoque <= 3
      ? `<span class="selo-estoque-baixo">Restam ${estoque} un.</span>`
      : '';

    return `
      <article class="prato-card">
        <div class="prato-imagem">
          ${seloEstoque}
          <img src="${imagem}" alt="${nome}"
            onerror="this.remove();this.parentElement.insertAdjacentText('beforeend','DEVORA · Especialidade');">
        </div>
        <div class="prato-info">
          <span class="prato-categoria">${categoria}</span>
          <h3>${nome}</h3>
          <div class="prato-rodape">
            <strong class="prato-preco">${moeda(p.preco_unitario_prato)}</strong>
            <button class="adicionar" data-id="${id}">+ Adicionar</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  listaPratos.querySelectorAll('.adicionar').forEach(botao => {
    botao.addEventListener('click', () =>
      adicionarAoCarrinho(Number(botao.dataset.id))
    );
  });
}

function adicionarAoCarrinho(id) {
  const prato = pratos.find(p => Number(p.id_prato) === id);

  if (!prato) return;

  const estoqueTotal = Number(prato.quantidade_estoque_prato ?? 0);
  const item = carrinho.find(i => i.id === id);
  const qtdAtualNoCarrinho = item ? item.quantidade : 0;

  if (qtdAtualNoCarrinho >= estoqueTotal) {
    avisarEstoque(
      `"${prato.nome_prato}" possui apenas ${estoqueTotal} unidade(s) disponível(is) em estoque.`,
      true
    );
    return;
  }

  const novaQuantidade = qtdAtualNoCarrinho + 1;
  const restante = estoqueTotal - novaQuantidade;

  if (item) {
    item.quantidade = novaQuantidade;
  } else {
    carrinho.push({
      id,
      nome: prato.nome_prato,
      preco: Number(prato.preco_unitario_prato),
      quantidade: 1
    });
  }

  if (estoqueTotal <= 3 || restante <= 3) {
    if (restante === 0) {
      avisarEstoque(
        `Você adicionou a última unidade disponível de "${prato.nome_prato}" (estoque total: ${estoqueTotal}).`
      );
    } else {
      avisarEstoque(
        `"${prato.nome_prato}" tem apenas ${estoqueTotal} unidade(s) no estoque (${restante} restante(s)).`
      );
    }
  }

  renderizarCarrinho();
}

function renderizarCarrinho() {
  localStorage.setItem('devoraCarrinho', JSON.stringify(carrinho));
  const area = document.getElementById('itensCarrinho');

  const total = carrinho.reduce(
    (soma, item) => soma + item.preco * item.quantidade,
    0
  );

  document.getElementById('contadorCarrinho').textContent =
    carrinho.reduce((soma, item) => soma + item.quantidade, 0);

  document.getElementById('valorTotal').textContent = moeda(total);

  document.getElementById('finalizarPedido').disabled =
    carrinho.length === 0;

  if (!carrinho.length) {
    area.innerHTML =
      '<p class="carrinho-vazio">Seu carrinho está vazio. Escolha algo delicioso no cardápio!</p>';
    return;
  }

  area.innerHTML = carrinho.map(item => `
    <div class="item-carrinho">
      <span>
        ${escapar(item.nome)} × ${item.quantidade}<br>
        <small>${moeda(item.preco * item.quantidade)}</small>
      </span>
      <button data-remover="${item.id}">Remover</button>
    </div>
  `).join('');

  area.querySelectorAll('[data-remover]').forEach(botao => {
    botao.addEventListener('click', () => {
      carrinho = carrinho.filter(
        item => item.id !== Number(botao.dataset.remover)
      );

      renderizarCarrinho();
    });
  });
}

document.getElementById('abrirLogin')
  .addEventListener('click', () => irParaLogin());

document.getElementById('abrirCadastro')
  .addEventListener('click', () => abrirModal());

document.getElementById('loginPedidos')
  .addEventListener('click', () => irParaLogin());

document.getElementById('criarContaFaixa')
  .addEventListener('click', () => abrirModal());

document.getElementById('fecharModal')
  .addEventListener('click', fecharModal);

modal.addEventListener('click', e => {
  if (e.target === modal) fecharModal();
});

document.getElementById('irCarrinho')
  .addEventListener('click', () => {
    document.getElementById('carrinho').scrollIntoView({
      behavior: 'smooth'
    });
  });

busca.addEventListener('input', renderizarPratos);

// ===== Sessão (cookie "usuarioLogado") =====
let sessao = { status: 'nao_logado' };

function atualizarTopo() {
  const logado = sessao.status === 'ok';
  document.getElementById('abrirLogin').classList.toggle('oculto', logado);
  document.getElementById('abrirCadastro').classList.toggle('oculto', logado);
  document.getElementById('loginPedidos').classList.toggle('oculto', logado);
  document.getElementById('btnSair').classList.toggle('oculto', !logado);
  document.getElementById('linkAdmin').classList.toggle(
    'oculto', !(logado && sessao.papeis && sessao.papeis.funcionario)
  );
  const saudacao = document.getElementById('saudacao');
  saudacao.classList.toggle('oculto', !logado);
  saudacao.textContent = logado ? 'Olá, ' + String(sessao.nome || '').split(' ')[0] : '';
}

async function carregarSessao() {
  try {
    const r = await fetch('/login/verificaLogado', { credentials: 'include' });
    sessao = await r.json();
  } catch {
    sessao = { status: 'nao_logado' };
  }
  atualizarTopo();
}

// Cadastro: cria usuario + cliente e já deixa a pessoa logada
formCadastro.addEventListener('submit', async e => {
  e.preventDefault();

  const dadosForm = Object.fromEntries(new FormData(formCadastro));
  const erroData = validarDataNascimento(dadosForm.data_nascimento_usuario);
  if (erroData) {
    mensagemForm.textContent = erroData;
    inputDataNascimento?.focus();
    return;
  }

  mensagemForm.textContent = 'Criando conta...';
  try {
    const r = await fetch('/login/cadastrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(dadosForm)
    });
    const corpo = await r.json().catch(() => ({
      mensagem: 'O servidor respondeu ' + r.status + '. Reinicie o servidor e confira se os arquivos novos foram copiados.'
    }));
    if (!r.ok || corpo.status !== 'ok') {
      mensagemForm.textContent = (corpo.mensagem || 'Não foi possível criar a conta') +
        (corpo.detalhe ? ' (' + corpo.detalhe + ')' : '');
      return;
    }
    formCadastro.reset();
    fecharModal();
    await carregarSessao();
  } catch {
    mensagemForm.textContent = 'Erro de conexão com o servidor';
  }
});

document.getElementById('btnSair').addEventListener('click', async () => {
  await fetch('/login/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
  sessao = { status: 'nao_logado' };
  atualizarTopo();
});

// Botão de pagamento: se não estiver logado, vai para a tela de login
document.getElementById('finalizarPedido')
  .addEventListener('click', () => {
    if (sessao.status !== 'ok') {
      irParaLogin(true);
      return;
    }

    window.location.href = 'pagamento.html';
  });

if (new URLSearchParams(location.search).get('cadastro')) abrirModal();

carregarSessao();
carregarPratos();
renderizarCarrinho();