import { ApiPromise, WsProvider } from "@polkadot/api";
import fs from "fs";
import { promisify } from "util";

import NaiveCrawler from "./classes/naive_crawler";

const sleep = promisify(setTimeout);

async function main(): Promise<void> {
  const url = "http://127.0.0.1:6161/";
  // await singleBlock(189594, "http://127.0.0.1:8080");

  void rangeLogKM(2_548_000, 2_573_000, url);

  void rangeLogKM(2_573_000, 2_598_000, url);

  void rangeLogKM(2_598_000, 2_623_000, url);

  await sleep(10 * 1000);

  await rangeLogKM(2_623_000, 2_648_000, url);
}

main().catch(console.log);

async function singleBlock(height: number, sidecarUrl: string): Promise<void> {
  const crawler = new NaiveCrawler(sidecarUrl);

  const results = await crawler.crawlBlock(height);
  console.log(results);
}

async function rangeLogKM(
  start: number,
  end: number,
  sidecarUrl: string
): Promise<void> {
  const crawler = new NaiveCrawler(sidecarUrl);
  const fileName = `log_KM_${start}+${end}`;

  // Restarting check with reconciler updated for staking rewards
  for (let i = start; i < end; i += 1) {
    console.log(`Checking block ${i}`);
    try {
      const result = await crawler.crawlBlock(i);
      crawler.warnWhenDiff(result).forEach((line) => {
        const withNewLine = `\n${line} `;
        console.log(withNewLine);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        fs.writeFileSync(fileName, withNewLine, {
          flag: "a+",
        });
      });
      if (result.length) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        fs.writeFileSync(fileName, "\n", {
          flag: "a+",
        });
      }
    } catch (e) {
      console.log(e);
    }
  }
}

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
