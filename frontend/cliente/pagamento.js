const formPagamento = document.getElementById('formPagamento');
const inputNome = document.getElementById('nomeCliente');
const inputEndereco = document.getElementById('enderecoEntrega');
const itensResumo = document.getElementById('itensResumo');
const totalResumo = document.getElementById('totalResumo');
const btnFinalizar = document.getElementById('btnFinalizar');
const mensagemPagamento = document.getElementById('mensagemPagamento');

// Elementos dinâmicos de Pix e Cartão
const detalhesPix = document.getElementById('detalhesPix');
const qrcodePix = document.getElementById('qrcodePix');
const codigoPixTexto = document.getElementById('codigoPixTexto');
const btnCopiarPix = document.getElementById('btnCopiarPix');

const detalhesCartao = document.getElementById('detalhesCartao');
const tituloCartao = document.getElementById('tituloCartao');
const inputNumeroCartao = document.getElementById('numeroCartao');
const inputNomeCartao = document.getElementById('nomeCartao');
const inputValidadeCartao = document.getElementById('validadeCartao');
const inputCvvCartao = document.getElementById('cvvCartao');
const campoParcelas = document.getElementById('campoParcelas');
const selectParcelas = document.getElementById('parcelasCartao');

let carrinho = [];

try {
  carrinho = JSON.parse(localStorage.getItem('devoraCarrinho')) || [];
} catch {
  carrinho = [];
}

function moeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
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

function mostrarMensagem(texto, tipo = '') {
  mensagemPagamento.textContent = texto;
  mensagemPagamento.className = tipo;
}

function calcularTotal() {
  return carrinho.reduce(
    (soma, item) => soma + Number(item.preco) * Number(item.quantidade),
    0
  );
}

// ==========================================================
// GERADOR DE PIX (BR CODE + QR CODE)
// ==========================================================

function crc16Pix(payload) {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function campoEmv(id, valor) {
  return `${id}${String(valor.length).padStart(2, '0')}${valor}`;
}

function gerarPayloadPix(valorTotal) {
  const chavePix = 'pix@devora.com.br';
  const nomeRecebedor = 'DEVORA GASTRONOMIA';
  const cidade = 'BRASIL';
  const valor = Number(valorTotal || 0).toFixed(2);

  const conta = campoEmv(
    '26',
    campoEmv('00', 'br.gov.bcb.pix') + campoEmv('01', chavePix)
  );

  const semCrc =
    campoEmv('00', '01') +
    conta +
    campoEmv('52', '0000') +
    campoEmv('53', '986') +
    (Number(valorTotal) > 0 ? campoEmv('54', valor) : '') +
    campoEmv('58', 'BR') +
    campoEmv('59', nomeRecebedor) +
    campoEmv('60', cidade) +
    campoEmv('62', campoEmv('05', 'DEVORA')) +
    '6304';

  return semCrc + crc16Pix(semCrc);
}

function renderizarPix() {
  const codigo = gerarPayloadPix(calcularTotal());
  codigoPixTexto.value = codigo;
  qrcodePix.innerHTML = '';

  if (typeof QRCode !== 'undefined') {
    new QRCode(qrcodePix, {
      text: codigo,
      width: 165,
      height: 165,
      colorDark: '#2b0b09',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  } else {
    qrcodePix.innerHTML = '<p style="font-size:12px;padding:12px;">Use o código Copia e Cola ao lado.</p>';
  }
}

btnCopiarPix.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(codigoPixTexto.value);
    btnCopiarPix.textContent = 'Copiado!';
    setTimeout(() => {
      btnCopiarPix.textContent = 'Copiar';
    }, 2000);
  } catch {
    codigoPixTexto.select();
    document.execCommand('copy');
    btnCopiarPix.textContent = 'Copiado!';
  }
});

// ==========================================================
// PARCELAS E MÁSCARAS DO CARTÃO
// ==========================================================

function montarParcelas() {
  const total = calcularTotal();
  const maxParcelas = total >= 60 ? 3 : total >= 30 ? 2 : 1;
  let opcoes = '';

  for (let i = 1; i <= maxParcelas; i++) {
    const valorParcela = total / i;
    opcoes += `<option value="${i}">${i}x de ${moeda(valorParcela)} sem juros</option>`;
  }

  selectParcelas.innerHTML = opcoes;
}

inputNumeroCartao.addEventListener('input', e => {
  const digitos = e.target.value.replace(/\D/g, '').slice(0, 16);
  e.target.value = digitos.replace(/(\d{4})(?=\d)/g, '$1 ');
});

