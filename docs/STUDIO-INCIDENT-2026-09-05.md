# Studio incident and replacement-candidate record — 2026-09-05

## Frozen deployed instance

```text
NETWORK: Studionet (chain 61999)
ACCOUNT: 0xeF5D2119416A2f5afa35dCFA209766EFC1BE5902
CONTRACT: 0x1dCcBE4942786Efc15Bb8e78d749e8D89f4fb68c
DEPLOY_TX: 0x1006b81a527f73db301f63c3ed551f70c1c8720dbe23f4262880851f1340d711
DEPLOYED_SOURCE_SHA256: 48B8B3BA0BEB806699CA777F90178020A85ACC6CA2EDB74765F1E109EFFEB18B
LIFECYCLE: INTENTIONALLY FROZEN
DISPOSITION: REJECTED — never upgrade; replace with a new contract after PRE_DEPLOY approval
```

Deployment reached `FINALIZED`, Studio reported consensus and contract deployment,
the normalized on-chain code payload matched the deployed source hash, and finalized
`get_count()` returned `0`.

## Failed S01 attempts

Both fresh `create_match` attempts reached `FINALIZED` but every leader/validator
execution result was `ERROR: BAD_ADDRESS`; neither transaction changed state.

| Attempt | Nonce | Opponent form | Transaction |
|---|---|---|---|
| S01-F1 | `a1b2c3d4e5f60718293a4b5c6d7e8f90` | checksum hex | `0x7a0e1193fe96190b6be2e1a3a9ba331ac0461aa4a8e037df99b1effefbb8b40e` |
| S01-F2 | `b1c2d3e4f5061728394a5b6c7d8e9f01` | lowercase hex | `0x4d4d1f572abd570f5eca49a54998e5fd028e4007c533f91af0688fb9ef2f183b` |

Root cause: `_address()` rejected the runtime's integer address representation.
`create_match()` calls `_sender()` before normalizing the opponent, so the identical
failure under two opponent encodings locates the defect at the shared normalizer,
not at checksum casing. Current official documentation types the message fields as
`Address`; existing verified runtime experience records that hosted Studio can
serialize address values as 160-bit integers.

The applied experience entry is `E:\Genlayer\experience\Task Build Experience.md`,
2026-08-08, “Keep GenVM test doubles narrower than the real runtime” (lines
196–204). Its prevention rule is to probe alternate calldata encodings and
normalize every public address boundary; this incident applies that rule at the
shared `_address()` boundary and adds a regression for a valid 160-bit integer
plus the out-of-range rejection. The entry is experience guidance, not a
substitute for current official Address documentation or replacement Studio
proof.

## Replacement candidate

```text
SOURCE_IMPLEMENTATION_COMMIT: 77a182aa35d661e71facdb183bb6902289e188bd
CONTRACT_SOURCE_SHA256: 5D770C9EF1C6E58063C4604EA1122AC1DE815D788DE34C89C776A610FEE8C6BC
TEST_SOURCE_SHA256: DEFC83A938E0CABCD8EECFCA8B7D199AB49901B8C5F6B511965ECF7E02E0FB9C
SCHEMA_SHA256: B6450B0E994156186EFCA475BCE61F079A468CCFAC38D80E486617B7EC078FAB
DELTA: one shared helper accepts non-bool integers in [0, 2^160) and renders 40 lowercase hex digits
LOCAL_TEST: 13 passed
LINT: PASS (3 checks)
VALIDATION: PASS — CommittedAnswerMatch, 13 methods (7 view, 6 write)
```

The retained anonymous reviewer approved this exact replacement source and
incident-bound delta with `ANONYMOUS REVIEW APPROVED - PRE_DEPLOY`.

## Replacement deployment attempts

