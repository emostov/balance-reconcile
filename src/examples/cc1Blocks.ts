export const cc1Blocks = [
  // 28 May
  28831, // Sudo setKey(0 -> 1)
  29231, // sudo.sudoUncheckedWeight runtime upgrade(v1, fix vesting bug in claims)
  29242, // sudo.setKey(1 -> 0)
  29258, // sudo.sudo(forceTransfer)
  //
  // 08 June
  188836, // sudo.sudoUncheckedWeight runtime upgrade(v5, generalized proxies, identity)
  188889, // add proxy for sudo 14TKt6bUNjKJdfYqVDNFBqzDAwmJ7WaQwfUmxmizJHHrr1Gs
  188902, // sudo.sudo(kill account)
  //
  // 09 June
  197681, // sudo.sudo(forceTransfer)
  199405, // sudo.sudoUncheckedWeight runtime upgrade(v6, council / sudo can move claims)
  200732, // sudo.sudo(batch assign indices)
  //
  // 10 June
  214264, // sudo.sudoUncheckedWeight runtime upgrade(v7, frozen indices)
  214357, // sudo.sudoUncheckedWeight batch(kill storage, set storage)
  214576, // proxy sudo batch of transfers
  216575, // sudo.sudoUncheckedWeight correction of batch(kill storage, set storage)
  //
  // 12 June
  240734, // sudo.sudo batch that set registrars and(failed) transfers
  240776, // sudo.sudo failed balances.transfer
  240801, // sudo.sudo failed balances.transfer
  240853, // sudo.sudo batch with balances.forceTransfer
  240984, // sudo.sudo batch with balances.forceTransfer
  241591, // proxy sudo batch of transfers
  243601, // proxy sudo batch of transfers
  244358, // sudo.sudoUncheckedWeight runtime upgrade(v8, (un)reserve events)
  //
  // 15 June
  287352, // sudo.sudo forceTransfer
  //
  // 16 June
  298558, // sudo.sudo forceTransfer
  298825, // sudo.sudo killStorage(remove ETH keys)
  298834, // sudo.sudo killStorage(remove DOT keys)
  299168, // sudo.sudo add proxy for `Any`(failed)
  299178, // sudo.sudo remove`SudoBalances` proxy(failed)
  299922, // proxy sudo batch of transfers
  300431, // sudo.sudo add proxy for `Any`(failed)
  300532, // proxy.addProxy for `Any` from sudo(direct to proxy module)
  301569, // proxy sudo mint claim
  301922, // proxy sudo set storage for account SAFT(failed)
  302255, // proxy sudo mint claim
  302396, // proxy sudo set vested claim
  303079, // sudo.sudoUncheckedWeight runtime upgrade(v9, add vested forceTransfer and new origin filtering)
  303284, // proxy sudo batch of transfers
  304468, // proxy sudo set balance(W3F)(failed)
  304519, // proxy sudo set balance(W3F)(failed)
  //
  // 17 June
  311620, // batch of proxy sudo vested transfers
  311669, // batch of proxy sudo vested transfers
  311691, // batch of proxy sudo vested transfers
  311877, // proxy sudo mint claim
  312390, // proxy sudo force transfer(failed)
  313222, // proxy sudo kill storage
  313317, // proxy sudo mint claim
  313396, // proxy sudo set storage
  314201, // sudo.sudoUncheckedWeight runtime upgrade(v10, allow sudo to do anything(i.e.fix new filtering))
  314326, // proxy sudo set balance(W3F)
  316332, // sudo.sudo set validator count to 20
  316632, // sudo.sudo schedule era change for NPoS
  //
  // 18 June
  325148, // scheduler dispatched
  326556, // sudo.sudo force new era always
  328496, // sudo.sudo force unstake
  329377, // sudo.sudo force transfer
  332275, // sudo.sudo force transfer
  332279, // sudo.sudo force transfer
  334038, // sudo.sudo schedule validator count of 25
  334193, // sudo.sudo schedule validator count of 24
  334202, // sudo.sudo schedule validator count of 24
  //
  // 19 June
  337000, // scheduler dispatched(set to 24)
  338824, // scheduler dispatched(set to 25)
  341469, // proxy sudo force transfer
  342400, // sudo.sudoUncheckedWeight runtime upgrade(v11, scale validator count functions)
  342477, // sudo.sudo schedule regular validator set increases
  342500, // scheduler dispatched regular validator set increases
  342503, // sudo.sudo cancel schedule named(failed)
  342547, // sudo.sudo schedule regular validator set increases
  342555, // scheduler dispatched regular validator set increases
  344955, // scheduler dispatched
  344999, // proxy sudo batch of transfers
  345874, // proxy sudo batch of transfers
  347355, // scheduler dispatched
  //
  // 20 June
  352155, // scheduler dispatched
  354555, // scheduler dispatched
  356955, // scheduler dispatched
  359355, // scheduler dispatched
  361755, // scheduler dispatched
  //
  // 21 June
  364155, // scheduler dispatched
  366555, // scheduler dispatched
  368955, // scheduler dispatched
  371100, // sudo.sudo force new era(end fast eras)
  371355, // scheduler dispatched
  371442, // sudo.sudo change scheduler from 2400 to 14400
  372203, // sudo.sudo batch of two transfers
  //
  // 22 June
  383992, // proxy sudo set storage to correct claims issuance
  385000, // scheduler dispatched
  //
  // 23 June
  399400, // scheduler dispatched
  402146, // proxy sudo batch of transfers
  //
  // 24 June
  413800, // scheduler dispatched
  //
  // 25 June
  428200, // scheduler dispatched
  //
  // 26 June
  440695, // proxy sudo kill storage
  440755, // proxy sudo force transfer
  440928, // proxy sudo adjust unclaimed total
  440981, // proxy sudo set balance of W3F account pre - force transfer
  442600, // scheduler dispatched
  443963, // sudo.sudoUncheckedWeight runtime upgrade(v12, new staking rewards curve)
  444722, // proxy sudo batch of transfers
  444754, // proxy sudo batch of transfers
  445476, // proxy sudo mint claim
  445482, // proxy sudo mint claim
  445655, // proxy sudo set balance to offset minted claims
  445984, // proxy sudo batch of vested transfers
  //
  // 27 June
  457000, // scheduler dispatched
  //
  // 28 June
  471400, // scheduler dispatched
  //
  // 29 June
  485800, // scheduler dispatched
  486184, // sudo.sudo cancel scheduled validator set increases
  486344, // sudo.sudo remove outdated scheduled task
  //
  // 30 June
  500796, // sudo.sudo batch of transfers
  //
  // 01 July
  512577, // proxy sudo batch of transfers
  516904, // sudo.sudo batch of transfers
  //
  // 02 July
  528470, // sudo.sudoUncheckedWeight runtime upgrade(v13, payout creates controller, allow voting, registrar proxy, refactor as_sub)
  //
  // 03 July
  543510, // sudo.sudo force transfer
  544088, // proxy sudo batch of transfers(some failed due to locked tokens)
  544270, // proxy sudo batch of transfers
  544607, // proxy sudo batch of transfers
  //
  // 06 July
  584698, // proxy sudo force transfer
  584754, // proxy sudo force transfer
  584800, // proxy sudo force transfer
  584840, // proxy sudo force transfer
  //
  // 10 July
  644266, // proxy sudo batch of transfers
  644310, // proxy sudo batch of transfers
  644359, // proxy sudo batch of transfers
  644438, // proxy sudo batch of transfers
  644509, // proxy sudo batch of transfers
  645657, // proxy sudo batch of transfers
  645697, // proxy sudo batch of transfers
  //
  // 13 July
  687751, // sudo.sudoUncheckedWeight runtime upgrade(v14, enable poll)
  //
  // 14 July
  705031, // proxy sudo batch of transfers
  //
  // 16 July
  730080, // proxy sudo batch of transfers
  730109, // proxy sudo force transfer(sale account for fees)
  730422, // proxy sudo force vested transfer
  730450, // proxy sudo move claim
  //
  // 17 July
  742827, // proxy sudo batch of transfers
  742878, // proxy sudo force vested transfer(failed)
  744556, // proxy sudo batch of transfers
  746085, // sudo.sudoUncheckedWeight runtime upgrade(v15, enable council elections, purchase)
  746605, // sudo.sudoAs add governance proxy
  746652, // sudo force transfer
  746845, // sudo batch of force transfers(failed)
  746893, // sudo batch of force transfers and set proxies
  //
  // 18 July
  760932, // sudo batch of force transfers
  //
  // 19 July
  774244, // sudo batch of force transfers
  774683, // sudo force transfer
  774931, // sudo batch of force transfers
  775312, // sudo batch of force transfers and set proxies
  775401, // sudoAs set proxy(failed)
  775597, // sudoAs set proxy(failed)
  775610, // sudoAs set proxy(failed)
  776915, // sudo batch of force transfers
  776922, // sudoAs set proxy(failed)
  776963, // sudo batch of force transfers
  776966, // sudo.sudoAs set proxy
  776981, // sudo.sudoAs set proxy
  776986, // sudo.sudoAs set proxy
  776994, // sudo.sudoAs set proxy
  776998, // sudo.sudoAs set proxy
  777003, // sudo.sudoAs set proxy
  //
  // 20 July
  784130, // sudo batch of force transfers
  786421, // sudo force transfer
  787923, // sudo.sudoUncheckedWeight runtime upgrade(v16, enable governance)
  790128, // proxy sudo batch of transfers
  //
  // 21 July
  799302, // runtime upgraded, no more sudo
];
