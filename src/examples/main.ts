import fs from "fs";

import NaiveCrawler from "../classes/naive_crawler";
import { ReconcileInfo } from "../types/types";
// // import { b1 } from "./ksmBatch1";
// import { jun15Batch } from "./ksmJun15Batch";
// import { subscribe } from "./subscribe";
import { categorizeExample } from "./categorize";

async function main(): Promise<void> {
  const sidecarUrl = "http://127.0.0.1:8080/";
  const crawler = new NaiveCrawler(sidecarUrl);
  let infos: ReconcileInfo[] = [];
  for (let i = 2_760_000; i < 2_767_701; i += 1) {
    infos = infos.concat(await crawler.crawlBlock(i));
  }

  const categorizedInfos = await crawler.categorize(infos);
  fs.writeFileSync("cat2_760_000-2_767_701", categorizedInfos);
  console.log(categorizedInfos);
}

main().catch(console.log);

// Fetch and print a single block.
async function singleBlock(height: number, sidecarUrl: string): Promise<void> {
  const crawler = new NaiveCrawler(sidecarUrl);

  const results = await crawler.crawlBlock(height);
  console.log(results);
}
