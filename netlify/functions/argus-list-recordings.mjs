import { createClient } from '@supabase/supabase-js';
const json = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify(body) });
export async function handler(event) {
  if (!['GET', 'POST'].includes(event.httpMethod)) return json(405, { error: 'Método não permitido.' });
  const auth = event.headers.authorization || event.headers.Authorization;
  if (!auth?.startsWith('Bearer ')) return json(401, { error: 'Autenticação necessária.' });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ARGUS_TOKEN_SIGNATURE) return json(503, { error: 'Integração não configurada no servidor.' });
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data: { user }, error: userError } = await supabase.auth.getUser(auth.slice(7));
    if (userError || !user) return json(401, { error: 'Sessão inválida.' });
    const { data: profile, error: profileError } = await supabase.from('profiles').select('role, active').eq('id', user.id).single();
    if (profileError || !profile?.active || profile.role !== 'director') return json(403, { error: 'Somente a Diretoria pode iniciar a importação global de gravações.' });
    const input = event.httpMethod === 'GET' ? event.queryStringParameters || {} : JSON.parse(event.body || '{}');
    const idCampanha = Number(input.idCampanha);
    if (!Number.isInteger(idCampanha) || idCampanha <= 0) return json(400, { error: 'Informe idCampanha válido.' });
    const payload = { idCampanha };
    const allowedFilters = ['nrLead', 'idSkill', 'codCliente', 'cpfCnpj', 'telefone'];
    const supplied = allowedFilters.filter(k => input[k] !== undefined && String(input[k]).trim() !== '');
    if (supplied.length > 1) return json(400, { error: 'Informe no máximo um filtro entre nrLead, idSkill, codCliente, cpfCnpj ou telefone.' });
    if (supplied.length) payload[supplied[0]] = ['nrLead', 'idSkill'].includes(supplied[0]) ? Number(input[supplied[0]]) : String(input[supplied[0]]).slice(0, 100);
    if (supplied.length && ['nrLead', 'idSkill'].includes(supplied[0]) && (!Number.isInteger(payload[supplied[0]]) || payload[supplied[0]] <= 0)) return json(400, { error: 'O filtro numérico deve ser um inteiro positivo.' });
    const upstream = await fetch('http://api.argus.app.br:24797/apiargus', { method: 'POST', headers: { 'content-type': 'application/json', 'Token-Signature': process.env.ARGUS_API_TOKEN }, body: JSON.stringify(payload) });
    if (!upstream.ok) return json(502, { error: 'Falha na consulta ao Argus.', upstreamStatus: upstream.status });
    const body = await upstream.text(); let parsed;
    try { parsed = JSON.parse(body); } catch { return json(502, { error: 'Resposta inválida recebida do Argus.' }); }
    return json(200, { data: parsed });
  } catch (error) {
    console.error('argus-list-recordings error', error?.message || 'unknown');
    return json(500, { error: 'Falha interna ao consultar gravações.' });
  }
}
