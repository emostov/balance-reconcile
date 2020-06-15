import NaiveCrawler from "../classes/naive_crawler";
import { b1 } from "./ksmBatch1";
async function main(): Promise<void> {
  const sidecarUrl = "http://127.0.0.1:6161/";
	await singleBlock(2282911, sidecarUrl);
  // await b1();
}

main().catch(console.log);

// Fetch and print a single block.
async function singleBlock(height: number, sidecarUrl: string): Promise<void> {
  const crawler = new NaiveCrawler(sidecarUrl);

  const results = await crawler.crawlBlock(height);
  console.log(results);
}
