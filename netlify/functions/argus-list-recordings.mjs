
import { json, authorizeDirector, argusPost } from './_shared.mjs';
export async function handler(event) {
  if (!['GET','POST'].includes(event.httpMethod)) return json(405,{error:'Método não permitido.'});
  const auth=await authorizeDirector(event); if(auth.response)return auth.response;
  let q=event.queryStringParameters||{};
  if(event.httpMethod==='POST'){try{q={...q,...JSON.parse(event.body||'{}')}}catch{return json(400,{error:'JSON inválido.'})}}
  const idCampanha=Number(q.idCampanha||process.env.ARGUS_CAMPAIGN_ID||1);
  if(!Number.isInteger(idCampanha)||idCampanha<1)return json(400,{error:'idCampanha inválido.'});
  const allowed=['nrLead','idSkill','codCliente','cpfCnpj','telefone'];
  const supplied=allowed.filter(k=>q[k]!==undefined&&String(q[k]).trim()!=='');
  if(supplied.length!==1)return json(400,{error:'Informe exatamente um filtro: nrLead, idSkill, codCliente, cpfCnpj ou telefone.'});
  const key=supplied[0], value=(key==='nrLead'||key==='idSkill')?Number(q[key]):String(q[key]).trim().slice(0,100);
  if((key==='nrLead'||key==='idSkill')&&(!Number.isInteger(value)||value<1))return json(400,{error:'Filtro numérico inválido.'});
  try { const data=await argusPost('/cmd/listargravacoes',{idCampanha,[key]:value}); return json(200,{data}); }
  catch(e){console.error('argus-list-recordings:',e.message);return json(e.name==='AbortError'?504:502,{error:e.message||'Falha ao listar gravações.'});}
}
