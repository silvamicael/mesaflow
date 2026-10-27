# Requisitos e regras de negócio — MesaFlow

Documento de planejamento da Situação de Aprendizagem (SA).

**Status:** regras de negócio aprovadas em 27/10/2026. Este documento especifica o comportamento a implementar; não indica funcionalidades já implementadas.

## 1. Objetivo

Integrar reservas, cardápio, pedidos, atendimento e controle financeiro de um restaurante em uma aplicação web.

O PDF da SA define o escopo principal. O ZIP disponibilizado pelo professor é uma referência didática para iniciar o desenvolvimento, principalmente do módulo de reservas, e não uma aplicação pronta.

O desenvolvimento e a validação ocorrerão localmente. A publicação na nuvem será a última etapa.

## 2. Escopo da primeira entrega completa

- Cadastro e autenticação de usuários.
- Perfis de administrador, funcionário e cliente.
- Agendamento e reserva de mesas para sextas, sábados e domingos.
- Consulta de disponibilidade e prevenção de conflitos.
- Cardápio, pedidos antecipados e pedidos locais.
- Atendimento e acompanhamento do preparo e da entrega.
- Registro de pagamentos pela equipe.
- Registro de compras de alimentos, vendas e recebimentos.
- Controle dos 10% associados ao garçom responsável.
- Interfaces para clientes, equipe e gestão.
- Documentação da API, testes e evidências dos fluxos completos.

O detalhamento abaixo é a especificação de trabalho do projeto. Não representa transcrição literal de todas as exigências do PDF.

## 3. Decisões de escopo confirmadas

- Cada reserva ocupa uma única mesa.
- O atendimento local utiliza a aplicação web responsiva no navegador, em celular, tablet ou computador.
- Não será necessário instalar um aplicativo móvel nativo.
- Os pagamentos serão registrados pela equipe autorizada.
- Não haverá cobrança online nem integração com gateways de pagamento nesta versão.
- Não haverá integração com MQTT ou ESP32.
- A publicação na nuvem ocorrerá após a validação local.

A compra antecipada será atendida por pedidos vinculados a reservas confirmadas e pagamentos antecipados, integrais ou parciais, recebidos fora da aplicação e registrados pela equipe após conferência. Não haverá cobrança automática pela aplicação.

## 4. Perfis e permissões

### 4.1 Cliente

- Criar sua própria conta, entrar e sair do sistema.
- Consultar e atualizar os campos permitidos do próprio perfil.
- Consultar o cardápio e a disponibilidade de reservas.
- Criar, consultar, alterar e cancelar suas reservas conforme as regras.
- Criar e consultar seus pedidos.
- Consultar os pagamentos dos próprios pedidos ou atendimentos vinculados.

O cliente não pode acessar dados de outros clientes, alterar preços, atribuir permissões ou confirmar um pagamento.

### 4.2 Funcionário

- Consultar dados necessários à operação e ao atendimento.
- Criar reservas em nome de clientes.
- Confirmar reservas e registrar chegada, conclusão, ausência ou cancelamento conforme as regras.
- Abrir atendimentos, registrar pedidos e atualizar seus estados.
- Registrar pagamentos e encerrar atendimentos.

O funcionário não pode promover usuários a administrador ou acessar relatórios financeiros globais sem permissão específica. O papel funcionário inclui quem atua como garçom; o responsável pelo atendimento deve ser identificado.

### 4.3 Administrador

- Gerenciar usuários, acessos e inativação de contas.
- Gerenciar mesas, horários e configurações.
- Gerenciar categorias e produtos.
- Acompanhar reservas, atendimentos e pedidos.
- Registrar e consultar compras de alimentos.
- Consultar vendas, recebimentos e valores associados aos garçons.
- Autorizar correções financeiras e cancelamentos restritos.
- Analisar solicitações de cancelamento após o início do preparo.

Todas as permissões serão verificadas no backend, independentemente dos botões exibidos no frontend.

## 5. Cadastro, autenticação e sessões

- O cadastro público sempre cria um cliente e não aceita perfil privilegiado.
- Contas de funcionários são cadastradas pelo administrador.
- O primeiro administrador é criado por procedimento controlado, sem senha real no repositório.
- O e-mail deve ser único após normalização.
- Senhas são armazenadas com hash bcrypt, nunca em texto puro.
- O login utiliza JWT com expiração.
- Contas inativas não podem entrar nem continuar acessando rotas protegidas.
- O logout encerra a sessão conforme a estratégia de sessões adotada.
- Erros de login não revelam se um e-mail está cadastrado.
- A API limita tentativas repetidas de autenticação.
- Senhas, tokens e credenciais não aparecem em respostas indevidas nem em logs.

