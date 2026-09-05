# Committed Answer Match — RPC Budget

This file is the project-specific pre-action matrix required by the canonical `STUDIO.RPC_BUDGET` and `FRONTEND.RPC_BUDGET` gates. Studio/CLI traffic and browser/Vercel traffic are separate scopes; neither scope can satisfy the other.

## Applicability

- `RPC_BUDGET_MATRIX_REVISION: d0dd30e0405e73ae454eeb4a59b693701be418f3`
- `REVIEW_PACKAGE_HEAD: supplied in the exact PRE_DEPLOY package; not self-embedded in this Git-tracked matrix`
- `OFFICIAL_DOCS_CHECKED: 2026-09-05`
- `STUDIO_SCOPE: APPLICABLE — deployment and the primary-AI Studio E2E are required`
- `FRONTEND_SCOPE: APPLICABLE — the Vite frontend reads and writes the frozen Studionet contract`
- `STUDIO_MATRIX_STATUS: LIVE_EVIDENCE_PARTIAL — awaiting post-deploy review`
- `FRONTEND_MATRIX_STATUS: READY_FOR_POST_DEPLOY_MEASUREMENT`
- `STUDIO_EVIDENCE_STATUS: LIVE PARTIAL — replacement S00–S08 evidenced; physical UI request count remains unresolved`
- `POST_DEPLOY_REVIEW_VERDICT: ANONYMOUS REVIEW CHANGES REQUIRED - POST_DEPLOY_TEST`
- `POST_DEPLOY_REVIEW_RESIDUAL: PD-001 only — physical Studio request measurement remains unrecoverable`
- `FRONTEND_EVIDENCE_STATUS: PLAN_AND_MATRIX_READY — no exact-release measurement claimed; physical release measurement and wallet-signed E2E are later POST_GITHUB_VERCEL_FINAL gates`

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

Studio UI actions and transaction counts below are measured. The hosted UI's internal physical request count was not captured before the run, so it is explicitly unresolved rather than reported as zero. This blocks `POST_DEPLOY_TEST` but does not justify replaying writes. The replacement run must capture the physical count and explain any UI amplification.

| Operation/case | Actual requests | Actual transactions | Hash | Receipt/readback calls | Retry/Retry-After | Variance from matrix | Result |
|---|---:|---:|---|---:|---|---|---|
| S00 deploy | UI physical count not captured | 1 | `0x1006b81a527f73db301f63c3ed551f70c1c8720dbe23f4262880851f1340d711` | finalized status, deployed-code parity, `get_count=0` | First submission action failed pre-hash on 30/min; 55s cooldown; one retry | One pre-hash retry; one actual deployment transaction | PASS, count variance unresolved |
| S01 create F1 | UI physical count not captured | 1 | `0x7a0e1193fe96190b6be2e1a3a9ba331ac0461aa4a8e037df99b1effefbb8b40e` | terminal leader/validator execution inspected | None after hash | Fresh fixture; finalized execution `BAD_ADDRESS` | FAIL, unchanged state expected |
| S01 create F2 diagnostic | UI physical count not captured | 1 | `0x4d4d1f572abd570f5eca49a54998e5fd028e4007c533f91af0688fb9ef2f183b` | terminal leader/validator execution inspected | None after hash | New nonce and lowercase opponent isolated casing; same `BAD_ADDRESS` | FAIL, root cause located |
| Read-only diagnostic | UI physical count not captured | 0 | NONE | No contract result obtained | Studio hit 30/min; stopped; later one reload also exhausted the UI budget | Probe abandoned because existing evidence plus verified runtime pattern located the defect | STOPPED ON QUOTA |
| Replacement S00–S08 | See live rows below | 22 writes observed, including one idempotent duplicate | See live rows below | Finality/receipts/readbacks captured per row | No duplicate after a returned hash; cooldowns honored | Final replacement source commit `77a182aa35d661e71facdb183bb6902289e188bd`; source SHA `5D770C9EF1C6E58063C4604EA1122AC1DE815D788DE34C89C776A610FEE8C6BC` | S00–S08 logical evidence PASS; physical count unresolved |

Replacement live rows (2026-09-05; the hosted UI's physical request count
was not instrumented, the retained tab exposes no network/performance/CDP
counter, and its console log buffer contains no request counter, so `Actual
requests` remains unresolved and is not zero):

