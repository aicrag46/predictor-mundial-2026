#!/usr/bin/env node
/** Gera data-public.js (sem prognósticos) + prognosticos.json para upload Supabase */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
eval(fs.readFileSync(path.join(root, "js/data.js"), "utf8"));

const { prognosticos, ...publicData } = DADOS;
publicData.prognosticos = {};

const outPublic = `/* Gerado por scripts/split-data.js — NÃO editar manualmente */\nvar DADOS = ${JSON.stringify(publicData, null, 2)};\n`;
fs.writeFileSync(path.join(root, "js/data-public.js"), outPublic, "utf8");
fs.writeFileSync(path.join(root, "prognosticos.json"), JSON.stringify(prognosticos), "utf8");
console.log("✅ js/data-public.js (sem prognósticos)");
console.log("✅ prognosticos.json (" + Object.keys(prognosticos).length + " jogadores)");
