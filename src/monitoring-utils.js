export function normalizeText(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
export const RULES=[
 {category:'Ameaça ao beneficiário',severity:'Crítica',words:['bloquear benefício','cancelar benefício','cortar aposentadoria','suspender pagamento','perder o benefício','ficar sem receber','bloquear aposentadoria','cancelar pensão','ameaçar o beneficiário','vai perder o benefício']},
 {category:'Ocultação de informações',severity:'Alta',words:['não precisa ler','não fale dos juros','não mencione as taxas','esconder o custo','omitir informações','não precisa falar do contrato','não explique o refinanciamento','não informe o valor total','esconder parcelas','omitir condições','dizer que é gratuito quando não é','esconder os juros','não precisa explicar']},
 {category:'Falta de consentimento',severity:'Crítica',words:['sem autorização','sem consentimento','contratar sem autorização','falsificar assinatura','portabilidade sem autorização','não precisa autorizar']},
 {category:'Abuso verbal',severity:'Alta',words:['cala a boca','burro','incompetente','ignorante','ofender o cliente','humilhar o beneficiário','gritar com o cliente','xingamento','deboche','intimidação']},
 {category:'Coação comercial',severity:'Alta',words:['não tem escolha','obrigatório contratar','tem que aceitar','agora ou nunca','confirma agora ou perde']},
 {category:'Falsa identidade / segurança',severity:'Crítica',words:['sou do inss, sem ser','pedir senha bancária','falsa identidade']}
];
const getCallId = c => String(c.idLigacao??c.argus_call_id??c.id??'');
const getOperator = c => c.usuarioOperador??c.nomeUsuario??c.operator_name??'Não identificado';
export function scanCall(c){const transcript=c.transcript??c.transcricao??c.transcrição??'';if(!transcript)return [];const norm=normalizeText(transcript);const out=[];for(const r of RULES)for(const w of r.words){const at=norm.indexOf(normalizeText(w));if(at>=0){const start=Math.max(0,at-90),end=Math.min(transcript.length,at+w.length+100);out.push({category:r.category,severity:r.severity,word:w,context:transcript.slice(start,end),callId:getCallId(c),operator:getOperator(c)});}}return out}
