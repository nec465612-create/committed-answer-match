# Committed Answer Match — PRE_DEPLOY Readiness

`DOCUMENT_STATUS: HISTORICAL_PRE_DEPLOY_CHECKPOINT — superseded by live replacement evidence`

The table below preserves the exact pre-deployment checkpoint and its package
identity. Current deployment and Studio evidence is recorded in
`docs/DEPLOYMENT-MANIFEST.md`, `docs/STUDIO-INCIDENT-2026-09-05.md`, and
`docs/RPC-BUDGET.md`; those later records do not retroactively change this
historical review package.

## Checkpoint status

| Field | Current value |
|---|---|
| Workflow | Build |
| Category | `PROJECT` |
| Checkpoint | `PRE_DEPLOY` |
| Package identity | `CAM-PREDEPLOY-4B6556AD-DELTA-5` |
| Exact source revision | `4b6556ad9b469f2baf95509d07970c0de19a3d45` |
| Status | `ANONYMOUS REVIEW APPROVED - PRE_DEPLOY; historical checkpoint` |
| Anonymous reviewer delivery | `APPROVED — exact replacement package read back from retained reviewer` |
| Studionet contract | Historical table value: not deployed at this checkpoint; current replacement is bound in the manifest |
| Studio account | Selected and locked for deployment role: `0xeF5D2119416A2f5afa35dCFA209766EFC1BE5902`; no secret is recorded |
| GitHub/Vercel targets | Not supplied; no push or hosting release exists |

This is a readiness package, not an approval, deployment record, live-test result, or release claim. No signature, contract write, deployment transaction, or Studio E2E action has been sent from this checkpoint.

## Required deployment classification

**Classification: `INTENTIONALLY FROZEN`.** Stage 2 says that no upgrade mechanism is advertised for this single-contract product. The implementation therefore exposes no upgrade method and has no upgrade storage. A post-deployment defect may require a new contract deployment and a frontend/address update; the existing frozen contract cannot be repaired in place.

User confirmation recorded in this Task: `Xác nhận contract này là INTENTIONALLY FROZEN; nếu có lỗi sau deploy thì phải deploy contract mới.`

## Exact source and approved baseline

Research and specification artifacts remain the exact approved upstream baseline. The canonical package identifiers recorded by the approved handoff are not claims about the SHA-256 of the local files:

~~~text
Canonical research package SHA: 3464E830908CB1D87504057567242D36BDCD0C4FD59934B7D22F6482C6799ED2
Canonical Stage 1 package SHA:  29F4157210B2D9100D7F04FB7FBCC77E56BEC8B821813E4D7E0C3E88F123A686
Canonical Stage 2 package SHA:  D67DEA1887DDBD85E62692EC5EB8F6C31F03025A44858A2FA4B07AE36B3627BA
~~~

Exact local artifacts used for this checkout:

~~~text
RESEARCH-HANDOFF.md 90887C6D6AC6BEC64923E055B6BA49A58CD744AED71DBF7274E029C413C836FE
STAGE-1.md           BF5AABF59A75957BBCB95BDC0E6859F0AB83916EEBFD0974078E7CED54779155
STAGE-2.md           0A63F8F82F794555B08A9EEF04D925322CF940F205104D516CCC3E6462537749
~~~

The current implementation is a single `CommittedAnswerMatch` contract plus a React/Vite frontend. The source hashes at the exact revision are:

