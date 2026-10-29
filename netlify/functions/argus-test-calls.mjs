
import { createClient } from '@supabase/supabase-js';

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'content-type': 'application/json',
    'cache-control': 'no-store'
  },
  body: JSON.stringify(body)
});

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Método não permitido.' });
  }

  const auth =
    event.headers.authorization ||
    event.headers.Authorization;

  if (!auth?.startsWith('Bearer ')) {
    return json(401, {
      error: 'Autenticação necessária.'
    });
  }

  const {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    ARGUS_TOKEN_SIGNATURE,
    ARGUS_API_URL
  } = process.env;

  if (
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY ||
    !ARGUS_TOKEN_SIGNATURE ||
    !ARGUS_API_URL
  ) {
    return json(503, {
      error: 'Integração não configurada no servidor.'
    });
  }

  try {
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false
        }
      }
    );

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser(
      auth.slice(7)
    );

    if (authError || !user) {
      return json(401, {
        error: 'Sessão inválida.'
      });
    }

    const { data: profile, error: profileError } =
      await supabase
        .from('profiles')
        .select('role, active')
        .eq('id', user.id)
        .single();

    if (
      profileError ||
      !profile?.active ||
      profile.role !== 'director'
    ) {
      return json(403, {
        error: 'Apenas a Diretoria pode executar este teste.'
      });
    }

    const params = event.queryStringParameters || {};

    const idCampanha = Number(
      params.idCampanha || 1
    );

    const horas = Number(
      params.horas || 1
    );

    if (
      !Number.isInteger(idCampanha) ||
      idCampanha <= 0
    ) {
      return json(400, {
        error: 'ID da campanha inválido.'
      });
    }

    if (
      !Number.isInteger(horas) ||
      horas < 1 ||
      horas > 168
    ) {
      return json(400, {
        error: 'Informe horas entre 1 e 168.'
      });
    }

    const fim = new Date();
    const inicio = new Date(
      fim.getTime() - horas * 60 * 60 * 1000
    );

    const payload = {
      idCampanha,
      periodoInicial: inicio.toISOString(),
      periodoFinal: fim.toISOString()
    };

 const baseUrl = String(ARGUS_API_URL).replace(/\/+$/, '');

    const controller = new AbortController();
let upstream;

const timeout = setTimeout(() => {
  controller.abort();
}, 25000);

try {
  upstream = await fetch(baseUrl + '/cmd/ligacoesdetalhadas', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'Token-Signature': ARGUS_TOKEN_SIGNATURE
    },
    body: JSON.stringify(payload),
    signal: controller.signal
  });
} finally {
  clearTimeout(timeout);
}
    const responseText = await upstream.text();

    if (!upstream.ok) {
      console.error(
        'Teste de ligações Argus:',
        upstream.status
      );

      return json(502, {
        error: 'O Argus recusou a consulta.',
        upstreamStatus: upstream.status
      });
    }

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      return json(502, {
        error: 'O Argus não retornou JSON válido.'
      });
    }

    if (
      data?.codStatus !== undefined &&
      Number(data.codStatus) < 1
    ) {
      return json(200, {
        sucesso: false,
        mensagem:
          data.descStatus ||
          'O Argus não conseguiu gerar o relatório.',
        codStatus: data.codStatus
      });
    }

    const colecoes = {};

function inspecionar(valor, caminho = 'data', nivel = 0) {
  if (nivel > 4 || valor == null) {
    return;
  }

  if (Array.isArray(valor)) {
    colecoes[caminho] = {
      tipo: 'array',
      quantidade: valor.length,
      camposPrimeiroRegistro:
        valor.length > 0 &&
        typeof valor[0] === 'object' &&
        valor[0] !== null
          ? Object.keys(valor[0])
          : []
    };

    return;
  }

  if (typeof valor === 'object') {
    for (const [chave, item] of Object.entries(valor)) {
      if (item && typeof item === 'object') {
        inspecionar(
          item,
          caminho + '.' + chave,
          nivel + 1
        );
      }
    }
  }
}


    inspecionar(data);

    return json(200, {
      sucesso: true,
      campanha: idCampanha,
      periodo: {
        inicial: payload.periodoInicial,
        final: payload.periodoFinal
      },
      statusArgus: data.codStatus ?? null,
      mensagemArgus: data.descStatus ?? null,
      estrutura: {
        camposRaiz:
          data && typeof data === 'object'
            ? Object.keys(data)
            : [],
        colecoes
      },
      respostaArgus: data
    });
  } catch (error) {
    console.error(
      'argus-test-calls error:',
      error?.name || 'Erro desconhecido'
    );

    if (error?.name === 'AbortError') {
      return json(504, {
        error: 'O Argus demorou demais para responder.'
      });
    }

    return json(500, {
      error: 'Falha interna ao testar as ligações.'
    });
  }
}
