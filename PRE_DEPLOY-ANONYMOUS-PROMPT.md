DELTA — RETAINED REVIEWER ROUTE (FIRST CONTACT ALREADY DELIVERED)

REVIEWER: anonymous co-review AI
WORKFLOW: BUILD
TASK ID: committed-answer-match
PROJECT: Committed Answer Match
PROJECT PATH: E:\GenLayer-Projects\committed-answer-match
CATEGORY: PROJECT
CHECKPOINT: PRE_DEPLOY
REVISION/PACKAGE: source `b255cd3359ad3a870ba61c370d4133dcd9f96a30`; package `CAM-PREDEPLOY-B255CD33-DELTA-1`
DOCUMENT MODE / BASELINE: full exact-source review from the approved Stage 1/2 baseline
STATUS: delta sent on the supplied retained route; final reviewer turn pending

## Objective and acceptance criteria

Independently review this exact Committed Answer Match implementation for `PRE_DEPLOY`, including the bundled minimum-sufficient Studionet Studio E2E plan. Verify source/specification consistency, current schema/runtime compatibility, storage and ABI safety, nondeterministic isolation and substantive validator rederivation, production-shaped serialization, wallet and transaction safety, public UI truthfulness, recovery classification, and exact evidence binding.

Approve only if every current PRE_DEPLOY requirement passes for this exact revision/package. `PRE_DEPLOY` approval would authorize only the reviewed deployment readiness and the bundled Studio plan; it is not deployment proof, live evidence, GitHub/Vercel approval, or Explorer submission approval.

## Complete review package

The implementation source revision is `b255cd3359ad3a870ba61c370d4133dcd9f96a30`. This is a delta to the already-delivered first-contact review on the retained route, not a new reviewer task. The delta adds exact method-specific verification, same-hash reconciliation, lock-free journal reading, backup binding, chain-time expiry gating, CRLF-safe reveal hashing, and the two independent RPC budget matrices. No signature, deployment transaction, contract write, Studio E2E, GitHub push, Vercel release, Explorer readback, or public release URL exists.

Canonical approved upstream package identifiers (not local file hashes):

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

Exact implementation/evidence hashes:

~~~text
contracts/main.py 48B8B3BA0BEB806699CA777F90178020A85ACC6CA2EDB74765F1E109EFFEB18B
contract-schema.json B6450B0E994156186EFCA475BCE61F079A468CCFAC38D80E486617B7EC078FAB
tests/test_contract.py 8EBDE5C711D199A6E471D5F927C6CC9E47359F3FFF070F3FD42D32482D30A596
frontend/src/App.tsx 935927EDC425818390585E86BA7B3C75E2B0A737E6187DF813A79BFD12BD3349
frontend/src/styles.css A7413DC9BB6A7108DA0AE396DC7948AB53E42E992BBEFADFBCBFA64D12D22887
frontend/src/contract.ts 615A558588594FBBD52266091F4D44CB0A4676BF83ECF8E4265904E168A50753
frontend/src/contract.test.ts 89385A1A2A8EDD9E87420BDD3AB01B8F0CB9682E358A180D64DD3ADF7C07C80D
frontend/src/pending.ts 4C239071503006187DB8733F51CC9938F6D7F646D6C1715E9D431E52FEE989A6
frontend/src/pending.test.ts A9996DFB7D17E44C5409B259715DF0544962B61B9D291DBCD82E2AAD4FFE0726
frontend/src/chain/writeCoordinator.ts 0B0975E34A062F3F2ABA562E1702D1DF5906E3848B771A4C732CB321876F11DE
frontend/src/chain/writeCoordinator.test.ts 527531E4477EC972B6360CE915BEB03E850769E52905FF0B28114D70BF165652
frontend/src/verification.ts 8E9F345FD4095EADC4206755781E853E85F69A7725C2A480A34ACFDD840E499B
frontend/src/verification.test.ts FCE7DAEA4A79B8739564C85035B5C824D36EC471FF73EDA1086DC06FB783E05F
frontend/src/wallet/providers.ts A519ADB2FF99637EC51012F849B34583F48C182E85DEECD66F5046C037667A91
frontend/src/wallet/connection.ts 7615F7B529BE0553EF3146B1E27E6414ED9BCB2B2565DE81B4CF5AC6C14A7773
docs/RPC-BUDGET.md 595BBFF3CE433EFF3586EA501F95DBD6669FA80041263AEC0E1BA99B594BB09B
~~~

Relevant implementation diff summary:

