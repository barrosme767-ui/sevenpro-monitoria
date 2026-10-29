
import { json, authorizeDirector, argusPost } from './_shared.mjs';
export async function handler(event){
 if(event.httpMethod!=='GET')return json(405,{error:'Método não permitido.'},{allow:'GET'});
 const auth=await authorizeDirector(event);if(auth.response)return auth.response;
 try{return json(200,{data:await argusPost('/cmd/listarcampanhas',{ativo:'true'})})}
 catch(e){console.error('argus-list-campaigns:',e.message);return json(e.name==='AbortError'?504:502,{error:e.message||'Falha ao consultar campanhas.'})}
}
