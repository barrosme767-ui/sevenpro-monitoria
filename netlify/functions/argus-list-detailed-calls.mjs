
import { json, authorizeDirector, argusPost } from './_shared.mjs';
const validDate = v => typeof v === 'string' && !Number.isNaN(Date.parse(v));
const getRows = d => d?.ligacoesDetalhadas ?? d?.ligacoes ?? d?.retornoLigacoesItens ?? d?.data?.ligacoesDetalhadas ?? d?.data?.ligacoes ?? [];
export async function handler(event) {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Método não permitido.' }, { allow: 'GET' });
  const auth = await authorizeDirector(event); if (auth.response) return auth.response;
  const q = event.queryStringParameters || {};
  const campaign = Number(q.idCampanha || process.env.ARGUS_CAMPAIGN_ID || 1);
  const start = q.periodoInicial, end = q.periodoFinal;
  if (!Number.isInteger(campaign) || campaign < 1) return json(400,{error:'idCampanha inválido.'});
  if (!validDate(start) || !validDate(end) || new Date(end) <= new Date(start)) return json(400,{error:'Informe período inicial e final válidos.'});
  if (new Date(end)-new Date(start) > 7*86400000) return json(400,{error:'Consulte no máximo 7 dias por vez.'});
  const payload = { idCampanha: campaign, periodoInicial: start, periodoFinal: end };
  for (const k of ['idGrupoUsuario','idLote','nrLead','idUsuario','idStatusLigacao','idTabulacao']) {
    if (q[k] !== undefined && q[k] !== '') { const n=Number(q[k]); if(!Number.isInteger(n)||n<0)return json(400,{error:`Filtro ${k} inválido.`}); payload[k]=n; }
  }
  try {
    let all=[], pages=0, last=null, endOfTable=false;
    while (pages < 20) {
      const data = await argusPost('/report/ligacoesdetalhadas', payload);
      const rows = getRows(data);
      if (!Array.isArray(rows)) throw new Error('O relatório do Argus não trouxe uma lista de ligações reconhecida.');
      all.push(...rows); pages++;
      endOfTable = data.endOfTable === true || Number(data.idProxPagina || 0) === 0;
      last = data.idProxPagina ?? null;
      if (endOfTable || rows.length === 0 || !last) break;
      payload.ultimoId = Number(last);
    }
    const unique = new Map();
    for (const row of all) {
      const id = row.idLigacao ?? row.argus_call_id ?? `${row.dataHoraLigacao}|${row.usuarioOperador}|${row.nrLead}`;
      unique.set(String(id), row);
    }
    const calls = [...unique.values()];
    return json(200, { success:true, data:calls, meta:{campaign, start, end, pages, count:calls.length, endOfTable, nextPage:last, capped:pages>=20&&!endOfTable} });
  } catch (e) {
    console.error('argus-list-detailed-calls:', e.message);
    return json(e.name==='AbortError'?504:502,{error:e.message||'Falha ao consultar Argus.', detail:e.detail});
  }
}
