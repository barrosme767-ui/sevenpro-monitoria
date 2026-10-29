# SEVENPRO MONITORIA — ME7

Aplicação React + Vite publicada no Netlify, com autenticação/persistência no Supabase e consultas de ligações/gravações via API do Argus.

## O que esta versão implementa

- Consulta de ligações reais pelo relatório `POST /report/ligacoesdetalhadas`.
- Paginação pelo `idProxPagina`/`ultimoId`, deduplicação por `idLigacao` e aviso quando o limite defensivo de páginas é alcançado.
- Filtros por período, operador, resultado, texto e situação da avaliação.
- Detalhes da ligação e tentativa de reprodução MP3 pela API `POST /cmd/downloadgravacao`.
- Avaliações humanas persistidas na tabela `monitoring_reviews`.
- Painéis de volume, atendimentos, operadores, avaliações e exportação CSV.
- Detecção preliminar de palavras/frases em transcrições que já estejam presentes nos dados. Cada correspondência é um alerta para revisão, não uma conclusão automática.
- Token Argus e chave de serviço Supabase mantidos apenas nas funções de servidor.

## Requisitos

- Node.js 20 ou superior recomendado.
- Projeto Supabase com Auth e perfil de usuário em `public.profiles`.
- Conta Argus com token de API e permissão de relatório/gravação.
- Site Netlify com Functions habilitadas.

## Configuração local

1. Extraia o ZIP e entre na pasta `sevenpro-monitoria-main`.
2. Instale as dependências:

   ```bash
   npm install
   ```

3. Copie `.env.example` para `.env` e preencha:

   ```env
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=CHAVE_ANON_PUBLICA

   SUPABASE_URL=https://SEU-PROJETO.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=CHAVE_SERVICE_ROLE_PRIVADA
   ARGUS_API_URL=https://argus.app.br/apiargus
   ARGUS_TOKEN_SIGNATURE=TOKEN_DA_API_ARGUS
   ARGUS_CAMPAIGN_ID=1
   ```

4. Execute o ambiente local:

   ```bash
   npm run dev
   ```

   Para testar as Netlify Functions localmente, instale a CLI da Netlify e use `netlify dev`. O Vite sozinho não executa funções em `netlify/functions`.

## Configuração no Supabase

1. Faça backup do projeto antes de aplicar SQL.
2. Abra o SQL Editor do Supabase.
3. Confira se as tabelas/funções existentes `profiles`, `call_records` e `public.current_profile_role()` já estão instaladas. O SQL original de monitoria depende de partes dessa estrutura.
4. Execute `supabase/schema.sql` no projeto existente após revisar a migração. O script adiciona as categorias/regras e a tabela `monitoring_reviews`; não apague nem recrie tabelas de produção.
5. A tabela `profiles` precisa conter pelo menos `id`, `display_name`, `role` e `active`. A função administrativa espera o cargo `director`.
6. Habilite RLS e confira as políticas antes de colocar o sistema em produção.

A tabela `monitoring_reviews` salva avaliação, nota, critérios, observações, campanha, ligação, avaliador e data. A chave única `(campaign_id, argus_call_id)` permite atualizar uma avaliação existente sem criar cópias.

## Variáveis no Netlify

Em **Site configuration → Environment variables**, configure as mesmas variáveis acima. Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` ou `ARGUS_TOKEN_SIGNATURE` em variáveis com prefixo `VITE_`, no código React, ou no GitHub.

- `VITE_SUPABASE_URL`: URL pública do projeto Supabase.
- `VITE_SUPABASE_ANON_KEY`: chave pública anon do Supabase (proteger tabelas com RLS).
- `SUPABASE_URL`: URL usada pelas funções do servidor.
- `SUPABASE_SERVICE_ROLE_KEY`: chave privada para validar sessão/perfil no servidor.
- `ARGUS_API_URL`: base da API, normalmente `https://argus.app.br/apiargus`.
- `ARGUS_TOKEN_SIGNATURE`: token enviado no cabeçalho HTTP `Token-Signature`.
- `ARGUS_CAMPAIGN_ID`: ID da campanha padrão, no exemplo `1` (ME7 MATRIZ conforme documentação fornecida).

Depois de alterar variáveis, faça novo deploy para garantir que as funções usem os valores atualizados.

## Publicação no GitHub e Netlify

1. Envie o conteúdo da pasta para o repositório GitHub existente, preservando os arquivos de configuração e migrations anteriores.
2. No Netlify, conecte o repositório e configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
3. Configure todas as variáveis de ambiente antes de publicar.
4. Faça deploy e teste login, consulta Argus, gravação de áudio e salvamento de avaliação com uma conta autorizada.

## Endpoints de servidor usados

- `GET /.netlify/functions/argus-list-campaigns`
- `GET /.netlify/functions/argus-list-detailed-calls?idCampanha=1&periodoInicial=...&periodoFinal=...`
- `GET /.netlify/functions/argus-list-recordings?idCampanha=1&nrLead=...` (usar exatamente um filtro aceito)
- `GET /.netlify/functions/argus-download-recording?idCampanha=1&idLigacao=123&formato=MP3`

Todas as funções de consulta acima exigem sessão válida e perfil `director`. O servidor faz chamadas à API com o cabeçalho `Token-Signature`.

## Limitações que precisam ser conhecidas

- **Áudio:** só será reproduzido se a gravação existir no Argus, o token tiver permissão e o Argus devolver o arquivo em Base64. A aplicação não inventa áudio.
- **Transcrição/IA:** a documentação recebida descreve download de gravação, mas não comprova um endpoint de transcrição. A detecção de palavras-chave funciona apenas em texto de transcrição que já venha nos dados. Para análise automática de áudio, configure um serviço de transcrição/IA e revise seus requisitos de privacidade e retenção.
- **Completude do relatório:** a função pagina pelo `idProxPagina` até o fim, sem ultrapassar 20 páginas por requisição. Se `meta.capped` for `true`, consulte intervalos menores para completar o período. O limite histórico de 15.000 registros por página precisa ser confirmado em um período real de alto volume.
- **Credenciais:** não foram fornecidas credenciais de produção nesta entrega; portanto, não é possível afirmar que o Argus/Supabase real respondeu durante a compilação deste pacote.
- **Campanhas:** a interface mostra a campanha ME7 MATRIZ (ID 1) conforme documentação recebida. Ajuste `ARGUS_CAMPAIGN_ID` e o seletor se a operação precisar alternar entre várias campanhas.

## Verificações

Com dependências instaladas:

```bash
npm install
npm test
npm run build
```

Os testes automatizados `npm test` cobrem normalização de texto, ausência de transcrição, captura de contexto e evitam tratar o resultado do discador como prova de irregularidade. Eles não substituem os testes de integração com credenciais reais.

Teste também em um ambiente de homologação:
- Login válido e inválido.
- Perfil ativo/inativo e acesso negado para perfil não autorizado.
- Consulta com período válido/inválido.
- Paginação e deduplicação.
- Ligação sem gravação e ligação com áudio disponível.
- Salvar avaliação, atualizar a página e confirmar que a avaliação persiste.
- Revisar políticas RLS e acesso de usuários não-diretoria.

Não execute testes destrutivos na base de produção. Faça backup antes de aplicar SQL.
