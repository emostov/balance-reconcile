import { AddressAndBlock, ReconcileInfo } from "../types/types";
import Reconciler from "./reconciler";

export default class NaiveCrawler {
  reconciler: Reconciler;
  constructor(sideCarUrl: string) {
    this.reconciler = new Reconciler(sideCarUrl);
  }

  async crawl(toCheck: AddressAndBlock[]): Promise<ReconcileInfo[]> {
    // my brain is sleepy, pls help me name variables

    const reconcilePromises = toCheck.map(async ({ address, block }) => {
      return await this.reconciler.reconcileAtHeight(address, block);
    });

    return await Promise.all(reconcilePromises);
  }
}
