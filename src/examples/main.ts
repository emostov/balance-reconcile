import fs from "fs";

import NaiveCrawler from "../classes/naive_crawler";
import { ReconcileInfo } from "../types/types";
// // import { b1 } from "./ksmBatch1";
// import { jun15Batch } from "./ksmJun15Batch";
// import { subscribe } from "./subscribe";
import { categorizeExample } from "./categorize";

async function main(): Promise<void> {
  const sidecarUrl = "http://127.0.0.1:8080/";
  const wsUrl = "wss://rpc.polkadot.io";
  await singleBlock(324511, sidecarUrl, wsUrl);
}

main().catch(console.log);

/**
 * console.log the result of crawling a single block. A good starting point
 * for quickly trying things out.
 *
 * @param height block height
 * @param sidecarUrl base url of an instance of sidecar
 */
async function singleBlock(
  height: number,
  sidecarUrl: string,
  wsUrl: string
): Promise<void> {
  const crawler = new NaiveCrawler(sidecarUrl, wsUrl);

  const results = await crawler.crawlBlock(height);
  console.log(results);
}
