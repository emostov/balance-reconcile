export type ReconcileInfo = {
  block?: number;
  address?: string;
  actualVsExpectedDiff: number;
  expectedBalance: number;
  prevFreeBalance: number;
  curFreeBalance: number;
  partialFees: number;
  lostDust: number;
  transfers: number;
};

export type AddressAndBlock = {
  block: number;
  address: string; // check if this can be changed
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
  tip: number;
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
