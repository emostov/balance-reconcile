import NaiveCrawler from "./classes/naive_crawler";

const sidecarBaseUrlDev = "http://127.0.0.1:8080";

import {
  interestingCC1,
  postUpgrade0Random,
  postUpgrade0Staking,
} from "./data";

async function main(): Promise<void> {
  const crawler = new NaiveCrawler(sidecarBaseUrlDev);

  // console.log(await crawler.crawl(interestingCC1));

  console.log(await crawler.crawl(postUpgrade0Staking));

  // console.log(await crawler.crawlBlockRange(50, 56));
  // console.log(await crawler.crawlBlockRange(50, 56));
}

main().catch(console.log);
