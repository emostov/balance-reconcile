import NaiveCrawler from "../classes/naive_crawler";

/**
 * console.log the result of crawling a single block. A good starting point
 * for quickly trying things out.
 *
 * @param height block height
 * @param sidecarUrl base url of an instance of sidecar
 */
export async function singleBlock(
  height: number,
  sidecarUrl: string,
  wsUrl: string
): Promise<void> {
  const crawler = new NaiveCrawler(sidecarUrl, wsUrl);

  const results = await crawler.crawlBlock(height);
  console.log(results);
}
