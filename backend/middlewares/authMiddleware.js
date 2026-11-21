const { query } = require('../database');

// Retorna o CPF guardado no cookie assinado "usuarioLogado".
// (se o cookie foi alterado pelo usuário, o cookie-parser devolve false)
function cpfLogado(req) {
    return req.signedCookies ? req.signedCookies.usuarioLogado : null;
}

// Descobre se o usuário é cliente e/ou funcionário
async function papeisDoUsuario(cpf) {
    const c = await query('SELECT 1 FROM cliente WHERE usuario_cpf_usuario = $1', [cpf]);
    const f = await query('SELECT 1 FROM funcionario WHERE usuario_cpf_usuario = $1', [cpf]);
    return { cliente: c.rows.length > 0, funcionario: f.rows.length > 0 };
}

// Qualquer usuário logado (cliente ou funcionário). Será usado no pagamento.
function verificaAutenticacao(req, res, next) {
    const cpf = cpfLogado(req);

    if (cpf) {
        req.usuarioCpf = cpf;
        return next();
    }
    res.status(401).json({ status: 'nao_logado', mensagem: 'Faça login para continuar' });
}

// Só funcionário — para rotas de API (responde JSON)
async function verificaFuncionarioApi(req, res, next) {
    try {
        const cpf = cpfLogado(req);
        if (!cpf) {
            return res.status(401).json({ status: 'nao_logado', mensagem: 'Faça login para continuar' });
        }
        const papeis = await papeisDoUsuario(cpf);
        if (!papeis.funcionario) {
            return res.status(403).json({ status: 'proibido', mensagem: 'Acesso restrito a funcionários' });
        }
        req.usuarioCpf = cpf;
        next();
    } catch (err) {
        console.error('Erro no authMiddleware:', err);
        res.status(500).json({ status: 'erro', mensagem: 'Erro interno do servidor' });
    }
}

// Só funcionário — para páginas HTML (redireciona para o login)
async function verificaFuncionarioPagina(req, res, next) {
    try {
        const cpf = cpfLogado(req);
        if (cpf && (await papeisDoUsuario(cpf)).funcionario) {
            return next();
        }
    } catch (err) {
        console.error('Erro no authMiddleware:', err);
    }
    res.redirect('/frontend/login/login.html');
}

// Consultar (GET) é público; cadastrar/alterar/excluir exige funcionário.
// As rotas /abrirCrud... entregam telas de administração, então também exigem funcionário.
function leituraPublica(req, res, next) {
    if (req.method === 'GET' && !req.path.startsWith('/abrirCrud')) return next();
    return verificaFuncionarioApi(req, res, next);
}

module.exports = {
    papeisDoUsuario,
    verificaAutenticacao,
    verificaFuncionarioApi,
    verificaFuncionarioPagina,
    leituraPublica
};