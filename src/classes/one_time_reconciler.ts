/**
 * OneTimeReconciler is a class meant to generate a ReconcileInfo object for
 * an address (AccountId) at a given block height.
 *
 * Known limitations:
 *  - Keeping track of repatriated reserves in older versions of Kusama and Polkadot.
 *  - Taking into account Calls nested as arguments to an extrinsic (such as in a `utility.batch`).
 * 	- Handling older `staking.Reward` events where the address can be either stash or controller.
 */

import {
  BlockResponse,
  Extrinsic,
  PEvent,
  ReconcileInfo,
} from "../types/types";
import SideCarApi from "./sidecar_api";

/**
 * Return type for fetchReferenceBalances.
 */
type ReferenceBalances = {
  prevFreeBalance: bigint;
  prevReserveBalance: bigint;
  currFreeBalance: bigint;
  currReserveBalance: bigint;
};

export default class OneTimeReconciler {
  readonly api: SideCarApi;
  readonly DOLLAR = 10_000_000_000;
  readonly address: string;
  readonly height: number;
  private block!: BlockResponse;
  private eventsAffectingAddressBalance: string[];
  private reconcileInfo?: ReconcileInfo;
  // eslint-disable-next-line prettier/prettier
  constructor(
    sidecarBaseUrl: string,
    address: string,
    height: number,
    blockResponse?: BlockResponse
  ) {
    this.api = new SideCarApi(sidecarBaseUrl);
    this.address = address;
    this.height = height;
    this.eventsAffectingAddressBalance = [];
    if (blockResponse) {
      this.block = blockResponse;
    }
  }

  /**
   * Get the `reconcileInfo` for this reconciler. If the reconcileInfo has
   * already been generated it will return the previously generated object.
   * If it has not been generated it will make necessary network calls and
   * operations, which can be expensive.
   *
   * To force generation use the method `forceGetReconcileInfo`
   */
  async getReconcileInfo(): Promise<ReconcileInfo> {
    return this.reconcileInfo
      ? this.reconcileInfo
      : await this._getReconcileInfo();
  }

  /**
   * Always generate `reconcileInfo` and will not try and used cached information.
   * This is always costly and it is recommended to use `getReconcileInfo`
   * for 99% of use cases.
   */
  async forceGetReconcileInfo(): Promise<ReconcileInfo> {
    return await this._getReconcileInfo();
  }

  private async _getReconcileInfo(): Promise<ReconcileInfo> {
    // Ideally this would be in constructor but you cannot put async ops in
    this.block = this.block ?? (await this.api.getBlock(this.height));

    const extrinsicsSignedByAddress = this.getExtrinsicsSignedByAddress();

    // Extrinsics based sums
    const outgoingTransfers = this.sumTransfersSignedByAddress();
    const incomingTransfers = this.sumTransfersIntoAddress();

    // Fees, tips sums
    const partialFees = this.sumPartialFeesForExtrinsicsSignedByAddress();
    const tips = this.sumTipsByAddress();

    // Event based sums

    this.reconcileInfo = {
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
      lostDust: lostDust.toString(),
      transfers: outgoingTransfers.toString(),
      partialFees: partialFees.toString(),
      incomingTransfers: incomingTransfers.toString(),
      endowment: endowment.toString(),
      stakingRewards: stakingRewards.toString(),
      tips: tips.toString(),
      slashes: slashes.toString(),
      claimed: claimed.toString(),
      repatriatedReserves: repatriatedReserves.toString(),
      blockReward: blockReward.toString(),
      relevantExtrinsics: extrinsicsSignedByAddress,
      relevantEvents: this.events,
    };

    return this.reconcileInfo;
  }

