// Envio de e-mail.
// Se o SMTP não estiver configurado no .env (ou o nodemailer não estiver instalado),
// o e-mail NÃO é enviado: o conteúdo (com o link) aparece no terminal do servidor.
async function enviarEmail({ para, assunto, texto, html }) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        console.log('\n📧 [SMTP não configurado] E-mail que seria enviado:');
        console.log('   Para:   ' + para);
        console.log('   Assunto: ' + assunto);
        console.log('   ' + texto.split('\n').join('\n   ') + '\n');
        return { enviado: false };
    }

    let nodemailer;
    try {
        nodemailer = require('nodemailer');
    } catch {
        console.log('\n⚠️  O pacote "nodemailer" não está instalado (npm.cmd install nodemailer).');
        console.log('   Para: ' + para + '\n   ' + texto + '\n');
        return { enviado: false };
    }

    const porta = Number(SMTP_PORT || 587);
    const transporte = nodemailer.createTransport({
        host: SMTP_HOST,
        port: porta,
        secure: porta === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS }
    });

    await transporte.sendMail({
        from: SMTP_FROM || SMTP_USER,
        to: para,
        subject: assunto,
        text: texto,
        html
    });
    return { enviado: true };
}

module.exports = { enviarEmail };