// import { subscribe, writeNonZeroDiffToFile } from "./subscribe";

// const WS_URL = process.env.NODE_WS_URL || "wss://kusama-rpc.polkadot.io/";
// const SIDECAR_URL = process.env.SIDECAR_URL || "http://127.0.0.1:8080/";

import SidecarApi from "../classes/sidecar_api";
import { cc1Blocks } from "./cc1Blocks";
/**
 * If this is your first time using this repo, checkout `singleBlock`. It is
 * a good starting and probably the quickest example to get up and running.
 */
async function main(): Promise<void> {
  const sidecarUrl = "http://127.0.0.1:8080/";
  const sidecar = new SidecarApi(sidecarUrl);

  await sidecar.sleep(30 * 1000);

  // push request into array
  // every 100th request clear array
  let results = [];
  for (const n of cc1Blocks) {
    if (n % 3 === 0) {
      results = [];
    }

    void sidecar.getBlock(n).then((res) => results.push(res));
    void sidecar
      .getBalance(`13RDY9nrJpyTDBSUdBw12dGwhk19sGwsrVZ2bxkzYHBSagP2`, n)
      .then((res) => results.push(res));

    void sidecar
      .getVesting(`13RDY9nrJpyTDBSUdBw12dGwhk19sGwsrVZ2bxkzYHBSagP2`, n)
      .then((res) => results.push(res));

    void sidecar.getStakingProgress(n).then((res) => results.push(res));

    void sidecar.getTxArtifacts(n).then((res) => results.push(res));

    void sidecar.getMetadata(n).then((res) => results.push(res));

    // sleep a quarter second
    await sidecar.sleep(1 * 50);
  }

  console.log("Done checking cc1Blocks");

  // Make sure all the requests have finished
  await sidecar.sleep(120 * 1000);

	// finish up1
  process.exit(0);
}

main().catch(console.log);
// main();
