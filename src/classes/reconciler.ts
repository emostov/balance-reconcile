import { ReconcileInfo } from "../types/types";
import OneTimeReconciler from "./one_time_reconciler";

export default class Reconciler {
  sideCarUrl: string;
  constructor(sideCarUrl: string) {
    this.sideCarUrl = sideCarUrl;
  }

  async reconcileAtHeight(
    address: string,
    height: number
  ): Promise<ReconcileInfo> {
    const oneTimeReconciler = new OneTimeReconciler(this.sideCarUrl);
    return await oneTimeReconciler.reconcileAtHeight(address, height);
  }
}
