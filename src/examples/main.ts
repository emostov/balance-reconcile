import NaiveCrawler from "../classes/naive_crawler";
// // import { b1 } from "./ksmBatch1";
// import { jun15Batch } from "./ksmJun15Batch";
// import { subscribe } from "./subscribe";
import { categorizeExample } from "./categorize";

async function main(): Promise<void> {
  const sidecarUrl = "http://127.0.0.1:6161/";

  // await singleBlock(2689052, sidecarUrl);

  await categorizeExample(sidecarUrl);
  // await subscribe(
  //   "http://127.0.0.1:6969/",
  //   "ks_sub_jun15.txt",
  //   "wss://kusama-rpc.polkadot.io/"
  // );
}

main().catch(console.log);

// Fetch and print a single block.
async function singleBlock(height: number, sidecarUrl: string): Promise<void> {
  const crawler = new NaiveCrawler(sidecarUrl);

  const results = await crawler.crawlBlock(height);
  console.log(results);
}
