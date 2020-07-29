import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { promisify } from "util";

import {
  Balance,
  BlockResponse,
  StakingResponse,
  TxArtifactsResponse,
} from "../types/types";

// This does not include errors
type ApiResponse = {
  data: BlockResponse | Balance | StakingResponse | TxArtifactsResponse;
};

export default class SideCarApi {
  private api: AxiosInstance;
  readonly SECOND = 1_000;
  constructor(sidecarBaseUrl: string) {
    this.api = axios.create({ baseURL: sidecarBaseUrl });
  }

  async retryGet(uri: string, attempts = 0): Promise<ApiResponse> {
    try {
      return await this.api.get(uri);
    } catch (e) {
      // Try and tolerate a sidecar outage of up to 60 seconds with max 20 attempts
      // spaced 3 seconds apart
      if (attempts < 20) {
        console.error(`Attempt ${attempts} for sidecar endpoint ${uri}`);
        await this.sleep(3 * this.SECOND);
        return await this.retryGet(uri, (attempts += 1));
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (e && e?.isAxiosError) {
        const {
          response,
          config: { url, method },
        } = e as AxiosError<Error>;

        const res = response as AxiosResponse;

        throw {
          method,
          url,
          status: res?.status,
          statusText: res?.statusText,
        };
      }

      throw e;
    }
  }

  // I think these need better error handling
  async getBlock(num?: number): Promise<BlockResponse> {
    const response = num
      ? await this.retryGet(`/block/${num}`)
      : await this.retryGet(`/block`);

    return response.data as BlockResponse;
  }

  async getBalance(account: string, height?: number): Promise<Balance> {
    const response = height
      ? await this.retryGet(`/balance/${account}/${height}`)
      : await this.retryGet(`/balance/${account}`);

    return response.data as Balance;
  }

  async getStaking(account: string, height?: number): Promise<StakingResponse> {
    const response = height
      ? await this.retryGet(`/staking/${account}/${height}`)
      : await this.retryGet(`/staking/${account}`);

    return response.data as StakingResponse;
  }

  async getVesting(account: string, height?: number): Promise<any> {
    const response = height
      ? await this.retryGet(`/vesting/${account}/${height}`)
      : await this.retryGet(`/vesting/${account}`);

    return response.data;
  }

  async getTxArtifacts(height?: number): Promise<TxArtifactsResponse> {
    const response = height
      ? await this.retryGet(`tx/artifacts/${height}`)
      : await this.retryGet(`tx/artifacts`);

    return response.data as TxArtifactsResponse;
  }

  async getMetadata(height?: number): Promise<TxArtifactsResponse> {
    const response = height
      ? await this.retryGet(`metadata/${height}`)
      : await this.retryGet(`metadata`);

    return response.data as TxArtifactsResponse;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getStakingProgress(height?: number): Promise<any> {
    const response = height
      ? await this.retryGet(`staking-info/${height}`)
      : await this.retryGet(`staking-info`);

    return response.data;
  }

  /**
   *
   * @param ms milliseconds to sleep
   */
  async sleep(ms: number): Promise<void> {
    const s = promisify(setTimeout);
    await s(ms);
    return;
  }
}
