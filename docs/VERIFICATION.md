# Committed Answer Match — Verification

This document binds the public source, the deployed Studionet contract and the
reproducible local checks for the current release candidate.

## Release binding

```text
PACKAGE_COMMIT: ff2f2ad4a4c8d2995a5efeae57cb8bf2e06b3ad5
CONTRACT_SOURCE_COMMIT: 77a182aa35d661e71facdb183bb6902289e188bd
CONTRACT_SOURCE_SHA256: 5D770C9EF1C6E58063C4604EA1122AC1DE815D788DE34C89C776A610FEE8C6BC
CONTRACT_TEST_SHA256: DEFC83A938E0CABCD8EECFCA8B7D199AB49901B8C5F6B511965ECF7E02E0FB9C
SCHEMA_SHA256: B6450B0E994156186EFCA475BCE61F079A468CCFAC38D80E486617B7EC078FAB
NETWORK: Studionet
CHAIN_ID: 61999
CONTRACT: 0xD22f951BD5B7AE6615c27066e99a80D9751be5cF
DEPLOYMENT_TRANSACTION: 0x94005694eb8bc36780e258a80123f8965666e96b3801b8a4158566a4d2151644
FINALITY: FINALIZED
DEPLOYMENT_RESULT: SUCCESS; consensus Accepted
INITIAL_COUNT: 0
LIFECYCLE: INTENTIONALLY FROZEN
POST_DEPLOY_DEFECT_POLICY: deploy a new contract and update the frontend address; never upgrade this address
HOSTED_FRONTEND: not released yet
```

- [Contract in the Studionet Explorer](https://explorer-studio.genlayer.com/address/0xD22f951BD5B7AE6615c27066e99a80D9751be5cF)
- [Deployment transaction](https://explorer-studio.genlayer.com/tx/0x94005694eb8bc36780e258a80123f8965666e96b3801b8a4158566a4d2151644)

## Live contract proof

The deployed source matches the local source byte-for-byte after the
documented deployment normalization. The live proof covers a successful
`MATCH`, a successful `NO_MATCH`, unauthorized/stale/bad-reveal rejection with
unchanged state, a bounded ambiguity path that completed as `NO_MATCH`, and
deadline expiry to `VOID`. Every retained result was checked at finality and
against the corresponding historical record.

Studio request telemetry did not expose a recoverable physical-request count
for the retained run, so no physical count is claimed. Logical actions,
transaction hashes, bounded status observations, terminal receipts and
authoritative readbacks are recorded in the project RPC evidence.

## Reproducible checks

Run from the repository root:

```powershell
$env:PYTHONIOENCODING='utf-8'
py -3.13 -m pytest tests\test_contract.py -q -p no:cacheprovider
genvm-lint check contracts\main.py
genvm-lint validate contracts\main.py
genvm-lint schema --json -o contract-schema.json contracts\main.py
```

Run from `frontend`:

```powershell
npm test -- --run
npm run build
npm run test:e2e
```

Current results: contract tests `13 passed`; frontend tests `69 passed`; local
Playwright `7 passed`; lint, validation, schema generation and production build
passed. The build reports only the existing large-bundle warning.

## Trust and recovery boundaries

The contract has no upgrade path. Its state is public and permanent, and a
confirmed contract defect requires a new reviewed deployment with fresh live
evidence. The frontend requires finality, successful execution and an
authoritative historical readback before showing success; uncertain writes
retain their hash for same-hash reconciliation and are never automatically
resubmitted.
