import { subscribe, writeNonZeroDiffToFile } from "./subscribe";

/**
 * If this is your first time using this repo, checkout `singleBlock`. It is
 * a good starting and probably the quickest example to get up and running.
 */
async function main(): Promise<void> {
  const sidecarUrl = "http://127.0.0.1:8080/";
  // const sidecarUrl = "http://127.0.0.1:6262/";
  // const wsUrl = "wss://rpc.polkadot.io";

  const wsUrl = "wss://kusama-rpc.polkadot.io/";

  const logger = writeNonZeroDiffToFile("Jun18Sub.txt");

  await subscribe(sidecarUrl, wsUrl, logger);
}

main().catch(console.log);
