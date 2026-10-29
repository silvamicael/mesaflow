# MesaFlow — Backend

API local em JavaScript ES Modules, com Express 5, PostgreSQL, Sequelize 6 e migrations executadas pelo Umzug.

## Funcionalidades disponíveis

- Cadastro público de clientes com validação Zod.
- Senhas protegidas com bcrypt, custo 12 e limite de 72 bytes UTF-8.
- Login com JWT HS256, emissor e destinatário definidos.
- Sessões persistidas e revogação no logout.
- Verificação de conta ativa e papel no banco em cada requisição autenticada.
- Middleware RBAC e rota de verificação administrativa.
- Limites por IP: cadastro 10/15 minutos, login 20/15 minutos e API 1000/15 minutos.
- Helmet, CORS, limites de JSON e erros padronizados.
- Swagger UI e especificação OpenAPI.
- Migrations de usuários e sessões.
- Comando controlado para criação do administrador.

A configuração é de desenvolvimento/teste local. Produção, recuperação de senha, verificação de e-mail, gestão completa de usuários, refresh tokens e demais módulos do restaurante ainda não fazem parte desta entrega.

## Pré-requisitos

- Node.js 22 ou superior e npm.
- PostgreSQL 17 do Docker Compose da raiz em execução.
- Credenciais locais correspondentes ao banco inicializado.

## Instalação inicial

Comandos executados na raiz do repositório, em PowerShell:

```powershell
docker compose up -d --wait
Copy-Item backend/.env.example backend/.env
npm ci --prefix backend
npm run auth:setup --prefix backend
```

A cópia do exemplo é necessária apenas quando `backend/.env` ainda não existe. Em uma atualização, preservar o arquivo existente e acrescentar as variáveis necessárias.

Configurar `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD` em `backend/.env`. O `.env` da raiz configura o Docker; o `.env` do backend configura a API. A senha do backend deve corresponder à senha real do banco.

`auth:setup` gera `JWT_SECRET` aleatório de 32 bytes, representado por 64 caracteres hexadecimais, se ausente ou vazio. Um segredo existente é preservado. O comando também acrescenta `JWT_EXPIRES_SECONDS=3600` quando necessário. O segredo não é exibido no terminal nem versionado.

```powershell
npm test --prefix backend
npm run db:check --prefix backend
npm run db:status --prefix backend
npm run db:migrate --prefix backend
npm run db:status --prefix backend
npm run dev --prefix backend
```

Na primeira atualização desta base, existem duas migrations pendentes. Depois da execução, o resultado esperado é duas executadas e nenhuma pendente. Repetir `db:migrate` não reaplica migrations já registradas.

As migrations não são executadas automaticamente ao iniciar a API. Não é utilizado `sequelize.sync()`.

## Endereços locais

| Recurso | Endereço |
| --- | --- |
| API e banco | http://127.0.0.1:3001/api/health |
| Swagger UI | http://127.0.0.1:3001/api/docs/ |
| OpenAPI JSON | http://127.0.0.1:3001/api/docs.json |

## Variáveis adicionais de autenticação

| Variável | Descrição |
| --- | --- |
| `JWT_SECRET` | Segredo gerado pelo comando `auth:setup`; obrigatório |
| `JWT_EXPIRES_SECONDS` | Duração da sessão, padrão 3600; entre 60 e 86400 segundos |
| `ADMIN_NOME` | Nome do administrador; somente para `admin:create` |
| `ADMIN_EMAIL` | E-mail do administrador; somente para `admin:create` |
| `ADMIN_SENHA` | Senha definida pelo operador; somente para `admin:create` |

A alteração de `JWT_SECRET` invalida tokens assinados com o segredo anterior. A alteração do prazo afeta novos logins; não estende sessões existentes.

## Criação do administrador

Após executar as migrations, preencher temporariamente as variáveis `ADMIN_NOME`, `ADMIN_EMAIL` e `ADMIN_SENHA` em `backend/.env`. A senha deve ter pelo menos 10 caracteres e no máximo 72 bytes UTF-8.

