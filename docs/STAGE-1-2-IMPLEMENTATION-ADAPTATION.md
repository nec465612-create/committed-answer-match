# Committed Answer Match — Stage 1/2 Implementation Adaptation

`ADAPTATION_STATUS: ACTIVE BUILD ADAPTATION`

This record is the primary-build technical adaptation required by
`SPEC.TECHNICAL_ADAPTATION`. It preserves the public product scope, the frozen
on-chain contract, the actor journey, the transaction consequence and the
approved acceptance outcomes. It does not authorize deployment or any Studio
write.

## Original choice

The approved `STAGE-2.md` defined the browser journal as a version-1 record
with exactly these 13 keys:

```text
v, reservation, chain, contract, account, method, intent, args_json,
pre_revision, pre_hash, tx_hash, status, created_ms
```

The build then added two recovery facts to the same durable record:
`pre_state_json` and `resolution_json`.

## Verified problem and risk

The recovery requirements already implemented for this build need both facts
to remain bound to the immutable reservation. `pre_state_json` is the exact
pre-write snapshot needed to prove an unchanged state after a finalized
execution error; `resolution_json` records the monotonic authoritative
classification (`ABSENT`, `UNKNOWN`, `UNCHANGED`, `PRESENT` or `COMPETING`).
Moving either fact to an unbound sidecar would permit the record and its
recovery evidence to diverge after a crash or partial storage failure.
Silently using 15 keys while claiming the approved 13-key schema would instead
make the source/specification package inconsistent.

## Replacement and authority

The effective v1 journal schema is explicitly adapted to exactly 15 keys:

```text
{v:1,reservation:hex32,chain:decimal,contract:A,account:A,
 method:T(48),intent:T(160),args_json:T(18000),pre_revision:decimal,
 pre_hash:hex64,pre_state_json:E(24576),tx_hash:E(66),
 status:'SIGNING'|'SUBMITTED'|'RECONCILE'|'FINALIZED_ERROR'|'VERIFIED',
 created_ms:decimal,resolution_json:T(8192)}
```

The two adapted fields are bounded strings. `pre_state_json` is empty before
there is a state snapshot and otherwise is canonical JSON. `resolution_json`
is always nonempty canonical JSON and starts as `{}`. Every object key in
either nested JSON value is checked for duplicates before canonical validation.
The outer record parser also rejects duplicate keys before schema validation.
Records with the old 13-key shape, unknown keys, malformed JSON or any bound
violation are retained as raw unknown entries and block signing; they are not
silently normalized.

The reservation and index semantics remain unchanged: the record is stored at
`glj1:<reservation>`, `glj1:index` contains the sorted record keys, immutable
context and a nonempty `tx_hash` cannot change, and every update is validated
under the same exclusive Web Lock. The adapted fields do not add an RPC call,
contract field, public method or transaction.

## Preserved outcomes and affected evidence

The adaptation preserves the approved public outcomes: one durable
pre-signing reservation, no duplicate submission, same-hash reconciliation,
explicit raw export, bounded 32-record capacity, truthful finality/execution
status and authoritative readback before `VERIFIED` or `FINALIZED_ERROR`.

Affected acceptance evidence is limited to the journal schema and recovery
tests:

- exact-key tests accept the 15-key effective schema and quarantine the old
  13-key shape;
- top-level and nested duplicate-key tests prove raw preservation and signing
  disablement;
- coordinator tests prove pre-sign failures emit no transaction progress claim
  and returned hashes remain single-use;
- JournalPanel tests distinguish `PRESENT`, `UNCHANGED` and `COMPETING`, and
  browser E2E proves a submitted hash remains visible with a safe reconcile
  action after reload;
- the separate Studio and frontend RPC budgets are unchanged because this is
  storage/UI evidence only.

## Residual risk

Existing browser data written by the earlier 13-key shape will be quarantined
and must be exported or manually recovered; it will never be re-signed. The
adaptation is effective only for this exact reviewed build revision. Any future
schema extension requires a new reviewed adaptation and package.
