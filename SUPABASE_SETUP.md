# Configuração Supabase — Predictor Mundial 2026

Segue estes 3 passos. Demora ~5 minutos.

---

## Passo 1 — Criar projeto Supabase (gratuito)

1. Vai a **https://supabase.com** e clica em **Start for free**
2. Cria conta (podes usar o Google)
3. Clica **New project**
4. Preenche:
   - **Name:** `predictor-mundial-2026`
   - **Database Password:** cria uma password forte (guarda-a)
   - **Region:** `West EU (Ireland)` — mais perto de Portugal
5. Clica **Create new project** e espera ~1 min

---

## Passo 2 — Criar a tabela da base de dados

1. No projeto Supabase, vai ao menu **SQL Editor** (ícone de terminal à esquerda)
2. Clica **New query**
3. Cola este SQL e clica **Run** (▶):

```sql
-- Tabela principal
CREATE TABLE app_state (
  key         TEXT PRIMARY KEY,
  data        JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Só utilizadores autenticados podem ler/escrever
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read"
  ON app_state FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth write"
  ON app_state FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth update"
  ON app_state FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth delete"
  ON app_state FOR DELETE TO authenticated USING (true);

-- Activar realtime (sincronização entre dispositivos)
ALTER PUBLICATION supabase_realtime ADD TABLE app_state;
```

4. Deves ver **Success. No rows returned.**

---

## Passo 3 — Criar o teu utilizador

1. No menu esquerdo vai a **Authentication** → **Users**
2. Clica **Add user** → **Create new user**
3. Preenche o teu email e uma password (vai ser o teu login na app)
4. Clica **Create user**

---

## Passo 4 — Copiar as credenciais para o código

1. No menu esquerdo vai a **Project Settings** → **API**
2. Copia:
   - **Project URL** (ex: `https://abcdefgh.supabase.co`)
   - **anon public** key (chave longa que começa com `eyJ...`)

3. Abre o ficheiro **`js/config.js`** e substitui os valores:

```js
const SUPABASE_URL      = 'https://abcdefgh.supabase.co';   // ← a tua URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJI...';               // ← a tua chave anon
```

---

## Passo 5 — Testar

1. Abre o `index.html` no browser
2. Deverá aparecer o ecrã de login
3. Entra com o email/password que criaste no Passo 3
4. A app carrega normalmente — agora os dados estão na cloud!

**No telemóvel:** abre o mesmo `index.html` (ou publica no GitHub Pages) e faz login com as mesmas credenciais. Os dados sincronizam automaticamente.

---

## Notas

- A chave **anon** é pública (não é segredo) — é o comportamento normal do Supabase
- O acesso aos dados é protegido por **Row Level Security** — só utilizadores autenticados acedem
- O plano **Free** do Supabase inclui 500MB de BD e 2GB de transferência/mês — mais que suficiente
- Se ficares inativo 7 dias, o projeto pausa sozinho (basta reactivar em supabase.com)
