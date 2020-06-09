async function KM1062Check3(): Promise<void> {
	const crawler = new NaiveCrawler("http://127.0.0.1:5000");

	// Restarting check with reconciler updated for staking rewards
	for (let i = 2_562_763; i < 2_648_000; i += 1) {
		console.log(`Checking block ${i}`);
		try {
			const result = await crawler.crawlBlock(i);
			crawler.warnWhenDiff(result).forEach((line) => {
				const withNewLine = `\n${line} `;
				console.log(withNewLine);
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
				fs.writeFileSync("log_KM_blocks_2_562_763-2_648_000.txt", withNewLine, {
					flag: "a+",
				});
			});
			if (result.length) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
				fs.writeFileSync("log_KM_blocks_2_562_763-2_648_000.txt", "\n", {
					flag: "a+",
				});
			}
		} catch (e) {
			console.log(e);
		}
	}
}

async function KM1062Check2(): Promise<void> {
	const crawler = new NaiveCrawler("http://127.0.0.1:5000");

	// Restarting check with reconciler updated for staking rewards
	for (let i = 2_558_707; i < 2_648_000; i += 1) {
		console.log(`Checking block ${i}`);
		try {
			const result = await crawler.crawlBlock(i);
			crawler.warnWhenDiff(result).forEach((line) => {
				const withNewLine = `\n${line} `;
				console.log(withNewLine);
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
				fs.writeFileSync("log_KM_blocks_2_558_706-2_648_000.txt", withNewLine, {
					flag: "a+",
				});
			});
			if (result.length) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
				fs.writeFileSync("log_KM_blocks_2_558_706-2_648_000.txt", "\n", {
					flag: "a+",
				});
			}
		} catch (e) {
			console.log(e);
		}
	}
}

async function KM1062Check(): Promise<void> {
	const crawler = new NaiveCrawler("http://127.0.0.1:5000");

	for (let i = 2_548_000; i < 2_648_000; i += 1) {
		console.log(`Checking block ${i}`);
		try {
			const result = await crawler.crawlBlock(i);
			crawler.warnWhenDiff(result).forEach((line) => {
				const withNewLine = `\n${line} `;
				console.log(withNewLine);
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
				fs.writeFileSync("log_KM_blocks_2_548_000-2_648_000.txt", withNewLine, {
					flag: "a+",
				});
			});
			if (result.length) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
				fs.writeFileSync("log_KM_blocks_2_548_000-2_648_000.txt", "\n", {
					flag: "a+",
				});
			}
		} catch (e) {
			console.log(e);
		}
	}
}

async function CC1FirstCheck(): Promise<void> {
	const crawler = new NaiveCrawler(sidecarBaseUrlDev);

	// check small ranges so an error does not mess up to much
	for (let i = 5; i < 174_000; i += 1) {
		console.log(`Checking range block ${i}`);
		try {
			const result = await crawler.crawlBlock(i);
			crawler.warnWhenDiff(result).forEach((line) => {
				const withNewLine = `\n${line} `;
				console.log(withNewLine);
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
				fs.writeFileSync("log_blocks_5-200_000.txt", withNewLine, {
					flag: "a+",
				});
			});
			if (result.length) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
				fs.writeFileSync("log.txt", "\n", { flag: "a+" });
			}
		} catch (e) {
			console.log(e);
		}
	}