- `contracts/main.py` implements the approved C2 lifecycle, canonical context-bound SHA-256 commitment, deterministic exact-match short circuit, one bounded semantic assessment with independent validator rederivation, atomic phase/revision/history updates, and explicit expiry.
- `frontend/src/contract.ts` uses one shared installed `genlayer-js` `studionet` read client, in-flight deduplication, the official lightweight status endpoint for the first two probes, terminal/diagnostic full receipt normalization, exact record parsing, and explicit chain-time reads.
- `frontend/src/chain/writeCoordinator.ts` writes the journal before signing, submits once, polls at most three times, requires `FINALIZED` plus `FINISHED_WITH_RETURN`, performs one deliberate authoritative readback, bounds Retry-After/backoff/cancellation, and preserves same-hash reconciliation on uncertainty.
- `frontend/src/pending.ts` keeps mutations under the required `navigator.locks` mutex while making journal listing/export and same-hash reconciliation available when signing is unavailable; it retains random 16-byte reservation keys, the 32-record cap, and immutable operation context.
- `frontend/src/wallet/` implements bounded EIP-6963 plus recognized legacy discovery for only MetaMask, OKX Wallet, and Rabby, with explicit selection and reload-on-session-change behavior.
- `frontend/src/App.tsx` enforces exact method-specific postconditions, offers same-hash Resume/Reconcile without resubmission, binds backup acknowledgement to the current commitment context, normalizes CRLF answers before reveal, gates expiry on explicit refreshed chain time, and keeps role-aware UI truthful. The final visual redesign is a separate bounded Claude handoff and is not a reason to alter this contract or transaction package.
- `docs/RPC-BUDGET.md` records independent `STUDIO.RPC_BUDGET` and `FRONTEND.RPC_BUDGET` matrices, evidence schemas, per-write envelopes, physical-provider-call measurement requirements, and the explicit pre-deployment live-evidence boundary.

Observed Studio identity before any deployment: selected account `0xeF5D2119416A2f5afa35dCFA209766EFC1BE5902` in the Codex in-app Browser on 2026-09-05. No secret is included. The displayed balance was 998 GEN at observation time and is not treated as a durable balance claim.

Deployment classification: `INTENTIONALLY FROZEN`. Stage 2 advertises no upgrade mechanism. The source exposes no upgrade method or upgrade storage. A post-deployment defect would require a new contract deployment and frontend/address update. The user has explicitly confirmed in this Task: `Xác nhận contract này là INTENTIONALLY FROZEN; nếu có lỗi sau deploy thì phải deploy contract mới.`

## Current runtime and official references

Installed versions used for local evidence: Python 3.13.6, `genlayer-py` 0.16.3, `genlayer-test` 0.29.2, `genvm-linter` 0.11.0, Node v22.22.2, npm 12.0.2, `genlayer-js` 1.1.8, React 18.3.1, Vite 6.4.3, and Playwright 1.62.0.

Official documentation checked on 2026-09-05:

- https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio
- https://docs.genlayer.com/developers/intelligent-contracts/features/transaction-context
- https://docs.genlayer.com/developers/decentralized-applications/genlayer-js
- https://docs.genlayer.com/developers/decentralized-applications/writing-data
- https://docs.genlayer.com/developers/decentralized-applications/querying-a-transaction
- https://docs.genlayer.com/api-references/genlayer-node/gen/gen_getTransactionStatus
- https://docs.genlayer.com/api-references/genlayer-linter

The intended network is Studionet, chain ID `61999`, using the installed `studionet` preset. The contract header is:

```text
# v0.1.0
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
```

## Contract/schema/runtime review facts

The contract has one discoverable `gl.Contract` class, no linked contracts, no value transfers, no web fetches, and no backend dependency. Persistent fields are exactly:

```text
case_count:u256
cases:TreeMap[u256,str]
nonce_index:TreeMap[str,u256]
actor_index:TreeMap[str,str]
child_index:TreeMap[u256,str]
version_index:TreeMap[u256,u256]
history:TreeMap[str,str]
```

Public writes are:

```text
create_match(nonce:str, opponent:Address, clue:str, commitment:str) -> u256
submit_guess(case_id:u256, guess:str, expected_revision:u256) -> None
reveal_answer(case_id:u256, answer:str, salt:str, expected_revision:u256) -> None
evaluate_match(case_id:u256, expected_revision:u256) -> None
retry_match(case_id:u256, expected_revision:u256) -> None
expire_match(case_id:u256, expected_revision:u256) -> None
```

Views are `get_case`, `get_version`, `get_id_by_nonce`, `get_count`, `list_cases`, `list_actor`, and `list_children`; the generated schema reports 13 methods total, 7 view and 6 write.