~~~text
contracts/main.py 48B8B3BA0BEB806699CA777F90178020A85ACC6CA2EDB74765F1E109EFFEB18B
contract-schema.json B6450B0E994156186EFCA475BCE61F079A468CCFAC38D80E486617B7EC078FAB
tests/test_contract.py 8EBDE5C711D199A6E471D5F927C6CC9E47359F3FFF070F3FD42D32482D30A596
frontend/src/App.tsx 52D865B493FCF200776D72A40F936329954A19F7748438D18B88E5CD68F59DB0
frontend/src/styles.css 77BEFAEC5F7E2AEC88136A7F53A122787300C4248CA7E9D92C90671C1691930E
frontend/src/contract.ts 3CDF41EDEB81B7BF5AD8DCC1F20B3AC7C2001078A7BC0EAE75A439604CFD25FF
frontend/src/contract.test.ts C0F3D2A7175A7444D1800126762F12B27661BBE244D5BCBC3557D0B806BDAAFB
frontend/src/pending.ts 8BF9D873FD8AB311604B9D9064B5DB010F155AC3ACBDFB644B27C191BDC503DD
frontend/src/pending.test.ts B781F4EAF0C318943588634A88F3E392FA7ED021DD96D26E2A776249AD67EC6A
frontend/src/chain/writeCoordinator.ts 9637537343D69178BDFC2F96A3A81AD1306F9F64BDCBD6DC37D8D7C000535EDB
frontend/src/chain/writeCoordinator.test.ts ADCCE276C672E95D525E4D44DFA2652EDD5081D35B2BADB6B509BEEC27A65399
frontend/src/verification.ts 2A5AFFE777DA95CDF1B9CE673B6EF01A7260613312D1B01C34D0111E803E06A1
frontend/src/verification.test.ts 53AAC0212A6697202CCAA03E2398F3C36D904CCD42433D4F54D483E0FC7AB03B
frontend/src/wallet/providers.ts A519ADB2FF99637EC51012F849B34583F48C182E85DEECD66F5046C037667A91
frontend/src/wallet/connection.ts 7615F7B529BE0553EF3146B1E27E6414ED9BCB2B2565DE81B4CF5AC6C14A7773
frontend/src/components/TransactionProgress.tsx DE619CBCB405A1284B3C3023C8DDAABE1ADFC25949320779E5FA13FB1C09140F
frontend/src/transactionProgress.test.ts 04B3E1AE759423C90A59A7B0E58EF35C1CD4DC8DC873BCEF097A434278C44B13
frontend/src/journalStatus.test.ts D89CDBD3B88F7DA13F4BAB05D387A8F11C424326F62A2ADA22756DAB592D2643
frontend/tests/flow.spec.ts 8A50C345F60324DCC2C264BF98FF9F3B8E6C2C21F6DF48C203558EBBE0D211A6
docs/STAGE-1-2-IMPLEMENTATION-ADAPTATION.md 77FDDA9392FA8FC7A0B776DF9A1233C3B0140E375AF33757074BC11A33AC9261
docs/RPC-BUDGET.md A205EC84027FEA4A50F8DDB0C01762CB7578F17A01052FC74B753E1E28ED86F4
docs/DEPLOYMENT-MANIFEST.md 4EB1F43C01E249594EF8C1187A6352DAC3F74CEC53D4D6FD27EBBD1401D32F95
docs/RECOVERY-RUNBOOK.md 3A96B5B24B0AAD2A48478092753AD245B7B37D620E6CD574CDA4BEA252E83E49
~~~

The implementation source revision is 4b6556ad9b469f2baf95509d07970c0de19a3d45. It closes the retained reviewer delta with exact pre-state-bound transitions, strict deadline advancement, competing/finalized-error classification, hashless lookup, raw journal recovery, hidden-tab pause, paged complete journal rendering, byte/control-equivalent frontend validation, exact public transaction progress, journal health latching, monotonic reconciliation evidence, single-flight lifecycle control, duplicate-key quarantine, truthful finalized-error labels, reload-visible hashes, the explicit 15-key journal adaptation, and the separate Studio plus frontend RPC budgets. The user-frozen contract itself remains unchanged by any later deployment action.

## Runtime, documentation, and technical decisions

Installed versions used for this package:

```text
Python 3.13.6
genlayer-py 0.16.3
genlayer-test 0.29.2
genvm-linter 0.11.0
Node v22.22.2
npm 12.0.2
genlayer-js 1.1.8
React 18.3.1
Vite 6.4.3
Playwright 1.62.0
```

The contract uses the current installed header:

```text
# v0.1.0
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
```

