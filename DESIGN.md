# Committed Answer Match — Design Brief

## Status and ownership

This repository currently contains a functional React/TypeScript shell and a tested GenLayer contract. The visible product still needs its final presentation pass. Claude owns that final frontend redesign; the contract, transaction coordinator, wallet behavior, tests, configuration, and release workflow are outside that handoff.

The existing green/cream functional styling is scaffolding, not a locked visual system. The redesign must preserve behavior while making the public experience feel deliberate, calm, and easy to audit.

## Product intent

Committed Answer Match creates a public case around one exact clue or context. The creator commits an answer, an assigned wallet submits one guess, the creator reveals the committed answer, and the contract records a deterministic exact-match result or a bounded consensus-backed assessment. Every accepted revision remains readable in the case history.

Primary audiences are:

- participants who need clear wallet, backup, reveal, and transaction states;
- observers and judges who need the clue, locked evidence, phase, outcome, and history to be legible;
- developers who need a truthful, small, documented GenLayer example.

Tone: evidence-first, precise, calm, and human. Avoid hype, fake metrics, invented testimonials, simulated activity, or claims that external facts were verified.

## Information architecture

Use a compact public navigation with these destinations or anchored sections:

- **Home** — explain the two-party flow and open an existing case by ID.
- **New match** — collect the public clue, assigned guesser wallet, and local reference answer; show the commitment preview and reveal-backup action.
- **Match** — show the current phase, evidence, revision, deadline, outcome, accepted history, and the one action available to the connected role.
- **Journal** — show the newest local transaction records and export affordance without implying that the browser journal is authoritative.
- **Docs / How it works** — explain commitment, guess, reveal, evaluation, retry, expiry, finality, and readback in plain language.

The primary macrostructure is **Workbench**: the product should guide a user through a real case state and its next safe action. Use **modern-minimal** as the genre and **Cobalt** as the visual direction: cool near-white surfaces, restrained electric-cobalt emphasis, dark ink, quiet borders, and no gradients or glass effects. Use **N5 Floating pill** for the main navigation and **Ft5 Statement** for the footer treatment.

## Visual system direction

Claude may choose the exact tokens, but must document and use them consistently:

- all colors through named OKLCH custom properties;
- a 4pt spacing rhythm with a small, intentional type scale;
- display typography with technical character and highly readable body text;
- monospace only for IDs, hashes, deadlines, transaction references, and other machine-readable values;
- strong hierarchy through type, whitespace, and rules rather than a grid of generic cards;
- real icons with accessible labels; no emoji as interface icons;
- one clear primary action per state and quiet secondary actions;
- no fake dashboard metrics, stock imagery, logo walls, decorative browser chrome, or dead links.

The wallet chooser must follow the supplied visual reference:

`E:\Genlayer\brain\assets\wallet-selector-reference\connect-wallet-picker-reference.png`

It must remain a compact, accessible chooser with recognizable MetaMask, OKX Wallet, and Rabby rows, a right-side affordance, and Cancel. Do not invent additional wallet providers.

## Public copy and trust boundaries

Keep this warning exact and visible before submission:

> All submitted text will be public and permanent. Do not include private information, credentials or personal records.

Keep this assessment note exact wherever the result is introduced:

> Assessment of this exact submitted material only; not verification of external facts.

Use plain labels such as `GUESS_OPEN`, `REVEAL_WAIT`, `FROZEN`, `UNRESOLVED`, `EXHAUSTED`, and `DONE` with a short human explanation. Do not expose internal AI, reviewer, checkpoint, EIP-6963, provider/RPC, debug, or release-process language in the public UI.

## Behavior that the redesign must preserve

- Discover only supported MetaMask, OKX Wallet, and Rabby providers. Opening the chooser never requests accounts; account access happens only after an explicit wallet selection.
- Support zero, one, or all three discovered wallets without fake options. Keep the page disconnected after reload, reload on account/chain/disconnect changes, and keep connection errors inside the chooser.
- Keep the wallet dialog keyboard accessible: initial focus, Tab/Shift+Tab trap, Escape and Cancel, backdrop behavior, focus restoration, and inert background.
- Keep the reference answer and salt out of the create transaction. The reveal backup must be downloadable and verifiable against the exact case.
- Keep write progress honest: no optimistic success, no duplicate submission, finalized receipt required, execution result must be `FINISHED_WITH_RETURN`, and exact historical readback must verify the intended post-state.
- Keep the bounded browser journal and reconciliation flow. The journal is local operational memory, not the source of truth; the chain and historical readback are authoritative.
- Keep the 6-RPC write budget and the contract's create → guess → reveal → evaluate/retry → expire lifecycle.

## Required state coverage

The final interface must have intentional designs for loading, disconnected, no-wallet, one-wallet, three-wallet, empty, validation error, wallet rejection, pending, finalized success, finalized execution failure, readback mismatch, reconciliation, unresolved cooldown, expired case, exhausted attempts, and read-only observer states. Every state needs a useful next action or explanation.

## Accessibility and responsive acceptance

- Test at 320, 375, 414, and 768px widths as well as desktop.
- Preserve semantic headings, labels, button names, visible focus rings, contrast, keyboard operation, and reduced-motion behavior.
- Keep long clues, addresses, IDs, hashes, and error messages readable without horizontal scrolling.
- Use `overflow-x: clip` at the document level and do not rely on hover for essential information.
- Animated affordances must stop or reduce when `prefers-reduced-motion: reduce` is active.

## Handoff boundary

Claude may edit only the visible frontend presentation layer:

- `frontend/src/App.tsx`
- `frontend/src/styles.css`
- `frontend/src/main.tsx`
- `frontend/index.html` when needed for public metadata or font loading
- `frontend/public/*` only for necessary local visual assets

Do not edit `contracts/`, `tests/`, `frontend/tests/`, `frontend/src/contract.ts`, `frontend/src/pending.ts`, `frontend/src/chain/`, `frontend/src/wallet/`, package/config/lock files, `.env*`, governance documents, or deployment/release files. Do not change method names, arguments, readback checks, journal semantics, provider discovery, or transaction behavior.

## Required local references

Read the applicable sections of:

- `E:\Genlayer\knowledge\implementation\hallmark\SKILL.md`
- `E:\Genlayer\knowledge\implementation\hallmark\references\genres\modern-minimal.md`
- `E:\Genlayer\knowledge\implementation\hallmark\references\macrostructures\05-workbench.md`
- `E:\Genlayer\knowledge\implementation\hallmark\references\components\n5-floating-pill.md`
- `E:\Genlayer\knowledge\implementation\hallmark\references\components\ft5-statement.md`
- `E:\Genlayer\brain\Engineering and UI Quality Rules.md`
- `E:\Genlayer\brain\Reusable Frontend Build Patterns.md`

The final pass should finish with a Hallmark slop-test, keyboard and responsive checks, and the repository's existing frontend test/build/E2E commands. Record the locked visual tokens and any intentional exceptions in the implementation files or this brief.
