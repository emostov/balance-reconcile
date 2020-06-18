/**
 * OneTimeReconciler is a class meant to generate a ReconcileInfo object for
 * an address (AccountId) at a given block height.
 *
 * Known limitations:
 *  - Keeping track of repatriated reserves in older versions of Kusama and Polkadot.
 *  - Taking into account Calls nested as arguments to an extrinsic (such as in a `utility.batch`).
 * 	- Handling older `staking.Reward` events where the address can be either stash or controller.
 */
import { ApiPromise } from "@polkadot/api";
import { WsProvider } from "@polkadot/rpc-provider";

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
  private polkadotApi!: ApiPromise;
  readonly wsUrl: string;
  readonly DOLLAR = 10_000_000_000;
  readonly address: string;
  readonly height: number;
  private block!: BlockResponse;
  private eventsAffectingAddressBalance: string[];
  private reconcileInfo?: ReconcileInfo;

  // Change this be an object for argument
  constructor(
    sidecarBaseUrl: string,
    nodeWSUrl: string,
    address: string,
    height: number,
    blockResponse?: BlockResponse
  ) {
    this.api = new SideCarApi(sidecarBaseUrl);
    this.address = address;
    this.height = height;
    this.wsUrl = nodeWSUrl;
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
   * Coordinate the creation of the ReconcileInfo object for `address` at `height`.
   *
   * Primarily because it mutates `eventsAffectingAddressBalance`, this
   * method should only be called once per lifetime of an instance of this class.
   * This method should be thought of as a lazy extension of the constructor.
   */
  private async _getReconcileInfo(): Promise<ReconcileInfo> {
    // Ideally this would be in constructor but you cannot put async ops in bc TS
    this.block = this.block ?? (await this.api.getBlock(this.height));
    this.polkadotApi = await ApiPromise.create({
      provider: new WsProvider(this.wsUrl),
    });

    const extrinsicsSignedByAddress = this.getExtrinsicsSignedByAddress();

    // Extrinsics based amounts
    const outgoingTransfers = this.sumTransfersSignedByAddress();
    const incomingTransfers = this.sumTransfersIntoAddress();

    // Fees, tips amounts
    const partialFees = this.sumPartialFeesForExtrinsicsSignedByAddress();
    const tips = this.sumTipsByAddress();

    // Event based amounts
    const stakingRewards = await this.sumStakingRewardsForAddress();
    // const stakingRewards = this.sumStakingRewardsForAddress();
    const claimed = this.sumClaimsForAddress();
    const repatriatedReserves = this.sumRepatriatedReservesByAddress();
    const blockReward = this.getBlockRewardIfAddressIsAuthor();
    const slashes = this.sumSlashesOfAddress();
    // Beginning & End of life events
    // Get because an address should only be endowed once, which is when it is created.
    const endowment = this.getEndowmentToAddress();
    const lostDust = this.getLostDustFromAddress();

    const {
      prevFreeBalance,
      prevReserveBalance,
      currFreeBalance,
      currReserveBalance,
    } = await this.fetchReferenceBalances();

    // Dan recommended moving this to its own function. Leaving here for now
    // though because it would take more space to pass in arguments and then extract
    const expectedBalance: bigint =
      prevFreeBalance +
      outgoingTransfers -
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

    this.reconcileInfo = {
      // maybe should add a notes section
      block: this.height,
      address: this.address,
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
      relevantEvents: this.eventsAffectingAddressBalance,
    } as ReconcileInfo;

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
      if (BigInt(ext.tip) > 0 && this.isSigner(this.address, ext)) {
        tips += BigInt(ext.tip);

        // TODO this isn't actually an event... need to clarify naming
        this.eventsAffectingAddressBalance.push("tip");
      }
    }

    return tips;
  }

  /**
   * Get the address of the of the reward destination based off a staking.Reward
   * event and the block height. This requires network calls.
   *
   * @param event reward.Staking event
   */
  private async fetchRewardDestinationAddress(
    event: PEvent,
    ext: Extrinsic
  ): Promise<string | undefined> {
    if (!this.isStakingReward(event)) {
      return undefined;
    }

    const { hash } = this.block;
    const { data } = event;

    // In staking.payoutStakers, rewardAddress is a stash, but in
    // staking.payout{Nominators, Validators} rewardAddress is the controller
    const rewardEventAddressType = this.isLegacyPayoutMethod(ext)
      ? "controller"
      : "stash";
    const [rewardEventAddress] = data;

    // If we know the address from within the event is the stash we do not need
    // to do any extra fetching. But if it is not the stash, we need to fetch
    // the StakingLedger to get the stash address.
    const stash =
      rewardEventAddressType === "stash"
        ? rewardEventAddress
        : (
            await this.polkadotApi.query.staking.ledger.at(
              hash,
              rewardEventAddress
            )
          ).unwrapOr(null)?.stash;

    // Using the stash address, we can query for the RewardDestination, which can
    // be Staked, Stash
    const rewardDestinationType = await this.polkadotApi.query.staking.payee.at(
      hash,
      stash
    );

    if (
      rewardDestinationType.toString() === "Controller" &&
      rewardEventAddressType === "stash"
    ) {
      // The rewardDestination is the controller but we only have the stash,
      // so go and query for the controller and return it.
      return await this.polkadotApi.query.staking.bonded.at(hash, stash);
    }

    if (rewardDestinationType.toString() === "Controller") {
      // The rewardDestination is the controller and we have it, so return it
      return rewardEventAddress;
    }

    // Reward destination is the stash, and we will always have it because it
    // was necessary to fetch rewardDestinationType, so we can just return it
    return stash?.toString();
  }

  /**
   * Sum staking rewards for `address` by looking at the `staking.Reward` event
   * and, making an additional call to find reward destination, and adding to
   * sum if the reward destination === `address`.
   */
  // private async sumStakingRewardsForAddress(): Promise<bigint> {
  private async sumStakingRewardsForAddress(): Promise<bigint> {
    const { extrinsics } = this.block;
    let rewards = BigInt(0);

    for (const ext of extrinsics) {
      const { events } = ext;

      for (const event of events) {
        // we should have these methods as constants somewhere to avoid fat thumb errors
        // TODO create isStakingReward
        if (!this.isStakingReward(event)) {
          continue;
        }

        const rewardDestination = await this.fetchRewardDestinationAddress(
          event,
          ext
        );

        if (rewardDestination === this.address) {
          const { data } = event;
          const [, amount] = data;
          rewards += BigInt(amount);
        }
      }
    }

    return rewards;
  }

  /**
   * Get the amount that may have been endowed to an address. Note: if return
   * value is greater than the account was created this block.
   */
  private getEndowmentToAddress(): bigint {
    const { extrinsics } = this.block;
    let endowed = BigInt(0);

    for (const ext of extrinsics) {
      const { events } = ext;

      for (const event of events) {
        const { method, data } = event;
        const [endowAddr, amount] = data;

        if (method === "balances.Endowed" && endowAddr === this.address) {
          endowed += BigInt(amount);
          this.eventsAffectingAddressBalance.push(method);

          return endowed;
        }
      }
    }

    return endowed;
  }

  /**
   * Get the dust that may have been lost from `address`. Note: If return value
   *  is greater than zero the account has been killed.
   */
  private getLostDustFromAddress(): bigint {
    const { extrinsics } = this.block;
    let dust = BigInt(0);

    for (const ext of extrinsics) {
      const { events } = ext;

      for (const event of events) {
        const { method, data } = event;
        const [deadAddr, amount] = data;

        if (method === "balances.DustLost" && deadAddr === this.address) {
          dust += BigInt(amount);
          this.eventsAffectingAddressBalance.push(method);

          return dust;
        }
      }
    }

    return dust;
  }

  /**
   * Sum the successful claims incoming to `address`.
   */
  private sumClaimsForAddress(): bigint {
    let claimed = BigInt(0);
    const { extrinsics } = this.block;

    for (const ext of extrinsics) {
      const { events } = ext;

      for (const event of events) {
        const { method, data } = event;
        const [claimsAddr, , amount] = data;

        if (method === "claims.Claimed" && claimsAddr === this.address) {
          claimed += BigInt(amount);
          this.eventsAffectingAddressBalance.push(method);
        }
      }
    }

    return claimed;
  }

  // TODO account for repatriated reserve events in newer versions
  /**
   * Best effort attempt to sum reserves that where repatriated by `address`.
   * The term best effort is used because in older versions of Kusama and Polkadot
   * there was no event for repatriated reserves, so this method uses educated
   * or sometimes known constants. In the future this method may be broken up to
   * reflect specific events.
   */
  private sumRepatriatedReservesByAddress(): bigint {
    const { extrinsics } = this.block;
    let repatriated = BigInt(0);

    extrinsics.forEach((ext): void => {
      const { events } = ext;

      events.forEach((event: PEvent): void => {
        if (this.isVoterReported(event, this.address)) {
          repatriated += BigInt(5 * this.DOLLAR);
          this.eventsAffectingAddressBalance.push(event.method);
        } else if (this.isJudgementGiven(event, this.address, ext)) {
          this.eventsAffectingAddressBalance.push(event.method);

          // This is a hardcoded guess! In reality this is not a constant
          repatriated += BigInt("5000000000000");
        }
      });
    });

    return repatriated;
  }

  /**
   * Sum up all balances.Deposit events that indicate funds moving into `address`.
   */
  private getBlockRewardIfAddressIsAuthor(): bigint {
    const { extrinsics } = this.block;
    let reward = BigInt(0);

    for (const ext of extrinsics) {
      const { events } = ext;

      for (const event of events) {
        const { method, data } = event;
        const [blockAuthor, amount] = data;
        if (method === "balances.Deposit" && blockAuthor === this.address) {
          reward += BigInt(amount);
          this.eventsAffectingAddressBalance.push(method);
        }
      }
    }

    return reward;
  }

  /**
   * Sum up the amount of slashes from `address` by looking at the
   * staking.Slash event.
   */
  private sumSlashesOfAddress(): bigint {
    const { extrinsics } = this.block;
    let reward = BigInt(0);

    for (const ext of extrinsics) {
      const { events } = ext;

      for (const event of events) {
        const { method, data } = event;
        const [validator, amount] = data;
        if (method === "staking.Slash" && validator === this.address) {
          reward += BigInt(amount);
          this.eventsAffectingAddressBalance.push(method);
        }
      }
    }

    return reward;
  }

  // boolean "is" methods
  /**
   * Returns if an extrinsic is a staking.payout{Nominator, Validator} or
   * if it has an argument of calls that is staking.payout{Nominator, Validator}
   *
   * @param ext an extrinsic
   */
  private isLegacyPayoutMethod(ext: Extrinsic): boolean | undefined {
    const {
      method,
      newArgs: { calls },
    } = ext;

    const isLegacy = (md: string) =>
      md === "staking.payoutNominator" || md === "staking.payoutValidator";

    if (isLegacy(method)) {
      return true;
    }

    // This would be the case in something like a batch call
    return calls && calls.some((c) => isLegacy(c.method));
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

  private isStakingReward(event: PEvent) {
    const { method } = event;
    return method == "staking.Reward";
  }

  // Not used methods
  private parseNumber(n: string): number {
    const num = Number(n);

    if (!Number.isInteger(num)) {
      throw { error: "Failed parsing a number" };
    }

    return num;
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
}
