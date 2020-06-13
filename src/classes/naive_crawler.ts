import { AddressAndBlock, BlockResponse, ReconcileInfo } from "../types/types";
import Reconciler from "./one_time_reconciler";
import SideCarApi from "./sidecar_api";

export default class NaiveCrawler {
  reconciler: Reconciler;
  api: SideCarApi;
  constructor(sideCarUrl: string) {
    this.reconciler = new Reconciler(sideCarUrl);
    this.api = new SideCarApi(sideCarUrl);
  }

  // non-inclusive
  async crawlRange(start: number, end: number): Promise<ReconcileInfo[]> {
    const reconcileInfos: ReconcileInfo[] = [];

    for (let height = start; height < end; height += 1) {
      reconcileInfos.push(...(await this.crawlBlock(height)));
    }

    return reconcileInfos;
  }

  async crawlHeightArray(heights: number[]): Promise<ReconcileInfo[]> {
    const reconcileInfos: ReconcileInfo[] = [];

    for (let idx = 0; idx < heights.length; idx += 1) {
      const height = heights[idx];
      reconcileInfos.push(...(await this.crawlBlock(height)));
    }

    return reconcileInfos;
  }

  async crawlBlock(height: number): Promise<ReconcileInfo[]> {
    const blockResponse = await this.api.getBlock(height);

    const addresses = this.findSigners(blockResponse);

    const toCheck = addresses.map(
      (address): AddressAndBlock => {
        return {
          address,
          block: height.toString(),
        };
      }
    );

    return await this.crawlAddressAndBlock(toCheck);
  }

  async crawlAddressAndBlock(
    toCheck: AddressAndBlock[]
  ): Promise<ReconcileInfo[]> {
    // my brain is sleepy, pls help me name variables

    const reconcilePromises = toCheck.map(async ({ address, block }) => {
      return await this.reconciler.reconcileAtHeight(address, Number(block));
    });

    return await Promise.all(reconcilePromises);
  }

  warnWhenDiff(infos: ReconcileInfo[]): string[] {
    let count = 0;
    const updates: string[] = [];

    if (!infos.length) {
      return updates;
    }

    updates.push(`Log for block number ${infos[0].block}`);

    infos.forEach((info) => {
      if (info.actualVsExpectedDiff !== BigInt(0)) {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`${info.block} has an issue`);
        console.log(info);
        updates.push(`${info.block} has an issue`);
        updates.push(JSON.stringify(info));
        count += 1;
      } else {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`${info.block} looks ok`);
        updates.push(`${info.block} looks ok`);
      }
    });

    console.log(`Found ${count} discrepancies`);

    return updates;
  }

  private findSigners(block: BlockResponse): string[] {
    const signers: string[] = [];
    const { extrinsics } = block;

    extrinsics.forEach((ext): void => {
      const { signature } = ext;

      // Second half of this expression prevents from having multiple
      // reconcileInfo for an address in a block
      if (signature?.signer && !(signers.indexOf(signature.signer) > -1)) {
        signers.push(signature.signer);
      }
    });

    return signers;
  }
}
