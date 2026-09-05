NOT SENT — MANUAL RELAY REQUIRED

REVIEWER: anonymous co-review AI
WORKFLOW: BUILD
TASK ID: committed-answer-match
PROJECT: Committed Answer Match
PROJECT PATH: E:\GenLayer-Projects\committed-answer-match
CATEGORY: PROJECT
CHECKPOINT: PRE_DEPLOY
REVISION/PACKAGE: source `9f6452b6d2030605f72d9912b095c501b62451ac`; package `CAM-PREDEPLOY-9F6452B6-LOCAL-1`
DOCUMENT MODE / BASELINE: full exact-source review from the approved Stage 1/2 baseline
STATUS: ready for first-contact delivery once the retained reviewer route is supplied; not yet sent

## Objective and acceptance criteria

Independently review this exact Committed Answer Match implementation for `PRE_DEPLOY`, including the bundled minimum-sufficient Studionet Studio E2E plan. Verify source/specification consistency, current schema/runtime compatibility, storage and ABI safety, nondeterministic isolation and substantive validator rederivation, production-shaped serialization, wallet and transaction safety, public UI truthfulness, recovery classification, and exact evidence binding.

Approve only if every current PRE_DEPLOY requirement passes for this exact revision/package. `PRE_DEPLOY` approval would authorize only the reviewed deployment readiness and the bundled Studio plan; it is not deployment proof, live evidence, GitHub/Vercel approval, or Explorer submission approval.

## Complete review package

The source revision is the local root commit `9f6452b6d2030605f72d9912b095c501b62451ac`. The later documentation commit does not change source behavior. No signature, deployment transaction, contract write, Studio E2E, GitHub push, Vercel release, Explorer readback, or public release URL exists.

Approved upstream artifact hashes:

```text
RESEARCH-HANDOFF.md 3464E830908CB1D87504057567242D36BDCD0C4FD59934B7D22F6482C6799ED2
STAGE-1.md           29F4157210B2D9100D7F04FB7FBCC77E56BEC8B821813E4D7E0C3E88F123A686
STAGE-2.md           D67DEA1887DDBD85E62692EC5EB8F6C31F03025A44858A2FA4B07AE36B3627BA
```

Exact implementation/evidence hashes:

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

Relevant implementation diff summary:

- `contracts/main.py` implements the approved C2 lifecycle, canonical context-bound SHA-256 commitment, deterministic exact-match short circuit, one bounded semantic assessment with independent validator rederivation, atomic phase/revision/history updates, and explicit expiry.
- `frontend/src/contract.ts` uses the installed `genlayer-js` `studionet` client, finality/execution enums, canonical decimal arguments, and exact read methods.
- `frontend/src/chain/writeCoordinator.ts` writes the journal before signing, submits once, polls at most three times, requires `FINALIZED` plus `FINISHED_WITH_RETURN`, performs bounded post-readback, and preserves reconciliation on uncertainty.
- `frontend/src/pending.ts` implements the required `navigator.locks` mutex, random 16-byte reservation keys, 32-record cap, immutable operation context, export, and reconciliation semantics.
- `frontend/src/wallet/` implements bounded EIP-6963 plus recognized legacy discovery for only MetaMask, OKX Wallet, and Rabby, with explicit selection and reload-on-session-change behavior.
- `frontend/src/App.tsx` provides Home, New match, Match, Journal, exact public warning/assessment note, backup verification, and role-aware actions. The final visual redesign is a separate bounded Claude handoff and is not a reason to alter this contract or transaction package.

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

npm test
4 files passed; 21 tests passed

npm run build
Vite build passed; 5436 modules; non-blocking warning for a minified chunk over 500 kB

npm run test:e2e
3 passed
```

The contract suite covers idempotent creation/context binding, authorization and wrong phase, stale revision and atomic bad reveal, exact MATCH, consensus NO_MATCH, deliberate validator disagreement, malformed consensus, UNKNOWN/cooldown/exhaustion, explicit VOID expiry, inclusive deadlines, wrong chain context, bounded lists, and production-shaped closure serialization. The serialization test enables `VMContext.check_pickling=True` and `cloudpickle.dumps` the captured leader and validator closures after semantic assessment.

Frontend E2E covers no account request on page load or picker open, exact single-provider rendering, zero-provider empty state without fake wallet choices, focus restoration, inert background, and journal-lock failure without signing. Static scans found no direct global `window.ethereum` access and no derivation of `glj1:` storage keys from `operationFingerprint`.

## Minimum-sufficient Studio E2E plan bundled with this checkpoint

No row below has run. After anonymous PRE_DEPLOY approval, the primary AI must operate the Codex in-app GenLayer Studio using the locked account above, record every attempt, and retain secret-free evidence. Use only the exact deployed source, Studionet, and authoritative RPC/Explorer/readback.

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

Current missing items are stated facts for this package: no live contract address, deployment transaction, receipt, Explorer/RPC result, GitHub target, Vercel target, or public release URL exists; and no reviewer route has been supplied. Do not infer any of them.

## Return exactly this schema

```text
REVIEWER: anonymous co-review AI
CHECKPOINT: PRE_DEPLOY
REVISION/PACKAGE: source 9f6452b6d2030605f72d9912b095c501b62451ac; package CAM-PREDEPLOY-9F6452B6-LOCAL-1
VERDICT: ANONYMOUS REVIEW APPROVED - PRE_DEPLOY
FINDINGS: NONE, or for each finding provide ID, severity, violated requirement, exact file/line/URL/artifact, evidence, cause or contradiction, impact, concrete correction, and verification criterion.
REBUTTALS: none, or each finding ID with accepted/revised/retained decision and exact evidence.
VERIFIED EVIDENCE: exact artifacts, hashes, commands, outputs, and links actually checked.
MISSING OR UNVERIFIABLE EVIDENCE: exact missing item and verification criterion, or NONE.
```

Replace the verdict line with exactly one of the three allowed verdicts. Do not return `INCONCLUSIVE`, silence, partial approval, vague approval, a delegation, a request for another reviewer, or a request that the user assemble attachments. Review read-only; do not code, edit, sign, transact, deploy, push, or submit.
