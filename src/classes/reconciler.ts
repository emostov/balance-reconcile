import { BlockResponse, ReconcileInfo } from "../types/types";
import OneTimeReconciler from "./one_time_reconciler";

export default class Reconciler {
  sideCarUrl: string;
  // polkaApiWSUrl: string;
  constructor(sideCarUrl: string) {
    this.sideCarUrl = sideCarUrl;
    // this.polkaApiWSUrl = polkaApiWSUrl;
  }

  async reconcileAddressAtHeight(
    address: string,
    height: number,
    block?: BlockResponse
  ): Promise<ReconcileInfo> {
    const oneTimeReconciler = new OneTimeReconciler(
      this.sideCarUrl,
      address,
      height,
      block
    );
    return await oneTimeReconciler.getReconcileInfo();
  }
}
