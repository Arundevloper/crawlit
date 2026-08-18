async function runCrawl(startUrls, maxRequestsPerCrawl = 10) {
  const { CheerioCrawler } = await import('crawlee');
  const results = [];

  const crawler = new CheerioCrawler({
    async requestHandler({ request, $, enqueueLinks, log }) {
      const title = $('title').text();
      log.info(`Title of ${request.loadedUrl} is '${title}'`);
      results.push({ title, url: request.loadedUrl });
      await enqueueLinks();
    },
    maxRequestsPerCrawl,
  });

  await crawler.run(startUrls);

  return results;
}

module.exports = { runCrawl };
