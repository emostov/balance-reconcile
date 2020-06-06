import {
  BlockResponse,
  Extrinsic,
  PEvent,
  ReconcileInfo,
} from "../types/types";
import SideCarApi from "./sidecar_api";

export default class Reconciler {
  api: SideCarApi;
  constructor(sidecarBaseUrl: string) {
    this.api = new SideCarApi(sidecarBaseUrl);
  }

  // Work on a graceful exit?
  async reconcileAtHeight(
    address: string,
    height: number
  ): Promise<ReconcileInfo> {
    const prevBalance = await this.api.getBalance(address, height - 1);
    const curBalance = await this.api.getBalance(address, height);
    const block = await this.api.getBlock(height);

    const prevFreeBalance = this.parseNumber(prevBalance.free);
    const curFreeBalance = this.parseNumber(curBalance.free);

    const partialFees = this.partialFees(address, block);

    const transfers = this.transfers(address, block);
    const lostDust = this.lostDust(address, block);

    const expectedBalance: number =
      prevFreeBalance - transfers - lostDust - partialFees;

    return {
      // maybe should add a notes section
      block: height,
      address,
      actualVsExpectedDiff: curFreeBalance - expectedBalance,
      expectedBalance,
      prevFreeBalance,
      curFreeBalance,
      partialFees,
      lostDust,
      transfers,
    };
  }

  // In the future, it may be nice to log all the relevant extrinsics to the address
  // for better records.

  // Also these function should be broken up so that operate within a loop that goes
  // through extrinsics instead of each doing there own loop.
  private partialFees(address: string, block: BlockResponse): number {
    const { extrinsics } = block;
    let sum = 0;
    extrinsics.forEach((ext: Extrinsic): void => {
      // TODO deal with any type of nested calls
      // if(ext.method == "utility.batch"){}
      const {
        signature,
        info: { partialFee },
      } = ext;

      if (signature && signature.signer === address && partialFee) {
        sum += this.parseNumber(partialFee);
      }
    });

    return sum;
  }

  private isTransferOutOfAddress(
    address: string,
    ext: Extrinsic
  ): boolean | null {
    return (
      ext.signature &&
      ext.signature.signer == address &&
      (ext.method == "balances.transferKeepAlive" ||
        ext.method == "balances.transfer")
    );
  }

  private transfers(address: string, block: BlockResponse): number {
    const { extrinsics } = block;
    let sum = 0;
    extrinsics.forEach((ext: Extrinsic): void => {
      // TODO deal with any type of nested calls like
      // if(ext.method == "utility.batch"){}
      if (this.isTransferOutOfAddress(address, ext)) {
        sum += this.parseNumber(ext.args[1]);
      }
    });

    return sum;
  }

  private lostDust(address: string, block: BlockResponse): number {
    const killed = this.killedAccounts(block);

    if (!(address in killed)) return 0;

    const { extrinsics } = block;
    let dust = 0;
    extrinsics.forEach((ext): void => {
      const { events } = ext;

      events.forEach((event: PEvent): void => {
        const { method, data } = event;
        const [deadAddr, amount] = data;

        if (method === "balances.DustLost" && deadAddr === address) {
          dust += this.parseNumber(amount); // Can we break here?
        }
      });
    });

    return dust;
  }

  private killedAccounts(block: BlockResponse): Record<string, boolean> {
    const killed: Record<string, boolean> = {}; // Should this be Set instead?
    const { extrinsics } = block;

    extrinsics.forEach((ext): void => {
      const { events } = ext;

      events.forEach((event: PEvent): void => {
        if (event.method === "system.KilledAccount") {
          const [deadAddr] = event.data;
          if (!(deadAddr in killed)) {
            killed[deadAddr] = true;
          }
        }
      });
    });

    return killed;
  }

  private parseNumber(n: string): number {
    const num = Number(n);

    if (!Number.isInteger(num)) {
      throw { error: "Failed parsing a number" };
    }

    return num;
  }
}
