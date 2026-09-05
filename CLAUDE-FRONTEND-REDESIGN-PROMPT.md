CLAUDE_DESIGN_ITERATION 1

# Claude frontend redesign handoff — Committed Answer Match

You are Claude, the bounded frontend presentation owner for the GenLayer project at:

`E:\GenLayer-Projects\committed-answer-match`

The functional source baseline is exactly commit `9f6452b6d2030605f72d9912b095c501b62451ac`. Treat that revision as the source of truth while editing. Do not broaden the task into deployment, release, contract changes, reviewer communication, or repository cleanup.

## Your scope

Directly redesign and implement the visible public frontend so it feels finished, trustworthy, and judge-readable. You may edit only:

- `E:\GenLayer-Projects\committed-answer-match\frontend\src\App.tsx`
- `E:\GenLayer-Projects\committed-answer-match\frontend\src\styles.css`
- `E:\GenLayer-Projects\committed-answer-match\frontend\src\main.tsx`
- `E:\GenLayer-Projects\committed-answer-match\frontend\index.html`
- `E:\GenLayer-Projects\committed-answer-match\frontend\public\*` only when a necessary local visual asset cannot be expressed with the existing code

Leave every other file untouched. In particular, do not edit `contracts/`, `tests/`, `frontend/tests/`, `frontend/src/contract.ts`, `frontend/src/pending.ts`, `frontend/src/chain/`, `frontend/src/wallet/`, `package.json`, `package-lock.json`, TypeScript/Vite/Playwright configuration, `.env*`, governance files, or release files. Do not add a dependency. Do not change contract method names, arguments, state transitions, readback checks, journal semantics, provider discovery, transaction behavior, test fixtures, or RPC limits.

## Read these local references before editing

- `E:\Genlayer-Projects\committed-answer-match\DESIGN.md`
- `E:\Genlayer\knowledge\implementation\hallmark\SKILL.md`
- `E:\Genlayer\knowledge\implementation\hallmark\references\genres\modern-minimal.md`
- `E:\Genlayer\knowledge\implementation\hallmark\references\macrostructures\05-workbench.md`
- `E:\Genlayer\knowledge\implementation\hallmark\references\components\n5-floating-pill.md`
- `E:\Genlayer\knowledge\implementation\hallmark\references\components\ft5-statement.md`
- `E:\Genlayer\brain\Engineering and UI Quality Rules.md`
- `E:\Genlayer\brain\Reusable Frontend Build Patterns.md`
- `E:\Genlayer\brain\assets\wallet-selector-reference\connect-wallet-picker-reference.png`

Use these official product references when adding public explanatory copy:

