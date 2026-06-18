// ─── SUPABASE DB WRAPPER ──────────────────────────────────────────────────────
// Substitui localStorage por Supabase. O app funciona igual mas sincroniza
// entre Mac e telemóvel em tempo real.
// Todos os dados ficam em cache em memória para que o app seja síncrono.

const DB_KEYS = {
  RESULTADOS:   "resultados",
  MATAMATA:     "matamata",
  GS_OVERRIDES: "gs_overrides",
  KO_PREDS:     "ko_preds",
};

let _sb        = null;   // cliente Supabase
let _dbUser    = null;   // utilizador autenticado
let _cache     = {};     // cache em memória (para leituras síncronas)
let _channel   = null;   // canal realtime

// ─── Inicializar cliente ──────────────────────────────────────────────────────
async function dbInit() {
  const configured = SUPABASE_URL && !SUPABASE_URL.includes("XXXXX");
  if (!configured) {
    console.warn("[DB] Supabase não configurado — a usar localStorage como fallback");
    _sb = null;
    return null;
  }
  _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { session } } = await _sb.auth.getSession();
  _dbUser = session?.user || null;
  return _dbUser;
}

// ─── Login / Logout ───────────────────────────────────────────────────────────
async function dbLogin(email, password) {
  const { data, error } = await _sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  _dbUser = data.user;
  return _dbUser;
}

async function dbLogout() {
  if (_sb) await _sb.auth.signOut();
  _dbUser  = null;
  _cache   = {};
  if (_channel) { _sb.removeChannel(_channel); _channel = null; }
}

// ─── Carregar todos os dados ──────────────────────────────────────────────────
async function dbLoadAll() {
  if (!_sb || !_dbUser) return;
  const { data, error } = await _sb.from("app_state").select("key, data");
  if (error) { console.error("[DB] Erro ao carregar dados:", error); return; }
  data.forEach(row => { _cache[row.key] = row.data; });

  // Realtime: actualiza cache quando outro dispositivo escrever
  _channel = _sb.channel("app_state_changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "app_state" }, payload => {
      const row = payload.new;
      if (!row) return;
      _cache[row.key] = row.data;
      // Refrescar o ecrã silenciosamente
      try { renderTab(activeTab); } catch {}
    })
    .subscribe();
}

// ─── Leitura síncrona (da cache) ─────────────────────────────────────────────
function dbGet(key) {
  if (_sb && _dbUser) {
    return _cache[key] ?? null;
  }
  // Fallback localStorage
  try {
    const v = localStorage.getItem("predictor_" + key + "_2026");
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}

// ─── Escrita (cache + Supabase async) ────────────────────────────────────────
function dbSet(key, value) {
  _cache[key] = value;
  if (_sb && _dbUser) {
    _sb.from("app_state")
      .upsert({ key, data: value, updated_at: new Date().toISOString() })
      .then(({ error }) => { if (error) console.error("[DB] Erro ao guardar:", key, error); });
  } else {
    // Fallback localStorage
    try { localStorage.setItem("predictor_" + key + "_2026", JSON.stringify(value)); } catch {}
  }
}

// ─── Remover ─────────────────────────────────────────────────────────────────
function dbRemove(key) {
  delete _cache[key];
  if (_sb && _dbUser) {
    _sb.from("app_state").delete().eq("key", key)
      .then(({ error }) => { if (error) console.error("[DB] Erro ao apagar:", key, error); });
  } else {
    try { localStorage.removeItem("predictor_" + key + "_2026"); } catch {}
  }
}

// ─── Helpers para a UI ────────────────────────────────────────────────────────
function dbIsConfigured() {
  return SUPABASE_URL && !SUPABASE_URL.includes("XXXXX");
}
function dbCurrentUser() { return _dbUser; }