The digest is the canonical JSON array `[
  "ANSWER_MATCH_V1", chain_decimal, contract_lower, creator_lower,
  opponent_lower, nonce, clue, answer, salt
]` hashed with UTF-8 SHA-256. CRLF becomes LF before validation/digest; no Unicode normalization or case folding is applied except lowercase hexadecimal. Create stores only the public commitment context; answer and salt enter the contract only after a valid reveal.

The only nondeterministic path is semantic evaluation after reveal. `gl.nondet.exec_prompt` runs inside `gl.vm.run_nondet_unsafe`; leader and validator operate on captured primitive JSON data, require exact bounded `{v:1,label}` output, and independently rederive the label. Malformed output, validator failure, or disagreement fails closed without mutation. Exact byte equality uses deterministic `MATCH` and does not call the model.

## Local evidence actually executed

```text
$env:PYTHONIOENCODING='utf-8'; py -3.13 -m pytest tests\test_contract.py -q -p no:cacheprovider
12 passed in 0.53s

genvm-lint check contracts\main.py
Lint passed (3 checks)

genvm-lint validate contracts\main.py
Validation passed; CommittedAnswerMatch; 13 methods (7 view, 6 write)

genvm-lint schema --json -o contract-schema.json contracts\main.py
Schema written to contract-schema.json

npx tsc --noEmit
pass

npm test
6 files passed; 30 tests passed

npm run build
Vite build passed; 5437 modules; non-blocking warning for a minified chunk over 500 kB

npm run test:e2e
3 passed
```

The contract suite covers idempotent creation/context binding, authorization and wrong phase, stale revision and atomic bad reveal, exact MATCH, consensus NO_MATCH, deliberate validator disagreement, malformed consensus, UNKNOWN/cooldown/exhaustion, explicit VOID expiry, inclusive deadlines, wrong chain context, bounded lists, and production-shaped closure serialization. The serialization test enables `VMContext.check_pickling=True` and `cloudpickle.dumps` the captured leader and validator closures after semantic assessment.

Frontend E2E covers no account request on page load or picker open, exact single-provider rendering, zero-provider empty state without fake wallet choices, focus restoration, inert background, and journal-lock failure without signing. Static scans found no direct global `window.ethereum` access and no derivation of `glj1:` storage keys from `operationFingerprint`.

## Delta closure matrix

| Prior finding | Closure in this exact delta | Regression/evidence |
|---|---|---|
| F-001 exact method-specific readback missing | `frontend/src/verification.ts` and `frontend/src/App.tsx` require exact create, submit, reveal, evaluate, retry and expire postconditions; broad terminal phase acceptance is rejected | `frontend/src/verification.test.ts`; `npm test` |
| F-002 no same-hash Resume/Reconcile UI | `writeCoordinator.reconcileWrite` and JournalPanel Reconcile invoke one lifecycle probe plus one authoritative view and never submit | `frontend/src/chain/writeCoordinator.test.ts`; browser path |
| F-003 journal unavailable without Web Locks | Journal list/export and lockless reconcile use read-only storage scan; only signing/mutations require Web Locks | `frontend/src/pending.test.ts` and Playwright no-lock test |
| F-004 backup acknowledgement not bound to current commitment | Binding includes chain, contract, creator, opponent, nonce, clue, answer, salt and commitment; input/wallet/contract changes reset acknowledgement | `backupBinding` tests in `frontend/src/verification.test.ts` |
| F-005 six-RPC write budget exceeded | At most one submission, three bounded lifecycle probes, and one action readback; create uses returned ID when available or one fallback ID-plus-version path | coordinator tests and `docs/RPC-BUDGET.md` |
| F-006 upstream artifact labels were misleading | Canonical handoff SHAs and exact local file SHAs are separately labeled above | Rehashed local `RESEARCH-HANDOFF.md`, `STAGE-1.md` and `STAGE-2.md` |
| F-007 CRLF answer/hash mismatch | Reveal answer is normalized with the contract's CRLF-to-LF rule before hashing and submission | `frontend/src/contract.test.ts` |
| F-008 local clock used as expiry authority | Expiry-capable cases require an explicit latest-block chain-time read; local clock is not authoritative | `readChainTime` path and no local-clock expiry |
| Dual RPC rule omitted Studio scope | `docs/RPC-BUDGET.md` contains both independent matrices and both evidence sections; Studio status is READY_FOR_PRE_DEPLOY_REVIEW and live Studio evidence is NOT_YET_LIVE | Package document plus exact source hash |

## Required dual RPC budget review

