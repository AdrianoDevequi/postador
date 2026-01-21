# Guia: Como Gerar Token do Instagram (Longa Duração)

Seu token atual expirou. Siga estes passos para gerar um novo que durará **60 dias**.

## Passo 1: Pegar Token de Curta Duração

1. Acesse o **[Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)**.
2. No menu lateral direito:
   - **Meta App**: Selecione seu aplicativo (ex: `AutoPostGram`).
   - **User or Page**: Selecione "User Token".
3. Em **Permissions**, adicione as seguintes (se não estiverem lá):
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
   - `public_profile`
4. Clique no botão azul **Generate Access Token**.
5. Uma janela popup aparecerá pedindo autorização. Confirme tudo (selecione a Página do Instagram correta).
6. Copie o token que aparecer no campo "Access Token" (começa com `EAA...`).

## Passo 2: Pegar App ID e Secret

1. Acesse o **[Painel de Apps da Meta](https://developers.facebook.com/apps/)**.
2. Clique no seu aplicativo.
3. No menu lateral esquerdo, vá em **Configurações (Settings) > Básico (Basic)**.
4. Copie o **App ID**.
5. Clique em "Mostrar" (Show) no **App Secret** e copie (pode pedir sua senha do Facebook).

## Passo 3: Gerar Token de Longa Duração

1. Volte para o terminal do VS Code.
2. Execute o comando:
   ```bash
   node get-token.js
   ```
3. Cole as informações quando pedido:
   - Token de Curta Duração (do Passo 1)
   - App ID (do Passo 2)
   - App Secret (do Passo 2)

## Passo 4: Atualizar Vercel

O script atualizará seu arquivo `.env` local automaticamente. Contudo, **você precisa atualizar a Vercel manualmente**:

1. Vá para o painel do seu projeto na Vercel.
2. Settings > Environment Variables.
3. Edite `INSTAGRAM_ACCESS_TOKEN` com o novo token gerado.
4. Salve.
