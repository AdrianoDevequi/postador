import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const post = await prisma.post.findUnique({ where: { id: Number(id) } });

    if (!post?.imageUrl) {
        return new NextResponse("Not found", { status: 404 });
    }

    const dataUrl = post.imageUrl;

    if (dataUrl.startsWith("data:")) {
        const [header, base64] = dataUrl.split(",");
        const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";
        const buffer = Buffer.from(base64, "base64");
        return new NextResponse(buffer, {
            headers: {
                "Content-Type": mimeType,
                "Cache-Control": "public, max-age=3600",
            },
        });
    }

    return NextResponse.redirect(dataUrl);
}
