
// Compatibilidade com o endpoint antigo; a implementação principal fica em argus-list-detailed-calls.
import { handler as detailedHandler } from './argus-list-detailed-calls.mjs';
export async function handler(event) {
  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode:400, headers:{'content-type':'application/json'}, body:JSON.stringify({error:'JSON inválido.'}) }; }
    const params = new URLSearchParams();
    for (const [k,v] of Object.entries(body)) if (v !== undefined && v !== null) params.set(k,String(v));
    return detailedHandler({ ...event, httpMethod:'GET', queryStringParameters:Object.fromEntries(params.entries()) });
  }
  return detailedHandler(event);
}