All replacement deployments used new addresses. None used Studio's `Upgrade
code` action on the frozen address.

| Candidate | Deployment transaction | Source evidence | Disposition |
|---|---|---|---|
| Intermediate 1 | `0x83c6aac45b993d6a55c4fc04b42ca98e02bd2bb881e934333969e54a197f3abb` | Explorer showed the old `_address()` implementation without the integer branch | Rejected; old source sent after a UI source-load mistake |
| Intermediate 2 | `0xaa9d10c039b0472fc16ec881cd61d0fac7346a635ceeb2708e31e38893ccace4` | Deployed payload length 23533 and SHA256 `A69F998D44A3CB6A651340F8B9B79C6F19A974C636ADF592BF066C67EAB64A59`, versus exact local length 23532 | Rejected; extra trailing newline |
| Final replacement | `0x94005694eb8bc36780e258a80123f8965666e96b3801b8a4158566a4d2151644` | `0xD22f951BD5B7AE6615c27066e99a80D9751be5cF`; deployed code SHA256 exactly `5D770C9EF1C6E58063C4604EA1122AC1DE815D788DE34C89C776A610FEE8C6BC` | Eligible replacement; never upgrade the rejected addresses |

The final replacement deployment was `FINALIZED`, Studio reported `SUCCESS`
and consensus `Accepted`, and the authoritative `get_count()` read at
`Finalized` returned `0`. Some validator rows reported `Idle — Validator
execution cancelled after quorum`; this did not change the accepted/finalized
result.

## Replacement live Studio E2E

The locked account and final contract were used throughout the following
secret-free fixtures. Transaction hashes below are full hashes read from the
Studio receipt dialogs.

| Case | Transaction evidence | Result and authoritative readback |
|---|---|---|
| S01 MATCH | `create_match` `0x85712016751dbe4251ab26b24d777446559734f608062f7a3f12a920693a54bb`; output `1` | `FINALIZED/SUCCESS`; case 1 `revision=4`, `outcome=MATCH`, `phase=DONE` |
| S02 guess | `submit_guess` `0x5e16a2c157a30eb1bb74b20cceaf6c17995b5f5a0f9a163ab528888a5cf37b4e` | `FINALIZED/SUCCESS`; case 1 readback `revision=2`, `phase=REVEAL_WAIT`, caller B, guess `hello` |
| S03 reveal | `reveal_answer` `0x5110f1d5d4ddca7d3fd8f826c1ac720098157721131c2639428f1c3c1ee756e6` | `FINALIZED/SUCCESS`; case 1 advanced to revision 3 |
| S04 evaluate | `evaluate_match` `0x38f5b5ca26aad86fc16a4e5251ba2ae042359af875c0aaf47289104081d94e6c` | `FINALIZED/SUCCESS`; case 1 readback `revision=4`, `outcome=MATCH`, `phase=DONE` |
| S05 NO_MATCH | create `0xac265c38428a5e7e5a83ba6c556a6e8731e4f22a004946003d117547989abe9a`; guess `0x2d93bb2b6250f4f99c862d9cc24df0e04187efd8811a654640b3c5b0e9327e63`; reveal `0x5ae28ac7d460e457a95353305278120f74e5f0ecba13a99604b69d42402830a7`; evaluate `0xecfc09f6e585bd84b30908d5b59fb0756693a2d81f16c19440c717dbe04dfa1d` | All `FINALIZED/SUCCESS`; consensus output `NO_MATCH`; case 2 readback `revision=4`, `outcome=NO_MATCH`, `phase=DONE` |
| S06 controls | wrong actor `0x15ff28841ae145b50ecabd314cc58276bd076297fb33a5751f857c672eb188a2`; stale revision `0x32ed42d0bec692d7dfb9806b80d42b241de791479c1f359a174aa4c4b003e40a`; bad reveal `0xc12dfd450a3cb229c8e763947910e65646a6bbc19477044882a541e76ad24868` | All `FINALIZED/ERROR`; `[rollback] UNAUTHORIZED`, `[rollback] BAD_REVISION`, and `[rollback] BAD_REVEAL`; case 3 remained `revision=2`, `phase=REVEAL_WAIT`, answer/salt empty |
| S07 ambiguity | create `0xa6e76d9fb82abc17d983b9d5873648009dcd306d7b3766db926975fd0ccf2ef6`; guess `0xff95a487ae84ac3a9b4788ec48fa7cb4e763da3eac60a2b51431abb8b1567914`; reveal `0x01773206258d174200a35fc710c30d1e04667c7ed7ed666c5888e268354564a7`; evaluate `0xec28171464f38002dc3bab281d6b2bc0a0a62d6a7768f998ca0152267cb9ca12` | All `FINALIZED/SUCCESS`; live ambiguity evaluated as `NO_MATCH`, not `UNKNOWN`, so no retry was sent; `get_version(4,4)` readback `revision=4`, `outcome=NO_MATCH`, `phase=DONE` |
| S08 expiry | `expire_match` `0xa74f09fae8c3bb0ddf321fcd202220df09d3c586d3c1398ca1d21fe2c7dea087` after deadline `1788623047` | `FINALIZED/SUCCESS`; case 3 readback `revision=3`, `phase=DONE`, `outcome=VOID`, preserved guess and empty result; no model call |

The accidental idempotent duplicate create transaction
`0x656faf600d7f39c751a3ff7ada40d3ae32b4ff2834b536d010f94adc4c447e88`
replayed the already-used S01 nonce and returned existing case `1`; it did
not create a new case or alter the final case state. S07 and S08 logical live
journeys are now complete. The physical hosted-UI request count is explicitly
unclaimed; the current rule's retrospective ledger route is used instead of
replaying any write.

## Current checkpoint disposition

The retained reviewer first rechecked commit `4734fc290cd0838126884e558f63c8f50a8318b9`
and returned exactly `ANONYMOUS REVIEW CHANGES REQUIRED - POST_DEPLOY_TEST`.
PD-002 (expiry), PD-003 (UNKNOWN/retry disposition), and PD-004 (frontend
stage wording) were closed. The report's PD-001 physical-count finding was
made before the current explicit legacy evidence route was applied, so it is
retained as historical review evidence.

The same reviewer then rechecked exact package HEAD
`086cddd663f8762c4b4d15d919344ef1763aced4` and returned exactly
`ANONYMOUS REVIEW APPROVED - POST_DEPLOY_TEST`. PD-001 and PD-005 are closed;
the observable ledger is accepted without a physical-count claim.

As a bounded recovery probe, a newly opened `/run-debug` Studio tab was loaded
once after the retained tab had been removed from the Browser runtime. The
tab's console log exposed three `gen_getContractSchema` errors, each reporting
`Rate limit exceeded: 30 requests per minute`; it exposed neither successful
request events nor a total request counter. The probe was then closed. This is
runtime evidence for the Studio quota constraint, not a physical request count
or a reason to treat the missing count as zero. It is the capability evidence
for `OBSERVABLE_ACTION_LEDGER` with timing `RETROSPECTIVE_LEGACY`.

## Measurement-mode correction

The current canonical RPC rule permits a legacy Studio run to use an honest
retrospective action ledger when physical network telemetry is unavailable. The
capability probe at `2026-09-05T16:07:09.809Z` recorded:

```text
MODE: OBSERVABLE_ACTION_LEDGER
TIMING: RETROSPECTIVE_LEGACY
PHYSICAL_STUDIO_REQUESTS: NOT_APPLICABLE
PHYSICAL_COUNT_CLAIM: NONE
REPLAY_OR_REDEPLOY_FOR_MEASUREMENT: NO
CAPABILITY: IAB DOM/console only; no performance/network/CDP counter granted
ADDITIONAL_PROBE: three gen_getContractSchema 30/min errors; tab closed
LEDGER: 22 retained replacement logical actions/transactions, 22 terminal receipt reads, 22 authoritative readback records, one pre-hash retry and one disclosed idempotent duplicate
```

The full per-row ledger, hashes, variance and the distinction between logical
actions and physical RPC requests are locked in `docs/RPC-BUDGET.md`.

## Post-deploy frontend repair delta

The reviewer then checked exact frontend package HEAD `86b7bece50f444ce11888bfaeb7bc67d5910f915` and returned
`ANONYMOUS REVIEW CHANGES REQUIRED - POST_DEPLOY_TEST` with three P1 findings:
the wallet store was destroyed and reused across React StrictMode effect replay,
an empty `eth_accounts` response could still commit a connected session, and
write/reconcile polling and readback had no operation-scoped cancellation.

The repair keeps the deployed contract and all Studio evidence unchanged. It
creates and tears down the wallet store in one mount-owned effect, requires a
non-empty and matching `eth_accounts` confirmation, and propagates one
`AbortController` through coordinator polling, status/receipt reads and
authoritative readback. It also adds the rendered late-provider, account
confirmation and retained-hash/no-next-poll regressions. Local contract tests,
lint, validation, frontend unit tests, build, Playwright and the PostDeployTest
project audit pass; the same reviewer must recheck this exact repair revision
before the checkpoint can be treated as current approval.
