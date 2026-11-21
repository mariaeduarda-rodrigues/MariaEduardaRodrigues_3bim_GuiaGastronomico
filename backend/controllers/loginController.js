const bcrypt = require('bcrypt');
const { query } = require('../database');
const { papeisDoUsuario } = require('../middlewares/authMiddleware');

// Opções do cookie de sessão
const opcoesCookie = {
    signed: true,       // assinado: se o usuário mexer no valor, ele é rejeitado
    httpOnly: true,     // JavaScript do navegador não consegue ler
    sameSite: 'Lax',
    secure: false,      // true apenas em HTTPS
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
};

// Aceita senha com hash (bcrypt) ou em texto puro (dados antigos do banco)
async function senhaConfere(senhaDigitada, senhaBanco) {
    const guardada = senhaBanco || '';
    if (guardada.startsWith('$2b$') || guardada.startsWith('$2a$')) {
        return bcrypt.compare(senhaDigitada, guardada);
    }
    return senhaDigitada === guardada;
}

function validarDataNascimento(dataStr) {
    if (!dataStr || !/^\d{4}-\d{2}-\d{2}$/.test(String(dataStr))) {
        return 'Informe uma data de nascimento válida';
    }

    const [ano, mes, dia] = String(dataStr).split('-').map(Number);
    const nascimento = new Date(ano, mes - 1, dia);

    if (
        nascimento.getFullYear() !== ano ||
        nascimento.getMonth() !== mes - 1 ||
        nascimento.getDate() !== dia
    ) {
        return 'Data de nascimento inválida';
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (nascimento > hoje) {
        return 'A data de nascimento não pode ser futura';
    }

    const limite16Anos = new Date(
        hoje.getFullYear() - 16,
        hoje.getMonth(),
        hoje.getDate()
    );

    if (nascimento > limite16Anos) {
        return 'É necessário ter 16 anos ou mais para criar uma conta';
    }

    return null;
}

// 🔹 Etapa 1: verifica se o e-mail existe e devolve o nome
exports.verificarEmail = async (req, res) => {
    const { email } = req.body;
    const sql = 'SELECT nome_usuario FROM usuario WHERE LOWER(email_usuario) = LOWER($1) LIMIT 1';

    try {
        const result = await query(sql, [email || '']);

        if (result.rows.length > 0) {
            return res.json({ status: 'existe', nome: result.rows[0].nome_usuario });
        }
        res.json({ status: 'nao_encontrado' });
    } catch (err) {
        console.error('Erro em verificarEmail:', err);
        res.status(500).json({ status: 'erro', mensagem: err.message });
    }
};

// 🔹 Etapa 2: valida a senha e cria o cookie de sessão
exports.verificarSenha = async (req, res) => {
    const { email, senha } = req.body;
    const sql = `
        SELECT cpf_usuario, nome_usuario, senha_usuario
        FROM usuario
        WHERE LOWER(email_usuario) = LOWER($1)
    `;

    try {
        const result = await query(sql, [email || '']);

        // Pode haver mais de um usuário com o mesmo e-mail: vale o que bater com a senha
        let usuario = null;
        for (const u of result.rows) {
            if (await senhaConfere(senha || '', u.senha_usuario)) {
                usuario = u;
                break;
            }
        }

        if (!usuario) {
            return res.json({ status: 'senha_incorreta' });
        }

        const papeis = await papeisDoUsuario(usuario.cpf_usuario);
        if (!papeis.cliente && !papeis.funcionario) {
            return res.json({ status: 'sem_perfil' });
        }

        // 🔐 Cria o cookie de sessão (guarda o CPF de quem logou)
        res.cookie('usuarioLogado', usuario.cpf_usuario, opcoesCookie);

        return res.json({ status: 'ok', nome: usuario.nome_usuario, papeis });
    } catch (err) {
        console.error('Erro ao verificar senha:', err);
        return res.status(500).json({ status: 'erro', mensagem: err.message });
    }
};

// 🔹 Logout: remove o cookie
exports.logout = (req, res) => {
    res.clearCookie('usuarioLogado', {
        httpOnly: true,
        sameSite: 'Lax',
        secure: false,
        path: '/'
    });
    res.json({ status: 'deslogado' });
};

// 🔹 Quem está logado? (usado no topo da loja)
exports.verificaSeUsuarioEstaLogado = async (req, res) => {
    try {
        const cpf = req.signedCookies ? req.signedCookies.usuarioLogado : null;
        if (!cpf) return res.json({ status: 'nao_logado' });

        const r = await query('SELECT nome_usuario FROM usuario WHERE cpf_usuario = $1', [cpf]);
        if (r.rows.length === 0) {
            res.clearCookie('usuarioLogado', { path: '/' });
            return res.json({ status: 'nao_logado' });
        }

        const papeis = await papeisDoUsuario(cpf);
        res.json({ status: 'ok', nome: r.rows[0].nome_usuario, cpf, papeis });
    } catch (err) {
        console.error('Erro em verificaLogado:', err);
        res.json({ status: 'nao_logado' });
    }
};

// 🔹 Cadastro de novo cliente (cria usuario + cliente, com hash de senha) e já faz login
exports.cadastrar = async (req, res) => {
    const {
        nome_usuario,
        data_nascimento_usuario,
        email_usuario,
        endereco_usuario,
        senha_usuario
    } = req.body;
    const cpf = String(req.body.cpf_usuario || '').replace(/\D/g, '');
    let usuarioCriado = false;

    try {
        if (!nome_usuario || !data_nascimento_usuario || !email_usuario || !senha_usuario || cpf.length !== 11) {
            return res.status(400).json({
                status: 'dados_invalidos',
                mensagem: 'Preencha nome, CPF (11 dígitos), data de nascimento, e-mail e senha'
            });
        }

        const erroData = validarDataNascimento(data_nascimento_usuario);
        if (erroData) {
            return res.status(400).json({ status: 'dados_invalidos', mensagem: erroData });
        }

        if (String(senha_usuario).length < 6) {
            return res.status(400).json({ status: 'dados_invalidos', mensagem: 'A senha deve ter pelo menos 6 caracteres' });
        }

        const cpfExiste = await query('SELECT 1 FROM usuario WHERE cpf_usuario = $1', [cpf]);
        if (cpfExiste.rows.length > 0) {
            return res.status(409).json({ status: 'cpf_existente', mensagem: 'Já existe uma conta com este CPF' });
        }

        const emailExiste = await query('SELECT 1 FROM usuario WHERE LOWER(email_usuario) = LOWER($1)', [email_usuario]);
        if (emailExiste.rows.length > 0) {
            return res.status(409).json({ status: 'email_existente', mensagem: 'Já existe uma conta com este e-mail' });
        }

        const senhaHash = await bcrypt.hash(senha_usuario, 10);

        await query(
            `INSERT INTO usuario (cpf_usuario, nome_usuario, data_nascimento_usuario, endereco_usuario, senha_usuario, email_usuario)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [cpf, nome_usuario, data_nascimento_usuario, endereco_usuario || null, senhaHash, email_usuario]
        );
        usuarioCriado = true;

        await query(
            `INSERT INTO cliente (usuario_cpf_usuario, renda_cliente, data_cadastro_cliente)
             VALUES ($1, 0, CURRENT_DATE)`,
            [cpf]
        );

        res.cookie('usuarioLogado', cpf, opcoesCookie);
        res.status(201).json({
            status: 'ok',
            nome: nome_usuario,
            papeis: { cliente: true, funcionario: false }
        });
    } catch (err) {
        console.error('Erro no cadastro:', err);
        if (usuarioCriado) {
            await query('DELETE FROM usuario WHERE cpf_usuario = $1', [cpf]).catch(() => {});
        }
        res.status(500).json({ status: 'erro', mensagem: 'Não foi possível criar a conta', detalhe: err.message });
    }
};