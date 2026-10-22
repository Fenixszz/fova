# Aviso por e-mail (função na Vercel + Gmail)

O painel manda um e-mail pro **sócio citado** numa notificação (menção,
atribuição, prazo, automação) quando o toggle **"Avisar por e-mail"** está
ligado (no sino de notificações, dentro de **Quadros**).

Como o site é estático, quem envia o e-mail é a função serverless
[`notify-email.js`](./notify-email.js), hospedada na Vercel no mesmo projeto
`fova`. O envio é via **SMTP do Gmail** — não precisa de domínio próprio: sai de
uma conta Gmail e chega em qualquer destinatário. A função fica atrás do login
do Supabase (só sócio logado dispara) e só envia para o e-mail de um perfil real.

## Configurar (uma vez)

### 1. Gerar uma "senha de app" no Google
A senha de app deixa a função enviar pelo Gmail sem usar a senha normal.
1. A conta Gmail precisa ter **Verificação em duas etapas** ligada:
   https://myaccount.google.com/security → **Verificação em duas etapas** → ligar.
2. Depois, crie a senha de app:
   https://myaccount.google.com/apppasswords → dê um nome (ex.: "Fova CRM") →
   **Criar**. O Google mostra **16 caracteres** (em 4 blocos). Copie.

### 2. Pôr as variáveis na Vercel
No projeto `fova` → **Settings → Environment Variables** (ambiente Production):

| Variável | Obrigatória | Valor |
|---|---|---|
| `GMAIL_USER` | sim | o e-mail que vai enviar, ex.: `suaagencia@gmail.com` |
| `GMAIL_APP_PASSWORD` | sim (secreta) | os 16 caracteres da senha de app (pode colar com ou sem espaços) |
| `FOVA_MAIL_FROM` | opcional | nome exibido, ex.: `Fova CRM <suaagencia@gmail.com>`. Padrão: `Fova CRM <GMAIL_USER>`. No Gmail, o endereço tem que ser o próprio `GMAIL_USER`. |

> A `RESEND_API_KEY` não é mais usada — pode remover das env vars se quiser.

### 3. Fazer deploy
`vercel --prod` ou um push pro Git ligado à Vercel. A função sobe sozinha
(a pasta `/api` é detectada automaticamente).

### 4. Ligar o toggle
No painel, em **Quadros** → sino de notificações → ligue **"Avisar por e-mail"**.
É uma preferência compartilhada: vale pros dois sócios.

## Como testar
Com o toggle ligado, peça pro outro sócio te **atribuir um cartão** ou te
**mencionar** num comentário. Deve chegar um e-mail "Fova · ..." com botão
**Abrir no painel** (de `GMAIL_USER` para o e-mail do sócio citado).

## Notas
- **Limites do Gmail**: conta comum envia ~500 e-mails/dia — de sobra para avisos
  entre dois sócios.
- **Melhor esforço**: se o envio falhar, a notificação no sino acontece do mesmo
  jeito. Falhas vão pro console do navegador (com `debug: true` no `config.js`).
- **Sem as variáveis**: a função responde erro e nada é enviado — não quebra o painel.
- **Não manda e-mail do que você mesmo fez**: menção/atribuição só avisam o outro
  sócio; prazos avisam os responsáveis do cartão.
- **Quer remetente profissional** (ex.: `crm@suaagencia.com.br`)? Aí sim precisa de
  um domínio; dá pra voltar pro Resend/SMTP próprio quando tiver um.
