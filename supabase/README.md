# FOVA · CRM — Colaboração em tempo real + login por sócio

Este guia liga o CRM da Fova em modo **colaborativo**: login individual para os
dois sócios, sessão que dura 30+ dias e **toda alteração aparecendo na tela do
outro em menos de 1 segundo**, sem recarregar a página.

Enquanto você **não** fizer esta configuração, o CRM continua funcionando
exatamente como hoje (senha única + dados só no aparelho). Nada quebra. A camada
nova é opcional e só liga quando você preenche duas chaves.

---

## Visão geral da arquitetura

| Camada | O que é | Onde |
|---|---|---|
| Site/painel | HTML + JS puro (sem framework), servido estático | Vercel (projeto `fova`) |
| Base de leads | Blob **criptografado** (`crm-data.enc.js`, AES-256-GCM) — semente compartilhada e só-leitura | no próprio `index.html` |
| Banco + tempo real + login | **Supabase** (Postgres + Auth + Realtime + RLS) | nuvem do Supabase |

Escolhi **Supabase** porque o site é estático e em JS puro, sem backend próprio:
é o encaixe padrão que entrega, de uma vez, banco, login, tempo real nativo e
segurança por linha (RLS) sem trocar a stack nem subir servidor.

**Como os dados sincronizam**
- CRM (leads): a camada mutável (etapa, follow-up, apagados, arquivados,
  renomeados) vira **1 linha por empresa** na tabela `crm_cards`. Dois sócios
  mexendo em empresas diferentes nunca se atropelam; na mesma empresa, vence a
  última gravação (por `updated_at`), campo a campo.
- Quadros (Kanban/Trello): snapshot em `app_state` + **merge por cartão**
  (cada cartão vence por `updatedAt`), então arrastar cartões diferentes ao
  mesmo tempo preserva os dois. Conflito real no mesmo cartão → mantém a versão
  mais nova e **avisa** (nunca some em silêncio).
- Presença, "quem está arrastando/editando" e reconexão: canal **Realtime**
  (Presence + Broadcast). Indicador discreto no topo: *Sincronizado /
  Reconectando… / Offline*.

---

## Passo a passo (uma vez só)

### 1. Criar o projeto no Supabase
1. Acesse https://supabase.com → **New project** (plano free serve de sobra para 2 pessoas).
2. Guarde a **senha do banco** (não é usada no front, mas o Supabase pede).

### 2. Rodar o schema
1. No projeto, abra **SQL Editor** → **New query**.
2. Cole **todo** o conteúdo de [`schema.sql`](./schema.sql) e clique **Run**.
   Ele cria as tabelas, o Realtime, as regras de segurança (RLS) e os gatilhos.
   É idempotente — pode rodar de novo sem problema.

### 3. Ajustar a autenticação
Em **Authentication → Providers → Email**:
- **Confirm email: DESLIGADO** (importante para o cadastro dos dois sócios
  funcionar de uma vez). São duas contas de confiança; não precisa de confirmação.
- Deixe **Enable Signups** ligado **durante** a configuração inicial.
  Depois que os dois sócios existirem, **desligue** para travar cadastro público
  (o app também já esconde a tela de cadastro, e há um gatilho no banco que
  recusa uma 3ª conta por auto-cadastro).

Em **Authentication → URL Configuration**:
- **Site URL**: a URL do painel em produção
  (ex.: `https://SEU-DOMINIO/painel-ajfqcxvp4y/`).
- **Redirect URLs**: adicione a mesma URL. É para onde o link de
  **recuperação de senha** volta.

Para a recuperação de senha por e-mail funcionar de verdade, configure um
**SMTP** em **Authentication → Emails → SMTP** (o remetente padrão do Supabase
tem limite baixo; para uso real use um SMTP próprio, ex. Resend/SendGrid).

### 4. Pegar as duas chaves públicas
Em **Project Settings → API**, copie:
- **Project URL** → ex.: `https://abcd1234.supabase.co`
- **anon public** (NÃO a `service_role`, que é secreta e nunca vai pro front)

### 5. Colar no projeto e buildar
Edite [`../painel-ajfqcxvp4y/config.js`](../painel-ajfqcxvp4y/config.js):

```js
window.FOVA_CFG = {
  supabaseUrl: 'https://abcd1234.supabase.co',
  supabaseAnonKey: 'eyJhbGciOi...almojado...anon-public',
  debug: false,
};
```

Gere o `index.html` embutido:

```bash
node painel-ajfqcxvp4y/build-panel.mjs
```

Faça o deploy (ex.: `vercel --prod` ou push pro Git ligado à Vercel).

> As duas chaves são **públicas por natureza** — a segurança real vem das regras
> de RLS no banco. Pode commitar e publicar sem risco. A `service_role` é que é
> secreta; ela **não** é usada em lugar nenhum do front.