| Operation/case | Actual requests | Actual transactions | Hashes | Receipt/readback | Result |
|---|---:|---:|---|---|---|
| Replacement S00 final deploy | unresolved | 1 | `0x94005694eb8bc36780e258a80123f8965666e96b3801b8a4158566a4d2151644` | `FINALIZED/SUCCESS`; exact deployed-code SHA parity; `get_count=0` | PASS; physical count unresolved |
| Intermediate replacement deploys | unresolved | 2 | `0x83c6aac45b993d6a55c4fc04b42ca98e02bd2bb881e934333969e54a197f3abb`; `0xaa9d10c039b0472fc16ec881cd61d0fac7346a635ceeb2708e31e38893ccace4` | Both finalized; old source / extra-newline parity failure | Rejected candidates; never upgrade |
| S01–S04 MATCH path | unresolved | 4 | `0x85712016751dbe4251ab26b24d777446559734f608062f7a3f12a920693a54bb`; `0x5e16a2c157a30eb1bb74b20cceaf6c17995b5f5a0f9a163ab528888a5cf37b4e`; `0x5110f1d5d4ddca7d3fd8f826c1ac720098157721131c2639428f1c3c1ee756e6`; `0x38f5b5ca26aad86fc16a4e5251ba2ae042359af875c0aaf47289104081d94e6c` | All finalized/success; case 1 exact MATCH readback | PASS; physical count unresolved |
| S05 NO_MATCH path | unresolved | 4 + 1 idempotent duplicate | `0xac265c38428a5e7e5a83ba6c556a6e8731e4f22a004946003d117547989abe9a`; `0x656faf600d7f39c751a3ff7ada40d3ae32b4ff2834b536d010f94adc4c447e88`; `0x2d93bb2b6250f4f99c862d9cc24df0e04187efd8811a654640b3c5b0e9327e63`; `0x5ae28ac7d460e457a95353305278120f74e5f0ecba13a99604b69d42402830a7`; `0xecfc09f6e585bd84b30908d5b59fb0756693a2d81f16c19440c717dbe04dfa1d` | All finalized/success; case 2 exact NO_MATCH readback | PASS with idempotent duplicate disclosed; physical count unresolved |
| S06 rejection controls | unresolved | 3 rejected writes + 2 setup writes | `0x15ff28841ae145b50ecabd314cc58276bd076297fb33a5751f857c672eb188a2`; `0x32ed42d0bec692d7dfb9806b80d42b241de791479c1f359a174aa4c4b003e40a`; `0xc12dfd450a3cb229c8e763947910e65646a6bbc19477044882a541e76ad24868`; setup `0x093474c9413106d777f00100e5b9093e482e5c8443d89361e20e3165ed8a277f`; setup `0xe2f9df617363ff507535b9b3b49dbaefe3c08160202951dccdf25949fbdfe82d` | Rejections finalized/error with exact rollback markers; case 3 unchanged after bad reveal | PASS as control evidence; physical count unresolved |
| S07 ambiguity | unresolved | 4 | create `0xa6e76d9fb82abc17d983b9d5873648009dcd306d7b3766db926975fd0ccf2ef6`; guess `0xff95a487ae84ac3a9b4788ec48fa7cb4e763da3eac60a2b51431abb8b1567914`; reveal `0x01773206258d174200a35fc710c30d1e04667c7ed7ed666c5888e268354564a7`; evaluate `0xec28171464f38002dc3bab281d6b2bc0a0a62d6a7768f998ca0152267cb9ca12` | All finalized/success; evaluate NO_MATCH; get_version(4,4) exact readback; no retry because result was not UNKNOWN | PASS; physical count unresolved |
| S08 expiry | unresolved | 1 | `0xa74f09fae8c3bb0ddf321fcd202220df09d3c586d3c1398ca1d21fe2c7dea087` | Finalized/success; deadline passed; case 3 exact DONE/VOID readback; no model call | PASS; physical count unresolved |

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

The following is the current frontend plan and matrix required by
`POST_DEPLOY_TEST`. It does not claim an exact-release measurement because no
GitHub/Vercel release exists yet. The later `POST_GITHUB_VERCEL_FINAL` gate
must measure the deployed browser traffic, include SDK preflight calls and
complete wallet-signed E2E. The same tab-visibility rule applies to every
status loop: a hidden tab waits without issuing another status/receipt request,
and the journal remains the recovery source.

| Screen/workflow | Request source/method | Actual requests | Cache hit/miss | In-flight dedupe | Poll attempts | Retry/delay | Invalidations | Readback calls | Actual transactions | Variance/result |
|---|---|---:|---|---|---:|---|---:|---:|---:|---|
| Coordinator write path | Vitest mocked lifecycle | 3 lifecycle probes + 1 post/pre readback in the bounded tests | No persistent cache | Coordinator invokes one readback after terminal receipt | 3 maximum | Fixed 2/4/8s; transient `Retry-After` path is bounded and jittered | Read flights cleared around readback | 1 action; create is 1 returned-ID path or 2 fallback views | 1 mocked submission | LOCAL PASS; physical browser count pending |
| Lock-free journal | Vitest + Playwright browser | 0 GenLayer RPC; storage-only read/export path | N/A | N/A | 0 | 0 | N/A | 0 | 0 | LOCAL PASS; records are not hidden by absent Web Locks |
| Future exact frontend release journeys | Browser/Vercel | NOT YET MEASURED — intentionally deferred until the exact release exists | Must be measured at `POST_GITHUB_VERCEL_FINAL` | Must be measured | Must be measured | Must be measured | Must be recorded | Must be recorded | Must be recorded | FUTURE GATE; not a current live claim |

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
- Missing or unexplained Studio measurements block `POST_DEPLOY_TEST`; missing
  exact-release frontend measurements block `POST_GITHUB_VERCEL_FINAL` and
  public release.
- `PD-001` is the sole residual reviewer blocker for this current
  `POST_DEPLOY_TEST` checkpoint. No duplicate write or redeployment may be used
  to manufacture the missing physical count.
