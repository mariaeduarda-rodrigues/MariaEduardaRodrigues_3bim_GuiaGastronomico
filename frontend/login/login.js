const API_BASE_URL = ''; // mesma origem do servidor

// Elementos do DOM
const formLogin = document.getElementById('formLogin');
const etapaEmail = document.getElementById('etapaEmail');
const etapaSenha = document.getElementById('etapaSenha');
const etapaRecuperar = document.getElementById('etapaRecuperar');
const etapaNovaSenha = document.getElementById('etapaNovaSenha');
const etapaPerfil = document.getElementById('etapaPerfil');
const inputEmail = document.getElementById('email');
const inputSenha = document.getElementById('senha');
const inputLink = document.getElementById('linkRecuperacao');
const inputNovaSenha = document.getElementById('novaSenha');
const inputConfirmaSenha = document.getElementById('confirmaSenha');
const saudacaoUsuario = document.getElementById('saudacaoUsuario');
const textoRecuperar = document.getElementById('textoRecuperar');
const mensagemErro = document.getElementById('mensagemErro');

// Se veio do carrinho (botão de pagamento), volta para ele depois do login
const voltarParaCarrinho = new URLSearchParams(location.search).get('voltar') === 'carrinho';
const PAGINA_CLIENTE = '/frontend/cliente/cliente.html' + (voltarParaCarrinho ? '#carrinho' : '');
const PAGINA_ADMIN = '/frontend/admin/admin.html';

let etapaAtual = etapaEmail;
let tokenRecuperacao = null; // vem do link colado (ou da URL, se a pessoa clicou no link do e-mail)

// Event Listeners
document.getElementById('btnVerificarEmail').addEventListener('click', verificarEmail);
document.getElementById('btnVoltar').addEventListener('click', voltarParaEmail);
document.getElementById('btnEsqueci').addEventListener('click', esqueciSenha);
document.getElementById('btnVoltarRecuperar').addEventListener('click', () => mostrarEtapa(etapaSenha));
document.getElementById('btnCancelarNova').addEventListener('click', () => {
    tokenRecuperacao = null;
    mostrarEtapa(etapaEmail);
});
document.getElementById('btnComoCliente').addEventListener('click', () => { window.location.href = PAGINA_CLIENTE; });
document.getElementById('btnComoAdmin').addEventListener('click', () => { window.location.href = PAGINA_ADMIN; });

// Enter (ou botão "submit") faz a ação da etapa que estiver na tela
formLogin.addEventListener('submit', (event) => {
    event.preventDefault();
    if (etapaAtual === etapaEmail) verificarEmail();
    else if (etapaAtual === etapaSenha) realizarLogin();
    else if (etapaAtual === etapaRecuperar) usarLinkColado();
    else if (etapaAtual === etapaNovaSenha) salvarNovaSenha();
});

// Se a pessoa clicou direto no link do e-mail (login.html?token=...), vai direto para a nova senha
const tokenDaUrl = new URLSearchParams(location.search).get('token');
if (tokenDaUrl) {
    tokenRecuperacao = tokenDaUrl;
    history.replaceState(null, '', location.pathname); // tira o token da barra de endereço
    mostrarEtapa(etapaNovaSenha);
}

// 🔹 Mostra só uma etapa por vez
function mostrarEtapa(etapa) {
    [etapaEmail, etapaSenha, etapaRecuperar, etapaNovaSenha, etapaPerfil]
        .forEach(e => e.classList.add('hidden'));
    etapa.classList.remove('hidden');
    etapaAtual = etapa;
    mostrarMensagem('', false);
}

function mostrarMensagem(texto, sucesso) {
    mensagemErro.innerText = texto;
    mensagemErro.className = sucesso ? 'erro-msg ok-msg' : 'erro-msg';
}

