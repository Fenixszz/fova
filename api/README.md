# Aviso por e-mail (função na Vercel + Resend)

O painel manda um e-mail pro **sócio citado** numa notificação (menção,
atribuição, prazo, automação) quando o toggle **"Avisar por e-mail"** está
ligado (no sino de notificações, dentro de **Quadros**).

Como o site é estático, quem envia o e-mail é a função serverless
[`notify-email.js`](./notify-email.js), hospedada na Vercel no mesmo projeto
`fova`. Ela fica atrás do login do Supabase (só sócio logado dispara) e só envia
para o e-mail de um perfil real.

## Configurar (uma vez)

### 1. Criar conta no Resend e pegar a chave
1. Acesse https://resend.com → crie a conta (plano free: 3.000 e-mails/mês).
2. Em **API Keys** → **Create API Key** → copie a chave (`re_...`).
3. Para enviar com remetente próprio (ex.: `crm@suaagencia.com.br`), verifique o
   domínio em **Domains** (adiciona uns registros DNS). **Enquanto não verificar**,
   dá pra testar com o remetente `onboarding@resend.dev`, que só entrega para o
   e-mail dono da conta Resend.

### 2. Pôr as variáveis na Vercel
No projeto `fova` → **Settings → Environment Variables** (ambiente Production):

| Variável | Obrigatória | Valor |
|---|---|---|
| `RESEND_API_KEY` | sim (secreta) | a chave `re_...` do Resend |
| `FOVA_MAIL_FROM` | recomendada | `Fova CRM <crm@seudominio.com.br>` (ou deixe vazio pra usar o remetente de teste) |

> `SUPABASE_URL` e `SUPABASE_ANON_KEY` já têm o valor público padrão embutido;
> só defina se um dia trocar de projeto Supabase.

### 3. Fazer deploy
`vercel --prod` ou um push pro Git ligado à Vercel. A função sobe sozinha
(a pasta `/api` é detectada automaticamente).

### 4. Ligar o toggle
No painel, em **Quadros** → sino de notificações → ligue **"Avisar por e-mail"**.
É uma preferência compartilhada: vale pros dois sócios.

## Como testar
Com o toggle ligado, peça pro outro sócio te **atribuir um cartão** ou te
**mencionar** num comentário. Deve chegar um e-mail "Fova · ..." com botão
**Abrir no painel**. (Em teste sem domínio verificado, o e-mail só chega pra
conta dona do Resend.)

## Notas
- **Melhor esforço**: se o envio falhar, a notificação no sino acontece do mesmo
  jeito. Falhas vão pro console do navegador (com `debug: true` no `config.js`).
- **Sem chave configurada**: a função responde erro e nada é enviado — não quebra
  o painel.
- **Não manda e-mail do que você mesmo fez**: menção/atribuição só avisam o outro
  sócio; prazos avisam os responsáveis do cartão.
