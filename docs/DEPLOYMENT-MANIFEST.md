# Committed Answer Match — Replacement Deployment Manifest

`MANIFEST_STATUS: REPLACEMENT_DEPLOYED — POST_DEPLOY_TEST_APPROVED`

This secret-free manifest is the deployment/recovery binding for the exact
reviewed source. It is not a deployment receipt and contains no private key,
seed phrase, wallet secret, RPC credential or signing material.

## Replacement exact source

```text
SOURCE_IMPLEMENTATION_COMMIT: 77a182aa35d661e71facdb183bb6902289e188bd
CONTRACT_CLASS: CommittedAnswerMatch
CONSTRUCTOR_ARGUMENTS: []
CONTRACT_SOURCE_SHA256: 5D770C9EF1C6E58063C4604EA1122AC1DE815D788DE34C89C776A610FEE8C6BC
SCHEMA_SHA256: B6450B0E994156186EFCA475BCE61F079A468CCFAC38D80E486617B7EC078FAB
CONTRACT_TEST_SOURCE_SHA256: DEFC83A938E0CABCD8EECFCA8B7D199AB49901B8C5F6B511965ECF7E02E0FB9C
IMPLEMENTATION_ADAPTATION_SHA256: 77FDDA9392FA8FC7A0B776DF9A1233C3B0140E375AF33757074BC11A33AC9261
```

The frontend is part of the reviewed package but is not embedded in the
contract deployment. The exact replacement address is now bound below:

```text
FRONTEND_CONFIG_KEY: VITE_CONTRACT_ADDRESS
FRONTEND_CONFIG_VALUE: 0xD22f951BD5B7AE6615c27066e99a80D9751be5cF
FRONTEND_SOURCE_COMMIT: 77a182aa35d661e71facdb183bb6902289e188bd
```

## Network and identity

```text
NETWORK: Studionet
CHAIN_ID: 61999
RPC_SCOPE: Studio deployment and Studio-E2E only
RPC_REFERENCE: https://studio.genlayer.com/api
EXPLORER_REFERENCE: https://explorer-studio.genlayer.com
STUDIO_DEPLOYER: 0xeF5D2119416A2f5afa35dCFA209766EFC1BE5902
ROLE: deployer only
UPGRADER: none
```

The deployer is recorded as a public address only. No upgrade method, upgrade
storage, linked contract, configuration transaction or value transfer exists
in this product.

## Frozen classification

```text
LIFECYCLE: INTENTIONALLY FROZEN
USER_CONFIRMATION: Xác nhận contract này là INTENTIONALLY FROZEN; nếu có lỗi sau deploy thì phải deploy contract mới.
POST_DEPLOY_DEFECT: deploy a new contract and update the frontend address; never upgrade this address
```

## Rejected first deployment outcome

Before S00, record the actual Studio source view/hash, account, network and
constructor arguments. After S00, append the deployment transaction hash,
finality, semantic execution result, deployed-code/source parity and initial
`get_count()` readback to the checkpoint evidence. Do not fill those fields
from a plan or from a UI label.

```text
DEPLOYMENT_TRANSACTION: 0x1006b81a527f73db301f63c3ed551f70c1c8720dbe23f4262880851f1340d711
DEPLOYED_CONTRACT: 0x1dCcBE4942786Efc15Bb8e78d749e8D89f4fb68c
FINALITY: FINALIZED
SEMANTIC_EXECUTION: deployment success; S01 create_match failed BAD_ADDRESS
SOURCE_PARITY: normalized deployed payload equals 48B8B3BA0BEB806699CA777F90178020A85ACC6CA2EDB74765F1E109EFFEB18B
INITIAL_COUNT_READBACK: 0
DISPOSITION: rejected frozen instance; never upgrade
REPLACEMENT_SOURCE_COMMIT: 77a182aa35d661e71facdb183bb6902289e188bd
REPLACEMENT_SOURCE_SHA256: 5D770C9EF1C6E58063C4604EA1122AC1DE815D788DE34C89C776A610FEE8C6BC
```

See `STUDIO-INCIDENT-2026-09-05.md` for the two failed transaction hashes,
root-cause evidence, and the replacement candidate's local verification.

## Replacement deployment and live evidence

```text
REPLACEMENT_DEPLOY_TX: 0x94005694eb8bc36780e258a80123f8965666e96b3801b8a4158566a4d2151644
REPLACEMENT_CONTRACT: 0xD22f951BD5B7AE6615c27066e99a80D9751be5cF
REPLACEMENT_FINALITY: FINALIZED
REPLACEMENT_SEMANTIC_EXECUTION: SUCCESS; consensus Accepted
REPLACEMENT_SOURCE_PARITY: exact deployed payload SHA256 equals 5D770C9EF1C6E58063C4604EA1122AC1DE815D788DE34C89C776A610FEE8C6BC
REPLACEMENT_INITIAL_COUNT_READBACK: 0 at Finalized
POST_DEPLOY_STUDIO_E2E: S01 MATCH, S05 NO_MATCH, S06 rejection controls, S07 terminal NO_MATCH, S08 VOID expiry
POST_DEPLOY_STUDIO_E2E_REMAINING: NONE — logical S00-S08 journeys complete; retrospective OBSERVABLE_ACTION_LEDGER recorded and accepted
STUDIO_MEASUREMENT_MODE: OBSERVABLE_ACTION_LEDGER
STUDIO_MEASUREMENT_TIMING: RETROSPECTIVE_LEGACY
PHYSICAL_STUDIO_REQUEST_COUNT: NONE CLAIMED — physical telemetry unavailable
POST_DEPLOY_REVIEW_VERDICT: ANONYMOUS REVIEW APPROVED - POST_DEPLOY_TEST
POST_DEPLOY_REVIEW_RESIDUAL: NONE — PD-001 and PD-005 closed; exact legacy ledger accepted
```

The two intermediate replacement candidates are rejected and must not be
upgraded: `0x124F49152e558Ef7A4733A2eBBA04a7f8Cc08BD2` used the old source after
a UI source-load mistake, and `0xD0CF5063Ba3E4B43CEa615B37314Ada776b0cE1a`
contained one extra trailing newline. The final address above is the only
replacement address eligible for later frontend binding.

The separate [`RPC-BUDGET.md`](/E:/GenLayer-Projects/committed-answer-match/docs/RPC-BUDGET.md)
contains the required `STUDIO RPC BUDGET MATRIX` and independent
`FRONTEND RPC BUDGET MATRIX`; neither scope is replaced by this manifest.
