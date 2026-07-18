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
        brand_styles: p.brandStyles ?? "",
        brand_tones: p.postTones ?? "",
        brand_formats: p.brandFormats ?? "",
        brand_palette: p.brandPalette ?? "",
        brand_alternate: p.alternateStyles ? "true" : "false",
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

// ---------------------------------------------------------------------------
// Scheduling (America/Sao_Paulo, UTC-3, no DST)
// ---------------------------------------------------------------------------

const SP_TZ = "America/Sao_Paulo";
export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type SchedulePick = Pick<Profile, "scheduleDays" | "scheduleTimes">;

export function parseSchedule(p: SchedulePick): { days: number[]; times: string[] } {
    const days = (p.scheduleDays || "")
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
    const times = (p.scheduleTimes || "")
        .split(",")
        .map((s) => s.trim())
        .filter((t) => /^\d{2}:\d{2}$/.test(t));
    return { days, times };
}

/** Current São Paulo wall-clock date (YYYY-MM-DD) and weekday (0=Sun). */
function nowInSaoPaulo(now: Date): { dateStr: string; weekday: number } {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: SP_TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "short",
    }).formatToParts(now);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { dateStr: `${get("year")}-${get("month")}-${get("day")}`, weekday: map[get("weekday")] ?? 0 };
}

/**
 * True when a schedule slot has become due since lastScheduledRunAt — i.e. the
 * cron (polled every ~15 min) should generate a post now for this profile.
 */
export function isScheduledDue(
    p: Pick<Profile, "scheduleDays" | "scheduleTimes" | "lastScheduledRunAt">,
    now: Date = new Date()
): boolean {
    const { days, times } = parseSchedule(p);
    if (!days.length || !times.length) return false;

    const { dateStr, weekday } = nowInSaoPaulo(now);
    if (!days.includes(weekday)) return false;

    const last = p.lastScheduledRunAt ? p.lastScheduledRunAt.getTime() : 0;
    for (const t of times) {
        const slotMs = new Date(`${dateStr}T${t}:00-03:00`).getTime();
        if (slotMs <= now.getTime() && slotMs > last) return true;
    }
    return false;
}

/** Human summary of a schedule, e.g. "Seg, Qua, Sex às 09:00, 18:00". */
export function describeSchedule(p: SchedulePick): string {
    const { days, times } = parseSchedule(p);
    if (!days.length || !times.length) return "Sem agendamento";
    const dayStr = days.slice().sort((a, b) => a - b).map((d) => WEEKDAY_LABELS[d]).join(", ");
    return `${dayStr} às ${times.join(", ")}`;
}
