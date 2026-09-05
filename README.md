# Committed Answer Match

Committed Answer Match is a small GenLayer application for recording whether an assigned guess matches a creator's committed answer for one exact public clue or context. The contract keeps the case phase, locked evidence, accepted result history, bounded retries, and expiry on chain.

> All submitted text will be public and permanent. Do not include private information, credentials or personal records.

> Assessment of this exact submitted material only; not verification of external facts.

## Current status

The exact reviewed replacement is deployed on Studionet at
`0xD22f951BD5B7AE6615c27066e99a80D9751be5cF`. Verified live evidence covers
the successful match, no-match, rejection, ambiguity and expiry journeys.
Physical hosted-UI request counting is not claimed because the retained Studio
binding exposes no physical counter. The hosted frontend is available at
[frontend-psi-kohl-42.vercel.app](https://frontend-psi-kohl-42.vercel.app);
deployment and source parity are summarized in
[`docs/VERIFICATION.md`](docs/VERIFICATION.md).

## Case lifecycle

1. The creator enters a clue, the assigned guesser address, and a reference answer. The browser derives a context-bound SHA-256 commitment and offers a reveal backup containing the answer and salt.
2. The create transaction stores the case and commitment; the answer and salt are not sent in that transaction.
3. The assigned guesser submits one guess, moving the case to `REVEAL_WAIT`.
4. The creator verifies the backup and reveals the answer, moving the case to `FROZEN`.
5. Anyone may request an assessment. Exact equality records `MATCH` or `NO_MATCH`; an inconclusive bounded assessment records `UNRESOLVED` and may be retried after the cooldown.
6. Accepted attempts are capped. A case can be expired after its deadline, and every accepted revision remains available through historical reads.

## Local setup

Requirements used by this checkout:

- Python 3.13 with `genlayer-py` and `genlayer-test` available;
- Node.js 22 and npm 12;
- a supported EIP-1193 wallet for interactive chain operations.

From PowerShell:

```powershell
cd E:\GenLayer-Projects\committed-answer-match\frontend
npm install --no-audit --no-fund
npm run dev
```

Create `frontend\.env` from `frontend\.env.example` and set the exact
replacement contract address locally:

```text
VITE_CONTRACT_ADDRESS=0xD22f951BD5B7AE6615c27066e99a80D9751be5cF
```

The local `.env` is intentionally ignored. The address, source parity,
deployment receipt and frozen/replacement rule are bound in
`docs/DEPLOYMENT-MANIFEST.md`.

## Verification commands

Frontend checks:

```powershell
cd E:\GenLayer-Projects\committed-answer-match\frontend
npm test
npm run build
npm run test:e2e
```

Contract checks:

```powershell
cd E:\GenLayer-Projects\committed-answer-match
$env:PYTHONIOENCODING='utf-8'
py -3.13 -m pytest tests\test_contract.py -q -p no:cacheprovider
genvm-lint check contracts\main.py
genvm-lint validate contracts\main.py
genvm-lint schema --json -o contract-schema.json contracts\main.py
```

## Contract surface

Write methods are `create_match`, `submit_guess`, `reveal_answer`, `evaluate_match`, `retry_match`, and `expire_match`. Views expose the case, a specific version, the case ID for a creator/nonce pair, and the stored history. The contract validates canonical addresses, decimal IDs, commitment preimages, deadlines, phase transitions, revision numbers, and last-operation records.

The frontend accepts a write only after a finalized transaction receipt with `FINISHED_WITH_RETURN` and an exact historical readback of the intended state. Its browser journal records local write progress and reconciliation metadata; it never replaces the chain as the source of truth.

## Architecture

- The Intelligent Contract owns the case lifecycle, commitment, role checks,
  semantic assessment, expiry and immutable version history.
- The React/Vite frontend owns wallet selection, input validation, reveal-backup
  handling, transaction progress and same-hash recovery.
- Studionet and historical contract reads are authoritative. Browser journal
  data is local operational memory and never substitutes for on-chain state.

## Transaction lifecycle

The interface records a journal entry before wallet approval, then shows wallet
confirmation, submission, bounded finality polling, execution verification and
authoritative readback. A real transaction hash remains visible after
submission. Rejected, failed and ambiguous operations remain distinguishable;
ambiguous operations offer reconciliation of the existing hash and never
silently submit a replacement.

## Deployment

The current contract runs on Studionet (`61999`) at
`0xD22f951BD5B7AE6615c27066e99a80D9751be5cF`. Its deployed source is verified
against the local SHA-256 binding and its deployment reached `FINALIZED` with
consensus `Accepted`. See [`docs/VERIFICATION.md`](docs/VERIFICATION.md) for
the deployment transaction and reproducible checks.

## Security and trust boundaries

Submitted clue, guess and answer text is public and permanent. The reference
answer is committed before a guess and is not sent in the create transaction;
the creator must retain the local reveal backup. The contract validates caller
roles, immutable revisions, commitments, deadlines and exact operation
postconditions. The semantic result concerns only the submitted material and
does not verify external facts.

## Known limitations

- A lost reveal backup cannot be reconstructed by the application.
- Semantic assessment may be inconclusive; the contract stores `UNRESOLVED`
  and bounds retries rather than inventing a result.
- The current contract is intentionally frozen. A confirmed post-deployment
  contract defect requires a new contract and fresh evidence.
- Exact-release browser RPC measurements are not claimed until the hosted
  frontend E2E gate is completed.

## GenLayer references

- [GenLayerJS](https://docs.genlayer.com/developers/decentralized-applications/genlayer-js)
- [Transaction context](https://docs.genlayer.com/developers/intelligent-contracts/features/transaction-context)
- [Writing data](https://docs.genlayer.com/developers/decentralized-applications/writing-data)
- [Querying a transaction](https://docs.genlayer.com/developers/decentralized-applications/querying-a-transaction)
- [Transaction status](https://docs.genlayer.com/api-references/genlayer-node/gen/gen_getTransactionStatus)
- [GenLayer linter](https://docs.genlayer.com/api-references/genlayer-linter)
