#!/usr/bin/env node
/** Upload prognosticos.json → Supabase app_state (correr 1x após login configurado) */
const fs = require("fs");
const path = require("path");

const url  = process.env.SUPABASE_URL;
const key  = process.env.SUPABASE_ANON_KEY;
const email = process.env.SUPABASE_EMAIL;
const pass  = process.env.SUPABASE_PASSWORD;

if (!url || !key || !email || !pass) {
  console.error("Define: SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_EMAIL SUPABASE_PASSWORD");
  process.exit(1);
}

const prognosticos = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "prognosticos.json"), "utf8")
);

(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(url, key);
  const { error: authErr } = await sb.auth.signInWithPassword({ email, password: pass });
  if (authErr) { console.error("Login:", authErr.message); process.exit(1); }

  const { error } = await sb.from("app_state").upsert({
    key: "prognosticos",
    data: prognosticos,
    updated_at: new Date().toISOString(),
  });
  if (error) { console.error(error); process.exit(1); }
  console.log("✅ Prognósticos enviados para Supabase (" + Object.keys(prognosticos).length + " jogadores)");
})();
