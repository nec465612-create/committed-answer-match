# Studio RPC measurement recovery plan

## Purpose

Recover a truthful physical Studio RPC measurement for the Build
`POST_DEPLOY_TEST` gate without changing the approved contract source or
upgrading any frozen address.

## Ordered procedure

1. Close every stale Studio tab and honor the `30 requests per minute`
   cooldown. Do not reload or probe during the cooldown.
2. Open exactly one fresh Codex in-app Studio tab on `/run-debug`. Confirm the
   locked account, Studionet/61999 and the final source/address before any
   write. Do not use Chrome or an external browser.
3. Clear the Studio Logs state if the UI exposes that control, select the RPC
   log filter, and verify that the visible ledger receives
   `endpoint_call`/`endpoint_success`/`endpoint_error` entries. Record the
   ledger baseline before the first measured action.
4. Use one bounded read-only action to validate the ledger. Record the exact
   visible RPC-event delta, method names, errors, interval and total. Stop if
   the ledger is unavailable or the quota is hit.
5. If the ledger is usable, run only the smallest approved unique live matrix
   needed for a fresh exact evidence package. Count the physical event delta
   for every row, retain hashes/readbacks, and stop on rate limit or an
   unexplained extra request. Never replay a returned-hash write.
6. If the final contract's historical run remains unrecoverable and the user
   has directed a new run, keep every prior address intentionally frozen,
   deploy one new instance from the exact approved source, bind the new
   address, and run a fresh matrix with the ledger active from step 3.
7. Rehash source/schema/tests, update the manifest and RPC evidence, run the
   affected local checks, and send the same-reviewer `POST_DEPLOY_TEST` delta.
   GitHub/Vercel remain out of scope until the checkpoint is approved.

## Current disposition

The existing final contract/source is unchanged. The first bounded recovery
probe found the IAB tab had no network/performance/CDP counter. Static Studio
client inspection shows that the hosted app itself receives WebSocket endpoint
events, so a fresh ledger-backed run is the next measurement attempt. A new
contract is permitted only as the user-directed replacement run after the
historical measurement path is exhausted; it is never an upgrade or a reason
to alter the existing frozen addresses.
