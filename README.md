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

Os comandos de instalação, configuração do banco e inicialização serão
adicionados após a implementação e validação da base de cada aplicação.

O desenvolvimento e os testes locais terão prioridade.
A publicação na nuvem será realizada após a validação dos fluxos completos.

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