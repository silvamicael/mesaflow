# MesaFlow

Sistema web de gestão para restaurantes, desenvolvido como Situação de
Aprendizagem (SA), com foco na integração entre reservas, atendimento,
pedidos e controle financeiro.

O projeto busca organizar o fluxo do restaurante desde a reserva do cliente
até o registro da venda e a identificação do garçom responsável pelo atendimento.

## Status do projeto

Em desenvolvimento — etapa de estruturação e definição dos requisitos.

Ainda não há aplicação executável nesta versão. As funcionalidades abaixo
representam o escopo planejado e serão marcadas conforme forem implementadas
e verificadas.

## Objetivo

Desenvolver uma aplicação funcional para clientes, funcionários e gestores,
com persistência de dados, controle de acesso e validação das regras de negócio.

O PDF da Situação de Aprendizagem é a referência principal dos requisitos.
Os materiais de apoio disponibilizados pelo professor serão utilizados como
base didática para iniciar o desenvolvimento.

## Funcionalidades previstas

- [ ] Cadastro e autenticação de usuários.
- [ ] Controle de acesso para administrador, funcionário e cliente.
- [ ] Agendamento e reserva de mesas para sextas, sábados e domingos.
- [ ] Consulta de disponibilidade e prevenção de reservas conflitantes.
- [ ] Consulta, edição e cancelamento de reservas.
- [ ] Cardápio digital.
- [ ] Compra antecipada e realização de pedidos.
- [ ] Atendimento local com acesso ao cardápio e aos pedidos.
- [ ] Gestão dos pedidos pela equipe do restaurante.
- [ ] Registro de pagamentos.
- [ ] Registro de compras de alimentos e vendas de itens do cardápio.
- [ ] Cálculo e identificação dos 10% associados ao garçom responsável.
- [ ] Interfaces para clientes, funcionários e gestão.

As regras de pagamento, atendimento local e integração IoT serão detalhadas
na documentação de requisitos antes da implementação dos respectivos módulos.

## Tecnologias planejadas

| Área | Tecnologia |
| --- | --- |
| Frontend | React com Vite |
| Backend | Node.js com Express |
| Banco de dados | PostgreSQL |
| Autenticação | JWT com expiração |
| Proteção de senhas | Hash com bcrypt |
| Validação | Zod |
| Documentação da API | OpenAPI com Swagger UI |
| Versionamento | Git e GitHub |

As versões das dependências serão definidas durante a configuração de cada
aplicação e registradas nos respectivos arquivos de dependências.

## Segurança e organização

A implementação deverá contemplar:

- Autenticação e autorização no backend.
- Controle de acesso baseado em papéis (RBAC).
- Restrição de acesso aos dados conforme o usuário autenticado.
- Armazenamento de senhas com hash.
- Validação dos dados recebidos pela API.
- Configuração de CORS para as origens autorizadas.
- Tratamento padronizado de erros, sem exposição de informações internas.
- Credenciais e segredos em variáveis de ambiente.
- Separação entre rotas, controllers, services e repositories.
- Proteção da integridade dos dados em operações simultâneas.

Arquivos `.env` não devem ser enviados ao repositório.
Os arquivos `.env.example` documentarão as variáveis necessárias sem
incluir credenciais reais.

## Estrutura do repositório

- `backend/`: API, regras de negócio e persistência.
- `frontend/`: interface web.
- `docs/`: requisitos, regras de negócio, modelo de dados e testes.
- `README.md`: apresentação e orientações gerais do projeto.

## Execução local

### Pré-requisitos

- Git.
- Docker Engine com Docker Compose ou Docker Desktop com Compose.
- Docker em execução.

Node.js e npm serão necessários para o backend e o frontend.
As versões e os comandos dessas aplicações serão documentados durante
a implementação.

### Configuração do banco

Na raiz do projeto, crie o arquivo `.env` a partir do exemplo.

No PowerShell:

```powershell
Copy-Item .env.example .env
```

No Linux ou macOS:

```bash
cp .env.example .env
```

Edite o `.env` e substitua a senha de exemplo por uma senha local.
O arquivo `.env` não deve ser versionado.

Configuração padrão:

| Parâmetro | Valor |
| --- | --- |
| Host para aplicações executadas no computador | `127.0.0.1` |
| Porta no computador | `5433` |
| Banco | `mesaflow` |
| Usuário de desenvolvimento | `mesaflow_dev` |
| Versão principal do PostgreSQL | `17` |

O serviço é destinado ao desenvolvimento local. Credenciais e permissões
do ambiente publicado serão configuradas separadamente.

### Inicialização

