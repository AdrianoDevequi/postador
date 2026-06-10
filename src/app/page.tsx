import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cleanOldPosts, cleanErrorPosts } from "./actions";
import { CleanPostsButton } from "./CleanPostsButton";
import { NextPostTimer } from "./NextPostTimer";
import { ManualTrigger } from "./ManualTrigger";
import { PostActions } from "./PostActions";
import { ProfileForm } from "./ProfileForm";
import { DeleteProfileButton } from "./ProfileControls";
import { TokenStatusBadge } from "./TokenStatusBadge";
import { getTokenStatus } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ profile?: string }> }) {
  const { profile: profileParam } = await searchParams;

  const profiles = await prisma.profile.findMany({ orderBy: { id: "asc" } });

  const isNew = profileParam === "new" || profiles.length === 0;
  const selected = isNew
    ? null
    : profiles.find((p) => String(p.id) === profileParam) || profiles[0];

  const posts = selected
    ? await prisma.post.findMany({
        where: { profileId: selected.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Instagram Autopost</h1>
        </header>

        {/* Profile selector tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {profiles.map((p) => {
            const isActive = selected?.id === p.id;
            const ts = getTokenStatus(p);
            const tokenMark = ts.state === "expired" ? "⛔" : ts.state === "warning" ? "⚠️" : null;
            return (
              <Link
                key={p.id}
                href={`/?profile=${p.id}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  isActive
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                }`}
              >
                {tokenMark && <span className="mr-1" title={ts.label}>{tokenMark}</span>}
                {p.name}
                {!p.active && <span className="ml-1.5 text-xs opacity-70">(pausado)</span>}
              </Link>
            );
          })}
          <Link
            href="/?profile=new"
            className={`px-4 py-2 rounded-full text-sm font-medium border border-dashed transition-colors ${
              isNew
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-green-700 border-green-300 hover:bg-green-50"
            }`}
          >
            + Novo perfil
          </Link>
        </div>

        {/* Create new profile */}
        {isNew && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-1">Novo perfil</h2>
            <p className="text-sm text-gray-500 mb-6">
              Conecte outra conta do Instagram e defina a identidade de marca dela.
            </p>
            <ProfileForm />
          </div>
        )}

        {/* Selected profile dashboard */}
        {selected && (
          <>
            {/* Token expiry banner (only when there's something to act on) */}
            {(() => {
              const ts = getTokenStatus(selected);
              if (ts.state !== "warning" && ts.state !== "expired") return null;
              const isExpired = ts.state === "expired";
              return (
                <div className={`rounded-lg p-4 border-l-4 ${isExpired ? "bg-red-50 border-red-500" : "bg-amber-50 border-amber-500"}`}>
                  <p className={`font-semibold ${isExpired ? "text-red-800" : "text-amber-800"}`}>
                    {isExpired ? "⛔ Token do Instagram expirado" : "⚠️ Token do Instagram perto de expirar"}
                  </p>
                  <p className={`text-sm mt-1 ${isExpired ? "text-red-700" : "text-amber-700"}`}>
                    {ts.label}. Gere um novo token long-lived e cole no campo Access Token abaixo para continuar publicando.
                  </p>
                </div>
              );
            })()}

            <NextPostTimer />

            <ManualTrigger profileId={selected.id} />

            {/* Posts */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Posts de {selected.name}</h2>
                <div className="flex gap-2">
                  <CleanPostsButton action={cleanErrorPosts.bind(null, selected.id)} label="Limpar Erros" confirm="Deletar todos os posts com erro deste perfil?" />
                  <CleanPostsButton action={cleanOldPosts.bind(null, selected.id)} label="Limpar +15 dias" confirm="Deletar posts com mais de 15 dias deste perfil?" />
                </div>
              </div>
              {posts.length === 0 ? (
                <p className="text-gray-500 italic">Nenhum post ainda.</p>
              ) : (
                <div className="space-y-6">
                  {posts.map((post: any) => (
                    <div key={post.id} className="flex gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <a href={`/api/image/${post.id}`} target="_blank" rel="noopener noreferrer" className="w-32 h-32 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden relative block hover:opacity-80 transition-opacity cursor-zoom-in">
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
                        {(post.status === 'DRAFT' || post.status === 'ERROR') && (
                          <PostActions postId={post.id} isError={post.status === 'ERROR'} />
                        )}
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

            {/* Profile settings */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-semibold">Configurações de {selected.name}</h2>
                  <TokenStatusBadge status={getTokenStatus(selected)} expiresAt={selected.tokenExpiresAt} />
                </div>
                <DeleteProfileButton profileId={selected.id} profileName={selected.name} />
              </div>
              <ProfileForm profile={selected} />

              <div className="mt-6 pt-4 border-t border-gray-100 text-sm text-gray-500">
                <p><strong>Cron Job URL:</strong> <code className="bg-gray-100 px-1 py-0.5 rounded">/api/cron</code> — processa todos os perfis ativos.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
