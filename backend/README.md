# MesaFlow — Backend

Base local com Express 5, PostgreSQL e Sequelize 6, em JavaScript ES Modules.
Umzug executa migrations e registra as versões na tabela técnica `sequelize_meta`.

## Escopo atual

- Validação das variáveis de ambiente.
- Conexão PostgreSQL e encerramento do pool.
- Endpoint `GET /api/health`, com verificação do banco.
- Helmet, CORS e limite do corpo JSON.
- Respostas padronizadas para erros básicos e rotas inexistentes.
- Executor de migrations independente da inicialização da API.

Ainda não inclui autenticação, tabelas de negócio, Swagger, rate limiting ou
fluxos de restaurante. A configuração está restrita a desenvolvimento/teste
local; a preparação para produção será feita na etapa de publicação.

## Preparação no PowerShell

Pré-requisitos: Node.js 22 ou superior, npm e o PostgreSQL do Compose em execução.
Na raiz do repositório:

```powershell
docker compose up -d --wait
Copy-Item backend/.env.example backend/.env
```

Configure `backend/.env` com as credenciais do banco. O `.env` da raiz configura
o contêiner; `backend/.env` configura a API. `DB_PASSWORD` deve corresponder à
senha com que o PostgreSQL foi inicializado. Não sobrescreva um `.env` existente
sem preservar sua configuração.

```powershell
npm ci --prefix backend
npm test --prefix backend
npm run db:check --prefix backend
npm run db:status --prefix backend
npm run dev --prefix backend
```

A API fica em `http://127.0.0.1:3001`.

Os testes automatizados de configuração e HTTP não precisam do banco; a disponibilidade é simulada nos testes HTTP. `db:check` e `db:status` precisam.
O comando de status pode criar a tabela técnica de histórico, mas não cria
tabelas de negócio. Nenhuma migration de negócio acompanha esta etapa; o resultado
esperado é zero executadas e zero pendentes.

## Verificação manual

Em outro terminal:

```powershell
Invoke-RestMethod http://127.0.0.1:3001/api/health
```

Resposta HTTP 200:

```json
{ "status": "ok", "database": "connected" }
```

Se o banco ficar indisponível após a inicialização, a rota retorna HTTP 503.
Se o banco estiver indisponível ao iniciar, a API encerra com código de erro.
Uma rota desconhecida retorna HTTP 404 com o objeto `erro`.

## Migrations

Arquivos em `src/database/migrations/`, com nomes ordenados por timestamp e
exports `up({ context })` e `down({ context })`. `context` é o QueryInterface
Sequelize. Cada migration deve definir transações e restrições apropriadas.

```powershell
npm run db:status --prefix backend
npm run db:migrate --prefix backend
```

As migrations são executadas por um único processo de manutenção por vez.
A API não executa `sync()` nem aplica migrations automaticamente.
Rollback destrutivo não foi exposto como atalho nesta etapa.

## Versionamento

Versionar código, `.env.example` e `package-lock.json` incluído nesta base.
Não versionar `.env` ou `node_modules`. Instalações reproduzíveis devem utilizar `npm ci --prefix backend`.

A versão `0.1.0` identifica o pacote em desenvolvimento, não uma release estável
ou uma tag Git já publicada.
