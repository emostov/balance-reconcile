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
    const prevReserveBalance = this.parseNumber(prevBalance.reserved);
    const currFreeBalance = this.parseNumber(curBalance.free);
    const currReserveBalance = this.parseNumber(curBalance.reserved);

    const partialFees = this.partialFees(address, block);
    const transfers = this.transfers(address, block);
    const tips = this.tips(address, block);
    const incomingTransfers = this.incomingTransfers(address, block);
    const endowment = this.endowment(address, block);
    const stakingRewards = await this.stakingRewards(address, block);
    const claimed = this.claimed(address, block);
    // TODO? if endowed then expected_previous_balance == 0
    const lostDust = this.lostDust(address, block);

    const expectedBalance: number =
      prevFreeBalance +
      prevReserveBalance -
      transfers -
      lostDust -
      tips -
      partialFees +
      endowment +
      incomingTransfers +
      stakingRewards +
      claimed;

    return {
      // maybe should add a notes section
      block: height,
      address,
      actualVsExpectedDiff:
        currFreeBalance + currReserveBalance - expectedBalance,
      currFreeBalance,
      currReserveBalance,
      expectedBalance,
      prevFreeBalance,
      prevReserveBalance,
      partialFees,
      lostDust,
      transfers,
      incomingTransfers,
      endowment,
      stakingRewards,
      tips,
      claimed,
    };
  }

  // In the future, it may be nice to log all the relevant extrinsics to the address
  // for better records.

  // Also these functions could be broken up so that operate within a loop that goes
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

  private isSuccess(ext: Extrinsic) {
    return ext.success;
  }

  private transfers(address: string, block: BlockResponse): number {
    const { extrinsics } = block;
    let sum = 0;
    extrinsics.forEach((ext: Extrinsic): void => {
      // TODO deal with any type of nested calls like
      // if(ext.method == "utility.batch"){}
      if (this.isTransferOutOfAddress(address, ext) && this.isSuccess(ext)) {
        sum += this.parseNumber(ext.args[1]);
      }
    });

    return sum;
  }

  private isTransferIntoAddress(
    address: string,
    ext: Extrinsic
  ): boolean | null {
    const [dest] = ext.args;
    return (
      (ext.method == "balances.transferKeepAlive" ||
        ext.method == "balances.transfer") &&
      dest === address
    );
  }

  private incomingTransfers(address: string, block: BlockResponse): number {
    const { extrinsics } = block;
    let sum = 0;
    extrinsics.forEach((ext: Extrinsic): void => {
      // TODO deal with any type of nested calls like
      // if(ext.method == "utility.batch"){}
      if (this.isTransferIntoAddress(address, ext) && this.isSuccess(ext)) {
        sum += this.parseNumber(ext.args[1]);
      }
    });

    return sum;
  }

  private isSigner(address: string, ext: Extrinsic) {
    return ext.signature && ext.signature.signer == address;
  }

  private tips(address: string, block: BlockResponse): number {
    const { extrinsics } = block;
    let tips = 0;

    extrinsics.forEach((ext) => {
      if (ext.tip && this.isSigner(address, ext)) {
        tips += this.parseNumber(ext.tip);
      }
    });

    return tips;
  }

  private async stakingRewards(
    address: string,
    block: BlockResponse
  ): Promise<number> {
    const { extrinsics, number } = block;
    let rewards = 0;
    for (const ext of extrinsics) {
      const { events } = ext;

      for (const event of events) {
        const { method, data } = event;
        const [stash, amount] = data;
        console.log(method);
        // we should have these methods as constants somewhere to avoid fat thumb errors
        if (!(method === "staking.Reward")) continue;

        const { rewardDestination, bonded } = await this.api.getPayoutInfo(
          stash,
          this.parseNumber(number)
        );

        if (
          (rewardDestination === "Staked" || rewardDestination === "Stash") &&
          stash === address
        ) {
          rewards += this.parseNumber(amount);
        } else if (rewardDestination === "Controller" && bonded === address) {
          rewards += this.parseNumber(amount);
        }
      }
    }

    return rewards;
  }

  private endowment(address: string, block: BlockResponse): number {
    const { extrinsics } = block;
    let endowed = 0;
    extrinsics.forEach((ext): void => {
      const { events } = ext;

      events.forEach((event: PEvent): void => {
        const { method, data } = event;
        const [endowAddr, amount] = data;

        // we should have these methods as constants somewhere to avoid fat thumb errors
        if (method === "balances.Endowed" && endowAddr === address) {
          endowed += this.parseNumber(amount);
        }
      });
    });

    return endowed;
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
          dust += this.parseNumber(amount);
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

  private claimed(address: string, block: BlockResponse): number {
    let claimed = 0;
    const { extrinsics } = block;

    extrinsics.forEach((ext): void => {
      const { events } = ext;

      events.forEach((event: PEvent): void => {
        const { method, data } = event;
        const [claimsAddr, , amount] = data;

        if (method === "claims.Claimed" && claimsAddr === address) {
          claimed += this.parseNumber(amount);
        }
      });
    });

    return claimed;
  }

  private parseNumber(n: string): number {
    const num = Number(n);

    if (!Number.isInteger(num)) {
      throw { error: "Failed parsing a number" };
    }

    return num;
  }
}
