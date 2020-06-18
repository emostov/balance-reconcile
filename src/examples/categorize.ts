import fs from "fs";

import NaiveCrawler from "../classes/naive_crawler";

// TODO show usage of categorize with multiple threads

export async function categorizeExample(sidecarUrl: string): Promise<void> {
  const crawler = new NaiveCrawler(sidecarUrl);

  // Create an array of ReconcileInfo's by crawling
  const reconcileInfos = await crawler.crawlHeightArray([
    2681075,
    2695070,
    2662071,
    2257900,
    2217889,
    2610074,
  ]);

  // Feed the array of ReconcileInfos to categorize in order to get back a
  // ready-to-print JSON string of the categorize ReconcileInfo's
  const categorizedInfos = await crawler.categorize(reconcileInfos);

  // Write the JSON to a file
  fs.writeFileSync("categorize_example.txt", categorizedInfos);
  console.log(categorizedInfos);
}