Duração das sessões, armazenamento e revogação dos tokens serão definidos na etapa de autenticação.

## 6. Mesas e reservas

### 6.1 Modelo

Mesas físicas possuem identificação única, capacidade e situação ativa. Cada reserva ocupa uma mesa. Junção de mesas fica fora desta versão.

### 6.2 Regras de disponibilidade

- Reservas são permitidas para sextas, sábados e domingos.
- Horários de funcionamento, duração das reservas e tolerância de chegada são configuráveis.
- Configuração inicial de demonstração: sexta a domingo, das 18h às 23h, duração de 2 horas e tolerância de 15 minutos; último início às 21h.
- Alterações de configuração não modificam automaticamente reservas já confirmadas.
- O fuso horário do restaurante deve ser explícito e consistente.
- Cada reserva possui início e fim.
- A quantidade de pessoas deve ser um inteiro positivo.
- A mesa deve estar ativa e comportar o grupo.
- Todo o intervalo da reserva deve estar dentro do funcionamento.
- Não é permitido reservar para um horário passado.
- Reservas pendentes e confirmadas bloqueiam o intervalo reservado.
- Intervalos sobrepostos não podem ocupar a mesma mesa.
- Uma reserva pode começar exatamente quando a anterior terminar.
- Criação e edição verificam disponibilidade no backend.
- Solicitações simultâneas não podem gravar reservas conflitantes.
- Cancelamentos liberam a disponibilidade.
- Reservas utilizadas são vinculadas ao atendimento correspondente.
- O histórico não é apagado para simular um cancelamento.

### 6.3 Estados e transições

Estados: `pendente`, `confirmada`, `concluida`, `cancelada` e `nao_compareceu`.

- `pendente` → `confirmada` ou `cancelada`.
- `confirmada` → `concluida`, `cancelada` ou `nao_compareceu`.
- Estados finais não são reabertos por uma alteração comum.

A conclusão ocorre após o encerramento do atendimento associado. A ausência só pode ser registrada pela equipe após o horário previsto e a tolerância configurada. Se existir atendimento aberto, deve-se tratar o atendimento antes de finalizar ou cancelar a reserva.

### 6.4 Alterações pelo cliente

O cliente pode alterar ou cancelar uma reserva própria antes do início, desde que ainda não exista atendimento aberto. A edição deve respeitar o estado da reserva e verificar novamente a disponibilidade.

Pedidos antecipados ou pagamentos associados exigem tratamento conjunto. Não é permitido cancelar uma reserva e deixar pedidos ou registros financeiros em estado inconsistente.

## 7. Cardápio

- Produtos possuem nome, descrição, categoria, preço e disponibilidade.
- Preços de venda devem ser positivos.
- Produtos indisponíveis não entram em novos pedidos.
- Produtos utilizados em pedidos não são excluídos fisicamente.
- Alterações no cardápio não modificam pedidos já registrados.
- Cada item guarda o nome e o preço praticados na compra.
- O backend consulta os preços reais e calcula os valores.
- Valores enviados pelo navegador não são fonte confiável para cobrança.

## 8. Atendimentos e pedidos

### 8.1 Atendimento local

- Cada atendimento possui mesa, funcionário responsável e estado.
- O responsável deve estar ativo.
- Uma mesa não pode ter dois atendimentos abertos simultaneamente.
- Um atendimento pode conter vários pedidos.
- Operações relevantes devem identificar seu autor.
- Trocas de responsável preservam o histórico.
- Atendimentos sem reserva devem considerar as reservas futuras da mesa.
- Uma mesa com atendimento ainda aberto não deve aparecer como livre apenas porque terminou o intervalo previsto da reserva.

### 8.2 Pedido antecipado

