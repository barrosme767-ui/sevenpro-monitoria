
import { json, authorizeDirector, argusPost } from './_shared.mjs';
export async function handler(event) {
  if(event.httpMethod!=='GET')return json(405,{error:'Método não permitido.'},{allow:'GET'});
  const auth=await authorizeDirector(event);if(auth.response)return auth.response;
  const q=event.queryStringParameters||{}, campaign=Number(q.idCampanha||process.env.ARGUS_CAMPAIGN_ID||1), id=Number(q.idLigacao);
  if(!Number.isInteger(campaign)||campaign<1||!Number.isInteger(id)||id<1)return json(400,{error:'Informe idCampanha e idLigacao válidos.'});
  const format=String(q.formato||'MP3').toUpperCase();if(!['MP3','WAV'].includes(format))return json(400,{error:'Formato deve ser MP3 ou WAV.'});
  try{
    const data=await argusPost('/cmd/downloadgravacao',{idCampanha:campaign,idLigacao:id,formato:format,preAtendimento:'N',opcaoCanais:1,base64:'S'},45000);
    const file=data.arquivoBase64||data.data?.arquivoBase64;
    if(!file)return json(404,{error:'O Argus não retornou áudio para esta ligação. Verifique se a gravação existe e se a campanha/ID estão corretos.'});
    return json(200,{success:true,nomeArquivo:data.nomeArquivo||`ligacao-${id}.${format.toLowerCase()}`,formato:data.formato||format,arquivoBase64:file});
  }catch(e){console.error('argus-download-recording:',e.message);return json(e.name==='AbortError'?504:502,{error:e.message||'Falha ao obter gravação.'});}
}
