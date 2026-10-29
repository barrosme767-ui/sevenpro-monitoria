-- SEVENPRO MONITORIA
-- Regras configuráveis de monitoria e ocorrências identificadas.

create table if not exists public.monitoring_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  severity text not null
    check (severity in ('critical', 'high', 'medium', 'low')),
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.monitoring_rules (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null
    references public.monitoring_categories(id) on delete restrict,
  rule_type text not null
    check (rule_type in ('keyword', 'phrase', 'behavior')),
  expression text not null,
  normalized_expression text not null,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, rule_type, normalized_expression)
);

create table if not exists public.monitoring_findings (
  id uuid primary key default gen_random_uuid(),
  call_record_id uuid not null
    references public.call_records(id) on delete cascade,
  rule_id uuid references public.monitoring_rules(id) on delete set null,
  category_id uuid
    references public.monitoring_categories(id) on delete set null,
  detected_text text not null,
  context_text text,
  timestamp_seconds integer
    check (timestamp_seconds is null or timestamp_seconds >= 0),
  severity text not null
    check (severity in ('critical', 'high', 'medium', 'low')),
  detection_method text not null default 'keyword'
    check (detection_method in ('keyword', 'ai', 'human')),
  review_status text not null default 'pending'
    check (review_status in (
      'pending',
      'confirmed',
      'dismissed'
    )),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now()
);

create index if not exists monitoring_rules_category_idx
  on public.monitoring_rules(category_id, active);

create index if not exists monitoring_findings_call_idx
  on public.monitoring_findings(call_record_id);

create index if not exists monitoring_findings_status_idx
  on public.monitoring_findings(review_status, severity, created_at desc);

create index if not exists monitoring_findings_category_idx
  on public.monitoring_findings(category_id, created_at desc);

drop trigger if exists monitoring_categories_set_updated_at
  on public.monitoring_categories;

create trigger monitoring_categories_set_updated_at
before update on public.monitoring_categories
for each row execute function public.set_updated_at();

drop trigger if exists monitoring_rules_set_updated_at
  on public.monitoring_rules;

create trigger monitoring_rules_set_updated_at
before update on public.monitoring_rules
for each row execute function public.set_updated_at();

alter table public.monitoring_categories enable row level security;
alter table public.monitoring_rules enable row level security;
alter table public.monitoring_findings enable row level security;

-- Apenas a Diretoria pode consultar e administrar as regras.
drop policy if exists monitoring_categories_director
  on public.monitoring_categories;

create policy monitoring_categories_director
on public.monitoring_categories
for all to authenticated
using (public.current_profile_role() = 'director')
with check (public.current_profile_role() = 'director');

drop policy if exists monitoring_rules_director
  on public.monitoring_rules;

create policy monitoring_rules_director
on public.monitoring_rules
for all to authenticated
using (public.current_profile_role() = 'director')
with check (public.current_profile_role() = 'director');

-- A ocorrência só pode ser consultada por quem pode consultar
-- a ligação correspondente.
drop policy if exists monitoring_findings_scoped_select
  on public.monitoring_findings;

create policy monitoring_findings_scoped_select
on public.monitoring_findings
for select to authenticated
using (
  public.current_profile_role() = 'director'
  or exists (
    select 1
    from public.call_records c
    where c.id = monitoring_findings.call_record_id
      and (
        (
          public.current_profile_role() = 'manager'
          and c.manager_id = auth.uid()
        )
        or
        (
          public.current_profile_role() = 'supervisor'
          and c.supervisor_id = auth.uid()
        )
      )
  )
);

-- Não permitir gravação direta das ocorrências pelo navegador.
-- A detecção e a revisão devem passar por funções de servidor
-- que validem a identidade e as permissões.

-- Categorias iniciais da monitoria.

insert into public.monitoring_categories
  (name, severity, description)
values
  (
    'Ameaça ao beneficiário',
    'critical',
    'Ameaças de bloqueio, cancelamento ou perda de benefício.'
  ),
  (
    'Coação comercial',
    'high',
    'Pressão indevida para contratar ou aceitar uma proposta.'
  ),
  (
    'Falsa promessa',
    'high',
    'Promessas de aprovação, liberação ou dinheiro garantido.'
  ),
  (
    'Falta de consentimento',
    'critical',
    'Indícios de contratação ou confirmação sem autorização.'
  ),
  (
    'Abuso verbal',
    'high',
    'Ofensas, humilhações ou tratamento desrespeitoso.'
  ),
  (
    'Pressão por urgência',
    'medium',
    'Pressão comercial baseada em urgência excessiva.'
  ),
  (
    'Ocultação de condições',
    'high',
    'Indícios de omissão de informações ou desestímulo à leitura.'
  ),
  (
    'Interrupção e agressividade',
    'high',
    'Interrupções repetidas, gritos ou agressividade verbal.'
  )
