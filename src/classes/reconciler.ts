import {
  BlockResponse,
  Extrinsic,
  PEvent,
  ReconcileInfo,
} from "../types/types";
import SideCarApi from "./sidecar_api";

export default class Reconciler {
  api: SideCarApi;
  // Not 100% sure this is accurate since I could not find def in runtime.
  readonly DOLLAR = 10_000_000_000;
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

    const prevFreeBalance = BigInt(prevBalance.free);
    const prevReserveBalance = BigInt(prevBalance.reserved);
    const currFreeBalance = BigInt(curBalance.free);
    const currReserveBalance = BigInt(curBalance.reserved);

    const partialFees = this.partialFees(address, block);
    const transfers = this.transfers(address, block);
    const tips = this.tips(address, block);
    const incomingTransfers = this.incomingTransfers(address, block);
    const endowment = this.endowment(address, block);
    const stakingRewards = await this.stakingRewards(address, block);
    const claimed = this.claimed(address, block);
    const blockReward = this.blockReward(address, block);
    // TODO? if endowed then expected_previous_balance == 0
    const lostDust = this.lostDust(address, block);
    const repatriatedReserves = this.repatriatedReserved(address, block);

    const expectedBalance: bigint =
      prevFreeBalance +
      prevReserveBalance -
      transfers -
      lostDust -
      tips -
      partialFees +
      endowment +
      incomingTransfers +
      stakingRewards +
      claimed +
      repatriatedReserves +
      blockReward;

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
      repatriatedReserves,
      blockReward,
    };
  }

  // In the future, it may be nice to log all the relevant extrinsics to the address
  // for better records.

  // Also these functions could be broken up so that operate within a loop that goes
  // through extrinsics instead of each doing there own loop.
  private partialFees(address: string, block: BlockResponse): bigint {
    const { extrinsics } = block;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    let sum = BigInt(0);
    extrinsics.forEach((ext: Extrinsic): void => {
      // TODO deal with any type of nested calls
      // if(ext.method == "utility.batch"){}
      const {
        signature,
        info: { partialFee },
      } = ext;

      if (signature?.signer === address && typeof partialFee === "string") {
        sum += BigInt(partialFee);
      }
    });

    return sum;
  }

  private transfers(address: string, block: BlockResponse): bigint {
    const { extrinsics } = block;
    let sum = BigInt(0);
    extrinsics.forEach((ext: Extrinsic): void => {
      // TODO deal with any type of nested calls like
      // if(ext.method == "utility.batch"){}
      if (this.isTransferOutOfAddress(address, ext) && this.isSuccess(ext)) {
        sum += BigInt(ext.args[1]);
      }
    });

    return sum;
  }

  private incomingTransfers(address: string, block: BlockResponse): bigint {
    const { extrinsics } = block;
    let sum = BigInt(0);
    extrinsics.forEach((ext: Extrinsic): void => {
      // TODO deal with any type of nested calls like
      // if(ext.method == "utility.batch"){}
      if (this.isTransferIntoAddress(address, ext) && this.isSuccess(ext)) {
        sum += BigInt(ext.args[1]);
      }
    });

    return sum;
  }

  private tips(address: string, block: BlockResponse): bigint {
    const { extrinsics } = block;
    let tips = BigInt(0);

    extrinsics.forEach((ext) => {
      if (ext.tip && this.isSigner(address, ext)) {
        tips += BigInt(ext.tip);
      }
    });

    return tips;
  }

  private async stakingRewards(
    address: string,
    block: BlockResponse
  ): Promise<bigint> {
    const { extrinsics, number } = block;
    let rewards = BigInt(0);
    for (const ext of extrinsics) {
      const { events } = ext;

      for (const event of events) {
        const { method, data } = event;
        const [stash, amount] = data;
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
          rewards += BigInt(amount);
        } else if (rewardDestination === "Controller" && bonded === address) {
          rewards += BigInt(amount);
        }
      }
    }

    return rewards;
  }

  private endowment(address: string, block: BlockResponse): bigint {
    const { extrinsics } = block;
    let endowed = BigInt(0);
    extrinsics.forEach((ext): void => {
      const { events } = ext;

      events.forEach((event: PEvent): void => {
        const { method, data } = event;
        const [endowAddr, amount] = data;

        // we should have these methods as constants somewhere to avoid fat thumb errors
        if (method === "balances.Endowed" && endowAddr === address) {
          endowed += BigInt(amount);
        }
      });
    });

    return endowed;
  }

  private lostDust(address: string, block: BlockResponse): bigint {
    const killed = this.killedAccounts(block);

    if (!(address in killed)) return BigInt(0);

    const { extrinsics } = block;
    let dust = BigInt(0);
    extrinsics.forEach((ext): void => {
      const { events } = ext;

      events.forEach((event: PEvent): void => {
        const { method, data } = event;
        const [deadAddr, amount] = data;

        if (method === "balances.DustLost" && deadAddr === address) {
          dust += BigInt(amount);
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

  private claimed(address: string, block: BlockResponse): bigint {
    let claimed = BigInt(0);
    const { extrinsics } = block;

    extrinsics.forEach((ext): void => {
      const { events } = ext;

      events.forEach((event: PEvent): void => {
        const { method, data } = event;
        const [claimsAddr, , amount] = data;

        if (method === "claims.Claimed" && claimsAddr === address) {
          claimed += BigInt(amount);
        }
      });
    });

    return claimed;
  }

  private repatriatedReserved(address: string, block: BlockResponse): bigint {
    const { extrinsics } = block;
    let repatriated = BigInt(0);

    extrinsics.forEach((ext): void => {
      const { events } = ext;

      events.forEach((event: PEvent): void => {
        const { method, data } = event;
        const [, reporter, isSuccess] = data;

        if (
          method === "electionsPhragmen.VoterReported" &&
          isSuccess &&
          reporter === address
        ) {
          repatriated += BigInt(5 * this.DOLLAR);
        }
      });
    });

    return repatriated;
  }

  private blockReward(address: string, block: BlockResponse): bigint {
    const { extrinsics } = block;
    let reward = BigInt(0);

    for (const ext of extrinsics) {
      const { events } = ext;

      for (const event of events) {
        const { method, data } = event;
        const [blockAuthor, amount] = data;
        if (method === "balances.Deposit" && blockAuthor === address) {
          reward += BigInt(amount);
        }
      }
    }

    return reward;
  }

  // boolean "is" methods
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

  private isSigner(address: string, ext: Extrinsic) {
    return ext.signature && ext.signature.signer == address;
  }

  private parseNumber(n: string): number {
    const num = Number(n);

    if (!Number.isInteger(num)) {
      throw { error: "Failed parsing a number" };
    }

    return num;
  }
}
