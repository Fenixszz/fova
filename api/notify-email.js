// ============================================================
// FOVA · CRM — Aviso por e-mail (Vercel Serverless Function)
// ------------------------------------------------------------
// Envia um e-mail para o sócio CITADO em uma notificação do painel
// (menção, atribuição, prazo, automação). É acionada pelo cliente
// quando "Avisar por e-mail" está ligado.
//
// Envio via SMTP do Gmail (não precisa de domínio próprio): manda a
// partir da conta Gmail configurada, para qualquer destinatário.
//
// Segurança (é um endpoint público, então trava o uso):
//   1. Exige o token de sessão do Supabase do sócio logado (Bearer).
//   2. Só envia para o e-mail de um PERFIL real (tabela profiles).
//   Assim ninguém de fora usa isso como relay de spam.
//
// Variáveis de ambiente (Vercel → Project → Settings → Environment Variables):
//   GMAIL_USER          (obrigatória) — o e-mail Gmail que vai enviar,
//                                        ex.: suaagencia@gmail.com.
//   GMAIL_APP_PASSWORD  (obrigatória, SECRETA) — a "senha de app" de 16
//                                        caracteres gerada no Google
//                                        (Conta Google → Segurança →
//                                        Verificação em duas etapas →
//                                        Senhas de app). NÃO é a senha
//                                        normal do Gmail.
//   FOVA_MAIL_FROM      (opcional) — nome/remetente exibido. Padrão:
//                                        "Fova CRM <GMAIL_USER>". No Gmail,
//                                        o endereço precisa ser o próprio
//                                        GMAIL_USER (ou um alias dele).
//   SUPABASE_URL / SUPABASE_ANON_KEY (opcionais) — já têm o valor público padrão.
// ============================================================

import nodemailer from 'nodemailer';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://arxtutjdxxkoelxkxpuu.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyeHR1dGpkeHhrb2VseGt4cHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MjY0MjgsImV4cCI6MjEwODIwMjQyOH0.G19eh_enQ3lVdAYDdKQDxCwfokMiSB9ttqO_KgaxI9M';

const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_PASS = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, ''); // o Google mostra em blocos de 4; tira os espaços
const MAIL_FROM = process.env.FOVA_MAIL_FROM || (GMAIL_USER ? 'Fova CRM <' + GMAIL_USER + '>' : '');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function emailHtml(nome, text, link) {
  const saudacao = nome ? 'Oi, ' + esc(String(nome).split(/\s+/)[0]) + '.' : 'Oi.';
  const botao = link
    ? '<a href="' + esc(link) + '" style="display:inline-block;margin-top:24px;padding:12px 22px;' +
      'background:#CBA96E;color:#1a1712;text-decoration:none;border-radius:10px;' +
      'font-weight:600;font-size:15px;">Abrir no painel</a>'
    : '';
  return '' +
    '<div style="margin:0;padding:32px 16px;background:#141210;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">' +
      '<div style="max-width:480px;margin:0 auto;background:#1e1b17;border:1px solid #2c2822;border-radius:16px;overflow:hidden;">' +
        '<div style="padding:20px 28px;border-bottom:1px solid #2c2822;">' +
          '<span style="color:#CBA96E;font-weight:700;letter-spacing:.14em;font-size:13px;">FOVA · CRM</span>' +
        '</div>' +
        '<div style="padding:28px;">' +
          '<p style="margin:0 0 14px;color:#9b948a;font-size:15px;">' + saudacao + '</p>' +
          '<p style="margin:0;color:#f3efe8;font-size:17px;line-height:1.5;">' + esc(text) + '</p>' +
          botao +
        '</div>' +
        '<div style="padding:16px 28px;border-top:1px solid #2c2822;">' +
          '<p style="margin:0;color:#6f6a62;font-size:12px;line-height:1.5;">' +
            'Você recebeu isto porque o aviso por e-mail está ligado no painel da Fova. ' +
            'Para parar, desligue "Avisar por e-mail" no sino de notificações.' +
          '</p>' +
        '</div>' +
      '</div>' +
    '</div>';
}

let _transporter = null;
function transporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    });
  }
  return _transporter;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  if (!GMAIL_USER || !GMAIL_PASS) {
    res.status(500).json({ error: 'Servidor de e-mail não configurado (faltam GMAIL_USER / GMAIL_APP_PASSWORD).' });
    return;
  }

  // Token do sócio logado (vem no header Authorization: Bearer <token>).
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Sem sessão.' });
    return;
  }

  // Corpo da requisição.
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const toMemberId = String(body.toMemberId || '');
  const text = String(body.text || '').slice(0, 2000);
  const link = typeof body.link === 'string' ? body.link.slice(0, 500) : '';
  if (!toMemberId || !text) {
    res.status(400).json({ error: 'Faltam dados (toMemberId e text).' });
    return;
  }

  try {
    // 1) Valida o token no Supabase (confirma que é um sócio logado).
    const userRes = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + token },
    });
    if (!userRes.ok) {
      res.status(401).json({ error: 'Sessão inválida ou expirada.' });
      return;
    }

    // 2) Resolve o destinatário — precisa ser um perfil real, com e-mail.
    const profRes = await fetch(
      SUPABASE_URL + '/rest/v1/profiles?select=nome,email&id=eq.' + encodeURIComponent(toMemberId),
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + token } }
    );
    const rows = profRes.ok ? await profRes.json() : [];
    const dest = Array.isArray(rows) ? rows[0] : null;
    if (!dest || !dest.email) {
      res.status(404).json({ error: 'Destinatário não encontrado ou sem e-mail.' });
      return;
    }

    // 3) Envia pelo Gmail (SMTP).
    const subject = text.length > 72 ? text.slice(0, 69) + '…' : text;
    await transporter().sendMail({
      from: MAIL_FROM,
      to: dest.email,
      subject: 'Fova · ' + subject,
      text: text + (link ? '\n\nAbrir no painel: ' + link : ''),
      html: emailHtml(dest.nome, text, link),
    });

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(502).json({ error: 'Falha ao enviar o e-mail.', detail: String(e && e.message || e).slice(0, 300) });
  }
}