The effective browser journal schema is the explicit adaptation recorded in
[`docs/STAGE-1-2-IMPLEMENTATION-ADAPTATION.md`](/E:/GenLayer-Projects/committed-answer-match/docs/STAGE-1-2-IMPLEMENTATION-ADAPTATION.md): exactly 15 bounded keys, with `pre_state_json` and `resolution_json` bound to the same reservation. The old 13-key shape and duplicate JSON keys at any depth are preserved as raw unknown data and cannot authorize signing.

Current official documentation was checked on 2026-09-05 for transaction context, GenLayerJS, writing/querying transactions, transaction status, and the linter:

- https://docs.genlayer.com/developers/intelligent-contracts/features/transaction-context
- https://docs.genlayer.com/developers/decentralized-applications/genlayer-js
- https://docs.genlayer.com/developers/decentralized-applications/writing-data
- https://docs.genlayer.com/developers/decentralized-applications/querying-a-transaction
- https://docs.genlayer.com/api-references/genlayer-node/gen/gen_getTransactionStatus
- https://docs.genlayer.com/api-references/genlayer-linter

The contract's time arithmetic uses `datetime.now(timezone.utc)` under the documented deterministic transaction-time mechanism. The Direct Mode runner's `warp()` patches that clock for local tests. This is local runtime evidence only; it is not Studio or live-chain proof.

## Contract and schema inventory

Constructor: `__init__()` with no arguments; initializes `case_count` to zero and leaves runtime-managed maps in their default storage identity.

Persistent fields:

```text
case_count:u256
cases:TreeMap[u256,str]
nonce_index:TreeMap[str,u256]
actor_index:TreeMap[str,str]
child_index:TreeMap[u256,str]
version_index:TreeMap[u256,u256]
history:TreeMap[str,str]
```

Public writes:

```text
create_match(nonce:str, opponent:Address, clue:str, commitment:str) -> u256
submit_guess(case_id:u256, guess:str, expected_revision:u256) -> None
reveal_answer(case_id:u256, answer:str, salt:str, expected_revision:u256) -> None
evaluate_match(case_id:u256, expected_revision:u256) -> None
retry_match(case_id:u256, expected_revision:u256) -> None
expire_match(case_id:u256, expected_revision:u256) -> None
```

Public views:

```text
get_case(case_id:u256) -> str
get_version(case_id:u256, revision:u256) -> str
get_id_by_nonce(creator:Address, nonce:str) -> u256
get_count() -> u256
list_cases(start_id:u256, limit:u256) -> str
list_actor(actor:Address, offset:u256, limit:u256) -> str
list_children(parent_id:u256, offset:u256, limit:u256) -> str
```

Record and digest rules are bound to Stage 2: canonical JSON, CRLF-to-LF before hashing, no Unicode normalization or case folding except lowercase hexadecimal, context-bound SHA-256 preimage, bounded text, canonical decimal IDs/revisions, and immutable accepted history.

The only nondeterministic path is semantic assessment after reveal. A deterministic exact text match returns `MATCH` without an LLM call. Otherwise `gl.nondet.exec_prompt` is isolated inside `gl.vm.run_nondet_unsafe`; the leader and validator rederive the bounded `{v:1,label}` result from captured primitive JSON data and fail closed on malformed output or disagreement. There are no web fetches, linked contracts, value transfers, external APIs, or backend dependencies.

## Layered local evidence

The following commands were executed against this exact source revision:

| Layer | Command | Result |
|---|---|---|
| Contract deterministic/direct | `$env:PYTHONIOENCODING='utf-8'; py -3.13 -m pytest tests\\test_contract.py -q -p no:cacheprovider` | `12 passed in 0.38s` |
| Contract lint | `genvm-lint check contracts\\main.py` | `Lint passed (3 checks)` |
| Contract validation | `genvm-lint validate contracts\\main.py` | `Validation passed; CommittedAnswerMatch; 13 methods (7 view, 6 write)` |
| Schema | `genvm-lint schema --json -o contract-schema.json contracts\\main.py` | `Schema written` |
| Frontend unit | `npm test -- --run` from `frontend` | `8 files passed; 53 tests passed` |
| Frontend type check | `npx tsc --noEmit` from `frontend` | Pass |
| Frontend build | `npm run build` from `frontend` | `Vite build passed; 5438 modules; non-blocking >500 kB chunk warning` |
| Browser E2E | `npm run test:e2e` from `frontend` | `6 passed` |
| Closure serialization | `cloudpickle.dumps` of captured leader and validator with `VMContext.check_pickling=True` | Passed in the installed Direct Mode runtime; no pickling error |
| Static trust scans | bounded `rg` scans for forbidden provider singleton and journal-key derivation | No forbidden matches |

