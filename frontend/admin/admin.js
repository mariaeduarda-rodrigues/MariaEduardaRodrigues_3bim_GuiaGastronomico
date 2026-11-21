// Preenche os contadores do resumo usando as rotas que já existem
async function contar(url, chave, idElemento) {
    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();
        document.getElementById(idElemento).textContent = (dados[chave] || []).length;
    } catch (erro) {
        console.warn('Não foi possível carregar ' + url);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    contar('/prato/listar', 'pratos', 'qtdPratos');
    contar('/categoria/listar', 'categorias', 'qtdCategorias');
    contar('/medida/listar', 'medidas', 'qtdMedidas');
    contar('/usuario', 'usuarios', 'qtdUsuarios');
});

// Logout: apaga o cookie de sessão no servidor e volta para a loja
document.getElementById('btnSair').addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch('/login/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    window.location.href = '../cliente/cliente.html';
});