- O pedido antecipado deve estar vinculado a uma reserva confirmada.
- O cliente escolhe os produtos antes de chegar.
- O pagamento pode ser integral ou parcial, recebido externamente e registrado pela equipe após conferência.
- Os valores antecipados são vinculados à reserva e aos pedidos correspondentes e aproveitados na conta do atendimento, sem duplicar receita ou pagamento.
- A equipe libera o preparo considerando a previsão de chegada. Pagamento e presença do cliente não iniciam automaticamente o preparo.
- Selecionar produtos não significa autorizar a cozinha a prepará-los.
- Antes do preparo, o cliente pode solicitar cancelamento. Havendo pagamento, a equipe trata a devolução e registra o estorno.
- Após o início do preparo, o cancelamento exige análise do administrador, com motivo e tratamento financeiro correspondente.
- O registro de um estorno só ocorre após a confirmação da devolução externa; a aplicação não transfere dinheiro.

### 8.3 Regras dos pedidos

- Um pedido contém pelo menos um item.
- Quantidades são inteiros positivos.
- A disponibilidade dos produtos é conferida na confirmação.
- Observações possuem limite de tamanho.
- Valores são calculados pelo backend.
- Repetir a mesma solicitação por falha de rede não duplica um pedido confirmado.
- Pedidos e seus itens mantêm os valores históricos.

### 8.4 Estados e transições

Estados: `recebido`, `em_preparo`, `pronto`, `entregue` e `cancelado`.

- `recebido` → `em_preparo` ou `cancelado`.
- `em_preparo` → `pronto`.
- `pronto` → `entregue`.

Cancelamentos após o início do preparo exigem uma operação administrativa específica, com motivo e tratamento financeiro correspondente. Não é permitido avançar ou retroceder estados arbitrariamente.

## 9. Pagamentos e encerramento

Os pagamentos serão registrados manualmente pela equipe autorizada. O sistema não realizará cobranças online nem se integrará a gateways nesta versão.

Cada pagamento registra valor, forma de pagamento, data e funcionário responsável. Não serão armazenados números completos de cartão ou códigos de segurança.

- O cliente não pode marcar o próprio pedido como pago.
- Pagamentos antecipados podem ser integrais ou parciais.
- A equipe confere o recebimento antes de registrá-lo; um comprovante enviado não confirma o pagamento por si só.
- Não haverá confirmação automática de Pix.
- O saldo final corresponde ao total devido, incluindo a taxa aplicável, menos os pagamentos válidos, considerando estornos.
- O valor antecipado é abatido do saldo final, sem novo registro do mesmo recebimento.
- Um atendimento pode receber mais de um pagamento.
- O valor aplicado dos pagamentos não pode ultrapassar o saldo devido.
- Em dinheiro, valor entregue e troco são separados do valor aplicado à conta.
- Reenvios não duplicam pagamentos.
- Pagamentos simultâneos devem preservar o saldo correto.
- Um atendimento só é encerrado sem saldo pendente e sem pedidos ativos ainda não entregues.
- Cancelamentos e estornos preservam o histórico.
- Uma venda paga não pode ser simplesmente apagada.
- Um estorno registrado representa uma devolução confirmada pela equipe; a aplicação não movimenta dinheiro automaticamente.

As formas de pagamento aceitas serão configuradas na implementação do módulo.

## 10. Taxa de serviço e garçom responsável

O sistema deve identificar os 10% associados ao garçom do atendimento.

- A taxa aparece separadamente na conta.
- A taxa não incide sobre ela mesma.
- O registro identifica o garçom beneficiário.
- O fechamento preserva os valores e a atribuição ao garçom.
- A atribuição não pode ser alterada silenciosamente após o fechamento.
- A base da taxa é o total dos itens consumidos e não cancelados.
- A taxa é de 10% dessa base.
- A retirada solicitada pelo cliente pode ser registrada pela equipe, com motivo.
- Há um garçom responsável por atendimento; trocas antes do fechamento ficam registradas com motivo.
- Os 10% são atribuídos ao garçom responsável no fechamento, sem divisão entre funcionários nesta versão.
- Valores cobrados, recebidos e repassados devem ser distinguíveis.
- Cancelamentos e estornos devem refletir nos valores associados à taxa.

A retirada da taxa deve atualizar o total e o saldo da conta de forma consistente. Se houver valor a devolver, a equipe trata a devolução e registra o estorno correspondente.

## 11. Controle financeiro

