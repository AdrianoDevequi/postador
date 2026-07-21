# App Review — Postador (Instagram API with Instagram Login)

Material para submeter o app **Postador** (`813460095069513`, app do Instagram
`887837497336635`) à análise da Meta e sair do modo de desenvolvimento.

Os textos de justificativa estão em inglês de propósito: os analistas da Meta são
internacionais e submissões em português costumam voltar pedindo tradução.

---

## Estado atual

| Item | Situação |
|---|---|
| Redirect URI do Instagram Login | ✅ `https://postador.vercel.app/api/auth/instagram-login/callback` |
| Permissões adicionadas ao caso de uso | ✅ `instagram_business_basic`, `instagram_business_content_publish` |
| Nível de acesso | ⚠️ Standard ("Pronto para teste") — o review pede Advanced |
| Política de Privacidade | ✅ `https://postador.vercel.app/privacidade` — falta cadastrar no painel |
| Termos de Uso | ✅ `https://postador.vercel.app/termos` |
| Exclusão de dados | ✅ `https://postador.vercel.app/exclusao-de-dados` |
| Ícone e categoria do app | ❓ conferir em Configurações do app → Básico |
| Verificação de negócio | ❌ pendente — exige documentos da empresa |
| Screencast | ❌ pendente — exige gravar o fluxo funcionando |

## Bloqueios que dependem de você

1. **Verificação de negócio / Provedor de Tecnologia.** O painel avisa: "Você
   precisará concluir a verificação de acesso". Exige documentos legais da
   empresa (CNPJ, comprovante de endereço, site com o mesmo domínio).
2. **Screencast.** Vídeo mostrando o fluxo real de ponta a ponta. Roteiro
   sugerido abaixo. Só é possível gravar depois que a sua conta do Instagram
   estiver como Testador e tiver aceitado o convite.
3. **Envio.** O clique final é seu — é uma declaração formal em nome da empresa.

## Roteiro do screencast

Grave em uma sessão só, sem cortes, mostrando a URL na barra de endereços:

1. Abrir `https://postador.vercel.app`, fazer login no painel.
2. Ir em "Novo perfil" e clicar em **Conectar com Instagram**.
3. Mostrar a tela de autorização do Instagram, com as permissões pedidas visíveis.
4. Autorizar e voltar ao painel já com o `@` preenchido.
5. Gerar um post e mostrar o rascunho (legenda + imagem).
6. Publicar e **abrir o post no app do Instagram**, provando que foi publicado.
7. Mostrar como desconectar (excluir o perfil) e a página de exclusão de dados.

Os passos 3, 4 e 6 são os que a Meta realmente procura: consentimento explícito
e uso efetivo da permissão.

## Justificativas das permissões

### `instagram_business_basic`

> Postador is a scheduling tool for Instagram professional accounts. After the
> user connects their own account through Instagram Business Login, we call
> `GET /me?fields=user_id,username` a single time to identify which account the
> newly issued token belongs to. The numeric id is required as the target of the
> `/media` and `/media_publish` calls, and the username is shown in our dashboard
> so the user can confirm they connected the right account when they manage more
> than one. We do not read followers, insights, comments or direct messages.

### `instagram_business_content_publish`

> This is the core function of the product. The user configures topics, brand
> colours and a posting schedule; Postador generates a caption and an image and
> publishes them to the user's own feed via `POST /{ig-user-id}/media` followed by
> `POST /{ig-user-id}/media_publish`. Publishing happens only to accounts the user
> authorized themselves, either at a time they scheduled or when they press
> "publish" on a draft they reviewed. We never publish to third-party accounts and
> we do not post on behalf of one user to another user's account.

### Descrição geral do app

> Postador helps small businesses keep their Instagram professional account
> active. The user describes their brand once (topics, tone, colours, logo) and
> picks the weekdays and times they want to post. The app then generates a caption
> and a matching image with AI and publishes it to their own account on schedule,
> or saves it as a draft for the user to review first. Every account is connected
> by its own owner through Instagram Business Login and can be disconnected at any
> time from Instagram's "Apps and websites" settings.

## Campos a cadastrar no painel

Configurações do app → Básico:
- **URL da Política de Privacidade:** `https://postador.vercel.app/privacidade`
- **URL dos Termos de Serviço:** `https://postador.vercel.app/termos`
- **URL de exclusão de dados:** `https://postador.vercel.app/exclusao-de-dados`

## Depois da aprovação

Definir `IG_ACCESS_GATE=off` na Vercel. A fila de solicitações (`/admin`) some,
o botão de conectar aparece para todos e nenhum código precisa mudar.
