# Committed Answer Match — RPC Budget

This file is the project-specific pre-action matrix required by the canonical `STUDIO.RPC_BUDGET` and `FRONTEND.RPC_BUDGET` gates. Studio/CLI traffic and browser/Vercel traffic are separate scopes; neither scope can satisfy the other.

## Applicability

- `RPC_BUDGET_REVISION: 4b6556ad9b469f2baf95509d07970c0de19a3d45`
- `OFFICIAL_DOCS_CHECKED: 2026-09-05`
- `STUDIO_SCOPE: APPLICABLE — deployment and the primary-AI Studio E2E are required`
- `FRONTEND_SCOPE: APPLICABLE — the Vite frontend reads and writes the frozen Studionet contract`
- `STUDIO_MATRIX_STATUS: READY_FOR_PRE_DEPLOY_REVIEW`
- `FRONTEND_MATRIX_STATUS: READY_FOR_PRE_DEPLOY_REVIEW`
- `STUDIO_EVIDENCE_STATUS: NOT_YET_LIVE — no deploy or Studio transaction has been sent; this is not a zero-request claim`
- `FRONTEND_EVIDENCE_STATUS: LOCAL_ONLY — exact deployed-release measurement is required before POST_DEPLOY_TEST/release`

Official references checked for the current transaction interface and lightweight status method:

