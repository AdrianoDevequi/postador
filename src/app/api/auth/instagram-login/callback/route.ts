import { NextRequest, NextResponse } from "next/server";
import { getAccountFromCode } from "@/lib/instagram-oauth";
import {
    requireAdmin,
    igCallbackUri,
    persistConnectedAccount,
    IG_STATE_COOKIE,
} from "@/lib/connect";

function errorRedirect(req: NextRequest, msg: string) {
    const url = new URL("/", req.url);
    url.searchParams.set("connect_error", msg);
    const res = NextResponse.redirect(url);
    res.cookies.delete(IG_STATE_COOKIE);
    return res;
}

/**
 * Handles Instagram's OAuth redirect. There is exactly one account per login —
 * whichever the user signed in as — so this saves it straight away; no picker.
 */
export async function GET(req: NextRequest) {
    let userId: number;
    try {
        userId = await requireAdmin();
    } catch {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    const params = req.nextUrl.searchParams;

    if (params.get("error")) {
        return errorRedirect(req, "Autorização cancelada no Instagram.");
    }

    const code = params.get("code");
    const state = params.get("state");
    const saved = req.cookies.get(IG_STATE_COOKIE)?.value || "";
    const [savedState, savedProfileId] = saved.split(":");

    if (!code || !state || !savedState || state !== savedState) {
        return errorRedirect(req, "Sessão de conexão inválida. Tente novamente.");
    }

    const profileId = savedProfileId ? Number(savedProfileId) : null;

    let account;
    try {
        account = await getAccountFromCode(code, igCallbackUri(req.nextUrl.origin));
    } catch (e: any) {
        const detail =
            e.response?.data?.error_message || e.response?.data?.error?.message || e.message || "Erro desconhecido";
        return errorRedirect(req, `Falha ao conectar: ${detail}`);
    }

    if (!account.igUserId) {
        return errorRedirect(
            req,
            "Não foi possível ler a conta. Verifique se o Instagram está configurado como Comercial ou Criador de conteúdo."
        );
    }

    const id = await persistConnectedAccount(profileId, account, userId);
    const res = NextResponse.redirect(new URL(`/?profile=${id}&connected=1`, req.url));
    res.cookies.delete(IG_STATE_COOKIE);
    return res;
}
