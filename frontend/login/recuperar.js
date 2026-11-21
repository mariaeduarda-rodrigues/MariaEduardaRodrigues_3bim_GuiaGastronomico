// Serve para as duas telas: esqueci.html (pede o link) e redefinir.html (cria a nova senha)
const formEsqueci = document.getElementById('formEsqueci');
const formRedefinir = document.getElementById('formRedefinir');
const mensagem = document.getElementById('mensagem');

function mostrarMensagem(texto, sucesso) {
    mensagem.innerText = texto;
    mensagem.className = sucesso ? 'erro-msg ok-msg' : 'erro-msg';
}

// 🔹 Tela "Esqueci minha senha": envia o e-mail para o servidor
if (formEsqueci) {
    formEsqueci.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value.trim();
        const botao = document.getElementById('btnEnviar');

        if (!email) {
            mostrarMensagem('Por favor, informe seu e-mail.', false);
            return;
        }

        botao.disabled = true;
        mostrarMensagem('Enviando...', true);

        try {
            const response = await fetch('/login/esqueciSenha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            mostrarMensagem(data.mensagem || 'Pedido enviado.', response.ok);
        } catch (error) {
            console.error('Erro em esqueciSenha:', error);
            mostrarMensagem('Falha ao se comunicar com o servidor.', false);
        } finally {
            botao.disabled = false;
        }
    });
}

// 🔹 Tela "Nova senha": o token vem na URL do link do e-mail (?token=...)
if (formRedefinir) {
    const token = new URLSearchParams(location.search).get('token');

    if (!token) {
        formRedefinir.querySelector('.form-group').classList.add('hidden');
        mostrarMensagem('Link inválido. Peça um novo link em "Esqueci minha senha".', false);
    }

    formRedefinir.addEventListener('submit', async (event) => {
        event.preventDefault();
        const novaSenha = document.getElementById('novaSenha').value;
        const confirmaSenha = document.getElementById('confirmaSenha').value;
        const botao = document.getElementById('btnSalvar');

        if (novaSenha.length < 6) {
            mostrarMensagem('A senha deve ter pelo menos 6 caracteres.', false);
            return;
        }
        if (novaSenha !== confirmaSenha) {
            mostrarMensagem('As senhas não são iguais.', false);
            return;
        }

        botao.disabled = true;

        try {
            const response = await fetch('/login/redefinirSenha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, novaSenha })
            });
            const data = await response.json();

            if (data.status === 'ok') {
                mostrarMensagem('Senha alterada! Redirecionando para o login...', true);
                setTimeout(() => { window.location.href = '/frontend/login/login.html'; }, 2500);
            } else {
                mostrarMensagem(data.mensagem || 'Não foi possível alterar a senha.', false);
                botao.disabled = false;
            }
        } catch (error) {
            console.error('Erro em redefinirSenha:', error);
            mostrarMensagem('Falha ao se comunicar com o servidor.', false);
            botao.disabled = false;
        }
    });
}