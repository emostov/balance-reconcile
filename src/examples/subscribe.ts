import { ApiPromise, WsProvider } from "@polkadot/api";
import fs from "fs";
import { promisify } from "util";

const sleep = promisify(setTimeout);

import NaiveCrawler from "../classes/naive_crawler";

export async function subscribe(
  sidecarUrl: string,
  outputFileName: string,
  wsUrl: string
): Promise<void> {
  const crawler = new NaiveCrawler(sidecarUrl);

  const wsProvider = new WsProvider(wsUrl);
  const api = await ApiPromise.create({ provider: wsProvider });

  await api.rpc.chain.subscribeNewHeads(async ({ number }) => {
    // I need this because it gets the head too quickly and then sidecar errors
    // out because it thinks the block does not exist
    await sleep(1000);

    console.log(`Checking block ${number.toString()}`);

    try {
      const results = await crawler.crawlBlock(number.toNumber());
      const diff = crawler.warnWhenDiff(results);
      diff.forEach((line) => {
        const withNewLine = `\n${line} `;

        fs.writeFileSync(outputFileName, withNewLine, {
          flag: "a+",
        });
      });

      if (diff.length) {
        fs.writeFileSync(outputFileName, "\n", {
          flag: "a+",
        });
      }
    } catch (e) {
      console.log(e);
    }
  });
}
