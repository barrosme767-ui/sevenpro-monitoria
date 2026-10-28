import { createClient } from '@supabase/supabase-js';

const json = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify(body) });

export async function handler(event) {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Método não permitido.' });
  const auth = event.headers.authorization || event.headers.Authorization;
  if (!auth?.startsWith('Bearer ')) return json(401, { error: 'Autenticação necessária.' });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.ARGUS_API_TOKEN) return json(503, { error: 'Integração não configurada no servidor.' });
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const token = auth.slice(7);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return json(401, { error: 'Sessão inválida.' });
    const { data: profile, error: profileError } = await supabase.from('profiles').select('role, active').eq('id', user.id).single();
    if (profileError || !profile?.active || !['director'].includes(profile.role)) return json(403, { error: 'Somente a Diretoria pode consultar a configuração global da integração.' });
    const response = await fetch('https://argus.app.br/apiargus/cmd/listarcampanhas', { method: 'POST', headers: { 'content-type': 'application/json', 'Token-Signature': process.env.ARGUS_API_TOKEN }, body: JSON.stringify({ ativo: 'true' }) });
    const body = await response.text();
    if (!response.ok) return json(502, { error: 'O Argus não aceitou a solicitação.', upstreamStatus: response.status });
    let parsed; try { parsed = JSON.parse(body); } catch { return json(502, { error: 'Resposta inválida recebida do Argus.' }); }
    return json(200, { data: parsed });
  } catch (error) {
    console.error('argus-list-campaigns error', error?.message || 'unknown');
    return json(500, { error: 'Falha interna ao consultar campanhas.' });
  }
}