The contract tests cover idempotent context-bound creation, authorization, wrong phase, stale revision, atomic bad reveal, exact match, consensus NO_MATCH, deliberate validator disagreement, malformed consensus, UNKNOWN/cooldown/exhaustion, explicit void expiry, inclusive deadline behavior, wrong chain context, bounded lists, and production-shaped closure serialization.

The frontend transaction indicator is driven by actual coordinator events and exposes the required `IDLE`, `WAITING_FOR_WALLET`, `SUBMITTED`, `WAITING_FOR_FINALITY`, `VERIFYING_EXECUTION`, `VERIFYING_READBACK`, `SUCCESS`, `REJECTED`, `FAILED` and `RECONCILIATION_REQUIRED` phases. It retains a returned hash with copy and verified Studionet Explorer actions, and a journal lock/storage failure latches signing off while read/export/reconcile remain available. One global lifecycle gate prevents concurrent write/reconciliation pollers; the journal pages visible records at four per page while export retains all valid and malformed entries. Finalized-error journal labels distinguish expected state present, unchanged state and competing operation, and a valid stored hash remains visible with safe reconciliation after reload. Pre-sign local failures remain local notices with no false `FAILED` transaction phase.

## Separate RPC budget gate

`docs/RPC-BUDGET.md` is the locked project matrix for both independent scopes required by the canonical rule: `STUDIO.RPC_BUDGET` for Studio/CLI/Studio-E2E traffic and `FRONTEND.RPC_BUDGET` for browser/Vercel traffic. The Studio matrix is required before opening Studio, deploying, or sending any Studio transaction. The frontend matrix is required before frontend repair and must later be measured on the exact release. Neither scope can satisfy the other.

The matrix enforces local/Direct Mode first, one exact deploy, unique live transitions only, no parallel poller, bounded lightweight status probes, full receipt only at terminal/diagnostic boundary, one deliberate authoritative readback, no duplicate submission, and explicit variance accounting. Studio evidence is NOT_YET_LIVE; frontend evidence is LOCAL_ONLY. Missing live measurement is not zero and blocks the later POST_DEPLOY_TEST/release gate.

## Minimum Studio E2E plan after anonymous approval

All live rows must be executed by the primary AI in the Codex in-app GenLayer Studio against the exact deployed source. The locked Studio deployer account and its public address will be recorded before review without exposing secrets. No row below is live evidence yet.