The canonical rule has two independent scopes and this delta must be reviewed against both. Studio/CLI/Studio-E2E traffic cannot be counted as frontend evidence, and browser/Vercel traffic cannot be counted as Studio evidence. Missing live measurement is not zero.

### STUDIO RPC BUDGET MATRIX

| Operation | Planned maximum | Boundary |
|---|---:|---|
| Session/network checks | 2 checks | One account and Studionet confirmation |
| Exact source/schema preflight | 1 probe | One exact source/schema check before deploy |
| S00 deploy | 6 RPC/actions | One submission, at most 3 lifecycle probes at 2/4/8 seconds, code/hash check, count readback |
| S01 create | 6 RPC/actions | One submission, at most 3 lifecycle probes, returned-ID readback; ID lookup plus version only when no returned ID |
| S02/S03/S04/S08 each | 5 RPC/actions | One submission, at most 3 lifecycle probes, one exact version readback |
| S05 semantic NO_MATCH sequence | 20 RPC/actions | Four unique writes, each bounded as above with one readback |
| S06 rejected transitions | 9 RPC/actions | Three unique attempts; no replay after a hash |
| S07 UNKNOWN/retry | 10 RPC/actions | One evaluation and retry only when live UNKNOWN plus cooldown permits |
| Explicit read/reconcile | 1 view or 1 lifecycle probe | User-triggered only; never a submission |

Studio must use local/Direct Mode first, deploy the exact frozen source once, execute only unique material transitions, use lightweight transaction status for the first two probes, fetch a full receipt only at terminal/diagnostic boundary, honor Retry-After, and stop on terminal/rate-limit/cooldown/blocker. Actual Studio counts, intervals, hashes, receipts, readbacks, transactions and variance are currently NOT_YET_LIVE.

### FRONTEND RPC BUDGET MATRIX

| Workflow | Planned maximum | Boundary |
|---|---:|---|
| Landing, wallet picker, journal read/export | 0 | Storage/UI only; no hidden RPC |
| Explicit wallet connect | 2 provider calls | eth_requestAccounts plus eth_chainId |
| Open case | 1 view | One shared read client and exact parsed record |
| Explicit expiry refresh | 2 views | get_case plus latest-block chain time |
| Create write | 6 logical calls | One submission, at most 3 bounded lifecycle probes, one returned-ID readback or two-view fallback |
| Any other case write | 5 logical calls | One submission, at most 3 bounded lifecycle probes, one exact post-readback |
| Same-hash Resume/Reconcile | 2 logical calls | One lifecycle probe/terminal receipt plus one exact view; never submits |

Frontend must use one shared read client/configuration per chain and contract, in-flight deduplication, no stale transaction/verdict cache, deliberate invalidation, bounded Retry-After/backoff/jitter with cancellation, and no duplicate write. Physical wallet-provider nonce/gas/preflight calls must be measured separately on the exact release. Frontend evidence is currently LOCAL_ONLY; exact deployed-release measurement remains required.

## Minimum-sufficient Studio E2E plan bundled with this checkpoint

No row below has run. After anonymous PRE_DEPLOY approval, the primary AI must operate the Codex in-app GenLayer Studio using the locked account above, record every attempt, and retain secret-free evidence. The pre-action matrix is `docs/RPC-BUDGET.md` and its Studio scope is independent from the frontend scope. Use only the exact deployed source, Studionet, sparse unique transitions, bounded status probes, one terminal/diagnostic receipt boundary, and authoritative RPC/Explorer/readback.

| ID | Criterion/actor | Exact action | Required evidence |
|---|---|---|---|
| S00 | Deploy/freeze parity; locked Studio deployer | Deploy exact source with empty constructor | `FINALIZED`, semantic execution success, code/version and SHA-256 parity, `get_count() == 0` |
| S01 | Creator A | `create_match` with fresh lowercase 32-hex nonce, distinct B, public clue, and exact context-bound commitment | `FINALIZED` + `FINISHED_WITH_RETURN`, returned ID, `GUESS_OPEN` revision 1, `get_case`/`get_version` readback |
| S02 | Assigned guesser B | `submit_guess(id, "hello", 1)` | `REVEAL_WAIT` revision 2, locked guess, deadline and history readback |
| S03 | Creator A | Verify backup, then `reveal_answer(id, "hello", salt, 2)` | `FROZEN` revision 3, digest recomputation parity, revealed data and history readback |
| S04 | Independent evaluator | `evaluate_match(id, 3)` | `DONE`/`MATCH`, attempt 1, exact result, finalized receipt, consensus/finality and history readback |
| S05 | Semantic no-match; A/B/evaluator | Fresh public synthetic case: answer `correct reference`, guess `different wording`; create, guess, reveal, evaluate | Consensus-backed `DONE`/`NO_MATCH` with semantic execution success and history readback; unavailable consensus remains a recorded failure |
| S06 | No-write controls | Wrong actor, stale revision, and bad reveal attempts | Rejection/failed execution plus authoritative unchanged pre-state; no phase, deadline, revision, history, or attempt mutation |
| S07 | UNKNOWN/retry safety | Fresh semantic case; if live evaluation is `UNKNOWN`, retry only after 60-second transaction-time cooldown | `UNRESOLVED` and valid bounded retry or unchanged safe failure; UNKNOWN never becomes MATCH; exact history |
| S08 | Expiry/VOID | Fresh case left in `GUESS_OPEN`/`REVEAL_WAIT`; after strict deadline call `expire_match` | `DONE`/`VOID`, no model call, preserved inputs/history, finalized receipt and readback |

