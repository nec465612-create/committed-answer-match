# Committed Answer Match — Recovery Runbook

`RECOVERY_SCOPE: PRE_DEPLOY AND FROZEN-CONTRACT OPERATIONS`

This runbook is intentionally secret-free. It preserves the rule that a
deployed Committed Answer Match contract is immutable: a defect or lost
network state is recovered by deploying a new contract, never by upgrading the
old one.

## 1. Local or Studio session reset

1. Stop the local dev server or Direct Mode run and keep the exact source
   commit from [`DEPLOYMENT-MANIFEST.md`](/E:/GenLayer-Projects/committed-answer-match/docs/DEPLOYMENT-MANIFEST.md).
2. If Studio resets before a deployment hash exists, reopen the same exact
   source, empty constructor `[]`, Studionet (`61999`) and recorded deployer
   address. Recheck source/schema parity once; do not start a reload loop.
3. If a deployment or write hash already exists, query that same hash and its
   authoritative state/readback first. Never create a replacement transaction
   merely because a tab, browser session or local process disappeared.
4. Recreate only ephemeral local test state. Export the browser journal before
   clearing anything; unreadable raw entries remain exportable and signing is
   blocked until recovery/quarantine is complete.
5. Re-run the exact local checks before any new Studio action:

   ```powershell
   $env:PYTHONIOENCODING='utf-8'
   py -3.13 -m pytest tests\test_contract.py -q -p no:cacheprovider
   genvm-lint check contracts\main.py
   genvm-lint validate contracts\main.py
   genvm-lint schema --json -o contract-schema.json contracts\main.py
   npm test -- --run
   npm run build
   npm run test:e2e
   ```

   The commands are offline evidence only. A reset does not restore Studio
   approval, deployment acceptance or live E2E evidence.

## 2. Studionet or chain-state reset

If Studionet state is reset, the old address and history are not assumed to
survive. Use the following bounded recovery:

1. Preserve the old address, transaction hashes and evidence as historical
   records; do not relabel them as current.
2. Rebuild from the exact source commit, contract SHA-256 and constructor
   arguments in the manifest. Verify the current network is Studionet/61999.
3. Deploy a new contract with `[]` and record its new address/hash. Do not
   issue an upgrade or write to the old address.
4. Update only the new frontend address after the replacement has passed live
   smoke verification. Rebind the frontend and manifest to the new address,
   then rerun the required Studio E2E rows and the exact-release frontend
   evidence. Prior address evidence cannot be transferred.
5. Stop on a rate limit, unexplained RPC request, missing finality, source
   mismatch or absent authoritative readback. Preserve the existing hash and
   resume with sparse reads after the documented cooldown.

## 3. Post-deployment contract defect

For any confirmed contract defect, the only valid repair is:

```text
old contract: remain frozen and readable
new contract: deploy from a new reviewed source revision
frontend: update VITE_CONTRACT_ADDRESS only after new live smoke verification
evidence: fresh source/address/hash/finality/readback package
```

Do not add an upgrade function, mutate storage assumptions, or claim that a
new address inherits the old state. The new contract requires fresh exact
deployment and live evidence; the old contract's records remain historical.

## 4. Browser journal recovery

The journal is a local recovery record, not the chain authority.

- `Refresh` reads all valid entries without requiring Web Locks.
- Malformed `glj1:*` entries are retained as raw export rows instead of being
  silently dropped; signing stays disabled while any are present.
- A hash-bearing entry may reconcile only the same transaction hash.
- A hashless entry may perform one nonce/history lookup to classify
  `PRESENT`, `ABSENT`, `COMPETING` or `UNKNOWN`; it is never replayed.
- Any rejected journal lock request or storage read/write failure latches
  signing off for the session. The visible hash and volatile recovery record
  remain available when possible; read, export and same-hash reconciliation
  stay allowed, but no second submission is permitted.
- Resolution evidence may advance monotonically from `UNKNOWN` or `ABSENT` to
  exact `UNCHANGED`, `PRESENT` or `COMPETING` evidence under the journal lock;
  immutable operation context and a nonempty transaction hash never change.
- Only one write or same-hash reconciliation lifecycle may run at once. A
  second caller is rejected before it can start another poller or submission.
- The visible journal is paged at four entries per page; export retains the
  complete valid and malformed record set.
- No pending/ambiguous entry is automatically resubmitted. Final success
  still requires finality, semantic execution success and exact authoritative
  readback.
