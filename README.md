# Reconcile what??

Balances

## Install and Usage

```
yarn
```

```
yarn start
```

```
yarn lint
```

## Background

There are 3 classes, `sidecar_api` for http requests to sidecar, `reconciler` for doing the business logic of calculated expected balance, and `naive_crawler` which can take in an array `[{address: 'aK1..', block: 255}]` and run the reconciler on each entry.

Currently `main` is setup to connect to the default dev url for sidecar and assumes sidecar is connected to Polkadot CC1 and using a version of sidecar that supports `partialFee`

### Improvements

- Look into the validity of the business logic
- Testing :)
- Error handling
- Look into using @polkadot types where possible
- Create variant crawlers, including one that supports pub/substrate
- As the sidecar API updates, this repo will need updates