For every attempted row retain case ID, deployed source hash/version, Studio account/role, method and exact non-secret arguments, transaction hash, observed lifecycle, execution result, consensus/finality, authoritative pre/post readback, actual result, and `PASS`/`FAIL`. A plan is not live evidence.

## Applicable governance excerpts

Apply the current canonical rules, not the primary-AI summary alone:

- **Contract Schema Runtime and Test Compatibility Gate §§8–9:** the exact package must include current header/dependency/docs, source hash, lint/schema, public method inventory, storage/ABI/generic/address inventory, nondeterministic wrapper/evidence/validator/error/consequence inventory, layered tests including disagreement and serialization, and linked-contract/Studio limitations. `PRE_DEPLOY` blocks on any unresolved schema/runtime defect; local green tests never waive a schema blocker.
- **Contract Recoverability and Upgradability Gate §§1, 7A, 8:** every deployment is explicitly `UPGRADABLE` or `INTENTIONALLY FROZEN`. Frozen code requires explicit user confirmation and the warning that a post-deployment defect may require a new contract. Prepare a secret-free Studionet manifest and both local/Studio-reset and Studionet-reset recovery plans. No signature, deployment transaction, or contract write before authorization.
- **Submission Integrity Gate §§6, 8–10:** off-chain state is provisional until `FINALIZED`, semantic execution success, and authoritative readback. Exact source/deployed source/address/manifest/evidence must match. Target Studionet and disclose all material limitations; local tests and prose are not live proof.
- **AI hierarchy:** `PRE_DEPLOY` bundles the Studio E2E plan and occurs before every signature/write/deployment. `POST_DEPLOY_TEST`, `POST_GITHUB_VERCEL_FINAL`, and `EXPLORER_PRE_SUBMISSION` are separate later checkpoints.
- **REVIEW.OPERATIONAL_PROTOCOL:** independently verify the exact package and do not delegate. Return one exact verdict: `ANONYMOUS REVIEW APPROVED - PRE_DEPLOY`, `ANONYMOUS REVIEW CHANGES REQUIRED - PRE_DEPLOY`, or `ANONYMOUS REVIEW REJECTED - PRE_DEPLOY`. Missing evidence is `CHANGES REQUIRED`, not `INCONCLUSIVE`.

Current missing items are stated facts for this package: no live contract address, deployment transaction, receipt, Explorer/RPC result, GitHub target, Vercel target, or public release URL exists. The retained reviewer route has been supplied; this delta must be sent there and the exact completed turn must be read back before any gate decision. Do not infer live evidence or approval.

## Return exactly this schema

```text
REVIEWER: anonymous co-review AI
CHECKPOINT: PRE_DEPLOY
REVISION/PACKAGE: source b255cd3359ad3a870ba61c370d4133dcd9f96a30; package CAM-PREDEPLOY-B255CD33-DELTA-1
VERDICT: ANONYMOUS REVIEW APPROVED - PRE_DEPLOY
FINDINGS: NONE, or for each finding provide ID, severity, violated requirement, exact file/line/URL/artifact, evidence, cause or contradiction, impact, concrete correction, and verification criterion.
REBUTTALS: none, or each finding ID with accepted/revised/retained decision and exact evidence.
VERIFIED EVIDENCE: exact artifacts, hashes, commands, outputs, and links actually checked.
MISSING OR UNVERIFIABLE EVIDENCE: exact missing item and verification criterion, or NONE.
```

Replace the verdict line with exactly one of the three allowed verdicts. Do not return `INCONCLUSIVE`, silence, partial approval, vague approval, a delegation, a request for another reviewer, or a request that the user assemble attachments. Review read-only; do not code, edit, sign, transact, deploy, push, or submit.
