async function test() {
    const token = '0H99TzuYbiDr6tE0CUX2ymrykr46YLif';
    const url = 'https://api.envato.com/v1/discovery/search/search/item?site=photodune.net&term=technology';
    try {
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await res.json();
        console.log(JSON.stringify(data.matches?.slice(0, 2), null, 2));
    } catch (e) {
        console.error(e);
    }
}

test();
