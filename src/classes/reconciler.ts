import { BlockResponse, ReconcileInfo } from "../types/types";
import OneTimeReconciler from "./one_time_reconciler";

/**
 * Wraps one OneTimeReconciler to provide an easier interface that only
 * requires setting the end point urls once
 */
export default class Reconciler {
  readonly sideCarUrl: string;
  readonly polkaApiWSUrl: string;
  constructor(sideCarUrl: string, polkaApiWSUrl: string) {
    this.sideCarUrl = sideCarUrl;
    this.polkaApiWSUrl = polkaApiWSUrl;
  }

  async reconcileAddressAtHeight(
    address: string,
    height: number,
    block?: BlockResponse
  ): Promise<ReconcileInfo> {
    const oneTimeReconciler = new OneTimeReconciler(
      this.sideCarUrl,
      this.polkaApiWSUrl,
      address,
      height,
      block
    );

    return await oneTimeReconciler.getReconcileInfo();
  }
}