- Compras de alimentos registram descrição, data, valor e responsável.
- A compra registrada deve ser distinguida de seu pagamento.
- Vendas e recebimentos podem ser consultados por período.
- Valores dos produtos e da taxa de serviço são separados.
- Pedidos cancelados não entram nos totais de vendas válidas.
- Estornos são considerados nos relatórios de recebimentos.
- Pedidos e pagamentos não podem ser somados como duas receitas.
- Correções e cancelamentos preservam o histórico.
- Valores monetários usam centavos inteiros ou tipos decimais exatos.
- A regra de arredondamento deve ser única e documentada.

O módulo não representa contabilidade completa. O saldo entre recebimentos e despesas não será apresentado automaticamente como lucro contábil.

## 12. Segurança, arquitetura e integridade

- PostgreSQL, Express, React e Node.js compõem a stack prevista.
- O backend separa rotas, controllers, services e repositories.
- Dados recebidos são validados com Zod.
- O frontend valida campos para orientar o usuário, sem substituir o backend.
- CORS é configurado para origens autorizadas e não substitui autenticação.
- Consultas usam parâmetros ou mecanismo equivalente seguro.
- Erros possuem formato padronizado e códigos HTTP adequados.
- Respostas não expõem stack traces, senhas ou credenciais.
- Recursos de clientes têm verificação de propriedade no backend.
- Operações relacionadas utilizam transações quando necessário.
- Restrições no banco reforçam a integridade e a prevenção de conflitos.
- Operações críticas têm proteção contra duplicação.
- Dados pessoais são coletados e expostos apenas quando necessários.
- Segredos ficam fora do repositório; `.env.example` contém valores fictícios.
- O código será versionado com Git e GitHub.
- A API terá documentação OpenAPI com Swagger UI.

## 13. Interfaces previstas

### Cliente

- Cadastro e login.
- Cardápio.
- Disponibilidade e criação de reservas.
- Minhas reservas.
- Pedidos e acompanhamento.
- Consulta de pagamentos.

### Equipe

- Reservas do dia.
- Mesas e atendimentos.
- Registro de pedidos.
- Fila de preparo e entrega.
- Recebimentos e encerramento da conta.

### Gestão

- Usuários e permissões.
- Mesas e horários.
- Categorias e produtos.
- Compras de alimentos.
- Vendas e recebimentos.
- Valores associados aos garçons.

As telas devem funcionar em computador e celular e apresentar carregamento, sucesso, erro e ausência de resultados. Ações incompatíveis com o estado atual não devem ser oferecidas; o backend também deve recusá-las.

## 14. Fluxos de referência

### 14.1 Reserva e atendimento

1. Cliente entra no sistema e consulta disponibilidade.
2. Solicita uma reserva.
3. Backend valida regras e garante a disponibilidade antes de confirmar a gravação.
4. Equipe confirma a reserva.
5. Na chegada, abre o atendimento e identifica o garçom responsável.
6. Pedidos são registrados, preparados e entregues.
7. A conta apresenta consumo e taxa separadamente.
8. A equipe registra os pagamentos.
9. O atendimento é encerrado e a reserva concluída.

### 14.2 Atendimento sem reserva

1. Funcionário consulta mesas disponíveis e reservas próximas.
2. Abre o atendimento e identifica o garçom.
3. Registra os pedidos.
4. A equipe prepara e entrega.
5. Registra pagamentos e encerra o atendimento.

### 14.3 Compra antecipada

1. Cliente possui uma reserva confirmada e registra um pedido antecipado.
2. O restaurante recebe um pagamento integral ou parcial por meio externo.
3. A equipe confere o recebimento e registra o valor vinculado à compra.
4. A equipe libera o preparo considerando a previsão de chegada.
5. Ao abrir o atendimento, os pedidos e pagamentos vinculados são associados à conta, sem duplicação.
6. O consumo final e a taxa aplicável compõem o total; os pagamentos antecipados são abatidos.
7. A equipe registra o saldo recebido e encerra o atendimento quando os pedidos estiverem entregues ou cancelados e a conta quitada.

Exemplo: um pedido de R$ 100 recebe R$ 40 antecipados. Se não houver consumo adicional e a taxa de 10% for mantida, o total será R$ 110 e o saldo final R$ 70. Se a taxa for retirada, o saldo será R$ 60.

### 14.4 Compra de alimentos

1. Administrador registra a compra.
2. Registra o pagamento quando realizado.
3. O sistema inclui os valores nos relatórios correspondentes.
4. Correções preservam o histórico.

## 15. Critérios mínimos de aceite

