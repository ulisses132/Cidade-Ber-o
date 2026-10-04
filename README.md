# Cidade Berço

Site do Festival de Tunas Académicas organizado pela Tuna Afonsina. Páginas independentes, arquivo das edições I–XX e XXI edição de 26 a 28 de fevereiro de 2027.

## Abrir localmente

Requer Node.js 22 ou superior. Não é necessário instalar dependências.

```sh
npm run dev
```

Abra http://localhost:4173. Para parar, use Ctrl+C no terminal.

## Atualizar o site

No primeiro acesso, execute:

```sh
npm run setup
```

O comando apresenta uma palavra-passe aleatória uma única vez. Guarde-a num gestor de palavras-passe e entre em http://localhost:4173/admin. Só é guardado o hash da palavra-passe, no ficheiro local `data/admin.json`, excluído do Git. Executar o comando novamente substitui a palavra-passe; reinicie o servidor para terminar sessões existentes.

Na gestão pode editar datas, local, apresentação, tunas, programa, bilhetes BOL, cartazes, prémios, fotografias e parceiros. Os campos vazios são apresentados como informação a anunciar, quando aplicável.

Para o ano seguinte, clique **Criar edição**, preencha os dados, marque **Mostrar esta edição como a edição atual do site** e guarde. A edição anterior passa para o arquivo. Alterar a edição selecionada mantém alterações em memória até clicar **Guardar alterações**.

Imagens: coloque os ficheiros em `public/assets/` e indique o caminho, por exemplo `/assets/cartaz-xxi.jpg`. Também pode usar um endereço HTTPS de uma imagem. Não existe envio de ficheiros pelo formulário nesta versão.

O programa aceita uma atividade por linha, com campos separados por `|`: `Sexta-feira | 21:00 | Serenata | Largo da Oliveira`. A galeria aceita `endereço da imagem | legenda`. Os parceiros aceitam `nome | link | logótipo`.

## Estrutura

- `server.mjs`: servidor e rotas HTTP.
- `lib/render.mjs`: páginas HTML renderizadas no servidor.
- `lib/store.mjs`: validação, gravação e cópias de segurança.
- `lib/auth.mjs`: autenticação e sessões de gestão.
- `public/styles.css`: apresentação e regras de adaptação a telemóveis.
- `public/site.js`: menu e pesquisa no arquivo.
- `public/admin.js`: formulário de gestão.
- `data/content.json`: conteúdos de todas as edições.
- `data/backups/`: cópias automáticas dos conteúdos antes de guardar.
- `test/site.test.mjs`: verificações do site e da gestão.

## Verificar

```sh
npm test
```

Os testes de gravação usam uma pasta temporária e não alteram os conteúdos do site.

## Publicar posteriormente

Esta aplicação necessita de um servidor Node.js e armazenamento persistente; não funciona apenas enviando HTML para alojamento estático. O servidor escuta apenas no computador local por defeito. Num alojamento com HTTPS, configure `HOST=0.0.0.0`, `PORT` conforme necessário e `COOKIE_SECURE=true`. Pode configurar `DATA_DIR` para um diretório persistente com `content.json` e `admin.json`.

Antes de publicar: configurar HTTPS, criar a palavra-passe no servidor, proteger e fazer backup do diretório de dados e confirmar os contactos. A gestão é adequada a uma única instância do servidor. As sessões ficam em memória e terminam quando o servidor reinicia. Para várias instâncias ou editores simultâneos em maior escala, migrar os dados e as sessões para uma base de dados.

O local, programa, tunas, parceiros e link BOL da XXI edição aguardam informação confirmada. Os contactos e o arquivo foram recolhidos do site oficial e devem ser revistos pela organização antes da publicação.

## Créditos

Logótipo fornecido pela Tuna Afonsina. Cartazes, datas e tunas das edições anteriores: https://afonsina.com/cidade-berco/ (consultado em outubro de 2026). Os recursos pertencem aos respetivos titulares.
