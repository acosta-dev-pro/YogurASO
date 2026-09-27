/**
 * Correos YogurASO — plantillas minimalistas (Arial, texto normal)
 */
const nodemailer = require('nodemailer');

function smtpReady() {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && String(process.env.SMTP_PASS || '').trim());
}

function transporter() {
    if (!smtpReady()) return null;
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || 'false') === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
}

function wrapHtml(title, body) {
    return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>${title}</title></head>
<body style="margin:0;padding:24px 12px;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#222;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid #ddd;border-radius:6px;">
      <tr><td style="padding:20px 24px 8px;border-bottom:1px solid #eee;">
        <strong style="font-size:16px;color:#E94545;">YogurASO</strong>
      </td></tr>
      <tr><td style="padding:20px 24px;">${body}</td></tr>
      <tr><td style="padding:12px 24px 20px;font-size:12px;color:#888;border-top:1px solid #eee;">
        Neiva y Tello, Huila · Si no reconoces este mensaje, ignóralo.
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

async function sendMail({ to, subject, html, text }) {
    const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'YogurASO <noreply@yoguraso.local>';
    const mailer = transporter();

    if (!mailer) {
        console.log('\n--- Correo (sin SMTP) ---');
        console.log('Para:', to);
        console.log('Asunto:', subject);
        console.log(text);
        console.log('-------------------------\n');
        return { ok: true, via: 'console' };
    }

    const info = await mailer.sendMail({ from, to, subject, html, text });
    console.log('Correo enviado a', to, info.messageId);
    return { ok: true, via: 'smtp' };
}

function sendQuiet(job) {
    Promise.resolve(job).catch((err) => console.error('Correo:', err.message));
}

async function sendWelcomeEmail(to, nombre, { firstTime = false } = {}) {
    const who = nombre || 'hola';
    const subject = firstTime ? 'Bienvenido a YogurASO' : 'Sesión iniciada en YogurASO';
    const lead = firstTime
        ? 'Tu cuenta está lista. Ya puedes ver sabores y armar pedidos.'
        : 'Se registró un inicio de sesión en tu cuenta.';
    const text = `${who},\n\n${lead}\n\n— YogurASO`;
    const html = wrapHtml(subject, `
        <p style="margin:0 0 12px;">Hola <strong>${who}</strong>,</p>
        <p style="margin:0 0 12px;">${lead}</p>
    `);
    return sendMail({ to, subject, html, text });
}

async function sendRecoveryCodeEmail(to, nombre, code) {
    const subject = 'Código de recuperación — YogurASO';
    const text = `Hola ${nombre || ''},\n\nTu código (15 min): ${code}\n\n— YogurASO`;
    const html = wrapHtml(subject, `
        <p style="margin:0 0 12px;">Hola <strong>${nombre || ''}</strong>,</p>
        <p style="margin:0 0 16px;">Usa este código para restablecer tu contraseña. Caduca en <strong>15 minutos</strong>.</p>
        <p style="margin:0;font-size:28px;font-weight:bold;letter-spacing:6px;text-align:center;padding:12px;background:#f5f5f5;border:1px solid #ddd;border-radius:4px;">${code}</p>
    `);
    return sendMail({ to, subject, html, text });
}

async function sendPasswordChangeCodeEmail(to, nombre, code) {
    const subject = 'Código para cambiar tu contraseña — YogurASO';
    const text = `Hola ${nombre || ''},\n\nCódigo para cambiar contraseña (15 min): ${code}\n\n— YogurASO`;
    const html = wrapHtml(subject, `
        <p style="margin:0 0 12px;">Hola <strong>${nombre || ''}</strong>,</p>
        <p style="margin:0 0 16px;">Solicitaste cambiar tu contraseña desde tu perfil. Código válido <strong>15 minutos</strong>:</p>
        <p style="margin:0;font-size:28px;font-weight:bold;letter-spacing:6px;text-align:center;padding:12px;background:#f5f5f5;border:1px solid #ddd;border-radius:4px;">${code}</p>
    `);
    return sendMail({ to, subject, html, text });
}

async function sendPasswordChangedEmail(to, nombre) {
    const subject = 'Contraseña actualizada — YogurASO';
    const text = `Hola ${nombre || ''},\n\nTu contraseña se cambió correctamente.\n\n— YogurASO`;
    const html = wrapHtml(subject, `
        <p style="margin:0 0 12px;">Hola <strong>${nombre || ''}</strong>,</p>
        <p style="margin:0;">Tu contraseña se actualizó. Si no fuiste tú, contáctanos de inmediato.</p>
    `);
    return sendMail({ to, subject, html, text });
}

module.exports = {
    sendMail,
    sendQuiet,
    sendWelcomeEmail,
    sendRecoveryCodeEmail,
    sendPasswordChangeCodeEmail,
    sendPasswordChangedEmail,
    smtpReady
};
