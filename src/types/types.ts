export type ReconcileInfo = {
  block: number;
  address: string;
  actualVsExpectedDiff: string;
  expectedBalance: string;
  currFreeBalance: string;
  currReserveBalance: string;
  prevFreeBalance: string;
  prevReserveBalance: string;
  partialFees: string;
  lostDust: string;
  transfers: string;
  incomingTransfers: string;
  endowment: string;
  stakingRewards: string;
  tips: string;
  slashes: string;
  claimed: string;
  repatriatedReserves: string;
  blockReward: string;
  relevantExtrinsics: string[];
  relevantEvents: string[];
};

export type AddressAndBlock = {
  block: string;
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
  nonce: string;
  method: string;
  callIndex: Record<string, unknown[]>;
  args: string[];
  tip: string;
  hash: string;
  info: {
    weight: string;
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
  nonce: string;
  free: string;
  reserved: string;
  miscFrozen: string;
  feeFrozen: string;
  locks: any[]; // ?
};

export type TxArtifactsResponse = {
  at: string;
  genesisHash: string;
  chainName: string;
  specName: string;
  specVersion: string;
  txversion: string;
  metadata: string;
};

export type CategorizeInfos = Record<
  string,
  Record<string, Record<string, ReconcileInfo[]>>
>;
