import type { Profile } from "@prisma/client";

/**
 * Converts a Profile row into the `Record<string,string>` brand-context shape
 * that openai.ts and image.ts already expect (keys like `brand_name`,
 * `brand_use_logo`, etc). This keeps the generation libs untouched.
 */
export function profileToBrand(p: Profile): Record<string, string> {
    return {
        brand_name: p.brandName ?? "",
        brand_description: p.brandDescription ?? "",
        brand_colors: p.brandColors ?? "",
        brand_style: p.brandStyle ?? "",
        brand_logo_url: p.brandLogoUrl ?? "",
        brand_extra: p.brandExtra ?? "",
        brand_link: p.linkUrl ?? "",
        brand_use_logo: p.useLogo ? "true" : "false",
        brand_less_text: p.lessText ? "true" : "false",
        design_font_style: p.designFontStyle ?? "",
        design_font_size: p.designFontSize ?? "",
        design_font_color: p.designFontColor ?? "",
        design_effects: p.designEffects ?? "",
        design_notes: p.designNotes ?? "",
        design_image_styles: p.designImageStyles ?? "",
    };
}

export type TokenState = "env" | "unknown" | "ok" | "warning" | "expired";

export interface TokenStatus {
    state: TokenState;
    daysLeft: number | null;
    label: string;
}

const WARN_DAYS = 10;

/**
 * Describes the health of a profile's Instagram token for display in the panel.
 */
export function getTokenStatus(
    p: Pick<Profile, "accessToken" | "tokenExpiresAt">,
    now: Date = new Date()
): TokenStatus {
    if (!p.accessToken) {
        return { state: "env", daysLeft: null, label: "Usando credenciais do ambiente" };
    }
    if (!p.tokenExpiresAt) {
        return { state: "unknown", daysLeft: null, label: "Validade desconhecida" };
    }

    const msLeft = p.tokenExpiresAt.getTime() - now.getTime();
    const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
        return { state: "expired", daysLeft, label: "Token expirado — renove agora" };
    }
    if (daysLeft <= WARN_DAYS) {
        return { state: "warning", daysLeft, label: `Token expira em ${daysLeft} dia(s)` };
    }
    return { state: "ok", daysLeft, label: `Token válido por mais ${daysLeft} dias` };
}

/**
 * Returns the Instagram credentials for a profile.
 * Falls back to the legacy INSTAGRAM_* env vars when the profile has none
 * (so the migrated default profile keeps working without re-entering them).
 */
export function getIgCreds(p: Pick<Profile, "igUserId" | "accessToken">): {
    igUserId: string;
    accessToken: string;
} {
    return {
        igUserId: p.igUserId || process.env.INSTAGRAM_USER_ID || "",
        accessToken: p.accessToken || process.env.INSTAGRAM_ACCESS_TOKEN || "",
    };
}
