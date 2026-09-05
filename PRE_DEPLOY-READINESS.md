# Committed Answer Match — PRE_DEPLOY Readiness

## Checkpoint status

| Field | Current value |
|---|---|
| Workflow | Build |
| Category | `PROJECT` |
| Checkpoint | `PRE_DEPLOY` |
| Package identity | `CAM-PREDEPLOY-9F6452B6-LOCAL-1` |
| Exact source revision | `9f6452b6d2030605f72d9912b095c501b62451ac` |
| Status | `NOT REQUESTED / HOLD` |
| Anonymous reviewer delivery | `NOT SENT — no retained reviewer route supplied` |
| Studionet contract | Not deployed; no address or deployment transaction exists |
| Studio account | Not yet selected and locked in a Studio session; no secret is recorded |
| GitHub/Vercel targets | Not supplied; no push or hosting release exists |

This is a readiness package, not an approval, deployment record, live-test result, or release claim. No signature, contract write, deployment transaction, or Studio E2E action has been sent from this checkpoint.

## Required deployment classification

**Proposed classification: `INTENTIONALLY FROZEN`.** Stage 2 says that no upgrade mechanism is advertised for this single-contract product. The implementation therefore exposes no upgrade method and has no upgrade storage. A post-deployment defect may require a new contract deployment and a frontend/address update; the existing frozen contract cannot be repaired in place.

The recoverability gate still requires an explicit user confirmation of this immutability decision before deployment authorization. The general instruction to continue work is not recorded here as that distinct decision. Until the explicit confirmation is recorded, this package remains on hold.

## Exact source and approved baseline

Research and specification artifacts remain the exact approved upstream baseline:

```text
RESEARCH-HANDOFF.md 3464E830908CB1D87504057567242D36BDCD0C4FD59934B7D22F6482C6799ED2
STAGE-1.md           29F4157210B2D9100D7F04FB7FBCC77E56BEC8B821813E4D7E0C3E88F123A686
STAGE-2.md           D67DEA1887DDBD85E62692EC5EB8F6C31F03025A44858A2FA4B07AE36B3627BA
```

The current implementation is a single `CommittedAnswerMatch` contract plus a React/Vite frontend. The source hashes at the exact revision are:

```text
contracts/main.py 48B8B3BA0BEB806699CA777F90178020A85ACC6CA2EDB74765F1E109EFFEB18B
contract-schema.json B6450B0E994156186EFCA475BCE61F079A468CCFAC38D80E486617B7EC078FAB
tests/test_contract.py 8EBDE5C711D199A6E471D5F927C6CC9E47359F3FFF070F3FD42D32482D30A596
frontend/src/App.tsx F696EE9A896EDFFB15074675216708D63F9A2DF61D52AD9BABBBC4302DC0D060
frontend/src/styles.css A7413DC9BB6A7108DA0AE396DC7948AB53E42E992BBEFADFBCBFA64D12D22887
frontend/src/contract.ts 28223FD78C1688946433DDF3A752C3BF78416CA5A45DC532E003ACB05D1BC076
frontend/src/pending.ts E258BE741E2641F4D03741BE7EF3A7969F4BD1600D8CACDA7BC63723107FD1F3
frontend/src/chain/writeCoordinator.ts C453F34D3496F2CA701793025D160E5C82CE7B332C7895E45A66A7F148C67E43
frontend/src/wallet/providers.ts A519ADB2FF99637EC51012F849B34583F48C182E85DEECD66F5046C037667A91
frontend/src/wallet/connection.ts 7615F7B529BE0553EF3146B1E27E6414ED9BCB2B2565DE81B4CF5AC6C14A7773
```

