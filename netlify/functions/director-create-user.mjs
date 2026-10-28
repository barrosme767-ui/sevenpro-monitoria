import { createClient } from '@supabase/supabase-js';
const json = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify(body) });
const roles = new Set(['director', 'manager', 'supervisor']);
export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Método não permitido.' });
  const auth = event.headers.authorization || event.headers.Authorization;
  if (!auth?.startsWith('Bearer ')) return json(401, { error: 'Autenticação necessária.' });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return json(503, { error: 'Serviço de autenticação não configurado.' });
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data: { user: actor }, error: authError } = await supabase.auth.getUser(auth.slice(7));
    if (authError || !actor) return json(401, { error: 'Sessão inválida.' });
    const { data: actorProfile, error: actorProfileError } = await supabase.from('profiles').select('role, active').eq('id', actor.id).single();
    if (actorProfileError || actorProfile?.role !== 'director' || !actorProfile.active) return json(403, { error: 'Somente a Diretoria pode criar usuários.' });
    const input = JSON.parse(event.body || '{}');
    const email = String(input.email || '').trim().toLowerCase();
    const displayName = String(input.display_name || '').trim().slice(0, 100);
    const role = String(input.role || '');
    const managerId = input.manager_id || null;
    const supervisorId = input.supervisor_id || null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !displayName || !roles.has(role)) return json(400, { error: 'Informe nome, e-mail válido e cargo permitido.' });
    if (role === 'director' && input.confirm_create_director !== true) return json(400, { error: 'Confirmação explícita necessária para criar outra conta de Diretoria.' });
    if (role === 'manager' && supervisorId) return json(400, { error: 'Gerentes não podem ter supervisor pai.' });
    if (role === 'supervisor' && !managerId) return json(400, { error: 'Vincule o supervisor a um gerente.' });
    if (managerId) {
      const { data: m } = await supabase.from('profiles').select('id, role, active').eq('id', managerId).single();
      if (!m || m.role !== 'manager' || !m.active) return json(400, { error: 'Gerente vinculado inválido.' });
    }
    const { data: created, error: createError } = await supabase.auth.admin.inviteUserByEmail(email, { data: { display_name: displayName } });
    if (createError || !created.user) return json(400, { error: 'Não foi possível convidar esse e-mail. Verifique se já existe uma conta e se o envio de e-mail está configurado.' });
    const { error: profileError } = await supabase.from('profiles').insert({ id: created.user.id, display_name: displayName, role, manager_id: managerId, supervisor_id: supervisorId, active: true, created_by: actor.id });
    if (profileError) {
      await supabase.auth.admin.deleteUser(created.user.id);
      console.error('profile insert failed after invite', profileError.message);
      return json(500, { error: 'A conta não pôde ser concluída. Nenhum usuário foi mantido ativo.' });
    }
    await supabase.from('audit_logs').insert({ actor_id: actor.id, action: 'user.invited', target_user_id: created.user.id, details: { role } });
    return json(201, { success: true, message: 'Convite enviado. O usuário deverá definir a própria senha pelo link recebido.' });
  } catch (error) {
    console.error('director-create-user error', error?.message || 'unknown');
    return json(500, { error: 'Falha interna ao criar usuário.' });
  }
}