Valide a configuração:

```bash
docker compose config --quiet
```

Inicie o banco e aguarde a verificação de disponibilidade:

```bash
docker compose up -d --wait
docker compose ps
```

O serviço `db` deve apresentar o estado `healthy`.

### Teste de conexão

Com os nomes padrão do `.env.example`:

```bash
docker compose exec db psql -h 127.0.0.1 -U mesaflow_dev -d mesaflow -W
```

Informe a senha configurada no `.env` e execute:

```sql
SELECT current_database(), current_user;
```

Resultado esperado:

| current_database | current_user |
| --- | --- |
| mesaflow | mesaflow_dev |

Para sair do cliente:

```text
\q
```

Se o nome do banco ou do usuário tiver sido alterado, ajuste os argumentos
do comando de conexão.

### Operação do ambiente

```bash
# Consultar o estado
docker compose ps

# Consultar logs recentes
docker compose logs --tail 80 db

# Parar o serviço
docker compose stop

# Iniciar novamente
docker compose up -d --wait

# Remover contêiner e rede, preservando os dados
docker compose down
```

Os dados ficam em um volume nomeado. O comando `docker compose down -v`
remove também esse volume e seus dados; não deve ser usado como comando
rotineiro de parada.

As variáveis de inicialização do PostgreSQL são aplicadas quando o volume
está vazio. Alterar a senha no `.env` não modifica automaticamente a senha
de um banco já inicializado.

### Estado da implementação

A conexão com o banco foi validada utilizando PostgreSQL 17.11.

As tabelas serão criadas por migrations do Sequelize. A configuração do
backend, do frontend e os respectivos comandos de execução ainda estão
em implementação.

O desenvolvimento e os testes locais precedem a publicação na nuvem.

## Documentação da API

A API será documentada utilizando OpenAPI e Swagger UI.

A documentação deverá apresentar:

- Rotas e métodos HTTP.
- Requisitos de autenticação e autorização.
- Parâmetros e corpos das requisições.
- Exemplos de respostas.
- Códigos de sucesso e erro.

O endereço de acesso será informado quando a documentação estiver disponível.

## Fluxo de desenvolvimento

- `main`: versões estáveis e verificadas.
- `develop`: integração das funcionalidades.
- `feature/*`: novas funcionalidades.
- `fix/*`: correções.
- `chore/*`: configurações e manutenção da estrutura.
- `docs/*`: alterações de documentação.

As alterações serão desenvolvidas em branches específicas e integradas
por Pull Requests para `develop`.

Versões estáveis serão integradas de `develop` para `main` e identificadas
por tags de versão.

### Padrão de commits

Exemplos:

- `chore: organiza estrutura inicial do projeto`
- `docs: documenta regras de reservas`
- `feat: implementa cadastro de clientes`
- `fix: impede reserva acima da capacidade`
- `test: verifica permissões de acesso`

## Critérios de conclusão de uma funcionalidade

Uma funcionalidade será considerada concluída quando:

- Atender aos requisitos e às regras de negócio documentadas.
- Validar entradas e permissões no backend.
- Tratar situações de sucesso e falha.
- Persistir corretamente os dados, quando aplicável.
- Passar pelos testes pertinentes à alteração.
- Possuir documentação atualizada.
- Ter sua integração verificada antes de chegar à branch estável.

## Estratégia de testes

Serão verificados, conforme cada módulo for implementado:

- Fluxos válidos de cadastro, login, reservas, pedidos e pagamentos.
- Dados obrigatórios ausentes ou inválidos.
- Acesso sem autenticação e sem permissão.
- Tentativas de acessar dados de outro cliente.
- Reservas em datas ou horários não permitidos.
- Conflitos entre reservas e solicitações simultâneas.
- Transições inválidas de status.
- Consistência dos valores financeiros e da atribuição ao garçom.
- Prevenção de duplicação em operações críticas.
- Falhas de comunicação e mensagens exibidas na interface.

## Documentação e entregáveis previstos

- Código-fonte do frontend e do backend.
- Requisitos e regras de negócio.
- Diagrama entidade-relacionamento (DER).
- Estrutura versionada do banco e dados de demonstração.
- Pelo menos três registros de teste por tabela, conforme o guia de apoio.
- Documentação da API.
- Instruções verificadas de execução local.
- Evidências dos testes.
- Demonstração dos fluxos completos.

Os dados de demonstração serão fictícios e separados dos dados de uso real.

## Contexto acadêmico

Projeto desenvolvido como Situação de Aprendizagem do SENAI,
aplicando desenvolvimento web, banco de dados, segurança e versionamento.