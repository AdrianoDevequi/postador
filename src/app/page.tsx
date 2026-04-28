import { prisma } from "@/lib/prisma";
import { updateTopic, updateBrandConfig, cleanOldPosts, cleanErrorPosts } from "./actions";
import { CleanPostsButton } from "./CleanPostsButton";
import { NextPostTimer } from "./NextPostTimer";
import { ManualTrigger } from "./ManualTrigger";
import { PostActions } from "./PostActions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const config = await prisma.config.findUnique({
    where: { key: "post_topic" },
  });

  const brandConfigs = await prisma.config.findMany({
    where: { key: { in: ["brand_name", "brand_description", "brand_colors", "brand_style", "brand_logo_url", "brand_extra"] } },
  });
  const brand = Object.fromEntries(brandConfigs.map((c: any) => [c.key, c.value]));

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Instagram Autopost Dashboard</h1>
        </header>

        {/* Next Publication Timer */}
        <NextPostTimer />

        {/* Manual Trigger Component */}
        <ManualTrigger />

        {/* Recent Posts Log */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Gerenciamento de Posts</h2>
            <div className="flex gap-2">
              <CleanPostsButton action={cleanErrorPosts} label="Limpar Erros" confirm="Deletar todos os posts com erro?" />
              <CleanPostsButton action={cleanOldPosts} label="Limpar +15 dias" confirm="Deletar todos os posts com mais de 15 dias?" />
            </div>
          </div>
          {posts.length === 0 ? (
            <p className="text-gray-500 italic">No posts yet.</p>
          ) : (
            <div className="space-y-6">
              {posts.map((post: any) => (
                <div key={post.id} className="flex gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <a href={post.imageUrl} target="_blank" rel="noopener noreferrer" className="w-32 h-32 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden relative block hover:opacity-80 transition-opacity cursor-zoom-in">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.imageUrl} alt="Generated" className="object-cover w-full h-full" />
                  </a>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${post.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : post.status === 'ERROR' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {post.status}
                      </span>
                      <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap line-clamp-3">{post.caption}</p>
                    <div className="mt-2 text-xs text-gray-400 font-mono truncate">
                      ID: {post.igMediaId || "N/A"}
                    </div>
                    {post.status === 'DRAFT' && <PostActions postId={post.id} />}
                    {post.error && (
                      <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
                        <strong>Error:</strong> {post.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Configuration Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-6">Configurações</h2>

          {/* Tópico */}
          <form action={updateTopic} className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Tema dos Posts</h3>
            <div className="flex gap-2">
              <input
                type="text"
                name="topic"
                id="topic"
                defaultValue={config?.value || "Technology"}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                placeholder="Ex: Criação de sites"
              />
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium transition-colors">
                Salvar
              </button>
            </div>
          </form>

          {/* Identidade de Marca */}
          <form action={updateBrandConfig} className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Identidade de Marca</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da marca</label>
                <input type="text" name="brand_name" defaultValue={brand.brand_name || ""} placeholder="Ex: Jupiter Sites" className="w-full rounded-md border p-2 text-sm border-gray-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cores da marca</label>
                <input type="text" name="brand_colors" defaultValue={brand.brand_colors || ""} placeholder="Ex: azul #0066FF, branco #FFFFFF" className="w-full rounded-md border p-2 text-sm border-gray-300" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição da marca</label>
              <textarea name="brand_description" defaultValue={brand.brand_description || ""} rows={2} placeholder="Ex: Agência especializada em criação de sites para pequenas empresas" className="w-full rounded-md border p-2 text-sm border-gray-300" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estilo visual</label>
              <input type="text" name="brand_style" defaultValue={brand.brand_style || ""} placeholder="Ex: moderno, minimalista, profissional, clean" className="w-full rounded-md border p-2 text-sm border-gray-300" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL da logo</label>
              <input type="url" name="brand_logo_url" defaultValue={brand.brand_logo_url || ""} placeholder="https://..." className="w-full rounded-md border p-2 text-sm border-gray-300" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contexto extra</label>
              <textarea name="brand_extra" defaultValue={brand.brand_extra || ""} rows={2} placeholder="Qualquer informação adicional que deva guiar os posts (público-alvo, tom de voz, etc.)" className="w-full rounded-md border p-2 text-sm border-gray-300" />
            </div>

            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium transition-colors">
              Salvar Identidade
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-sm text-gray-500">
            <p><strong>Cron Job URL:</strong> <code className="bg-gray-100 px-1 py-0.5 rounded">/api/cron</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