  private async fetchReferenceBalances(): Promise<ReferenceBalances> {
    const prevBalance = await this.api.getBalance(
      this.address,
      this.height - 1
    );
    const curBalance = await this.api.getBalance(this.address, this.height);

    return {
      prevFreeBalance: BigInt(prevBalance.free),
      prevReserveBalance: BigInt(prevBalance.reserved),
      currFreeBalance: BigInt(curBalance.free),
      currReserveBalance: BigInt(curBalance.reserved),
    };
  }

  // Work on a graceful exit?
  async reconcileAtHeight(
    address: string,
    height: number
  ): Promise<ReconcileInfo> {
    const prevBalance = await this.api.getBalance(address, height - 1);
    const curBalance = await this.api.getBalance(address, height);
    const block = await this.api.getBlock(height);

    // each function should return events field with relevant events for that function
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

    // Possibly pull out into its own function and pass parameters in as objects
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

  private getExtrinsicsSignedByAddress(): string[] {
    const extrinsicsTrack: string[] = [];
    const { extrinsics } = this.block;
    for (const ext of extrinsics) {
      if (this.isSigner(this.address, ext)) {
        extrinsicsTrack.push(ext.method);
      }
    }

    return extrinsicsTrack;
  }

  /**
   * Sum up the value of `balances.transfer` and `balances.transferKeepAlive`
   * signed by `address`.
   */
  private sumTransfersSignedByAddress(): bigint {
    const { extrinsics } = this.block;
    let sum = BigInt(0);
    extrinsics.forEach((ext: Extrinsic): void => {
      // TODO deal with any type of nested calls like
      // if(ext.method == "utility.batch"){}
      if (
        this.isTransferOutOfAddress(this.address, ext) &&
        this.isSuccess(ext)
      ) {
        sum += BigInt(ext.args[1]);
      }
    });

    return sum;
  }

  /**
   * Sum up the `partialFee`s for all the `Extrinsic`s signed by `address`
   */
  private sumPartialFeesForExtrinsicsSignedByAddress(): bigint {
    const { extrinsics } = this.block;
    let sum = BigInt(0);
    for (const ext of extrinsics) {
      const {
        info: { partialFee },
      } = ext;

      if (this.isSigner(this.address, ext) && typeof partialFee === "string") {
        sum += BigInt(partialFee);
      }
    }

    return sum;
  }

  /**
   * Sum the amounts transferred into the `address` from
   * `balances.transferKeepAlive` and `balances.transfer`.
   */
  private sumTransfersIntoAddress(): bigint {
    const { extrinsics } = this.block;
    let sum = BigInt(0);

    for (const ext of extrinsics) {
      // TODO deal with any type of nested calls like
      // if(ext.method == "utility.batch"){}
      if (
        this.isTransferIntoAddress(this.address, ext) &&
        this.isSuccess(ext)
      ) {
        sum += BigInt(ext.args[1]);
      }
    }

    return sum;
  }

  /**
   * Sum up the tips from extrinsics signed by `address`.
   */
  private sumTipsByAddress(): bigint {
    const { extrinsics } = this.block;
    let tips = BigInt(0);

    for (const ext of extrinsics) {
      if (BigInt(ext.tip) > 0 && this.isSigner(address, ext)) {
        tips += BigInt(ext.tip);

        // TODO this isn't actually an event... need to clarify naming
        this.eventsAffectingAddressBalance.push("tip");
      }
    }

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

        // we should have these methods as constants somewhere to avoid fat thumb errors
        // TODO create isStakingReward
        if (!(method === "staking.Reward")) {
          continue;
        }

        const [stash, amount] = data;

        const { rewardDestination, bonded } = await this.api.getPayout(
          stash,
          this.parseNumber(number)
        );

        if (
          (rewardDestination === "Staked" || rewardDestination === "Stash") &&
          stash === address
        ) {
          // The awards go to the stash
          rewards += BigInt(amount);
          eventsTrack.push(method);
        } else if (rewardDestination === "Controller" && bonded === address) {
          // The awards go to the controller
          rewards += BigInt(amount);
          eventsTrack.push(method);
        }
        // Otherwise we do not care since
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
