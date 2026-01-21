import { prisma } from "@/lib/prisma";
import { updateTopic } from "./actions";
import { NextPostTimer } from "./NextPostTimer";
import { ManualTrigger } from "./ManualTrigger";

export default async function Home() {
  const config = await prisma.config.findUnique({
    where: { key: "post_topic" },
  });

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

        {/* Configuration Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          <form action={updateTopic} className="space-y-4">
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
                Daily Post Topic
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="topic"
                  id="topic"
                  defaultValue={config?.value || "Technology"}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  placeholder="e.g., Cat Facts"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
          <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
            <p className="mb-1"><strong>Cron Job URL:</strong> <code className="bg-gray-100 px-1 py-0.5 rounded">/api/cron</code></p>
            <p>Ensure you set your environment variables in Vercel.</p>
          </div>
        </div>

        {/* Manual Trigger Component */}
        <ManualTrigger />

        {/* Recent Posts Log */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Recent Posts Log</h2>
          {posts.length === 0 ? (
            <p className="text-gray-500 italic">No posts yet.</p>
          ) : (
            <div className="space-y-6">
              {posts.map((post: any) => (
                <div key={post.id} className="flex gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="w-32 h-32 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.imageUrl} alt="Generated" className="object-cover w-full h-full" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${post.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {post.published ? 'Published' : 'Draft/Failed'}
                      </span>
                      <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap line-clamp-3">{post.caption}</p>
                    <div className="mt-2 text-xs text-gray-400 font-mono truncate">
                      ID: {post.igMediaId || "N/A"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