### 6. Configuração inicial (cadastrar os dois sócios)
Abra o painel. Como ainda não há contas, aparece o assistente **Configuração
inicial**:
1. Dados do **Sócio 1** (nome, e-mail, senha, cor) → *Próximo sócio*.
2. Dados do **Sócio 2** → *Próximo*.
3. **Senha dos dados**: informe a senha atual que hoje destrava a base
   criptografada. Ela é verificada na hora e guardada (com RLS) no seu banco, em
   `app_state/datakey`, para que os dois entrem direto depois, sem digitá-la de
   novo. A base continua criptografada no arquivo estático.

Pronto. As contas são criadas e a tela volta pro **login**. Cada sócio entra com
a própria conta, no próprio computador.

### 7. Travar o cadastro
Volte em **Authentication → Providers → Email** e **desligue Enable Signups**.

---

## Variáveis / configurações necessárias (resumo)

| Onde | Chave | Valor |
|---|---|---|
| `painel-ajfqcxvp4y/config.js` | `supabaseUrl` | Project URL do Supabase (público) |
| `painel-ajfqcxvp4y/config.js` | `supabaseAnonKey` | anon public key (público) |
| Supabase · Auth · Email | Confirm email | **Off** |
| Supabase · Auth · Email | Enable Signups | On durante setup → **Off** depois |
| Supabase · Auth · URL Config | Site URL + Redirect URLs | URL do painel |
| Supabase · Auth · SMTP | remetente | SMTP próprio (recuperação de senha) |

Não há `.env` novo nem função serverless: o front fala direto com o Supabase
usando a anon key pública + RLS. (A pasta já ignora `.env*` no git.)

---

## Como testar (dois navegadores)

1. **Login e sessão** — No navegador A, entre como Sócio 1. Feche o navegador e
   reabra: deve **continuar logado** (sessão de 30 dias). No navegador B (ou uma
   janela anônima), entre como Sócio 2.
2. **Edição ao vivo** — Com os dois na aba **Quadros**, no mesmo quadro: no A,
   renomeie um cartão / mude a etapa de um lead. Em **< 1s** a mudança aparece no
   B, sem recarregar.
3. **Presença** — No topo, cada um vê o avatar do outro (iniciais na cor dele) e
   o status **Sincronizado**.
4. **Indicador ao vivo** — No A, comece a **arrastar** um cartão ou abra um
   cartão para editar: no B aparece uma **borda colorida com o nome** de quem
   está mexendo.
5. **Arrastar e soltar** — Mova cartões entre colunas no A; a posição fica
   **idêntica** no B.
6. **Conflito** — Os dois editam o **mesmo** cartão quase juntos: vence a versão
   mais recente e aparece um aviso; nada some em silêncio.
7. **Queda de conexão** — No A, desligue a internet (DevTools → Network →
   *Offline*): o status vira **Reconectando…/Offline**. Religue: ele
   **reconecta sozinho** e sincroniza o que ficou pendente.
8. **Histórico** — Clique no ícone de relógio no topo: lista **quem fez o quê e
   quando**.
9. **Recuperar senha** — No login, *Esqueci minha senha* → chega o e-mail → o
   link abre a tela de nova senha.
10. **Meu perfil** — Clique no seu avatar (topo) → troque nome, cor ou senha;
    *Sair* e *Sair de todos os aparelhos*.

---

## Observações técnicas (decisões registradas)

- **Sessão persistente**: o cliente Supabase usa `persistSession` +
  `autoRefreshToken` (tokens de acesso/refresh renovados sozinhos), guardados no
  `localStorage` do navegador — o padrão para SPA estática. "Manter conectado"
  vem **marcado**; desmarcado, a sessão encerra ao fechar o navegador.
  > Os requisitos pediam cookies `HttpOnly/Secure/SameSite`. Num site **estático**
  > (sem servidor) isso não é possível pelo JS; seria preciso uma rota serverless
  > com `@supabase/ssr`. Como a hospedagem é estática e a stack não deveria mudar
  > sem necessidade, ficou no padrão SPA (token no `localStorage`). Se um dia
  > quiserem o endurecimento com cookies, dá para adicionar uma função na Vercel —
  > é um acréscimo, não uma troca de stack.
- **Senhas**: hash forte fica por conta do Supabase Auth (bcrypt); nunca
  trafega/armazena senha em texto. Proteção contra força bruta: limite nativo do
  Supabase **+** trava no cliente (5 tentativas → 60s).
- **Permissões no servidor**: toda tabela tem **RLS** exigindo usuário
  autenticado; os dois sócios são admin total. Sem login, nada do CRM é acessível.
- **Migração sem perder dados**: no 1º acesso com Supabase, o que já estava no
  aparelho (overrides, follow-ups, arquivados, imports, quadros) é **mesclado e
  enviado** ao servidor. A base de leads não é portada — segue como semente
  criptografada compartilhada.
- **Desempenho**: o CRM envia só as **empresas que mudaram** (linha a linha). Os
  Quadros usam snapshot + merge por cartão (ótimo para 2 pessoas e centenas de
  cartões); evoluir para "ops" por cartão é uma otimização futura fácil.