// 🔹 Etapa 1: verifica se o e-mail existe
async function verificarEmail() {
    const email = inputEmail.value.trim();
    mostrarMensagem('', false);

    if (!email) {
        mostrarMensagem('Por favor, informe seu e-mail.', false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login/verificarEmail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (data.status === 'existe') {
            saudacaoUsuario.innerText = `Olá, ${data.nome}!`;
            mostrarEtapa(etapaSenha);
            inputSenha.focus();
        } else if (data.status === 'nao_encontrado') {
            mostrarMensagem('E-mail não encontrado no sistema.', false);
        } else {
            mostrarMensagem('Erro ao verificar o e-mail.', false);
        }
    } catch (error) {
        console.error('Erro ao verificar e-mail:', error);
        mostrarMensagem('Falha ao se comunicar com o servidor.', false);
    }
}

// 🔹 Volta para a etapa de e-mail
function voltarParaEmail() {
    inputSenha.value = '';
    mostrarEtapa(etapaEmail);
    inputEmail.focus();
}

// 🔹 Etapa 2: valida a senha e realiza o login
async function realizarLogin() {
    const email = inputEmail.value.trim();
    const senha = inputSenha.value;
    mostrarMensagem('', false);

    if (!senha) {
        mostrarMensagem('Por favor, informe sua senha.', false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login/verificarSenha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // 🔑 envia/recebe cookies
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (data.status === 'ok') {
            aposLogin(data.papeis);
        } else if (data.status === 'senha_incorreta') {
            mostrarMensagem('Senha incorreta. Tente novamente.', false);
        } else if (data.status === 'sem_perfil') {
            mostrarMensagem('Este usuário não é cliente nem funcionário.', false);
        } else {
            mostrarMensagem('Erro ao efetuar login.', false);
        }
    } catch (error) {
        console.error('Erro ao realizar login:', error);
        mostrarMensagem('Falha ao se comunicar com o servidor.', false);
    }
}

// 🔹 Só cliente → loja | só funcionário → admin | os dois → pergunta
function aposLogin(papeis) {
    if (papeis.cliente && papeis.funcionario) {
        mostrarEtapa(etapaPerfil);
    } else if (papeis.funcionario) {
        window.location.href = PAGINA_ADMIN;
    } else {
        window.location.href = PAGINA_CLIENTE;
    }
}

// ================= RECUPERAÇÃO DE SENHA =================

// 🔹 "Esqueci minha senha": pede o link para o e-mail que a pessoa já digitou
async function esqueciSenha() {
    const email = inputEmail.value.trim();
    mostrarMensagem('Enviando o link...', true);

    try {
        const response = await fetch(`${API_BASE_URL}/login/esqueciSenha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await response.json();

        if (!response.ok) {
            mostrarMensagem(data.mensagem || 'Não foi possível enviar o link.', false);
            return;
        }

        textoRecuperar.innerText =
            `Se ${email} estiver cadastrado, enviamos um link para ele (vale por 30 minutos). ` +
            `Abra o e-mail, copie o link e cole abaixo.`;
        inputLink.value = '';
        mostrarEtapa(etapaRecuperar);
        inputLink.focus();
    } catch (error) {
        console.error('Erro em esqueciSenha:', error);
        mostrarMensagem('Falha ao se comunicar com o servidor.', false);
    }
}

// Pega o token de dentro do link colado (aceita o link inteiro ou só o código)
function extrairToken(texto) {
    const t = texto.trim();
    try {
        const token = new URL(t).searchParams.get('token');
        if (token) return token;
    } catch (e) { /* não era uma URL: tenta achar o código solto */ }
    const achado = t.match(/[0-9a-f]{64}/i);
    return achado ? achado[0] : null;
}

// 🔹 A pessoa colou o link: se for válido, mostra a tela da nova senha
function usarLinkColado() {
    const token = extrairToken(inputLink.value);

    if (!token) {
        mostrarMensagem('Link inválido. Copie o link completo que veio no e-mail.', false);
        return;
    }

    tokenRecuperacao = token;
    inputNovaSenha.value = '';
    inputConfirmaSenha.value = '';
    mostrarEtapa(etapaNovaSenha);
    inputNovaSenha.focus();
}

// 🔹 Salva a nova senha
async function salvarNovaSenha() {
    const novaSenha = inputNovaSenha.value;
    const confirmaSenha = inputConfirmaSenha.value;

    if (novaSenha.length < 6) {
        mostrarMensagem('A senha deve ter pelo menos 6 caracteres.', false);
        return;
    }
    if (novaSenha !== confirmaSenha) {
        mostrarMensagem('As senhas não são iguais.', false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login/redefinirSenha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: tokenRecuperacao, novaSenha })
        });
        const data = await response.json();

        if (data.status === 'ok') {
            tokenRecuperacao = null;
            inputSenha.value = '';
            mostrarEtapa(etapaSenha);
            mostrarMensagem('Senha alterada! Digite a nova senha para entrar.', true);
            inputSenha.focus();
        } else if (data.status === 'token_invalido') {
            mostrarEtapa(etapaRecuperar);
            mostrarMensagem(data.mensagem, false);
        } else {
            mostrarMensagem(data.mensagem || 'Não foi possível alterar a senha.', false);
        }
    } catch (error) {
        console.error('Erro em redefinirSenha:', error);
        mostrarMensagem('Falha ao se comunicar com o servidor.', false);
    }
}