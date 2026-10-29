
import { createClient } from '@supabase/supabase-js';
export const json = (statusCode, body, extraHeaders = {}) => ({
  statusCode,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extraHeaders },
  body: JSON.stringify(body)
});
export async function authorizeDirector(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization;
  if (!auth?.startsWith('Bearer ')) return { response: json(401, { error: 'Autenticação necessária.' }) };
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { response: json(503, { error: 'Supabase de servidor não configurado. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.' }) };
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error } = await supabase.auth.getUser(auth.slice(7));
  if (error || !user) return { response: json(401, { error: 'Sessão inválida ou expirada.' }) };
  const { data: profile, error: profileError } = await supabase.from('profiles').select('role, active').eq('id', user.id).single();
  if (profileError || !profile?.active) return { response: json(403, { error: 'Perfil inexistente ou desativado.' }) };
  if (profile.role !== 'director') return { response: json(403, { error: 'Esta operação exige perfil de Diretoria.' }) };
  return { supabase, user, profile };
}
export function argusConfig() {
  const base = (process.env.ARGUS_API_URL || 'https://argus.app.br/apiargus').replace(/\/+$/, '');
  const token = process.env.ARGUS_TOKEN_SIGNATURE || process.env.ARGUS_API_TOKEN;
  if (!token) return { error: 'Configure ARGUS_TOKEN_SIGNATURE nas variáveis de ambiente do Netlify.' };
  return { base, token };
}
export async function argusPost(path, payload, timeoutMs = 30000) {
  const cfg = argusConfig();
  if (cfg.error) throw new Error(cfg.error);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${cfg.base}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'Token-Signature': cfg.token },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const text = await response.text();
    if (!response.ok) {
      const err = new Error(`Argus respondeu HTTP ${response.status}.`);
      err.status = response.status;
      err.detail = text.slice(0, 500);
      throw err;
    }
    let data;
    try { data = JSON.parse(text); } catch { throw new Error('O Argus retornou conteúdo que não é JSON.'); }
    if (data?.codStatus !== undefined && Number(data.codStatus) < 1) throw new Error(data.descStatus || 'O Argus recusou a consulta.');
    return data;
  } finally { clearTimeout(timer); }
}