| ID | Criterion and actor | Action / method | Expected final evidence |
|---|---|---|---|
| S00 | Deploy/freeze parity; locked Studio deployer | Deploy the exact frozen source with the empty constructor | Studionet `FINALIZED`, semantic execution success, deployed source/version and SHA-256 parity, initial `get_count()` readback `0` |
| S01 | Creator A positive path | `create_match` with a fresh lowercase 32-hex nonce, distinct B address, public clue, and commitment derived from the exact chain/contract/A/B/nonce/clue/answer/salt preimage | `FINALIZED` + `FINISHED_WITH_RETURN`, returned ID, `GUESS_OPEN` revision `1`, one exact `get_version` readback; `get_case` only on an explicit user read |
| S02 | Assigned guesser B | `submit_guess(id, "hello", 1)` on the S01 case | `REVEAL_WAIT` revision `2`, locked guess, new deadline, one exact `get_version` history/readback |
| S03 | Creator A | Verify the saved backup and call `reveal_answer(id, "hello", salt, 2)` | `FROZEN` revision `3`, revealed answer/salt, commitment recomputation parity, one exact `get_version` history/readback |
| S04 | Independent evaluator | `evaluate_match(id, 3)` on S01 | `DONE`/`MATCH`, accepted attempt `1`, `{v:1,label:MATCH}`, finalized receipt, consensus/finality and one exact `get_version` historical readback |
| S05 | Semantic no-match path; A/B plus independent evaluator | Fresh case with public synthetic clue, revealed answer `correct reference`, and materially different guess `different wording`; call create, guess, reveal, evaluate | Consensus-backed `DONE`/`NO_MATCH` with `FINISHED_WITH_RETURN`, stable result and historical readback; if consensus is unavailable, record failure and do not reinterpret it as success |
| S06 | No-write authorization/revision control | Repeat a case write from the wrong actor and with a stale revision; attempt a bad reveal | Rejection/failed execution with no revision, history, phase, attempt, or deadline mutation; authoritative pre-state readback |
| S07 | UNKNOWN/retry safety | Use a fresh semantic case and execute evaluation/retry only when the live result is `UNKNOWN`; retry once after the documented 60-second transaction-time cooldown | `UNRESOLVED` then a valid retry transition or a bounded unchanged failure; no terminal MATCH can arise from UNKNOWN; exact history/readback |
| S08 | Expiry/void path | Fresh case left in `GUESS_OPEN` or `REVEAL_WAIT`; after strict transaction time exceeds its deadline call `expire_match` | `DONE`/`VOID`, no model call, all submitted data/history preserved, finalized receipt and readback |

Every attempted row, including failed or unavailable rows, must be recorded later with case ID, exact source/deployed hash, account/role, method and non-secret arguments, transaction hash, lifecycle status, execution result, consensus/finality, authoritative readback, actual result, and `PASS`/`FAIL`. The plan is deliberately not a claim that any row has run.

## Applicable gate excerpts and blockers

The current exact-source package must satisfy these checkpoint rules before any deployment or write:

- **Contract Schema Runtime and Test Compatibility Gate §§8–9:** include current header/dependency/docs, source hash, lint/schema, public inventory, storage/ABI/generic/address inventory, nondeterministic wrapper/evidence/validator/error/consequence inventory, layered tests including disagreement and serialization, and linked-contract/Studio limitations. Block when any exact schema/runtime requirement or known failure is unresolved; local green tests never waive a schema blocker.
- **Recoverability and Upgradability Gate §§1, 7A, 8:** classify every contract as `UPGRADABLE` or `INTENTIONALLY FROZEN`; for frozen code, record explicit user confirmation and explain that a post-deployment defect may require a new contract; prepare a secret-free Studionet manifest and recovery plans; no signature, deployment transaction, or write before authorization.
- **Submission Integrity Gate §§6, 8–10:** off-chain records remain provisional until finalized semantic success and authoritative readback; exact source, deployed source, address, manifest and evidence must match; target Studionet; disclose that local tests and prose do not substitute for live evidence.
- **AI hierarchy:** `PRE_DEPLOY` is before any signature/deployment/write and bundles the Studio E2E plan. It is not deployment proof. Later `POST_DEPLOY_TEST`, `POST_GITHUB_VERCEL_FINAL`, and `EXPLORER_PRE_SUBMISSION` remain separate approvals.

The following blanks were true at the historical checkpoint and are now
superseded where the current manifest and incident record provide evidence:

1. The retained anonymous reviewer route is supplied in this Task. The delta package must be sent on that existing route and verified by reading the exact completed reviewer turn; no replacement reviewer conversation is allowed.
2. GitHub identity, Vercel team/project, and public release URL remain unset; the replacement contract address, deployment transaction, live receipts, Explorer parity and Studio readbacks are now recorded in the current evidence files.
3. The user-frozen classification is recorded, but it does not waive the anonymous PRE_DEPLOY review, Studio RPC matrix, Studio E2E, or later release gates.

The retained reviewer returned the exact `ANONYMOUS REVIEW APPROVED - PRE_DEPLOY`
verdict. That approval does not waive the remaining `POST_DEPLOY_TEST`,
`POST_GITHUB_VERCEL_FINAL`, or `EXPLORER_PRE_SUBMISSION` gates.
