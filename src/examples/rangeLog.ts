import fs from "fs";

import NaiveCrawler from "../classes/naive_crawler";

export async function rangeLogKM(
  start: number,
  end: number,
  sidecarUrl: string,
  logName?: string
): Promise<void> {
  // Change file prefix/naming here
  const fileName = logName ?? `log_KM_${start}_to_${end}`;

  for (let i = start; i < end; i += 1) {
    const crawler = new NaiveCrawler(sidecarUrl);
    // console.log(`Checking block ${i}`);
    try {
      const result = await crawler.crawlBlock(i);
      const diff = crawler.warnWhenDiff(result);
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