```powershell
npm run admin:create --prefix backend
```

O comando não possui senha padrão. Se o e-mail já pertencer a um administrador ativo, preserva os dados e a senha. Se pertencer a um cliente, funcionário ou conta inativa, recusa a operação; não promove a conta nem redefine sua senha.

Remover `ADMIN_SENHA` do arquivo após a criação. As credenciais reais não devem aparecer em commits, documentação ou capturas de tela.

## Autenticação e Swagger

O cadastro usa `POST /api/auth/register` e cria exclusivamente clientes. O login usa `POST /api/auth/login` e retorna `token`, `token_type`, `expires_in` e os dados públicos do usuário.

Na interface Swagger, após o login, copiar somente o valor de `token` para o botão **Authorize**. A interface adiciona o prefixo Bearer. Para requisições HTTP externas, enviar:

```text
Authorization: Bearer <token>
```

`GET /api/auth/me` consulta o usuário atual. `POST /api/auth/logout` revoga somente a sessão atual e retorna 204 sem corpo. Reutilizar o token revogado retorna 401.

`GET /api/admin/status` é uma verificação de RBAC: clientes e funcionários recebem 403; administradores recebem 200. Não é um endpoint de gestão completa de usuários.

O token não é persistido pela interface Swagger ao recarregar. A futura interface deverá manter o token em memória nesta estratégia inicial; não há renovação automática de sessão nesta entrega.

## Organização

- `src/routes`: endpoints e composição de middlewares.
- `src/controllers`: tradução entre HTTP e serviços.
- `src/services`: regras de autenticação, hashes, JWT e sessões.
- `src/repositories`: consultas Sequelize.
- `src/models`: modelos e relacionamentos.
- `src/schemas`: validação Zod.
- `src/middlewares`: autenticação, autorização, validação e limites.
- `src/database/migrations`: evolução do banco.
- `src/docs`: contrato OpenAPI.
- `scripts`: preparação, migrations, testes de integração e criação administrativa.
- `tests`: testes automatizados sem banco externo.
- `integration`: cenários executados em banco isolado.

## Testes

```powershell
npm test --prefix backend
```

Os testes de configuração, regras e HTTP utilizam repositórios simulados e não alteram o banco da aplicação.

Para testar a integração com o PostgreSQL do Docker:

```powershell
npm run test:integration --prefix backend
```

Esse comando precisa de conexão com o banco e permissão `CREATEDB`, disponível no usuário de inicialização do Compose local. Cria um banco com nome aleatório iniciado por `mesaflow_test_`, aplica as migrations, executa os cenários e remove somente o banco temporário criado por aquela execução. Não limpa nem substitui o banco `mesaflow`.

Executar apenas no ambiente local. Uma interrupção forçada pode deixar o banco temporário para remoção posterior. O nome será informado se a limpeza falhar.

## Limites da implementação atual

- Rate limiting em memória, adequado a uma instância local; produção com múltiplas instâncias exige armazenamento compartilhado.
- Sem configuração de proxy confiável ou implantação pública nesta etapa.
- Login exige novo acesso ao expirar; sessões antigas não são automaticamente eliminadas da tabela.
- Cadastro pode retornar conflito de e-mail, mas login usa mensagem genérica para conta inexistente, senha incorreta e conta inativa.
- Contas de funcionários e inativação serão geridas pelo módulo administrativo futuro; não há endpoint público para isso.
- Usuário de inicialização do banco é de desenvolvimento; permissões mínimas e credenciais separadas de migrations serão tratadas na publicação.

## Versionamento

Versionar código, migrations, documentação, `.env.example` e `package-lock.json`. Não versionar `.env`, `node_modules`, JWTs ou dados reais.

A versão de pacote `0.1.0` permanece como versão em desenvolvimento. Não representa uma release estável ou tag Git publicada.
