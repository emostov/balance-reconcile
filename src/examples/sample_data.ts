export const interestingCC1 = [
  {
    // sudo setKey (0 -> 1)
    // issue: unknown
    block: 28_831,
    address: "1KvKReVmUiTc2LW2a4qyHsaJJ9eE9LRsywZkMk5hyBeyHgw",
  },
  {
    // sudo.sudoUncheckedWeight (runtime upgrade)
    // issue: unknown
    block: 29_231,
    address: "16cfqPbPeCb3EBodv7Ma7CadZj4TWHegjiHJ8m3dVdGgKJk1",
  },
  {
    // sudo.setKey ( 0 -> 1)
    block: 29_242,
    address: "16cfqPbPeCb3EBodv7Ma7CadZj4TWHegjiHJ8m3dVdGgKJk1",
  },
  {
    // sudo.sudo balances.forceTransfer
    block: 29_258,
    address: "1KvKReVmUiTc2LW2a4qyHsaJJ9eE9LRsywZkMk5hyBeyHgw",
  },
];

export const postUpgrade0Random = [
  {
    // utility.batch
    block: 160_200,
    address: "12Tst4yZtvGzSzc5ejDDq1Yt6iethkRckwjXLGFsUWB3JEV4",
  },
  {
    // claims.attest
    block: 160_156,
    address: "12sDCx3NcbbFm9cyDkHUiAwUXabnZpWvL7hMGmeixqkb41x7",
  },
  {
    // staking.bond_extra
    block: 159_474,
    address: "16UJBPHVqQ3xYXnmhEpaQtvSRnrP9k1XeE7WxoyCxsrL9AvV",
  },
  {
    // session.set_keys
    block: 158_825,
    address: "12bDHgG8swcakJhz4ADa4uJZThbQKx3rC4cQ6fH7h7EntCVA",
  },
];

export const postUpgrade0Staking = [
  {
    // staking.set_payee
    block: 154_547,
    address: "142mpo9pvqPZTCCQzRMq3PFADhUvQKc5XQwWqdKf857VxA3v",
  },
  {
    // staking.validate
    block: 152_718,
    address: "1sAkfdTH3cHAdJRYqMPNdeV7GhTKrddvMfkQrm3pQBABWrN",
  },
  {
    // staking.nominate
    block: 147_071,
    address: "1Z3VmtA5twBHMbsjbp6RHNVci8cnCTDnTYkC65sg3THse9f",
  },
  {
    // staking.chill
    block: 139_579,
    address: "131RjRMtuURJDWsprv42MFnJuo7SnrN1GPz8rTtqNT9UQ2Ts",
  },
];

export const postUpgrade0StakingHeights = [154_547, 152_718, 147_071, 139_579];

// left off at 28_979 going down
// these are claims and for some reason not being picked up
export const preUpgrade0RandomHeights = [29_130, 29_037];
