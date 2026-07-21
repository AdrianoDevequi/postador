import type { AccessRequest, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * The gate exists only while the Meta app is unpublished — Instagram refuses to
 * authorize anyone who isn't a tester on the app ("Função de desenvolvedor é
 * insuficiente"). Once App Review clears, set IG_ACCESS_GATE=off and every user
 * gets the connect button straight away; nothing else has to change.
 */
export function accessGateEnabled(): boolean {
    return process.env.IG_ACCESS_GATE !== "off";
}

export interface AccessState {
    /** Whether to show the "Conectar com Instagram" button. */
    allowed: boolean;
    /** The user's latest request, when there is one. */
    request: AccessRequest | null;
}

/**
 * Normalizes a handle the user typed: "@Foo.Bar/" -> "foo.bar".
 * Returns null when what's left isn't a valid Instagram username.
 */
export function normalizeHandle(raw: string): string | null {
    const handle = raw.trim().replace(/^@/, "").replace(/\/+$/, "").toLowerCase();
    return /^[a-z0-9._]{1,30}$/.test(handle) ? handle : null;
}

export async function getAccessState(user: User): Promise<AccessState> {
    if (!accessGateEnabled() || user.isAdmin) {
        return { allowed: true, request: null };
    }

    const request = await prisma.accessRequest.findFirst({
        where: { userId: user.id },
        orderBy: { id: "desc" },
    });

    return { allowed: request?.status === "APPROVED", request };
}
