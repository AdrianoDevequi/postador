"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { normalizeHandle } from "@/lib/access";

/** Throws unless the signed-in user is the admin. */
async function requireAdminUser() {
    const user = await requireUser();
    if (!user.isAdmin) throw new Error("Unauthorized");
    return user;
}

/** A user asks for their Instagram handle to be added as a tester on the Meta app. */
export async function requestInstagramAccess(formData: FormData) {
    const user = await requireUser();

    const raw = formData.get("igHandle");
    const handle = typeof raw === "string" ? normalizeHandle(raw) : null;
    if (!handle) throw new Error("Informe um @ válido do Instagram.");

    // Re-submitting the same handle just refreshes the existing row instead of
    // erroring on the unique constraint — a rejected user can try again.
    await prisma.accessRequest.upsert({
        where: { userId_igHandle: { userId: user.id, igHandle: handle } },
        create: { userId: user.id, igHandle: handle },
        update: { status: "PENDING", reviewedAt: null },
    });

    revalidatePath("/");
    revalidatePath("/admin");
}

export async function approveAccessRequest(id: number) {
    await requireAdminUser();
    await prisma.accessRequest.update({
        where: { id },
        data: { status: "APPROVED", reviewedAt: new Date() },
    });
    revalidatePath("/admin");
    revalidatePath("/");
}

export async function rejectAccessRequest(id: number) {
    await requireAdminUser();
    await prisma.accessRequest.update({
        where: { id },
        data: { status: "REJECTED", reviewedAt: new Date() },
    });
    revalidatePath("/admin");
    revalidatePath("/");
}