- Cadastro público não cria administradores ou funcionários.
- Usuário sem permissão não acessa operações restritas.
- Cliente não consulta nem altera recursos de outro cliente.
- Conta inativa não acessa rotas protegidas.
- Reservas fora dos dias e horários permitidos são rejeitadas.
- Reservas no passado ou acima da capacidade da mesa são rejeitadas.
- Solicitações simultâneas não gravam reservas conflitantes.
- Edição verifica novamente a disponibilidade.
- Cancelamento libera a disponibilidade.
- Produto indisponível não entra em novo pedido.
- Alterar preços no navegador não altera o cálculo do backend.
- Alterar o cardápio não modifica valores históricos.
- Transições inválidas são rejeitadas.
- Reenvios de operações críticas não duplicam registros.
- Pagamentos e estornos mantêm o saldo consistente.
- Pagamentos antecipados são abatidos uma única vez e não duplicam receitas.
- Comprovante enviado pelo cliente não confirma recebimento automaticamente.
- O preparo depende de liberação da equipe, sem gatilho automático por pagamento ou chegada.
- Solicitações de cancelamento com pagamento preservam o vínculo e o tratamento da devolução.
- Mudanças na configuração não alteram silenciosamente reservas confirmadas.
- Trocas de garçom não modificam contas já fechadas por uma operação comum.
- Os 10% são calculados e associados ao garçom correto conforme a política aprovada.
- Recarregar a página mantém os dados persistidos.
- Falhas de comunicação geram mensagens compreensíveis.
- Se uma etapa de uma operação transacional falhar, não ficam registros parciais inconsistentes.

## 16. Entregáveis e desenvolvimento

- Código-fonte versionado no GitHub.
- README com instruções verificadas de execução.
- Requisitos e regras de negócio atualizados.
- DER correspondente ao banco implementado.
- Migrations e dados fictícios de demonstração.
- Pelo menos três registros de teste por tabela, conforme o guia de apoio.
- Documentação OpenAPI com Swagger UI.
- Testes automatizados das regras críticas.
- Evidências dos testes de integração.
- Demonstração dos fluxos completos.

Branches de trabalho são integradas por Pull Requests em `develop`. Entregas estáveis são integradas em `main`. Tags serão criadas para marcos funcionais verificados; a estrutura inicial não exige uma tag de versão.

Antes de concluir cada módulo, verificar regras, permissões, persistência, situações de falha e documentação. O deploy fica por último.

## 17. Regras operacionais aprovadas

Aprovadas em 27/10/2026. São decisões do projeto para detalhar o funcionamento, e não exigências literais adicionais do PDF da SA.

| Tema | Regra aprovada |
| --- | --- |
| Reservas | Uma mesa por reserva, com início e fim |
| Configuração inicial | Sexta a domingo, das 18h às 23h |
| Duração inicial | 2 horas; último início às 21h |
| Tolerância inicial | 15 minutos; depois, a equipe pode registrar ausência |
| Configurações | Horários, duração e tolerância alteráveis sem modificar reservas já confirmadas |
| Pedido antecipado | Vinculado a uma reserva confirmada |
| Pagamento antecipado | Integral ou parcial, recebido externamente e registrado após conferência pela equipe |
| Saldo final | Deduz os pagamentos antecipados válidos, considerando estornos |
| Preparo | Liberado pela equipe considerando a previsão de chegada |
| Cancelamento antes do preparo | Cliente pode solicitar; pagamentos exigem tratamento da devolução pela equipe |
| Cancelamento após início do preparo | Exige análise do administrador |
| Taxa de serviço | 10% sobre os itens consumidos e não cancelados, apresentada separadamente |
| Retirada da taxa | Registrada pela equipe a pedido do cliente, com motivo |
| Garçom responsável | Um por atendimento; trocas registradas com motivo |
| Atribuição dos 10% | Ao responsável no fechamento, sem divisão entre funcionários nesta versão |
| Fechamento | Pedidos entregues ou cancelados e saldo quitado |
| Integrações excluídas | MQTT, ESP32, gateways e confirmação automática de Pix |

A próxima etapa é a modelagem do banco, preservando vínculos e histórico entre reserva, pedido, atendimento, pagamento e estorno. Decisões técnicas de sessão, formas de pagamento e arredondamento serão detalhadas nos módulos correspondentes, sem alterar silenciosamente estas regras de negócio.
