import { ApiPromise, WsProvider } from "@polkadot/api";
import fs from "fs";
import { promisify } from "util";

import NaiveCrawler from "./classes/naive_crawler";

async function main(): Promise<void> {
  await singleBlock(189594, "http://127.0.0.1:8080");
}

main().catch(console.log);

async function singleBlock(height: number, sidecarUrl: string): Promise<void> {
  const crawler = new NaiveCrawler(sidecarUrl);

  const results = await crawler.crawlBlock(height);
  console.log(results);
}

const sleep = promisify(setTimeout);

async function cC1Subscribe(sidecarUrl: string): Promise<void> {
  const outputFileName = "CC1_subscribe.txt";
  const crawler = new NaiveCrawler(sidecarUrl);

  const wsProvider = new WsProvider("wss://rpc.polkadot.io");
  const api = await ApiPromise.create({ provider: wsProvider });

  await api.rpc.chain.subscribeNewHeads(async ({ number }) => {
    // I need this because it gets the head to quickly and then sidecar errors
    // out because it thinks the block does not exist
    await sleep(1000);

    console.log(`Checking block ${number.toString()}`);

    try {
      const results = await crawler.crawlBlock(number.toNumber());
      crawler.warnWhenDiff(results).forEach((line) => {
        const withNewLine = `\n${line} `;

        fs.writeFileSync(outputFileName, withNewLine, {
          flag: "a+",
        });
      });

      if (results.length) {
        fs.writeFileSync(outputFileName, "\n", {
          flag: "a+",
        });
      }
    } catch (e) {
      console.log(e);
    }
  });
}
