import fs from "fs";

import NaiveCrawler from "../classes/naive_crawler";

export async function rangeLogKM(
  start: number,
  end: number,
  sidecarUrl: string
): Promise<void> {
  const crawler = new NaiveCrawler(sidecarUrl);

  // Change file prefix/naming here
  const fileName = `log_KM_${start}_to_${end}`;

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
