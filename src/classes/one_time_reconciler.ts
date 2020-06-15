import {
  BlockResponse,
  Extrinsic,
  PEvent,
  ReconcileInfo,
} from "../types/types";
import SideCarApi from "./sidecar_api";

export default class OneTimeReconciler {
  api: SideCarApi;
  readonly DOLLAR = 10_000_000_000;
  //TODO
  // address: string;
  // height: number;
  constructor(sidecarBaseUrl: string) {
    this.api = new SideCarApi(sidecarBaseUrl);

    // TODO replace address and height as params and just use these instead
    // this.address = address;
    // this.height = height;
  }

  // Work on a graceful exit?
  async reconcileAtHeight(
    address: string,
    height: number
  ): Promise<ReconcileInfo> {
    const prevBalance = await this.api.getBalance(address, height - 1);
    const curBalance = await this.api.getBalance(address, height);
    const block = await this.api.getBlock(height);

    const events: string[] = [];
    const extrinsics = this.extrinsics(address, block);

    const prevFreeBalance = BigInt(prevBalance.free);
    const prevReserveBalance = BigInt(prevBalance.reserved);
    const currFreeBalance = BigInt(curBalance.free);
    const currReserveBalance = BigInt(curBalance.reserved);

    const partialFees = this.partialFees(address, block);
    const transfers = this.transfers(address, block);
    const incomingTransfers = this.incomingTransfers(address, block);
    const tips = this.tips(address, block, events);
    const stakingRewards = await this.stakingRewards(address, block, events);
    const endowment = this.endowment(address, block, events);
    const claimed = this.claimed(address, block, events);
    // TODO? if endowed then expected_previous_balance == 0
    const lostDust = this.lostDust(address, block, events);
    const repatriatedReserves = this.repatriatedReserved(
      address,
      block,
      events
    );
    const blockReward = this.blockReward(address, block, events);
    // TODO test this on a block that actually has slashing.
    const slashes = this.slashes(address, block, events);

    const expectedBalance: bigint =
      prevFreeBalance +
      prevReserveBalance -
      transfers -
      lostDust -
      tips -
      partialFees -
      slashes +
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
      actualVsExpectedDiff: (
        currFreeBalance +
        currReserveBalance -
        expectedBalance
      ).toString(),
      expectedBalance: expectedBalance.toString(),
      currFreeBalance: currFreeBalance.toString(),
      currReserveBalance: currReserveBalance.toString(),
      prevFreeBalance: prevFreeBalance.toString(),
      prevReserveBalance: prevReserveBalance.toString(),
      partialFees: partialFees.toString(),
      lostDust: lostDust.toString(),
      transfers: transfers.toString(),
      incomingTransfers: incomingTransfers.toString(),
      endowment: endowment.toString(),
      stakingRewards: stakingRewards.toString(),
      tips: tips.toString(),
      slashes: slashes.toString(),
      claimed: claimed.toString(),
      repatriatedReserves: repatriatedReserves.toString(),
      blockReward: blockReward.toString(),
      relevantExtrinsics: extrinsics,
      relevantEvents: events,
    };
  }

  // In the future, it may be nice to log all the relevant extrinsics to the address
  // for better records.
  private extrinsics(address: string, block: BlockResponse): string[] {
    const extrinsicsTrack: string[] = [];
    const { extrinsics } = block;
    for (const ext of extrinsics) {
      if (this.isSigner(address, ext)) {
        extrinsicsTrack.push(ext.method);
      }
    }

    return extrinsicsTrack;
  }

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

  private tips(
    address: string,
    block: BlockResponse,
    events: string[]
  ): bigint {
    const { extrinsics } = block;
    let tips = BigInt(0);

    extrinsics.forEach((ext) => {
      if (BigInt(ext.tip) > 0 && this.isSigner(address, ext)) {
        tips += BigInt(ext.tip);
        events.push("tip");
      }
    });

    return tips;
  }

  private async stakingRewards(
    address: string,
    block: BlockResponse,
    eventsTrack: string[]
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

        const { rewardDestination, bonded } = await this.api.getPayout(
          stash,
          this.parseNumber(number)
        );

        if (
          (rewardDestination === "Staked" || rewardDestination === "Stash") &&
          stash === address
        ) {
          eventsTrack.push(method);
          rewards += BigInt(amount);
          console.log("staked");
        } else if (rewardDestination === "Controller" && bonded === address) {
          rewards += BigInt(amount);
          eventsTrack.push(method);
          console.log("controller");
        }
      }
    }

    return rewards;
  }

  private endowment(
    address: string,
    block: BlockResponse,
    eventsTrack: string[]
  ): bigint {
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
          eventsTrack.push(method);
        }
      });
    });

    return endowed;
  }

  private lostDust(
    address: string,
    block: BlockResponse,
    eventsTrack: string[]
  ): bigint {
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
          eventsTrack.push(method);
        }
      });
    });

    return dust;
  }

  private killedAccounts(block: BlockResponse): Record<string, boolean> {
    const killed: Record<string, boolean> = {};
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

  private claimed(
    address: string,
    block: BlockResponse,
    eventsTrack: string[]
  ): bigint {
    let claimed = BigInt(0);
    const { extrinsics } = block;

    extrinsics.forEach((ext): void => {
      const { events } = ext;

      events.forEach((event: PEvent): void => {
        const { method, data } = event;
        const [claimsAddr, , amount] = data;

        if (method === "claims.Claimed" && claimsAddr === address) {
          claimed += BigInt(amount);
          eventsTrack.push(method);
        }
      });
    });

    return claimed;
  }

  private repatriatedReserved(
    address: string,
    block: BlockResponse,
    eventsTrack: string[]
  ): bigint {
    const { extrinsics } = block;
    let repatriated = BigInt(0);

    extrinsics.forEach((ext): void => {
      const { events } = ext;

      events.forEach((event: PEvent): void => {
        if (this.isVoterReported(event, address)) {
          repatriated += BigInt(5 * this.DOLLAR);
          eventsTrack.push(event.method);
        } else if (this.isJudgementGiven(event, address, ext)) {
          eventsTrack.push(event.method);

          // This is a hardcoded guess! In reality this is not a constant
          repatriated += BigInt("5000000000000");
        }
      });
    });

    return repatriated;
  }

  private blockReward(
    address: string,
    block: BlockResponse,
    eventsTrack: string[]
  ): bigint {
    const { extrinsics } = block;
    let reward = BigInt(0);

    for (const ext of extrinsics) {
      const { events } = ext;

      for (const event of events) {
        const { method, data } = event;
        const [blockAuthor, amount] = data;
        if (method === "balances.Deposit" && blockAuthor === address) {
          reward += BigInt(amount);
          eventsTrack.push(method);
        }
      }
    }

    return reward;
  }

  private slashes(
    address: string,
    block: BlockResponse,
    eventsTrack: string[]
  ): bigint {
    const { extrinsics } = block;
    let reward = BigInt(0);

    for (const ext of extrinsics) {
      const { events } = ext;

      for (const event of events) {
        const { method, data } = event;
        const [validator, amount] = data;
        if (method === "staking.Slash" && validator === address) {
          reward += BigInt(amount);
          eventsTrack.push(method);
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

  private isJudgementGiven(
    event: PEvent,
    address: string,
    ext: Extrinsic
  ): boolean | null {
    const { method } = event;
    return this.isSigner(address, ext) && method === "identity.JudgementGiven";
  }

  private isVoterReported(event: PEvent, address: string): boolean | string {
    const { method, data } = event;
    const [, reporter, isSuccess] = data;
    return (
      method === "electionsPhragmen.VoterReported" &&
      isSuccess &&
      reporter === address
    );
  }

  private parseNumber(n: string): number {
    const num = Number(n);

    if (!Number.isInteger(num)) {
      throw { error: "Failed parsing a number" };
    }

    return num;
  }
}
