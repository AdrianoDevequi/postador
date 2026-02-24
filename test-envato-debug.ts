// Debug: show full structure of the first returned match to find the correct URL field
async function debugEnvatoJson() {
    const token = '0H99TzuYbiDr6tE0CUX2ymrykr46YLif';
    const terms = ['technology', 'artificial intelligence', 'AI Business Productivity'];

    for (const term of terms) {
        const url = `https://api.envato.com/v1/discovery/search/search/item?site=photodune.net&term=${encodeURIComponent(term)}&sort_by=relevance`;
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const total = data.matches?.length ?? 0;
        console.log(`\n=== Term: "${term}" - Total matches: ${total} ===`);
        if (total > 0) {
            const previews = data.matches[0].previews;
            const iconPreview = previews?.icon_with_thumbnail_preview;
            console.log("Keys in previews:", Object.keys(previews || {}));
            console.log("icon_with_thumbnail_preview keys:", Object.keys(iconPreview || {}));
            console.log("icon_with_thumbnail_preview values:", JSON.stringify(iconPreview, null, 2));
        }
    }
}

debugEnvatoJson();
