import { CheerioCrawler, Dataset } from 'crawlee';

const crawler = new CheerioCrawler({
    async requestHandler({ request, $, enqueueLinks, log }) {
        const title = $('title').text();
        log.info(`Title of ${request.loadedUrl} is '${title}'`);
        await Dataset.pushData({ title, url: request.loadedUrl });
        await enqueueLinks();
    },
    maxRequestsPerCrawl: 50,
});

await crawler.run(['https://crawlee.dev']);
