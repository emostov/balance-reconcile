import axios, { AxiosInstance } from "axios";

import {
  Balance,
  BlockResponse,
  PayoutResponse,
  StakingResponse,
} from "../types/types";

export default class SideCarApi {
  api: AxiosInstance;
  constructor(sidecarBaseUrl: string) {
    this.api = axios.create({ baseURL: sidecarBaseUrl });
  }

  // I think these need better error handling
  async getBlock(num?: number): Promise<BlockResponse> {
    const response = num
      ? await this.api.get(`/block/${num}`)
      : await this.api.get(`/block`);
    return response.data as BlockResponse;
  }

  async getBalance(account: string, height?: number): Promise<Balance> {
    const response = height
      ? await this.api.get(`/balance/${account}/${height}`)
      : await this.api.get(`/balance/${account}`);
    return response.data as Balance;
  }

  async getStaking(account: string, height?: number): Promise<StakingResponse> {
    const response = height
      ? await this.api.get(`/staking/${account}/${height}`)
      : await this.api.get(`/staking/${account}`);

    return response.data as StakingResponse;
  }

  async getPayoutInfo(
    account: string,
    height?: number
  ): Promise<PayoutResponse> {
    const response = height
      ? await this.api.get(`/payout/${account}/${height}`)
      : await this.api.get(`/payout/${account}`);

    return response.data as PayoutResponse;
  }
}
