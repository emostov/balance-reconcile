import SideCarApi from "./sidecar_api";

type ReconcileInfo = Record<string, string | number>

export default class Reconciler {
  api: SideCarApi;
	addr: string;
  constructor(sidecarBaseUrl: string) {
		this.api = new SideCarApi(sidecarBaseUrl);
	}
	
	async reconcileAtHeight(address: string, height: number): Promise<ReconcileInfo | Error> {
		const prevBalance = await this.api.getBalance(address, height - 1);
		const curBalance = await this.api.getBalance(address, height);
		const block = await this.api.getBlock(height);
		if (prevBalance instanceof Error) {
			return prevBalance;
		}
		if (curBalance instanceof Error){
			return curBalance;
		}
		if (block instanceof Error) {
			return block ;
		}

		const prevFreeBalance = prevBalance.free;
		const curFreeBalance = curBalance.free

		const partialFees = this.partialFees(account: string, block: BlockResponse)
		const transfers = this.transfer(account: string, block: BlockResponse);
		const dust = this.lostDust(account: string, block: BlockResponse);

		const expectedBalance = this.expectedBalance(prevBalance, nonFeeLosses, partialFees);

		return {
			expectedBalance,
			prevFreeBalance,
			curFreeBalance,
			partialFees,
			dust,
			transfers,
		}
	}

	private expectedBalance(prevBalance: number, transfers: number, dust: number, partialFees: number): number {
		return prevBalance - transfers - dust - partialFees;
	}
}
