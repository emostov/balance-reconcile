import {
  AddressAndBlock,
  BlockResponse,
  CategorizeInfos,
  ReconcileInfo,
} from "../types/types";
import Reconciler from "./reconciler";
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

  // AddressAndBlock -> AddressAtBlock
  // fn name -> reconcileAddressesAtBlock
  // For the input: have an array of addresses, and the block
  // to make it more clear
  async crawlAddressAndBlock(
    toCheck: AddressAndBlock[]
  ): Promise<ReconcileInfo[]> {
    // my brain is sleepy, pls help me name variables

    const reconcilePromises = toCheck.map(async ({ address, block }) => {
      return await this.reconciler.reconcileAddressAtHeight(
        address,
        Number(block)
      );
    });

    return await Promise.all(reconcilePromises);
  }

  // Look into having this automatically happen in crawling when env is dev
  warnWhenDiff(infos: ReconcileInfo[]): string[] {
    const updates: string[] = [];

    infos.forEach((info) => {
      if (BigInt(info.actualVsExpectedDiff) !== BigInt(0)) {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        updates.push(`Log for block number ${infos[0].block}`);
        updates.push(`issue ${info.block}`);
        updates.push(JSON.stringify(info, null, "  "));
      }
    });

    return updates;
  }

  // TODO potentially use a SQL database to be able to do queries
  async categorize(
    infos: ReconcileInfo[],
    preBuiltCategorize?: CategorizeInfos
  ): Promise<string> {
    const categorizeInfos: CategorizeInfos = preBuiltCategorize ?? {};

    for (const info of infos) {
      if (BigInt(info.actualVsExpectedDiff) !== BigInt(0)) {
        // query for version
        const { specVersion } = await this.api.getTxArtifacts(info.block);
        if (!(specVersion in categorizeInfos))
          categorizeInfos[specVersion] = {};

        for (const ext of info.relevantExtrinsics) {
          const [module, call] = ext.split(".");

          if (!(module in categorizeInfos[specVersion]))
            categorizeInfos[specVersion][module] = {};

          if (!(call in categorizeInfos[specVersion][module]))
            categorizeInfos[specVersion][module][call] = [];

          categorizeInfos[specVersion][module][call].push(info);
        }
      }
    }

    return JSON.stringify(categorizeInfos, null, "  ");
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
