import { NextRequest, NextResponse } from "next/server";
import { discoverAccountsFromCode } from "@/lib/facebook-oauth";
import {
    requireAdmin,
    callbackUri,
    persistConnectedAccount,
    OAUTH_STATE_COOKIE,
    OAUTH_PENDING_COOKIE,
} from "@/lib/connect";

function errorRedirect(req: NextRequest, msg: string) {
    const url = new URL("/", req.url);
    url.searchParams.set("connect_error", msg);
    const res = NextResponse.redirect(url);
    res.cookies.delete(OAUTH_STATE_COOKIE);
    return res;
}

/**
 * Handles Facebook's OAuth redirect: validates state, exchanges the code for a
 * long-lived token, and either saves the single discovered account or hands off
 * to the picker page when the admin manages several Instagram accounts.
 */
export async function GET(req: NextRequest) {
    try {
        await requireAdmin();
    } catch {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    const params = req.nextUrl.searchParams;

    if (params.get("error")) {
        return errorRedirect(req, "Autorização cancelada no Facebook.");
    }

    const code = params.get("code");
    const state = params.get("state");
    const saved = req.cookies.get(OAUTH_STATE_COOKIE)?.value || "";
    const [savedState, savedProfileId] = saved.split(":");

    if (!code || !state || !savedState || state !== savedState) {
        return errorRedirect(req, "Sessão de conexão inválida. Tente novamente.");
    }

    const profileId = savedProfileId ? Number(savedProfileId) : null;

    let accounts;
    try {
        accounts = await discoverAccountsFromCode(code, callbackUri(req.nextUrl.origin));
    } catch (e: any) {
        const detail = e.response?.data?.error?.message || e.message || "Erro desconhecido";
        return errorRedirect(req, `Falha ao conectar: ${detail}`);
    }

    if (accounts.length === 0) {
        return errorRedirect(
            req,
            "Nenhuma conta Instagram Business encontrada. Verifique se a conta é Business/Creator e está vinculada a uma Página do Facebook."
        );
    }

    // Single account → save straight away, no picker needed.
    if (accounts.length === 1) {
        const id = await persistConnectedAccount(profileId, accounts[0]);
        const url = new URL(`/?profile=${id}&connected=1`, req.url);
        const res = NextResponse.redirect(url);
        res.cookies.delete(OAUTH_STATE_COOKIE);
        return res;
    }

    // Multiple accounts → stash them and let the admin pick.
    const res = NextResponse.redirect(new URL("/connect", req.url));
    res.cookies.delete(OAUTH_STATE_COOKIE);
    res.cookies.set(
        OAUTH_PENDING_COOKIE,
        JSON.stringify({ profileId, accounts }),
        {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 600,
            path: "/",
        }
    );
    return res;
}
