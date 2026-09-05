# Studio RPC measurement recovery plan

## Purpose

Recover truthful mode-specific Studio evidence for the Build
`POST_DEPLOY_TEST` gate without changing the approved contract source or
upgrading any frozen address. A physical request count is not manufactured
when the platform does not expose one.

## Ordered procedure

1. Close every stale Studio tab and honor the `30 requests per minute`
   cooldown. Do not reload or probe during the cooldown.
2. Lock the capability result before any new Studio action. The retained
   binding exposed DOM/console evidence but no physical network counter; the
   hosted client/WebSocket event surface was inspected without submitting a
   transaction.
3. Because the final replacement E2E is legacy, select
   `OBSERVABLE_ACTION_LEDGER` with `RETROSPECTIVE_LEGACY`. Record the exact
   limitation, the probe time and the absence of a physical-count claim.
4. Inspect the retained artifacts and enumerate every primary-AI action,
   submitted hash, bounded status observation, terminal receipt, authoritative
   readback, retry, duplicate and variance. Do not infer physical requests
   from transaction totals or UI labels.
5. Do not replay a returned-hash write, create a measurement-only transaction,
   or redeploy. A new contract is reserved for a confirmed post-deploy
   contract defect under the intentionally-frozen rule; this measurement issue
   is not such a defect.
6. Rehash source/schema/tests, update the manifest and RPC evidence, run the
   affected local checks, and send the same-reviewer `POST_DEPLOY_TEST` delta.
   GitHub/Vercel remain out of scope until the checkpoint is approved.

## Current disposition

The existing final contract/source is unchanged. The capability probe at
`2026-09-05T16:07:09.809Z` found no granted network/performance/CDP counter;
the fresh tab also hit three `gen_getContractSchema` 30/min errors. Static
client inspection confirmed a hosted WebSocket event surface, but not a
recoverable historical physical count. The correct recovery is therefore the
locked retrospective observable ledger now recorded in `docs/RPC-BUDGET.md`.
The intentionally-frozen address remains untouched.
