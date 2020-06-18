import fs from "fs";

import NaiveCrawler from "../classes/naive_crawler";

interface RangeLogArgs {
  start: number;
  end: number;
  sidecarUrl: string;
  fileName: string;
}

interface AsyncRangeCrawlArgs {
  start: number;
  end: number;
  sidecarUrl: string;
  callback: (crawler: NaiveCrawler, height: number) => Promise<void>;
}

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
}: RangeLogArgs): Promise<void> {
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

/**
 * Create NaiveCrawler and then loops over the non-inclusive range start..end,
 * executing the callback at each height.
 *
 * Consider using this function when ordering of crawling blocks
 * does not matter, but you want to try and crawl every block in a range quickly.
 *
 */
export function asyncRangeCrawl({
  start,
  end,
  sidecarUrl,
  callback,
}: AsyncRangeCrawlArgs): void {
  const crawler = new NaiveCrawler(sidecarUrl);
  for (let i = start; i < end; i += 1) {
    void callback(crawler, i);
  }
}

export const logCBForAsyncRangeCrawl = (fileName: string) => async (
  crawler: NaiveCrawler,
  height: number
): Promise<void> => {
  try {
    const infos = await crawler.crawlBlock(height);
    const diff = NaiveCrawler.warnWhenDiff(infos);
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
    console.error(`Issue while trying to crawl block at height ${height}`);
  }
};

export function exampleUsageOfAsyncRange(sidecarUrl: string): void {
  const logger = logCBForAsyncRangeCrawl("example_asyncRangeCrawl_log.txt");

  asyncRangeCrawl({ start: 1, end: 1_000_000, sidecarUrl, callback: logger });
}