- [GenLayerJS](https://docs.genlayer.com/developers/decentralized-applications/genlayer-js)
- [Transaction context](https://docs.genlayer.com/developers/intelligent-contracts/features/transaction-context)
- [Querying a transaction](https://docs.genlayer.com/developers/decentralized-applications/querying-a-transaction)
- [Writing data](https://docs.genlayer.com/developers/decentralized-applications/writing-data)
- [Transaction status](https://docs.genlayer.com/api-references/genlayer-node/gen/gen_getTransactionStatus)
- [GenLayer linter](https://docs.genlayer.com/api-references/genlayer-linter)

## Exact functional baseline

The checkout contains a tested React/TypeScript shell with these public views: Home, New match, Match, and Journal. The frontend uses `frontend/src/contract.ts` for reads and writes, `frontend/src/chain/writeCoordinator.ts` for bounded transaction progress, `frontend/src/pending.ts` for the local journal, and `frontend/src/wallet/` for wallet discovery and connection.

The critical source hashes at the baseline are:

```text
contracts/main.py 48B8B3BA0BEB806699CA777F90178020A85ACC6CA2EDB74765F1E109EFFEB18B
frontend/src/App.tsx F696EE9A896EDFFB15074675216708D63F9A2DF61D52AD9BABBBC4302DC0D060
frontend/src/styles.css A7413DC9BB6A7108DA0AE396DC7948AB53E42E992BBEFADFBCBFA64D12D22887
frontend/src/contract.ts 28223FD78C1688946433DDF3A752C3BF78416CA5A45DC532E003ACB05D1BC076
frontend/src/pending.ts E258BE741E2641F4D03741BE7EF3A7969F4BD1600D8CACDA7BC63723107FD1F3
frontend/src/chain/writeCoordinator.ts C453F34D3496F2CA701793025D160E5C82CE7B332C7895E45A66A7F148C67E43
frontend/src/wallet/providers.ts A519ADB2FF99637EC51012F849B34583F48C182E85DEECD66F5046C037667A91
frontend/src/wallet/connection.ts 7615F7B529BE0553EF3146B1E27E6414ED9BCB2B2565DE81B4CF5AC6C14A7773
```

The contract lifecycle is exact: create → `GUESS_OPEN` → `REVEAL_WAIT` → `FROZEN` → deterministic or bounded consensus assessment → `DONE`, `UNRESOLVED`, or `EXHAUSTED`; deadline expiry can produce a void `DONE`. The public case shows clue, guess, revealed answer when available, phase, revision, deadline, outcome, and accepted history.

The create form must continue to keep the reference answer and salt out of the create transaction, provide a downloadable reveal backup, and require acknowledgement that it was saved. Keep the exact public warning:

> All submitted text will be public and permanent. Do not include private information, credentials or personal records.

Keep the exact assessment note:

> Assessment of this exact submitted material only; not verification of external facts.

## Wallet chooser requirements

The only supported choices are MetaMask, OKX Wallet, and Rabby. The chooser must be truthful for all three cardinalities: zero detected wallets, exactly one, or all three. Never render a fake or unavailable wallet tile. Preserve the stable display order OKX Wallet, MetaMask, Rabby.

Opening the chooser must not request accounts. `eth_requestAccounts` may run only after the user explicitly selects a detected wallet. Preserve the provider object/UUID deduplication, bounded EIP-6963 plus legacy discovery, reload-on-account/chain/disconnect behavior, and disconnected-on-reload behavior. Do not access a global `window.ethereum` singleton directly.

Use the supplied wallet reference as the visual guide:

`E:\Genlayer\brain\assets\wallet-selector-reference\connect-wallet-picker-reference.png`

The chooser needs recognizable brand marks, a compact row treatment, a right-side affordance, Cancel, initial focus, a keyboard focus trap, Escape/backdrop behavior, focus restoration, and an inert background. Connection errors stay inside the active chooser. Preserve existing test hooks such as `data-testid="wallet-option-metamask"`, `data-testid="wallet-option-okx"`, `data-testid="wallet-option-rabby"`, the Close wallet picker accessible name, and the Connect wallet accessible name.

## Transaction and journal requirements

The visible UI must represent transaction progress honestly. A write is successful only after a finalized receipt with execution result `FINISHED_WITH_RETURN` and an exact historical readback of the intended post-state. Never show optimistic success, never resubmit after an unknown outcome, and preserve the six-RPC write budget. The UI must distinguish signing, submitted/pending, finalized success, finalized execution failure, readback mismatch, reconciliation, and archived local error.

The local browser journal is operational memory, not chain authority. Keep its capacity, Web Locks behavior, reservation, immutable operation context, export, and reconciliation semantics intact. If the lock is unavailable, show a useful explanatory state and never attempt a write without the required lock.

## Design direction

Follow `DESIGN.md` as the project brief:

- genre: modern-minimal;
- theme direction: Cobalt;
- macrostructure: Workbench;
- nav: N5 Floating pill;
- footer: Ft5 Statement;
- tone: evidence-first, precise, calm, and human.

Replace the current functional green/cream styling with a coherent final system. Use named OKLCH tokens, a 4pt spacing rhythm, clear type hierarchy, readable body copy, monospace for machine values only, quiet rules, and one clear primary action per state. Do not use gradients, glassmorphism, emoji icons, fake metrics, fake testimonials, decorative browser chrome, stock imagery, logo walls, or dead links. Prefer the existing icon packages and compact inline brand marks over adding assets or dependencies.

Make the Workbench feel like a real case moving through evidence and action, not a generic dashboard card grid. Add or improve a visible Docs / How it works explanation inside the allowed presentation files if it helps a first-time judge understand commitment, guess, reveal, evaluation, retry, expiry, finality, and readback. Do not invent external facts or imply the application verifies anything beyond the exact submitted material.

Design intentional states for loading, disconnected, no-wallet, one-wallet, three-wallet, empty, validation error, wallet rejection, pending, finalized success, finalized execution failure, readback mismatch, reconciliation, unresolved cooldown, expired case, exhausted attempts, and read-only observer. Each state should explain what happened and offer the next safe action.

## Responsive and accessibility requirements

Check 320, 375, 414, and 768px widths plus desktop. Preserve semantic headings, labels, button names, visible `:focus-visible` rings, contrast, keyboard operation, readable wrapping for clues/addresses/hashes/errors, and reduced-motion behavior. Keep document-level `overflow-x: clip`; essential information must not depend on hover. Honor `prefers-reduced-motion: reduce`.

Do not remove or weaken existing `data-testid` hooks required by `frontend/tests/flow.spec.ts`, including wallet option selectors. Do not make the tests pass by hiding content or changing behavior.

## Verification and response protocol

After editing, run these commands from the project:

```powershell
cd E:\GenLayer-Projects\committed-answer-match\frontend
npm test
npm run build
npm run test:e2e
```

Then verify that the only changed files are in the allowed presentation list and that no contract, test, wallet, journal, transaction, config, dependency, or release file changed. Use a final responsive/keyboard/reduced-motion inspection and run a Hallmark slop-test. Do not commit, deploy, push, or contact a reviewer as part of this handoff.

Report the result beginning with exactly `CLAUDE_DESIGN_ITERATION 1`. If a second correction pass is explicitly requested, label it exactly `CLAUDE_DESIGN_ITERATION 2`; do not continue after that second pass. Include changed files, the three frontend command results, responsive/accessibility checks, and any unresolved issue. Stop after the bounded handoff.
