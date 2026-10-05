# Publicar no Cloudflare

O site e a gestão usam Workers. Os conteúdos e as sessões ficam no D1. A versão local Node.js continua disponível com `npm run dev`, usando o seu ficheiro JSON. As duas versões não sincronizam dados automaticamente.

## 1. Ligar a conta

No terminal do VS Code, dentro desta pasta:

```sh
npm run cf:login
```

Confirme a conta e autorize o Wrangler no navegador. Não partilhe passwords nem tokens no chat.

## 2. Criar a base de dados

```sh
npx wrangler d1 create cidade-berco
```

Copie o `database_id` apresentado para `wrangler.jsonc`, substituindo o identificador composto por zeros. Não altere o nome do binding `DB`.

## 3. Importar conteúdos

```sh
npx wrangler d1 migrations apply cidade-berco --remote
npm run cf:seed
npx wrangler d1 execute cidade-berco --remote --file cloudflare/seed.sql
```

A importação só cria os conteúdos se a base estiver vazia. Nunca substitui alterações feitas na gestão online. As gravações criam uma cópia da revisão anterior; são conservadas as últimas 30 revisões no D1.

## 4. Configurar o acesso à gestão

Gere uma chave aleatória no seu terminal:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Guarde os 64 caracteres num gestor de palavras-passe. Esta será a palavra-passe da gestão. Não use uma palavra-passe curta: a implementação exige uma chave aleatória de 256 bits.

```sh
npx wrangler secret put ADMIN_KEY
```

Cole a chave quando o Wrangler a pedir. A chave fica num secret do Cloudflare, nunca no GitHub. Se precisar de revogar acessos existentes, elimine também as sessões da tabela `sessions` ao trocar a chave.

## 5. Publicar

```sh
npm run cf:deploy
```

O comando apresenta o endereço HTTPS `workers.dev`. A gestão fica em `/admin`. Pode adicionar um domínio próprio mais tarde. Não é necessário migrar o domínio da tuna para testar.

## Desenvolvimento e verificações

```sh
npm run cf:db:local
npm run cf:seed
npx wrangler d1 execute cidade-berco --local --file cloudflare/seed.sql
npm run cf:dev
```

No desenvolvimento, `.dev.vars` contém uma chave de teste local e está excluído do Git. Não a use em produção.

Com o emulador a correr, `node scripts/cloudflare-check.mjs` verifica o ciclo de login/gravação/logout. Guarda os mesmos conteúdos na base local, incrementando apenas a revisão. `npm run cf:check` verifica o empacotamento sem publicar.

## Limites e conteúdos multimédia

Esta configuração usa Workers Free e D1; não requer um servidor pago. As quotas da Cloudflare continuam a aplicar-se e a disponibilidade gratuita não é ilimitada. Confirme no painel que mantém o plano Free.

Os cartazes atuais são publicados como ficheiros estáticos. A gestão continua a aceitar links HTTPS para novas imagens. O upload de imagens pelo formulário não está implementado; para isso será necessário preparar armazenamento de ficheiros, por exemplo R2, e verificar as suas condições separadamente.

Depois da publicação, `data/content.json` serve apenas para a versão local e para a primeira importação. As atualizações online ficam no D1. Para uma cópia externa:

```sh
npx wrangler d1 export cidade-berco --remote --output backup-cidade-berco.sql
```

Guarde esse backup fora do repositório público: inclui conteúdos e registos internos de gestão.
