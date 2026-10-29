# Evidências de validação — autenticação

## Verificações realizadas na preparação da entrega

- Instalação das dependências e atualização do lockfile.
- 26 testes automatizados de configuração, serviços e HTTP aprovados.
- Aplicação das duas migrations em banco PostgreSQL embarcado PGlite, acessado pelo protocolo PostgreSQL com o driver `pg` e Sequelize.
- Segunda execução das migrations sem reaplicação.
- 13 cenários de integração aprovados, cobrindo persistência, cadastro, login, logout, conta inativa, perfis, unicidade, chave estrangeira, rollback e criação administrativa. O executor informa 14 resultados ao incluir o agrupamento dos cenários.
- Comando de preparação JWT verificado: mantém a senha do banco e preserva o segredo gerado em execuções seguintes.
- Verificações executadas com Node.js 24.22.1; a base declara Node.js 22 ou superior.

PGlite é um ambiente de validação embarcado e não equivale ao servidor PostgreSQL 17 do Docker. Em particular, sua multiplexação de conexões não substitui a verificação de concorrência no servidor real. Ele não é dependência do projeto entregue.

## Verificação local necessária

```powershell
npm test --prefix backend
npm run test:integration --prefix backend
```

O segundo comando executa os cenários contra um banco descartável criado no PostgreSQL local. O resultado no Docker deve ser registrado no PR após execução pelo responsável pelo projeto.

A validação do Docker, da criação/remoção do banco temporário e do fluxo manual pelo Swagger não é declarada como concluída por este documento.