on conflict (name) do nothing;

-- Palavras-chave e frases iniciais.
-- A expressão normalizada é usada para evitar duplicidade.

with initial_rules(category_name, rule_type, expression) as (
  values
    ('Ameaça ao beneficiário', 'phrase', 'Vou bloquear o benefício do senhor'),
    ('Ameaça ao beneficiário', 'phrase', 'O senhor vai perder seu benefício'),
    ('Ameaça ao beneficiário', 'phrase', 'Se não fechar, vou cancelar'),
    ('Ameaça ao beneficiário', 'phrase', 'O senhor ficará sem receber'),
    ('Ameaça ao beneficiário', 'keyword', 'bloquear benefício'),
    ('Ameaça ao beneficiário', 'keyword', 'cancelar benefício'),
    ('Ameaça ao beneficiário', 'keyword', 'suspender pagamento'),
    ('Ameaça ao beneficiário', 'keyword', 'vai perder o benefício'),
    ('Ameaça ao beneficiário', 'keyword', 'ficará sem receber'),

    ('Coação comercial', 'phrase', 'É obrigatório contratar'),
    ('Coação comercial', 'phrase', 'É obrigatório fazer esse contrato'),
    ('Coação comercial', 'phrase', 'Não vou resolver se não fechar comigo'),
    ('Coação comercial', 'keyword', 'tem que aceitar'),
    ('Coação comercial', 'keyword', 'obrigatório fechar'),
    ('Coação comercial', 'keyword', 'não tem escolha'),

    ('Falsa promessa', 'phrase', 'O dinheiro está garantido'),
    ('Falsa promessa', 'keyword', 'dinheiro garantido'),
    ('Falsa promessa', 'keyword', 'aprovação garantida'),
    ('Falsa promessa', 'keyword', 'liberação certa'),

    ('Falta de consentimento', 'phrase', 'Não precisa da sua autorização'),
    ('Falta de consentimento', 'keyword', 'fazer sem autorização'),
    ('Falta de consentimento', 'keyword', 'confirmar pelo senhor'),
    ('Falta de consentimento', 'keyword', 'não precisa autorizar'),

    ('Abuso verbal', 'keyword', 'incompetente'),
    ('Abuso verbal', 'keyword', 'não entende'),
    ('Abuso verbal', 'keyword', 'cala a boca'),

    ('Pressão por urgência', 'phrase', 'Confirma agora ou perde a oportunidade'),
    ('Pressão por urgência', 'keyword', 'só hoje'),
    ('Pressão por urgência', 'keyword', 'agora ou nunca'),
    ('Pressão por urgência', 'keyword', 'última chance'),

    ('Ocultação de condições', 'phrase', 'Não precisa ler o contrato'),
    ('Ocultação de condições', 'keyword', 'não precisa ler'),
    ('Ocultação de condições', 'keyword', 'não vou explicar'),
    ('Ocultação de condições', 'keyword', 'não tem necessidade de informar')
)
insert into public.monitoring_rules
  (category_id, rule_type, expression, normalized_expression)
select
  c.id,
  r.rule_type,
  r.expression,
  lower(trim(r.expression))
from initial_rules r
join public.monitoring_categories c
  on c.name = r.category_name
on conflict (category_id, rule_type, normalized_expression)
do nothing;


-- Avaliações humanas da monitoria. Migração aditiva; não apaga dados existentes.
create table if not exists public.monitoring_reviews (
  id uuid primary key default gen_random_uuid(),
  argus_call_id text not null,
  campaign_id integer not null default 1,
  call_started_at timestamptz,
  operator_name text,
  outcome text not null default 'pending'
    check (outcome in ('approved','coaching','critical','pending')),
  score integer check (score is null or (score >= 0 and score <= 100)),
  criteria jsonb not null default '{}'::jsonb,
  notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, argus_call_id)
);
create index if not exists monitoring_reviews_operator_idx
  on public.monitoring_reviews(operator_name, reviewed_at desc);
create index if not exists monitoring_reviews_date_idx
  on public.monitoring_reviews(call_started_at desc);
alter table public.monitoring_reviews enable row level security;
drop policy if exists monitoring_reviews_director_all on public.monitoring_reviews;
create policy monitoring_reviews_director_all on public.monitoring_reviews
for all to authenticated
using (public.current_profile_role() = 'director')
with check (public.current_profile_role() = 'director');
