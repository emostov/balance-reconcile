import NaiveCrawler from "./classes/naive_crawler";

const sidecarBaseUrlDev = "http://127.0.0.1:8080";

import { interestingCC1 } from "./data";

async function main(): Promise<void> {
  const crawler = new NaiveCrawler(sidecarBaseUrlDev);

  console.log(await crawler.crawl(interestingCC1));
}

main().catch(console.log);
