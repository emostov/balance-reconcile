import { singleBlock } from "./singleBlock";
import { exampleUseOfSubscribeWithLogging } from "./subscribe";

/**
 * If this is your first time using this repo, checkout `singleBlock`. It is
 * a good starting and probably the quickest example to get up and running.
 */
const WS_URL = process.env.NODE_WS_URL || "wss://kusama-rpc.polkadot.io/";
const SIDECAR_URL = process.env.SIDECAR_URL || "http://127.0.0.1:8080/";

async function main(): Promise<void> {
  // await exampleUseOfSubscribeWithLogging(SIDECAR_URL, WS_URL);
  await singleBlock(291678, SIDECAR_URL, WS_URL);
  // await singleBlock(2773005, sidecarUrl, wsUrl);
}

main().catch(console.log);