- [GenLayerJS](https://docs.genlayer.com/api-references/genlayer-js)
- [Writing data](https://docs.genlayer.com/developers/decentralized-applications/writing-data)
- [Querying a transaction](https://docs.genlayer.com/developers/decentralized-applications/querying-a-transaction)
- [`gen_getTransactionStatus`](https://docs.genlayer.com/api-references/genlayer-node/gen/gen_getTransactionStatus)

The installed project runtime is `genlayer-js 1.1.8`. It exposes the compatibility `waitForTransactionReceipt` method rather than the newer `waitForFinalization`/`isSuccessful` pair. The adapter therefore uses the official lightweight status endpoint for the first two bounded probes and the installed receipt method only at terminal/last-diagnostic boundary, while normalizing the returned status and execution fields. This compatibility detail must remain visible in live evidence.

## STUDIO RPC BUDGET MATRIX

Studio work is sparse and deliberate. Deterministic behavior and rejected transitions are proved locally first. The primary AI opens the Codex in-app Studio once, uses the locked account, deploys the exact reviewed source once, and does not run a parallel Explorer/CLI poller. A terminal/diagnostic full receipt is included in the three lifecycle probes below, not added on top of them.

| Operation/case | RPC method or Studio action | Trigger | Planned maximum | Poll interval / attempts | Retry/cooldown | Terminal condition | Transaction count | Evidence |
|---|---|---|---:|---|---|---|---:|---|
| Session/network | Studio account selection; `eth_chainId`/network check | Once before the first action | 2 RPC checks | None | Stop on wrong network or rate limit | Locked account + Studionet confirmed | 0 | Account, chain and timestamp recorded once |
| Exact source/schema preflight | `gen_getContractSchemaForCode` or Studio schema view | Once before deploy | 1 schema probe | None | No refresh loop | 13-method schema matches package | 0 | Source SHA, schema result and version |
| S00 deploy | Studio deploy action; one submission; `gen_getTransactionStatus`/terminal receipt; `gen_getContractCode`; `get_count` | Once after PRE_DEPLOY approval | 6 RPC/actions | Lifecycle at 2/4/8 seconds, max 3 probes | Honor `Retry-After`; stop on 429/server busy; never duplicate deploy | Finalized + semantic success + code/hash parity + count `0` | 1 | Deployment hash, finality, source hash, count readback |
| S01 create | `create_match`; status/receipt; `get_version` (fallback `get_id_by_nonce` only if the terminal return does not expose the ID) | One fresh public fixture | 6 RPC/actions | Lifecycle max 3 at 2/4/8 seconds | No resubmit after a hash; preserve hash for reconcile | Finalized + `FINISHED_WITH_RETURN` + exact revision 1 readback | 1 | Hash, returned ID, exact version record |
| S02 guess | `submit_guess`; status/receipt; one `get_version` | One unique role transition | 5 RPC/actions | Lifecycle max 3 at 2/4/8 seconds | No retry of same hash | Finalized + semantic success + exact revision 2 readback | 1 | Hash, role, args, receipt and version |
| S03 reveal | `reveal_answer`; status/receipt; one `get_version` | One unique commitment reveal | 5 RPC/actions | Lifecycle max 3 at 2/4/8 seconds | Bad backup is rejected locally; no resubmit | Finalized + semantic success + exact revision 3/readback digest parity | 1 | No secret in log; hash and redacted argument record |
| S04 evaluate | `evaluate_match`; status/receipt; one `get_version` | One deterministic MATCH fixture | 5 RPC/actions | Lifecycle max 3 at 2/4/8 seconds | No repeated assessment | Finalized + semantic success + exact MATCH state | 1 | Consensus/finality and exact history |
| S05 no-match | Fresh create/guess/reveal/evaluate sequence; one readback per write | One semantic NO_MATCH fixture | 21 RPC/actions | Create max 6; guess/reveal/evaluate max 5 each | Stop if consensus is unavailable; do not reinterpret failure | Finalized + semantic NO_MATCH + exact history | 4 | Four hashes and per-write readbacks; create fallback lookup included |
| S06 no-write controls | One wrong-actor, one stale-revision and one bad-reveal attempt | Three unique rejection risks | 9 RPC/actions | One bounded terminal observation per attempt | No retry of a rejected/ambiguous hash | Execution failure plus unchanged authoritative pre-state | 3 attempted writes | Each failure and unchanged state recorded |
| S07 UNKNOWN/retry | One evaluate; `retry_match` only if the first result is UNKNOWN and cooldown is met | One live-only retry risk | 10 RPC/actions | Each write lifecycle max 3 | Wait the contract's 60-second transaction-time cooldown; never replay the first hash | Exact UNKNOWN/UNRESOLVED or bounded retry result | 1 or 2 | Separate hashes; cooldown evidence |
| S08 expiry | `expire_match`; status/receipt; one `get_version` | One fresh case left to deadline | 5 RPC/actions | Lifecycle max 3 at 2/4/8 seconds | No early retry; stop on rate limit | Finalized + semantic success + DONE/VOID readback | 1 | Deadline evidence and preserved inputs/history |
| Explicit read/reconcile | `get_case`/`get_version` or same-hash status check | One user/operator click only | 1 view, or 1 lifecycle probe | No background polling | Same hash only; no transaction submission | Fresh authoritative read or retained RECONCILE | 0 | Trigger and returned row recorded |

`Planned maximum` is the per-row Studio request/action envelope. If Studio's UI performs additional requests, the actual network count must include them; the row fails its budget until the variance is explained. Missing live measurement is not zero.

## STUDIO RPC BUDGET EVIDENCE

At this checkpoint every row is explicitly not run. There is no deployment, transaction hash, receipt or live request count to report. POST_DEPLOY_TEST must replace each applicable row with actual counts, intervals, retry/`Retry-After`, receipt/readback calls, total transactions and a variance/result. A plan is not live evidence.

| Operation/case | Actual requests | Actual transactions | Hash | Receipt/readback calls | Retry/Retry-After | Variance from matrix | Result |
|---|---:|---:|---|---:|---|---|---|
| S00–S08 and session/preflight | NOT RUN — no live Studio traffic | NOT RUN | NONE | NOT RUN | NONE OBSERVED | Pending exact deployed revision | NOT YET LIVE |

## FRONTEND RPC BUDGET MATRIX

The frontend has one shared `genlayer-js` read client for the configured Studionet chain/contract. Read deduplication is in-flight only; there is no stale persistent cache for transaction state, authorization, balances or verdicts. A write creates a durable journal record before wallet UI and never submits a second transaction for the same authorization/hash. The coordinator and App enforce one global lifecycle at a time, so write and same-hash reconciliation pollers cannot interleave. The public transaction indicator is driven by the exact lifecycle phases in `FRONTEND.TRANSACTION_PROGRESS`; a hash is retained through finality, execution and authoritative readback, including storage-degraded reconciliation.

The journal schema/recovery adaptation is storage-only and does not change either
RPC scope or any planned request envelope. The Studio matrix remains the
primary-AI deployment/Studio-E2E budget, and the frontend matrix remains the
browser/Vercel budget; both must still be measured independently on their exact
later revisions.

| Screen/workflow | Request source | RPC method | Trigger | Cache key / TTL | In-flight dedupe | Invalidation | Poll interval / attempts | Retry/backoff/cancel | Planned maximum | Transaction count | Terminal/readback condition |
|---|---|---|---|---|---|---|---|---|---:|---:|---|
| Landing / wallet picker | React + wallet registry | None on landing/picker open | Page load or open picker | None | N/A | N/A | None | No retry | 0 | 0 | No account request until explicit wallet selection |
| Connect wallet | Selected EIP-1193 provider | `eth_requestAccounts`, `eth_chainId`, conditional `wallet_switchEthereumChain`, `wallet_addEthereumChain`, retry switch | One explicit wallet choice | None | No duplicate selection call | Session replacement/reload | None | Wallet errors surface; no auto reconnect | 2 when already on Studionet; up to 5 for wrong unknown chain | 0 | Exact selected account and Studionet chain |
| Journal read/export | `DurableJournal` | Browser storage only | Mount or explicit Journal Refresh/export | None | N/A | N/A | None | No RPC retry | 0 | 0 | Lock-free records remain readable/exportable; signing still requires Web Locks |
| Open case | Shared read client | `gen_call(get_case)` | One explicit case open | Key `[61999,contract,get_case,id]`, in-flight only | Identical concurrent read shares one promise | Clear in-flight entries before authoritative write readback | None | No background retry | 1 | 0 | Exact current record parsed and shape-checked |
| Refresh case for expiry | Shared read client | `gen_call(get_case)` + `eth_getBlockByNumber(latest)` | One explicit Refresh for an expiry-capable phase | Same read key; block read in-flight only | Same-key concurrent refresh shares one promise | Clear after state transition | None | No automatic retry; user can click again | 2 | 0 | Chain-time estimate gates expiry; local clock is informational |
| Create submission | Selected wallet client + shared read client | SDK nonce/gas/send RPCs; status adapter; `gen_call(get_version)` and optional `get_id_by_nonce` fallback | One explicit Create after backup acknowledgement | No stale write cache | One journal lock; one hash | Clear in-flight reads after finality/before readback | Status probes at 2/4/8 seconds, max 3 | Bounded `Retry-After`/jitter on transient probe failure; abort preserves RECONCILE | 6 logical envelope; provider preflight calls measured separately | 1 | Hash + FINALIZED + FINISHED_WITH_RETURN + exact create record |
| Case write | Selected wallet client + shared read client | SDK nonce/gas/send RPCs; status adapter; one `gen_call(get_version)` | One explicit Guess/Reveal/Evaluate/Retry/Expire | No stale write cache | One journal lock; one hash | Clear in-flight reads after finality/before readback | Status probes at 2/4/8 seconds, max 3 | Bounded `Retry-After`/jitter; cancellation preserves hash; no resubmit | 5 logical envelope; provider preflight calls measured separately | 1 | Hash + finality + semantic success/error + exact method transition or unchanged pre-state |
| Same-hash Resume/Reconcile | Shared read client | `gen_getTransactionStatus`/terminal receipt + one `gen_call(get_version)` | One explicit journal action | No persistent cache | Same-key lifecycle/read shares in-flight promise; global lifecycle gate permits one poller | Clear before readback | One status/receipt probe; no loop; paused while the tab is hidden | No submission; no replacement; lockless mode may read but cannot persist a status mutation | 2 logical calls when terminal | 0 | Exact VERIFIED/FINALIZED_ERROR only after authoritative readback; otherwise RECONCILE |

Logical write envelopes preserve the approved Stage 2 limit: one submission, at most three lifecycle probes and at most two create or one action readback calls. The physical wallet-provider nonce/gas calls are not hidden: they must be included in exact-release evidence and must not be accompanied by any extra render/effect/retry amplification.

## FRONTEND RPC BUDGET EVIDENCE

The following is the local evidence available before deployment. It is not a claim about a deployed release; POST_DEPLOY_TEST must measure browser network traffic on the exact release and include SDK preflight calls. The same tab-visibility rule applies to every status loop: a hidden tab waits without issuing another status/receipt request, and the journal remains the recovery source.

| Screen/workflow | Request source/method | Actual requests | Cache hit/miss | In-flight dedupe | Poll attempts | Retry/delay | Invalidations | Readback calls | Actual transactions | Variance/result |
|---|---|---:|---|---|---:|---|---:|---:|---:|---|
| Coordinator write path | Vitest mocked lifecycle | 3 lifecycle probes + 1 post/pre readback in the bounded tests | No persistent cache | Coordinator invokes one readback after terminal receipt | 3 maximum | Fixed 2/4/8s; transient `Retry-After` path is bounded and jittered | Read flights cleared around readback | 1 action; create is 1 returned-ID path or 2 fallback views | 1 mocked submission | LOCAL PASS; physical browser count pending |
| Lock-free journal | Vitest + Playwright browser | 0 GenLayer RPC; storage-only read/export path | N/A | N/A | 0 | 0 | N/A | 0 | 0 | LOCAL PASS; records are not hidden by absent Web Locks |
| Exact frontend release journeys | Browser/Vercel | NOT YET MEASURED — no deployed release exists | Must be measured | Must be measured | Must be measured | Must be measured | Must be recorded | Must be recorded | Must be recorded | NOT YET LIVE |

## Closure

- Studio and frontend matrices/evidence remain separate.
- No full portfolio polling, schema/source reload loop or parallel receipt poller is allowed.
- Status polling is bounded, stops on terminal/cooldown/blocker and uses the current lightweight endpoint when available.
- Full receipts are fetched only at terminal/last-diagnostic boundary.
- 429/server-busy/transient failures are bounded, honor `Retry-After` when exposed and never trigger immediate recursive or concurrent retries.
- A returned hash is stored before verification; no automatic replacement or duplicate submission occurs.
- Finality, semantic execution success/error and authoritative method-specific readback remain mandatory.
- Public progress exposes the exact wallet, submission, finality, execution, readback, success, rejection, failure and reconciliation phases; signing disables for the session after a journal lock/storage failure while read/export/reconcile remain available.
- The journal renders at most four entries per page, keeps all valid/raw entries reachable and exportable, and disables every reconcile control while one write or reconciliation lifecycle is active.
- Missing or unexplained measurements block `POST_DEPLOY_TEST` and release.
