# Autenticação e controle de acesso

## Escopo

O módulo implementa identidade de usuários, autenticação, sessões persistidas e autorização por perfil. Os papéis são `cliente`, `funcionario` e `admin`.

O cadastro público é limitado a clientes. O primeiro administrador é provisionado pelo comando local `admin:create`, sem credenciais predefinidas.

## Endpoints

| Método | Rota | Autorização | Resposta de sucesso |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Pública, com rate limit | 201 e usuário público |
| POST | `/api/auth/login` | Pública, com rate limit | 200 e token |
| GET | `/api/auth/me` | Sessão ativa | 200 e usuário público |
| POST | `/api/auth/logout` | Sessão ativa | 204 sem corpo |
| GET | `/api/admin/status` | Administrador | 200 |

A documentação interativa está em `/api/docs/`; o contrato está em `/api/docs.json`.

## Validação e proteção das credenciais

O nome é aparado e deve conter de 2 a 120 caracteres. E-mails são aparados, normalizados para minúsculas e validados. A unicidade também é protegida pelo índice no banco, incluindo tentativas concorrentes.

A senha possui no mínimo 10 caracteres e no máximo 72 bytes UTF-8, sem caractere NUL. Espaços da senha são preservados. O limite em bytes impede truncamento silencioso pelo bcrypt. O custo utilizado é 12.

O telefone é opcional e, quando informado, aceita de 10 a 15 dígitos, com `+` opcional no início. Não enviar uma string vazia para representar telefone ausente.

Campos desconhecidos são rejeitados. `papel`, `ativo` e `senha_hash` não são aceitos no cadastro público. As respostas utilizam uma lista explícita de campos públicos e nunca incluem hash ou senha.

## Sessões e JWT

Cada login válido cria uma linha em `sessoes`. O JWT contém o identificador do usuário em `sub`, o identificador da sessão em `sid`, além de emissão, expiração, emissor e destinatário.

A verificação aceita somente HS256, com emissor `mesaflow-api` e destinatário `mesaflow-client`. A cada requisição autenticada, a API verifica assinatura e prazo, consulta a sessão e confere usuário ativo, vínculo e revogação.

O papel é obtido do banco. Alterações de papel não dependem da emissão de um novo JWT. Logout revoga a sessão atual; outras sessões continuam válidas. Conta inativa perde acesso mesmo que seu JWT ainda não tenha expirado.

A duração padrão é uma hora. Não há refresh token nesta versão. O cliente deve autenticar novamente após expiração. A estratégia inicial é Bearer no cabeçalho, com token mantido em memória pela futura interface, sem autenticação automática por cookies.

## Banco de dados

Duas migrations criam `usuarios` e `sessoes`, incluindo:

- Unicidade de e-mail normalizado.
- Restrição dos valores de papel.
- Chave estrangeira entre sessão e usuário.
- Validação de expiração posterior à criação.
- Índices para usuário e expiração das sessões.

Cada migration aplica suas alterações em uma transação. O histórico é registrado em `sequelize_meta`. A inicialização da API não modifica o esquema automaticamente.

O login revalida o usuário sob bloqueio antes de persistir a sessão, evitando criar uma sessão a partir de uma leitura anterior se os dados já tiverem sido alterados.

## Erros

| HTTP | Situação |
| --- | --- |
| 400 | Corpo inválido ou campos não permitidos |
| 401 | Login inválido ou autenticação ausente/inválida |
| 403 | Usuário autenticado sem o perfil necessário |
| 409 | Conflito de e-mail no cadastro |
| 413 | Corpo acima do limite |
| 429 | Limite de requisições atingido |
| 503 | Banco indisponível |
| 500 | Falha interna inesperada |

O login não diferencia e-mail inexistente, senha incorreta e conta inativa. Hashes, tokens, senhas e detalhes internos do banco não são registrados nas mensagens de erro.

## Validação

Os testes sem banco externo cobrem validação de configuração, entrada, cadastro, hash, JWT, logout, conta inativa, sessões expiradas, RBAC e respostas HTTP. O teste de integração cria um banco temporário e cobre migrations, persistência, conflitos, restrições e rollback.

A criação administrativa é repetível e não altera credenciais existentes nem promove uma conta não administrativa com o mesmo e-mail.

Os testes não substituem a configuração de produção. O armazenamento compartilhado de rate limits, HTTPS, políticas de proxy, recuperação de senha, verificação de e-mail e a interface de gestão de usuários serão tratados nas etapas correspondentes.
