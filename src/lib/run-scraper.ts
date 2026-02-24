import { downloadEnvatoPhoto } from './envato-scraper';

const term = process.argv[2];
if (!term) {
    console.error("Missing search term");
    process.exit(1);
}

downloadEnvatoPhoto(term).then(path => {
    if (path) {
        console.log(`RESULT_PATH:${path}`);
    }
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
