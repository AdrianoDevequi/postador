import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { cleanOldPosts, cleanErrorPosts } from "./actions";
import { CleanPostsButton } from "./CleanPostsButton";
import { ManualTrigger } from "./ManualTrigger";
import { PostActions } from "./PostActions";
import { ProfileForm } from "./ProfileForm";
import { DeleteProfileButton } from "./ProfileControls";
import { TokenStatusBadge } from "./TokenStatusBadge";
import { getTokenStatus, describeSchedule, nextScheduledRun } from "@/lib/profile";
import { AppShell } from "./ui/AppShell";
import { StatCard } from "./ui/StatCard";
import { NextPostCountdown } from "./ui/NextPostCountdown";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string; connected?: string; connect_error?: string }>;
}) {
  const { profile: profileParam, connected, connect_error: connectError } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profiles = await prisma.profile.findMany({
    where: { userId: user.id },
    orderBy: { id: "asc" },
  });

  const isNew = profileParam === "new" || profiles.length === 0;
  const selected = isNew
    ? null
    : profiles.find((p) => String(p.id) === profileParam) || profiles[0];

  let posts: Awaited<ReturnType<typeof prisma.post.findMany>> = [];
  let publishedCount = 0;
  let draftCount = 0;
  let errorCount = 0;
  if (selected) {
    // Two queries max (list + grouped counts) to stay within the DB's
    // connection limit on the shared MySQL host.
    const [postList, grouped] = await Promise.all([
      prisma.post.findMany({ where: { profileId: selected.id }, orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.post.groupBy({ by: ["status"], where: { profileId: selected.id }, _count: true }),
    ]);
    posts = postList;
    for (const g of grouped) {
      if (g.status === "PUBLISHED") publishedCount = g._count;
      else if (g.status === "DRAFT") draftCount = g._count;
      else if (g.status === "ERROR") errorCount = g._count;
    }
  }

  const banners = (
    <>
      {connected && (
        <div className="rounded-xl p-4 bg-success-light border-l-4 border-success">
          <p className="font-bold text-[#0a7a3f]">✅ Instagram conectado com sucesso</p>
          <p className="text-sm text-[#0a7a3f]/90 mt-0.5">O ID e o token foram preenchidos e salvos automaticamente.</p>
        </div>
      )}
      {connectError && (
        <div className="rounded-xl p-4 bg-danger-light border-l-4 border-danger">
          <p className="font-bold text-danger">Não foi possível conectar</p>
          <p className="text-sm text-danger/90 mt-0.5">{connectError}</p>
        </div>
      )}
    </>
  );

  // New profile screen
  if (isNew || !selected) {
    return (
      <AppShell
        profiles={profiles}
        isNew
        userLabel={user.email}
        title="Novo perfil"
        subtitle="Conecte uma conta e defina a marca"
      >
        <div className="space-y-6">
          {banners}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-line">
            <ProfileForm />
          </div>
        </div>
      </AppShell>
    );
  }

  const ts = getTokenStatus(selected);

  return (
    <AppShell
      profiles={profiles}
      selectedId={selected.id}
      userLabel={user.email}
      title={selected.name}
      subtitle={describeSchedule(selected)}
      actions={<DeleteProfileButton profileId={selected.id} profileName={selected.name} />}
    >
      <div className="space-y-6">
        {banners}

        {/* Token warning banner */}
        {(ts.state === "warning" || ts.state === "expired") && (
          <div
            className={`rounded-xl p-4 border-l-4 ${ts.state === "expired" ? "bg-danger-light border-danger" : "bg-warning-light border-warning"}`}
          >
            <p className={`font-bold ${ts.state === "expired" ? "text-danger" : "text-[#a06a12]"}`}>
              {ts.state === "expired" ? "⛔ Token do Instagram expirado" : "⚠️ Token perto de expirar"}
            </p>
            <p className={`text-sm mt-0.5 ${ts.state === "expired" ? "text-danger/90" : "text-[#a06a12]/90"}`}>
              {ts.label}. Reconecte o Instagram nas configurações abaixo.
            </p>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard color="teal" label="Publicados" value={String(publishedCount)} footer="No Instagram" />
          <StatCard color="blue" label="Rascunhos" value={String(draftCount)} footer="Aguardando aprovação" />
          <StatCard color="pink" label="Com erro" value={String(errorCount)} footer="Precisam de atenção" />
          <NextPostCountdown
            nextRunMs={nextScheduledRun(selected)?.getTime() ?? null}
            scheduleLabel={describeSchedule(selected)}
            active={selected.active}
          />
        </div>

        {/* Manual generation */}
        <ManualTrigger profileId={selected.id} />

        {/* Posts */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-line">
          <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-ink">Posts recentes</h2>
            <div className="flex gap-2">
              <CleanPostsButton action={cleanErrorPosts.bind(null, selected.id)} label="Limpar erros" confirm="Deletar todos os posts com erro deste perfil?" />
              <CleanPostsButton action={cleanOldPosts.bind(null, selected.id)} label="Limpar +15 dias" confirm="Deletar posts com mais de 15 dias deste perfil?" />
            </div>
          </div>
          {posts.length === 0 ? (
            <p className="text-muted italic">Nenhum post ainda.</p>
          ) : (
            <div className="space-y-5">
              {posts.map((post) => (
                <div key={post.id} className="flex gap-4 border-b border-line pb-5 last:border-0 last:pb-0">
                  <a
                    href={`/api/image/${post.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-28 h-28 flex-shrink-0 bg-slate-100 rounded-xl overflow-hidden relative block hover:opacity-80 transition-opacity cursor-zoom-in"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.imageUrl} alt="Post gerado" className="object-cover w-full h-full" />
                  </a>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1.5 gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          post.status === "PUBLISHED"
                            ? "bg-success-light text-[#0a7a3f]"
                            : post.status === "ERROR"
                              ? "bg-danger-light text-danger"
                              : "bg-warning-light text-[#a06a12]"
                        }`}
                      >
                        {post.status}
                      </span>
                      <span className="text-xs text-muted shrink-0">{new Date(post.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap line-clamp-3">{post.caption}</p>
                    {(post.status === "DRAFT" || post.status === "ERROR") && (
                      <PostActions postId={post.id} isError={post.status === "ERROR"} />
                    )}
                    {post.error && (
                      <div className="mt-2 text-xs text-danger bg-danger-light p-2 rounded-lg">
                        <strong>Erro:</strong> {post.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-line">
          <div className="flex items-center gap-3 flex-wrap mb-6">
            <h2 className="text-lg font-bold text-ink">Configurações</h2>
            <TokenStatusBadge status={ts} expiresAt={selected.tokenExpiresAt} />
          </div>
          <ProfileForm profile={selected} />
        </div>
      </div>
    </AppShell>
  );
}
