import axios, { AxiosInstance } from "axios";

type BlockResponse = {
  number: string;
  hash: string;
  parentHash: string;
  stateRoot: string;
  extrinsicsRoot: string;
  logs: Record<string, unknown>[];
  onInitialize: Record<string, unknown[]>;
  extrinsics: Record<string, unknown>[];
  onFinalize: Record<string, unknown[]>;
};


type Balance = {
  at: {
    hash: string;
    height: string;
  };
  nonce: number;
  free: string;
  reserved: string;
  miscFrozen: string;
  feeFrozen: string;
  locks: any[];
};

export default class SideCarApi {
  api: AxiosInstance;
  constructor(sidecarBaseUrl = "http://127.0.0.1:8080") {
    this.api = axios.create({ baseURL: sidecarBaseUrl });
  }

  async getBlock(num?: number): Promise<BlockResponse | Error> {
    try {
      const response = num
        ? await this.api.get(`/block/${num.toString()}`)
        : await this.api.get(`/block`);

      return response.data as BlockResponse;
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return { error: e };
    }
  }

  async getBalance(account: string, height?: number): Promise<Balance | Error> {
    try {
      const response = height
        ? await this.api.get(`/balance/${account}/${height}`)
        : await this.api.get(`/balance/${account}`);

      return response.data as Balance;
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return { error: e };
    }
  }
}

// async function main(): Promise<any> {
//   const api = new SideCarApi();
//   console.log(await api.getBlock());
//   console.log(
//     await api.getBalance("12zSBXtK9evQRCG9Gsdr72RbqNzbNn2Suox2cTfugCLmWjqG")
//   );
// }
