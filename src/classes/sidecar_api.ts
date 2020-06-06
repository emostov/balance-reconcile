import axios, { AxiosInstance } from "axios";

import { Balance, BlockResponse } from "../types/types";

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
}