The exact source commit includes the local functional shell, its tests, the contract schema, `DESIGN.md`, and `README.md`. `CLAUDE-FRONTEND-REDESIGN-PROMPT.md` is a later handoff document that names this source revision; it is not a source change.

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
| Contract deterministic/direct | `$env:PYTHONIOENCODING='utf-8'; py -3.13 -m pytest tests\\test_contract.py -q -p no:cacheprovider` | `12 passed in 0.53s` |
| Contract lint | `genvm-lint check contracts\\main.py` | `Lint passed (3 checks)` |
| Contract validation | `genvm-lint validate contracts\\main.py` | `Validation passed; CommittedAnswerMatch; 13 methods (7 view, 6 write)` |
| Schema | `genvm-lint schema --json -o contract-schema.json contracts\\main.py` | `Schema written` |
| Frontend unit | `npm test` from `frontend` | `4 files passed; 21 tests passed` |
| Frontend type/build | `npm run build` from `frontend` | `Vite build passed; 5436 modules; non-blocking >500 kB chunk warning` |
| Browser E2E | `npm run test:e2e` from `frontend` | `3 passed` |
| Closure serialization | `cloudpickle.dumps` of captured leader and validator with `VMContext.check_pickling=True` | Passed in the installed Direct Mode runtime; no pickling error |
| Static trust scans | bounded `rg` scans for forbidden provider singleton and journal-key derivation | No forbidden matches |

The contract tests cover idempotent context-bound creation, authorization, wrong phase, stale revision, atomic bad reveal, exact match, consensus NO_MATCH, deliberate validator disagreement, malformed consensus, UNKNOWN/cooldown/exhaustion, explicit void expiry, inclusive deadline behavior, wrong chain context, bounded lists, and production-shaped closure serialization.

## Minimum Studio E2E plan after anonymous approval

All live rows must be executed by the primary AI in the Codex in-app GenLayer Studio against the exact deployed source. The locked Studio deployer account and its public address will be recorded before review without exposing secrets. No row below is live evidence yet.

| ID | Criterion and actor | Action / method | Expected final evidence |
|---|---|---|---|
| S00 | Deploy/freeze parity; locked Studio deployer | Deploy the exact frozen source with the empty constructor | Studionet `FINALIZED`, semantic execution success, deployed source/version and SHA-256 parity, initial `get_count()` readback `0` |
| S01 | Creator A positive path | `create_match` with a fresh lowercase 32-hex nonce, distinct B address, public clue, and commitment derived from the exact chain/contract/A/B/nonce/clue/answer/salt preimage | `FINALIZED` + `FINISHED_WITH_RETURN`, returned ID, `GUESS_OPEN` revision `1`, exact `get_case`/`get_version` readback |
| S02 | Assigned guesser B | `submit_guess(id, "hello", 1)` on the S01 case | `REVEAL_WAIT` revision `2`, locked guess, new deadline, exact history/readback |
| S03 | Creator A | Verify the saved backup and call `reveal_answer(id, "hello", salt, 2)` | `FROZEN` revision `3`, revealed answer/salt, commitment recomputation parity, exact history/readback |
| S04 | Independent evaluator | `evaluate_match(id, 3)` on S01 | `DONE`/`MATCH`, accepted attempt `1`, `{v:1,label:MATCH}`, finalized receipt, consensus/finality and historical readback |
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

Current blockers are intentional and explicit:

1. The user must explicitly confirm `INTENTIONALLY FROZEN` and the consequence that a post-deployment defect requires a new contract, or choose a different governed classification.
2. The primary AI must select and record an accessible Studio deployer account and public address before the anonymous PRE_DEPLOY handoff; no account or secret has been guessed or recorded.
3. The user must supply the retained anonymous reviewer route for the one required first-contact handoff. The complete package is not marked sent merely because this file or the prompt file exists.
4. Contract address, deployment transaction, live receipts, Explorer/RPC readback, GitHub identity, Vercel team/project, and public release URL do not exist yet and are intentionally blank at this checkpoint.

Until these are resolved, do not deploy, sign, write, push, configure a public contract address, or claim `PRE_DEPLOY` approval.
