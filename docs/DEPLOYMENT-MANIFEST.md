# Committed Answer Match — Draft Deployment Manifest

`MANIFEST_STATUS: DRAFT_PRE_DEPLOY`

This secret-free manifest is the deployment/recovery binding for the exact
reviewed source. It is not a deployment receipt and contains no private key,
seed phrase, wallet secret, RPC credential or signing material.

## Exact source

```text
SOURCE_IMPLEMENTATION_COMMIT: b70e5cc4a4df7857f9ab08b47bb693c06e66d7ce
CONTRACT_CLASS: CommittedAnswerMatch
CONSTRUCTOR_ARGUMENTS: []
CONTRACT_SOURCE_SHA256: 48B8B3BA0BEB806699CA777F90178020A85ACC6CA2EDB74765F1E109EFFEB18
SCHEMA_SHA256: B6450B0E994156186EFCA475BCE61F079A468CCFAC38D80E486617B7EC078FAB
CONTRACT_TEST_SOURCE_SHA256: 8EBDE5C711D199A6E471D5F927C6CC9E47359F3FFF070F3FD42D32482D30A596
```

The frontend is part of the reviewed package but is not embedded in the
contract deployment. The address remains unset until the exact source is
deployed and accepted:

```text
FRONTEND_CONFIG_KEY: VITE_CONTRACT_ADDRESS
FRONTEND_CONFIG_VALUE: unset before S00
FRONTEND_SOURCE_COMMIT: b70e5cc4a4df7857f9ab08b47bb693c06e66d7ce
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

## Planned deployment checks

Before S00, record the actual Studio source view/hash, account, network and
constructor arguments. After S00, append the deployment transaction hash,
finality, semantic execution result, deployed-code/source parity and initial
`get_count()` readback to the checkpoint evidence. Do not fill those fields
from a plan or from a UI label.

```text
DEPLOYMENT_TRANSACTION: not yet sent
DEPLOYED_CONTRACT: not yet created
FINALITY: not yet created
SEMANTIC_EXECUTION: not yet created
SOURCE_PARITY: not yet created
INITIAL_COUNT_READBACK: not yet created
```

The separate [`RPC-BUDGET.md`](/E:/GenLayer-Projects/committed-answer-match/docs/RPC-BUDGET.md)
contains the required `STUDIO RPC BUDGET MATRIX` and independent
`FRONTEND RPC BUDGET MATRIX`; neither scope is replaced by this manifest.
