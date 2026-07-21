# App Review — Postador Master (Instagram API with Instagram Login)

Material para submeter o app **Postador Master** (`1542945893942187`, app do
Instagram `1350355007287029`) à análise da Meta e sair do modo de desenvolvimento.

O app é do portfólio **Master Sites** (`2296381251167956`), que é quem precisa
passar pela verificação de negócio — a análise do app olha o portfólio dono.

> O app antigo **Postador** (`813460095069513`, IG `887837497336635`), do
> portfólio "Criação de sites jupiter", ficou de lado. Não foi movido nem
> excluído: a Meta não oferece transferência de app entre portfólios, só
> remover e readicionar, e não valia o risco de deixá-lo órfão.

Os textos de justificativa estão em inglês de propósito: os analistas da Meta são
internacionais e submissões em português costumam voltar pedindo tradução.

---

## Estado atual

| Item | Situação |
|---|---|
| Redirect URI do Instagram Login | ✅ `https://postador.vercel.app/api/auth/instagram-login/callback` |
| Permissões | ✅ `instagram_business_basic`, `instagram_business_content_publish` |
| Nível de acesso | ⚠️ Standard — o review pede Advanced |
| Política de Privacidade | ✅ cadastrada — `https://postador.vercel.app/privacidade` |
| Termos de Uso | ✅ cadastrada — `https://postador.vercel.app/termos` |
| Exclusão de dados | ✅ cadastrada — `https://postador.vercel.app/exclusao-de-dados` |
| Categoria | ✅ Negócio e Páginas |
| Fluxo funcionando ponta a ponta | ✅ conectado e publicando pelo app novo |
| Ícone do app | ✅ `public/app-icon.png` (1024×1024) |
| Verificação de negócio (Master Sites) | ⏳ **em análise** (~2 dias úteis) — enviada em 21/07/2026 |
| Screencast | ❌ pendente — exige gravar o fluxo funcionando |

Dados da empresa já cadastrados no portfólio Master Sites: razão social
`51.226.861 ADRIANO RODRIGO NUNES DEVEQUI`, CNPJ `51.226.861/0001-23`,
endereço em Londrina/PR e site `https://mastersites.com.br`. Falta só o
complemento do endereço, que é campo opcional.

## Ordem das etapas

O painel encadeia as etapas — cada uma só abre quando a anterior conclui:

1. **Verificação da empresa** — enviada 21/07/2026, em análise. Não exigiu
   upload: a Meta localizou o registro pelo CNPJ.
2. **Verificação do acesso** (Provedor de Tecnologia) — bloqueada até a etapa 1
   passar. Prazo declarado de ~5 dias. Ainda não está claro se é obrigatória
   para as nossas permissões ou só para acesso a dados de outras empresas.
3. **App Review das permissões** — pede o screencast.
4. **App Ao vivo.**

## O que depende de você

1. **Screencast.** Vídeo mostrando o fluxo real de ponta a ponta, sem cortes.
   Roteiro abaixo. O fluxo já funciona, então dá para gravar a qualquer momento.
2. **Envio.** O clique final é seu — é uma declaração formal em nome da empresa.

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
