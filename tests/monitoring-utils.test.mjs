
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeText, scanCall } from '../src/monitoring-utils.js';

test('normaliza acentos e caixa para comparar expressões',()=>{
  assert.equal(normalizeText('NÃO precisa LER'), 'nao precisa ler');
});
test('não gera alertas quando a ligação não tem transcrição',()=>{
  assert.deepEqual(scanCall({idLigacao:12,usuarioOperador:'Operador A'}),[]);
});
test('identifica expressão de risco e mantém contexto para revisão humana',()=>{
  const transcript='Bom dia. Não precisa ler o contrato, pode confirmar logo. Obrigado.';
  const findings=scanCall({idLigacao:12,usuarioOperador:'Operador A',transcript});
  assert.ok(findings.some(x=>x.word==='não precisa ler'));
  assert.equal(findings[0].callId,'12');
  assert.equal(findings[0].operator,'Operador A');
  assert.ok(findings[0].context.includes('contrato'));
});
test('não considera resultado Argus como prova de irregularidade',()=>{
  // A função só procura frases na transcrição; sem texto, resultado sozinho não gera achado.
  assert.deepEqual(scanCall({idLigacao:13,resultadoLigacao:'ATENDIMENTO'}),[]);
});
