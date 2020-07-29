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

    // We are big org and different parts of the org are making requests
    void sidecar.getBlock(n).then((res) => results.push(res));
    void sidecar
      .getBalance(`13RDY9nrJpyTDBSUdBw12dGwhk19sGwsrVZ2bxkzYHBSagP2`, n)
      .then((res) => results.push(res));

    void sidecar
      .getVesting(`13RDY9nrJpyTDBSUdBw12dGwhk19sGwsrVZ2bxkzYHBSagP2`, n)
      .then((res) => results.push(res));

    void sidecar.getStakingProgress(n).then((res) => results.push(res));

    void sidecar.getTxArtifacts(n).then((res) => results.push(res));

    void sidecar.getMetadata(n).then((res) => {
      console.log(`got metadata for block {n}`);
      results.push(res);
    });

    // 50ms sleep, maybe a little more realistic?
    await sidecar.sleep(1 * 50);
  }

  console.log("Done checking cc1Blocks");

  // 6 requests per loop
  // expected response time upper bound is ~5 seconds
  // loop over 163 blocks
  // 6 * (5 * 1_000) * 163 -> 4890000ms or 4890s or 81.5 minutes
  await sidecar.sleep(4890000);

  // finish up!
  process.exit(0);
}

main().catch(console.log);
