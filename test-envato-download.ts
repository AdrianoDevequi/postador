// Test: Does stripping the Cloudflare transform query params from the preview URL give a clean image?
// The watermark is applied via Cloudflare's `mark=` param. Without it, we may get the original.
import 'dotenv/config';

const token = process.env.ENVATO_API_TOKEN || "0H99TzuYbiDr6tE0CUX2ymrykr46YLif";

async function testCleanUrl() {
    const searchRes = await fetch("https://api.envato.com/v1/discovery/search/search/item?site=photodune.net&term=technology&sort_by=relevance", {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const searchData = await searchRes.json();
    const firstMatch = searchData.matches?.[0];
    console.log("Item name:", firstMatch?.name, " | ID:", firstMatch?.id);

    const thumbUrl: string = firstMatch?.previews?.icon_with_thumbnail_preview?.thumbnail_url ?? '';
    console.log("\nOriginal URL (with watermark params):", thumbUrl);

    // Strategy 1: Strip all Cloudflare query params — get just the base file URL
    const baseUrl = thumbUrl.split('?')[0];
    console.log("\nBase URL (no params):", baseUrl);

    // Try fetching the base URL to see if it works (should be the raw file)
    const res = await fetch(baseUrl);
    console.log("Base URL status:", res.status, res.headers.get('content-type'));

    // Strategy 2: Build URL with only sizing, no mark param (must have valid signature — will it work without `s`?)
    // The `s=` param is a signature of all other params combined, so removing `mark` will invalidate it  
    // HOWEVER, we can try requesting WITHOUT the `s` param (just size, no watermark)
    const { searchParams } = new URL(thumbUrl);
    const withoutMark = `${baseUrl}?w=1080&h=1080&cf_fit=scale-down&format=auto&q=95`;
    const res2 = await fetch(withoutMark);
    console.log("Without-mark URL status:", res2.status, res2.headers.get('content-type'));
    console.log("Without-mark URL:", withoutMark);
}

testCleanUrl().catch(console.error);
