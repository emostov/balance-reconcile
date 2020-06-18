import fs from "fs";

import NaiveCrawler from "../classes/naive_crawler";

// TODO make an async version that takes a callback
/**
 * Synchronously loops over a non-inclusive range of block heights, crawls each
 * block and creates or appends to the file given as a parameter with
 * ReconcileInfos that have a non-zero diff.
 *
 * @param start start of block height range
 * @param end non-inclusive end of block height range
 * @param sidecarUrl base url that an instance of sidecar exposes
 * @param fileName name of the file to write to
 */
export async function rangeLog({
  start,
  end,
  sidecarUrl,
  fileName,
}: {
  start: number;
  end: number;
  sidecarUrl: string;
  fileName: string;
}): Promise<void> {
  for (let i = start; i < end; i += 1) {
    const crawler = new NaiveCrawler(sidecarUrl);

    try {
      const result = await crawler.crawlBlock(i);
      const diff = NaiveCrawler.warnWhenDiff(result);
      diff.forEach((line) => {
        console.log(line);
        const withNewLine = `\n${line} `;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        fs.writeFileSync(fileName, withNewLine, {
          flag: "a+",
        });
      });

      // Write a newline character if a block with an issue was found
      if (diff.length) {
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
