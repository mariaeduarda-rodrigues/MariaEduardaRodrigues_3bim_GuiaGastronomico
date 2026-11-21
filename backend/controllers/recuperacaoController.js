const crypto = require('crypto');
const { query } = require('../database');
const { enviarEmail } = require('../mailer');

const hashDoToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const MENSAGEM_GENERICA =
    'Se este e-mail estiver cadastrado, enviamos um link para redefinir a senha. O link vale por 30 minutos.';

async function garantirTabelaRecuperacao() {
    await query(`
        CREATE TABLE IF NOT EXISTS public.recuperacao_senha (
            id_recuperacao serial PRIMARY KEY,
            usuario_cpf_usuario character varying(20) NOT NULL
                REFERENCES public.usuario(cpf_usuario) ON DELETE CASCADE,
            token_hash character varying(64) NOT NULL,
            expira_em timestamp without time zone NOT NULL
        )
    `);
}

// Passo 1: gera o link de recuperação (salva apenas na tabela recuperacao_senha)
exports.esqueciSenha = async (req, res) => {
    try {
        await garantirTabelaRecuperacao();

        const email = String(req.body.email || '').trim();

        if (!email) {
            return res.status(400).json({ status: 'dados_invalidos', mensagem: 'Informe seu e-mail' });
        }

        const r = await query(
            `SELECT cpf_usuario, nome_usuario, email_usuario
             FROM usuario
             WHERE LOWER(email_usuario) = LOWER($1)
             ORDER BY cpf_usuario LIMIT 1`,
            [email]
        );

        if (r.rows.length > 0) {
            const usuario = r.rows[0];
            const token = crypto.randomBytes(32).toString('hex');

            await query('DELETE FROM recuperacao_senha WHERE usuario_cpf_usuario = $1', [usuario.cpf_usuario]);
            await query(
                `INSERT INTO recuperacao_senha (usuario_cpf_usuario, token_hash, expira_em)
                 VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
                [usuario.cpf_usuario, hashDoToken(token)]
            );

            const base = process.env.BASE_URL || 'http://localhost:' + (process.env.PORT || 3000);
            const link = `${base}/frontend/login/login.html?token=${token}`;

            try {
                await enviarEmail({
                    para: usuario.email_usuario,
                    assunto: 'DEVORA - Redefinição de senha',
                    texto:
                        `Olá, ${usuario.nome_usuario}!\n\n` +
                        `Recebemos um pedido para redefinir a sua senha no DEVORA.\n` +
                        `Clique no link abaixo (vale por 30 minutos):\n\n${link}\n\n` +
                        `Se não foi você, ignore este e-mail: a sua senha continua a mesma.`,
                    html:
                        `<p>Olá, <strong>${usuario.nome_usuario}</strong>!</p>` +
                        `<p>Recebemos um pedido para redefinir a sua senha no DEVORA.</p>` +
                        `<p><a href="${link}">Clique aqui para criar uma nova senha</a> (vale por 30 minutos).</p>` +
                        `<p>Se não foi você, ignore este e-mail: a sua senha continua a mesma.</p>`
                });
            } catch (erroEmail) {
                console.error('Erro ao enviar e-mail de recuperação:', erroEmail.message);
            }
        }

        res.json({ status: 'ok', mensagem: MENSAGEM_GENERICA });
    } catch (err) {
        console.error('Erro em esqueciSenha:', err);
        res.status(500).json({ status: 'erro', mensagem: 'Não foi possível processar o pedido' });
    }
};

// Passo 2: valida o link e grava a NOVA SENHA na tabela usuario
exports.redefinirSenha = async (req, res) => {
    try {
        await garantirTabelaRecuperacao();

        const rawToken = String(req.body.token || '').trim();
        const match = rawToken.match(/[0-9a-f]{64}/i);
        const token = match ? match[0] : rawToken;
        const novaSenha = String(req.body.novaSenha || '').trim();

        if (!token || !novaSenha) {
            return res.status(400).json({ status: 'dados_invalidos', mensagem: 'Dados incompletos' });
        }
        if (novaSenha.length < 6) {
            return res.status(400).json({ status: 'dados_invalidos', mensagem: 'A senha deve ter pelo menos 6 caracteres' });
        }

        const r = await query(
            `SELECT usuario_cpf_usuario
             FROM recuperacao_senha
             WHERE token_hash = $1 AND expira_em > NOW()`,
            [hashDoToken(token)]
        );

        if (r.rows.length === 0) {
            return res.status(400).json({ status: 'token_invalido', mensagem: 'Link inválido ou expirado. Peça um novo link.' });
        }

        const cpf = r.rows[0].usuario_cpf_usuario;

        // Salva a nova senha diretamente na tabela usuario
        await query('UPDATE usuario SET senha_usuario = $1 WHERE cpf_usuario = $2', [novaSenha, cpf]);
        await query('DELETE FROM recuperacao_senha WHERE usuario_cpf_usuario = $1', [cpf]);

        res.json({ status: 'ok', mensagem: 'Senha alterada com sucesso!' });
    } catch (err) {
        console.error('Erro em redefinirSenha:', err);
        res.status(500).json({ status: 'erro', mensagem: 'Não foi possível redefinir a senha' });
    }
};