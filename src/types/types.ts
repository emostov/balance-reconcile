export type ReconcileInfo = {
  block: number;
  address: string;
  actualVsExpectedDiff: number;
  expectedBalance: number;
  currFreeBalance: number;
  currReserveBalance: number;
  prevFreeBalance: number;
  prevReserveBalance: number;
  partialFees: number;
  lostDust: number;
  transfers: number;
  incomingTransfers: number;
  endowment: number;
  stakingRewards: number;
  tips: number;
  claimed: number;
};

export type AddressAndBlock = {
  block: number;
  address: string;
};

// TODO figure out where to use @polkadot/api types

export type BlockResponse = {
  number: string;
  hash: string;
  parentHash: string;
  stateRoot: string;
  extrinsicsRoot: string;
  logs: Record<string, unknown>[];
  onInitialize: Record<string, unknown[]>;
  extrinsics: Extrinsic[];
  onFinalize: Record<string, unknown[]>;
};

export type StakingResponse = {
  at: {
    hash: string;
    height: string;
  };
  staking: {
    stash: string;
    total: string;
    active: string;
    unlocking: string;
    claimedRewards: string[];
  };
};

export type PayoutResponse = {
  at: {
    hash: string;
    height: string;
  };
  rewardDestination: string;
  bonded: string;
};

export type Signature = {
  signature: string;
  signer: string;
};

// This will need to be changed soon
export type Extrinsic = {
  signature: Signature | null;
  nonce: number;
  method?: string;
  callIndex: Record<string, unknown[]>;
  args: string[];
  tip: string;
  hash: string;
  info: {
    weight: number;
    class: string; // could put enum?
    partialFee?: string;
    paysFee?: boolean;
  };
  events: PEvent[];
  success: boolean;
  paysFee: boolean;
};

export type PEvent = {
  method: string;
  data: string[];
};

export type Balance = {
  at: {
    hash: string;
    height: string;
  };
  nonce: number;
  free: string;
  reserved: string;
  miscFrozen: string;
  feeFrozen: string;
  locks: any[]; // ?
};