inputValidadeCartao.addEventListener('input', e => {
  const digitos = e.target.value.replace(/\D/g, '').slice(0, 4);
  if (digitos.length >= 3) {
    e.target.value = `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  } else {
    e.target.value = digitos;
  }
});

inputCvvCartao.addEventListener('input', e => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
});

// Alterna os painéis conforme a forma de pagamento selecionada
formPagamento.querySelectorAll('input[name="formaPagamento"]').forEach(radio => {
  radio.addEventListener('change', () => {
    mostrarMensagem('');
    const valor = radio.value;

    detalhesPix.classList.add('oculto');
    detalhesCartao.classList.add('oculto');

    if (valor === '4') {
      renderizarPix();
      detalhesPix.classList.remove('oculto');
    } else if (valor === '2' || valor === '3') {
      const ehCredito = valor === '2';
      tituloCartao.textContent = ehCredito
        ? 'DADOS DO CARTÃO DE CRÉDITO'
        : 'DADOS DO CARTÃO DE DÉBITO';
      campoParcelas.classList.toggle('oculto', !ehCredito);
      if (ehCredito) montarParcelas();
      detalhesCartao.classList.remove('oculto');
    }
  });
});

function validarCartao() {
  const numero = inputNumeroCartao.value.replace(/\D/g, '');
  const nome = inputNomeCartao.value.trim();
  const validade = inputValidadeCartao.value;
  const cvv = inputCvvCartao.value.replace(/\D/g, '');

  if (numero.length < 16) {
    inputNumeroCartao.focus();
    return 'Informe os 16 dígitos do cartão.';
  }
  if (nome.length < 3) {
    inputNomeCartao.focus();
    return 'Informe o nome impresso no cartão.';
  }
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(validade)) {
    inputValidadeCartao.focus();
    return 'Informe uma validade válida (MM/AA).';
  }
  if (cvv.length < 3) {
    inputCvvCartao.focus();
    return 'Informe o código de segurança (CVV).';
  }
  return null;
}

// ==========================================================
// RESUMO, DADOS DO CLIENTE E ENVIO
// ==========================================================

function renderizarResumo() {
  const total = calcularTotal();
  totalResumo.textContent = moeda(total);

  if (!carrinho.length) {
    itensResumo.innerHTML =
      '<p>Seu carrinho está vazio. Volte ao cardápio para escolher seus pratos.</p>';
    btnFinalizar.disabled = true;
    return;
  }

  btnFinalizar.disabled = false;

  itensResumo.innerHTML = carrinho.map(item => `
    <div class="item-resumo">
      <span>
        ${escapar(item.nome)} × ${Number(item.quantidade)}<br>
        <small>${moeda(item.preco)} cada</small>
      </span>
      <strong>${moeda(Number(item.preco) * Number(item.quantidade))}</strong>
    </div>
  `).join('');
}

async function carregarDadosCliente() {
  try {
    const resposta = await fetch('/pedido/dadosCliente', {
      credentials: 'include'
    });

    if (resposta.status === 401) {
      window.location.href = '/frontend/login/login.html?voltar=carrinho';
      return;
    }

    const dados = await resposta.json();

    if (dados.status !== 'ok') {
      window.location.href = '/frontend/login/login.html?voltar=carrinho';
      return;
    }

    inputNome.value = dados.nome || '';
    if (dados.endereco) {
      inputEndereco.value = dados.endereco;
    }
  } catch {
    mostrarMensagem('Não foi possível carregar seus dados. Confira o servidor.', 'erro');
  }
}

formPagamento.addEventListener('submit', async e => {
  e.preventDefault();
  mostrarMensagem('');

  if (!carrinho.length) {
    mostrarMensagem('Seu carrinho está vazio.', 'erro');
    return;
  }

  const endereco = inputEndereco.value.trim();
  if (!endereco) {
    mostrarMensagem('Informe o endereço de entrega.', 'erro');
    inputEndereco.focus();
    return;
  }

  const opcaoSelecionada = formPagamento.querySelector('input[name="formaPagamento"]:checked');
  if (!opcaoSelecionada) {
    mostrarMensagem('Escolha uma forma de pagamento.', 'erro');
    return;
  }

  // Se escolheu crédito (2) ou débito (3), valida os dados do cartão
  if (opcaoSelecionada.value === '2' || opcaoSelecionada.value === '3') {
    const erroCartao = validarCartao();
    if (erroCartao) {
      mostrarMensagem(erroCartao, 'erro');
      return;
    }
  }

  btnFinalizar.disabled = true;
  btnFinalizar.textContent = 'Processando...';

  try {
    const resposta = await fetch('/pedido/finalizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        endereco_entrega: endereco,
        id_forma_pagamento: Number(opcaoSelecionada.value),
        itens: carrinho.map(item => ({
          id_prato: Number(item.id),
          quantidade: Number(item.quantidade)
        }))
      })
    });

    const dados = await resposta.json().catch(() => ({}));

    if (resposta.status === 401) {
      window.location.href = '/frontend/login/login.html?voltar=carrinho';
      return;
    }

    if (!resposta.ok || dados.status !== 'ok') {
      mostrarMensagem(dados.mensagem || 'Não foi possível finalizar o pedido.', 'erro');
      btnFinalizar.disabled = false;
      btnFinalizar.textContent = 'Confirmar pedido →';
      return;
    }

    localStorage.removeItem('devoraCarrinho');
    carrinho = [];
    mostrarMensagem(`Pedido #${dados.id_pedido} confirmado com sucesso! Redirecionando...`, 'sucesso');

    setTimeout(() => {
      window.location.href = 'cliente.html';
    }, 2200);

  } catch {
    mostrarMensagem('Erro de comunicação com o servidor.', 'erro');
    btnFinalizar.disabled = false;
    btnFinalizar.textContent = 'Confirmar pedido →';
  }
});

renderizarResumo();
carregarDadosCliente();