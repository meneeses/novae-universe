# DevUniverse API

Backend Node.js com Fastify para cadastrar planetas de desenvolvedores a partir
de dados públicos do GitHub.

## Requisitos

- Node.js 20 ou superior
- Projeto Supabase
- Token do GitHub opcional

## Configuração

1. Execute `supabase/schema.sql` no SQL Editor do Supabase.
2. Copie `.env.example` para `.env` e preencha as variáveis.
3. Instale e inicie a API:

```bash
npm install
npm run dev
```

A API inicia em `http://localhost:3333` por padrão.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `PORT` | Não | Porta HTTP, padrão `3333` |
| `JWT_SECRET` | Sim | Segredo forte usado para assinar JWTs |
| `SUPABASE_URL` | Sim | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Chave server-side com permissão de escrita |
| `GITHUB_TOKEN` | Não | Aumenta o limite de requisições da API GitHub |
| `FRONTEND_URL` | Produção | Única origem aceita pelo CORS; local usa `http://localhost:5173` |

Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` no frontend ou em variáveis públicas
do build. O frontend também deve acessar o GitHub exclusivamente por
`GET /github/:username`.

## Rotas

| Método | Rota | Autenticação | Descrição |
| --- | --- | --- | --- |
| `GET` | `/health` | Pública | Health check para deploy e monitoramento |
| `POST` | `/auth/login` | Pública | Valida o usuário no GitHub, cria o planeta se necessário e retorna `{ token }` |
| `GET` | `/planets` | Pública | Lista os campos públicos dos planetas |
| `GET` | `/planets/:username` | Pública | Retorna o registro completo de um planeta |
| `POST` | `/planets/register` | JWT Bearer | Atualiza ou registra o planeta do usuário autenticado |
| `GET` | `/github/:username` | Pública | Proxy para perfil e repositórios do GitHub |

Exemplo de cadastro autenticado:

```bash
curl -X POST http://localhost:3333/planets/register \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"octocat"}'
```

`POST /auth/login` é a única exceção à exigência de JWT para rotas que podem
modificar dados, porque é o endpoint responsável por emitir o primeiro token.
Todas as rotas possuem validação JSON Schema nativa do Fastify. O rate limiter
global permite no máximo 30 requisições por minuto por IP.

## Segurança

- A chave `service_role` só é carregada pelo client server-side em
  `src/db/supabase.js`.
- RLS permite leitura pública e não cria políticas de escrita para clientes.
- Escritas explícitas exigem JWT e conferem a identidade do usuário.
- Helmet adiciona headers HTTP de segurança.
- CORS aceita apenas `FRONTEND_URL` ou a origem local padrão.
- Inputs rejeitam propriedades extras e validam o formato do username.

Em produção, use um `JWT_SECRET` aleatório e longo, HTTPS e configure
corretamente o proxy antes de alterar a opção `trustProxy`.

O fluxo solicitado de login por `username` apenas confirma que a conta existe;
ele não comprova que o cliente controla essa conta GitHub. Antes de usar a API
com dados privados ou permissões por identidade, substitua esse fluxo por
GitHub OAuth e emita o JWT somente após validar o callback do provedor.
