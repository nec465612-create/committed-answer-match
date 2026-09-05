import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";
import { SiOkx } from "@icons-pack/react-simple-icons";
import {
  chainIdDecimal,
  computeCommitment,
  invalidateReadRequests,
  makeWriteAdapter,
  normalizeAddress,
  normalizeText,
  parseRecord,
  pollFinalized,
  readCase,
  readChainTime,
  readIdByNonce,
  readVersion,
  randomHex,
  requireContractAddress,
  sha256Hex,
  validateContractText,
  type CaseRead,
  type CaseRecord,
  type WriteMethod,
} from "./contract";
import {
  executeWrite,
  INITIAL_WRITE_PROGRESS,
  reconcileWrite,
  type ResolutionEvidence,
  type WriteProgress,
} from "./chain/writeCoordinator";
import { TransactionProgress } from "./components/TransactionProgress";
import { backupBinding, matchesActionPostcondition, matchesCreatePostcondition, matchesJournalActionPostcondition } from "./verification";
import {
  canonicalJson as journalJson,
  createBrowserJournal,
  type DurableJournal,
  type JournalRecord,
  type UnknownJournalRecord,
} from "./pending";
import {
  browserDiscoveryHost,
  WalletRegistry,
  type WalletCandidate,
  type WalletId,
} from "./wallet/providers";
import { connectWallet, type ConnectedWallet } from "./wallet/connection";
import type { CalldataEncodable } from "genlayer-js/types";

const PUBLIC_WARNING = "All submitted text will be public and permanent. Do not include private information, credentials or personal records.";
const MATERIAL_NOTE = "Assessment of this exact submitted material only; not verification of external facts.";
const ZERO_HASH = "0".repeat(64);

type View = "home" | "new" | "match";

interface Notice {
  tone: "info" | "success" | "error";
  text: string;
}

interface CreateDraft {
  nonce: string;
  opponent: string;
  clue: string;
  commitment: string;
  args: CalldataEncodable[];
  journalArgs: unknown[];
}

interface CaseAction {
  method: Exclude<WriteMethod, "create_match">;
  args: CalldataEncodable[];
  journalArgs: unknown[];
}

type JournalIntent =
  | { kind: "create"; nonce: string }
  | { kind: "action"; method: Exclude<WriteMethod, "create_match">; caseId: string; preRevision: string };

function shortAddress(value: string): string {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function explorerTransactionUrl(hash: string): string | undefined {
  return /^0x[0-9a-fA-F]{64}$/.test(hash) ? `https://explorer-studio.genlayer.com/tx/${hash}` : undefined;
}

function friendlyError(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (code === 4001 || code === "4001") return "The wallet request was cancelled.";
  }
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes("journal lock unavailable")) return "Signing is disabled because the durable journal lock or storage health check is unavailable.";
  if (message.includes("unreadable") || message.includes("invalid journal")) return "The journal contains an unreadable entry. Export the raw journal before signing again.";
  if (message.includes("capacity")) return "The local operation journal is full. Export or archive completed entries before signing again.";
  if (message.includes("pending")) return "Another operation for this match is already awaiting reconciliation.";
  if (message.includes("contract is not configured")) return "This build has no contract address configured yet.";
  if (message.includes("chain")) return "The selected wallet could not switch to the required network.";
  if (message.includes("too early")) return "The chain says this operation is too early. Refresh the match and try again later.";
  if (message.includes("stale")) return "This match changed before the operation was accepted. Refresh the match to continue.";
  return "The operation could not be completed. No new attempt was started automatically.";
}

function walletIcon(id: WalletId, size = 42) {
  if (id === "okx") return <SiOkx size={size} aria-hidden color="#111827" />;
  if (id === "metamask") {
    return <svg className="wallet-svg" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true"><path fill="#e27625" d="m24 5 15 7-4 25-11 7-11-7-4-25 15-7Z" /><path fill="#f3b44d" d="m24 5-7 15 7 5 7-5-7-15Zm-11 7 4 8 7 5v4l-11-6-2-11Zm22 0-4 8-7 5v4l11-6 2-11Z" /><path fill="#d25b2b" d="m13 37 11 7V30l-7-4-4 11Zm22 0-11 7V30l7-4 4 11Z" /><path fill="#fff" d="m18 26 6 4 6-4-2-3-4 2-4-2-2 3Z" /></svg>;
  }
  return <svg className="wallet-svg" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true"><path fill="#7c83ff" d="M12 20c-1-7 1-12 5-15l5 9c1-1 3-1 4 0l5-9c4 3 6 8 5 15 3 3 4 8 2 13-2 6-7 10-12 10s-10-4-12-10c-2-5-1-10 2-13Z" /><path fill="#fff" d="M17 22c2-2 4-2 7 0-1 3-2 4-4 4s-3-1-3-4Zm14 0c-2-2-4-2-7 0 1 3 2 4 4 4s3-1 3-4Zm-10 8h6c-1 3-2 4-3 4s-2-1-3-4Z" /></svg>;
}

function walletLabel(id: WalletId): string {
  if (id === "metamask") return "MetaMask";
  if (id === "okx") return "OKX Wallet";
  return "Rabby";
}

function phaseLabel(phase: string): string {
  return phase.replaceAll("_", " ");
}

function formatDeadline(value: string): string {
  const seconds = Number(value);
  if (!Number.isSafeInteger(seconds)) return "Unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(seconds * 1000));
}

function nextRevision(revision: string): string {
  return (BigInt(revision) + 1n).toString(10);
}

function parseJournalIntent(record: JournalRecord): JournalIntent | null {
  if (record.method === "create_match") {
    const match = /^create:(0x[0-9a-f]{40}):([0-9a-f]{32})$/.exec(record.intent);
    return match && match[1] === record.account ? { kind: "create", nonce: match[2] } : null;
  }
  const match = /^(submit_guess|reveal_answer|evaluate_match|retry_match|expire_match):([1-9][0-9]*):([1-9][0-9]*)$/.exec(record.intent);
  if (!match || match[1] !== record.method) return null;
  return {
    kind: "action",
    method: match[1] as Exclude<WriteMethod, "create_match">,
    caseId: match[2],
    preRevision: match[3],
  };
}

function isRevealed(record: CaseRecord): boolean {
  return record.domain.answer !== "" && ["FROZEN", "UNRESOLVED", "EXHAUSTED", "DONE"].includes(record.phase);
}

function operationLabel(method: string): string {
  const labels: Record<string, string> = {
    create_match: "Create match",
    submit_guess: "Submit guess",
    reveal_answer: "Reveal answer",
    evaluate_match: "Evaluate match",
    retry_match: "Retry assessment",
    expire_match: "Expire match",
  };
  return labels[method] ?? "Match operation";
}

function resolutionClass(record: JournalRecord): string {
  try {
    const value = JSON.parse(record.resolution_json) as { classification?: unknown };
    return typeof value.classification === "string" ? value.classification : "";
  } catch {
    return "";
  }
}

function resolutionEvidence(classification: ResolutionEvidence["classification"], details: Record<string, unknown> = {}): ResolutionEvidence {
  return { classification, detailJson: journalJson({ classification, ...details }) };
}

function journalStatusLabel(record: JournalRecord): string {
  if (record.status === "VERIFIED") return "Verified";
  if (record.status === "FINALIZED_ERROR") {
    return resolutionClass(record) === "COMPETING" ? "Finalized; competing operation retained" : "Finalized with no state change";
  }
  if (record.status === "RECONCILE") {
    const classification = resolutionClass(record);
    if (classification === "PRESENT") return "Hash missing; state present";
    if (classification === "ABSENT") return "Hash missing; state absent";
    if (classification === "COMPETING") return "Needs reconciliation; competing operation";
    return "Needs reconciliation";
  }
  if (record.status === "SUBMITTED") return "Awaiting finality";
  return "Ready for wallet approval";
}

function finalizedErrorMessage(record: JournalRecord, retained = false): string {
  const prefix = retained ? "The retained transaction" : "The transaction";
  const classification = resolutionClass(record);
  if (classification === "COMPETING") return `${prefix} finalized with an execution error while a competing operation was recorded. No replacement was sent.`;
  if (classification === "PRESENT") return `${prefix} finalized with an execution error, but the expected state is present. No replacement was sent.`;
  return `${prefix} finalized with an execution error and the authoritative pre-state was unchanged. No replacement was sent.`;
}

function WalletPicker({
  open,
  wallets,
  busyId,
  error,
  onSelect,
  onClose,
}: {
  open: boolean;
  wallets: WalletCandidate[];
  busyId: WalletId | null;
  error: string;
  onSelect: (wallet: WalletCandidate) => void;
  onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const modal = modalRef.current;
    if (!modal) return undefined;

    const focusable = () => Array.from(modal.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ));
    const first = focusable()[0] ?? modal;
    first.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      if (elements.length === 0) {
        event.preventDefault();
        modalRef.current?.focus();
        return;
      }
      const current = document.activeElement;
      const index = elements.indexOf(current as HTMLElement);
      const next = event.shiftKey
        ? (index <= 0 ? elements[elements.length - 1] : elements[index - 1])
        : (index === elements.length - 1 ? elements[0] : elements[index + 1]);
      if (index === -1 || event.shiftKey || index === elements.length - 1) {
        event.preventDefault();
        next.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const target = returnFocusRef.current;
      returnFocusRef.current = null;
      if (target) {
        window.setTimeout(() => {
          if (document.contains(target)) target.focus();
        }, 0);
      }
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={modalRef} className="wallet-modal" role="dialog" aria-modal="true" aria-labelledby="wallet-picker-title" tabIndex={-1}>
        <div className="modal-heading">
          <div>
            <span className="eyebrow">Your wallet</span>
            <h2 id="wallet-picker-title">Choose a wallet</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Close wallet picker" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <p className="modal-copy">Select the wallet you want to use for this match.</p>
        <div className="wallet-options">
          {wallets.map((wallet) => (
            <button
              className="wallet-option"
              type="button"
              key={wallet.id}
              data-testid={`wallet-option-${wallet.id}`}
              disabled={busyId !== null}
              onClick={() => onSelect(wallet)}
            >
              <span className="wallet-mark">{walletIcon(wallet.id)}</span>
              <span className="wallet-option-name">{wallet.name}</span>
              {busyId === wallet.id ? <LoaderCircle className="spin" size={21} /> : <ArrowRight size={21} />}
            </button>
          ))}
        </div>
        {wallets.length === 0 && (
          <div className="empty-wallets">
            <WalletCards size={25} />
            <p>No supported wallet was detected yet.</p>
            <span>Install MetaMask, OKX Wallet, or Rabby, then reopen this picker.</span>
          </div>
        )}
        {error && <p className="modal-error" role="alert">{error}</p>}
        <button className="text-button modal-cancel" type="button" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

function Header({
  wallet,
  onConnect,
  onHome,
  onNew,
  onJournal,
}: {
  wallet: ConnectedWallet | null;
  onConnect: () => void;
  onHome: () => void;
  onNew: () => void;
  onJournal: () => void;
}) {
  return (
    <header className="site-header">
      <button className="brand" type="button" onClick={onHome} aria-label="Go to home">
        <span className="brand-symbol">CM</span>
        <span>Committed Match</span>
      </button>
      <nav className="nav-links" aria-label="Primary navigation">
        <button type="button" onClick={onHome}>How it works</button>
        <button type="button" onClick={onNew}>New match</button>
        <button type="button" onClick={onJournal}>Journal</button>
      </nav>
      <button className="connect-button" type="button" onClick={onConnect}>
        {wallet ? <><span className="online-dot" /> {shortAddress(wallet.account)}</> : <>Connect wallet <ArrowRight size={17} /></>}
      </button>
    </header>
  );
}

function NoticeBanner({ notice, onDismiss }: { notice: Notice | null; onDismiss: () => void }) {
  if (!notice) return null;
  return (
    <div className={`notice notice-${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
      <span>{notice.text}</span>
      <button type="button" aria-label="Dismiss message" onClick={onDismiss}><X size={17} /></button>
    </div>
  );
}

function PublicWarning() {
  return (
    <div className="public-warning">
      <ShieldCheck size={20} />
      <span>{PUBLIC_WARNING}</span>
    </div>
  );
}

function HomeView({ onNew, onOpen }: { onNew: () => void; onOpen: (caseId: string) => void }) {
  const [caseId, setCaseId] = useState("");
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={14} /> Exact material. Clear outcome.</span>
          <h1>When two answers meet, let the chain hold the line.</h1>
          <p className="hero-lede">Commit a reference answer, receive one guess, then reveal the evidence. The result is recorded against the exact submitted material.</p>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={onNew}>Start a match <ArrowRight size={18} /></button>
            <div className="open-case">
              <label htmlFor="open-case-id">Open a match</label>
              <span className="open-case-input">
                <input id="open-case-id" value={caseId} onChange={(event) => setCaseId(event.target.value)} placeholder="Case ID" inputMode="numeric" />
                <button type="button" aria-label="Open case" disabled={caseId.trim() === ""} onClick={() => onOpen(caseId.trim())}><ArrowRight size={17} /></button>
              </span>
            </div>
          </div>
        </div>
        <div className="hero-card" aria-label="Match lifecycle">
          <div className="hero-card-top"><span>One clear lifecycle</span><span className="status-pill">ON-CHAIN</span></div>
          <div className="lifecycle-step"><span className="step-number">01</span><div><strong>Commit</strong><span>Lock the reference answer.</span></div><Check size={18} /></div>
          <div className="lifecycle-line" />
          <div className="lifecycle-step"><span className="step-number">02</span><div><strong>Guess</strong><span>One response, permanently recorded.</span></div><Check size={18} /></div>
          <div className="lifecycle-line" />
          <div className="lifecycle-step"><span className="step-number">03</span><div><strong>Reveal & assess</strong><span>Compare the frozen material.</span></div><Check size={18} /></div>
        </div>
      </section>
      <PublicWarning />
      <section className="feature-grid">
        <article><span className="feature-index">01</span><h3>Commit first</h3><p>Your answer is hashed with the case context before anyone can guess.</p></article>
        <article><span className="feature-index">02</span><h3>Reveal once</h3><p>A saved backup lets the original creator reveal the exact committed answer later.</p></article>
        <article><span className="feature-index">03</span><h3>Keep the record</h3><p>Every accepted transition has a bounded revision and a historical readback.</p></article>
      </section>
    </main>
  );
}

function NewMatchView({
  wallet,
  contractAddress,
  busy,
  signingAvailable,
  onCreate,
}: {
  wallet: ConnectedWallet | null;
  contractAddress: string | null;
  busy: boolean;
  signingAvailable: boolean;
  onCreate: (draft: CreateDraft) => void;
}) {
  const [opponent, setOpponent] = useState("");
  const [clue, setClue] = useState("");
  const [answer, setAnswer] = useState("");
  const [nonce] = useState(() => {
    try { return randomHex(16); } catch { return ""; }
  });
  const [salt] = useState(() => {
    try { return randomHex(16); } catch { return ""; }
  });
  const [commitment, setCommitment] = useState("");
  const [backupDownloaded, setBackupDownloaded] = useState(false);
  const [backupAcknowledged, setBackupAcknowledged] = useState(false);
  const [backupBindingKey, setBackupBindingKey] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let active = true;
    setCommitment("");
    setBackupDownloaded(false);
    setBackupAcknowledged(false);
    setBackupBindingKey("");
    if (!wallet || !contractAddress || !/^0x[0-9a-fA-F]{40}$/.test(opponent) || clue === "" || answer === "" || nonce === "" || salt === "") return undefined;
    void computeCommitment({
      creator: wallet.account,
      opponent,
      nonce,
      clue,
      answer,
      salt,
      chain: chainIdDecimal(),
      contract: contractAddress,
    }).then((value) => {
      if (active) setCommitment(value);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [answer, clue, contractAddress, nonce, opponent, salt, wallet]);

  function backupPayload() {
    if (!wallet || !contractAddress) throw new Error("Contract is not configured.");
    return {
      context: {
        chain: chainIdDecimal(),
        contract: contractAddress,
        creator: wallet.account,
        opponent: normalizeAddress(opponent),
        nonce,
        clue: validateContractText(clue, 512),
      },
      answer: validateContractText(answer, 256),
      salt,
    };
  }

  function downloadBackup() {
    try {
      if (!commitment) throw new Error("Complete the commitment preview first.");
      const payload = backupPayload();
      const blob = new Blob([JSON.stringify(backupPayload(), null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `committed-match-${nonce.slice(0, 8)}-reveal.json`;
      link.click();
      URL.revokeObjectURL(url);
      setBackupDownloaded(true);
      setBackupBindingKey(backupBinding({
        ...payload.context,
        answer: payload.answer,
        salt: payload.salt,
        commitment,
      }));
      setFormError("");
    } catch (error) {
      setFormError(friendlyError(error));
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!wallet) { setFormError("Connect the creator wallet before creating a match."); return; }
    if (!contractAddress) { setFormError("This build has no contract address configured yet."); return; }
    if (!signingAvailable) { setFormError("Signing is disabled until the local journal lock and storage health are restored."); return; }
    if (!/^0x[0-9a-fA-F]{40}$/.test(opponent) || normalizeAddress(opponent) === wallet.account) { setFormError("Enter a different wallet address for the assigned guesser."); return; }
    let normalizedClue: string;
    try {
      normalizedClue = validateContractText(clue, 512);
      validateContractText(answer, 256);
    } catch {
      setFormError("Use public text within the contract's UTF-8 limits; only spaces, tabs and newlines are allowed as controls.");
      return;
    }
    if (commitment === "") { setFormError("Complete the clue and answer to create the commitment preview."); return; }
    let currentBackupBinding = "";
    try {
      const payload = backupPayload();
      currentBackupBinding = backupBinding({
        ...payload.context,
        answer: payload.answer,
        salt: payload.salt,
        commitment,
      });
    } catch {
      setFormError("Download and verify the reveal backup before creating.");
      return;
    }
    if (!backupDownloaded || !backupAcknowledged || backupBindingKey !== currentBackupBinding) { setFormError("Download the current reveal backup and confirm that you saved it before creating."); return; }
    const normalizedOpponent = normalizeAddress(opponent);
    onCreate({
      nonce,
      opponent: normalizedOpponent,
      clue: normalizedClue,
      commitment,
      args: [nonce, normalizedOpponent, normalizedClue, commitment],
      journalArgs: [nonce, normalizedOpponent, normalizedClue, commitment],
    });
  }

  return (
    <main className="form-page">
      <div className="page-heading"><span className="eyebrow">New match</span><h1>Set the question. Keep the answer in your hands.</h1><p>Build the public commitment now; reveal it later from the saved backup.</p></div>
      <PublicWarning />
      <form className="form-card" onSubmit={submit}>
        <div className="form-card-header"><div><span className="eyebrow">Step 01 / 02</span><h2>Public match details</h2></div><span className="form-status">{wallet ? `Creator ${shortAddress(wallet.account)}` : "Wallet not connected"}</span></div>
        <div className="field-grid">
          <label className="field field-wide"><span>Clue or context</span><textarea value={clue} onChange={(event) => setClue(event.target.value)} maxLength={512} placeholder="What exact material should the two answers address?" required /></label>
          <label className="field"><span>Assigned guesser wallet</span><input value={opponent} onChange={(event) => setOpponent(event.target.value)} placeholder="0x…" spellCheck={false} required /></label>
          <label className="field"><span>Reference answer <span className="muted">(kept locally until reveal)</span></span><input value={answer} onChange={(event) => setAnswer(event.target.value)} maxLength={256} type="password" placeholder="Your committed answer" required /></label>
        </div>
        <div className="commitment-preview"><div><span className="eyebrow">Commitment preview</span><p>{commitment || "Fill the three fields to derive the context-bound commitment."}</p></div><span className="preview-badge">SHA-256</span></div>
         <div className="backup-card"><div className="backup-icon"><Download size={20} /></div><div className="backup-copy"><strong>Save the reveal backup</strong><span>It contains the answer and salt needed to reveal this exact commitment.</span></div><button className="secondary-button" type="button" onClick={downloadBackup} disabled={!wallet || !contractAddress || !commitment || answer === "" || clue === "" || !/^0x[0-9a-fA-F]{40}$/.test(opponent)}><Download size={17} /> Download</button></div>
        <label className="acknowledgement"><input type="checkbox" checked={backupAcknowledged} disabled={!backupDownloaded} onChange={(event) => setBackupAcknowledged(event.target.checked)} /><span>I saved the reveal backup somewhere safe.</span></label>
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <div className="form-actions"><button className="primary-button" type="submit" disabled={busy || !signingAvailable}>{busy ? <><LoaderCircle className="spin" size={18} /> Preparing…</> : <>Create match <ArrowRight size={18} /></>}</button><span className="form-footnote">The answer and salt are not part of the create transaction.</span></div>
      </form>
    </main>
  );
}

function MatchView({
  loaded,
  wallet,
  busy,
  signingAvailable,
  chainNow,
  onRefresh,
  onAction,
}: {
  loaded: CaseRead;
  wallet: ConnectedWallet | null;
  busy: boolean;
  signingAvailable: boolean;
  chainNow: string | null;
  onRefresh: () => void;
  onAction: (action: CaseAction) => void;
}) {
  const { record } = loaded;
  const account = wallet?.account ?? "";
  const isPrimary = account !== "" && account === record.primary;
  const isSecondary = account !== "" && account === record.secondary;
  const [guess, setGuess] = useState("");
  const [backupText, setBackupText] = useState("");
  const [revealReady, setRevealReady] = useState<{ answer: string; salt: string } | null>(null);
  const [localError, setLocalError] = useState("");
  const chainDeadlinePassed = (() => {
    if (chainNow === null) return false;
    try { return BigInt(chainNow) > BigInt(record.domain.deadline); } catch { return false; }
  })();
  const canExpire = record.phase === "EXHAUSTED" || (["GUESS_OPEN", "REVEAL_WAIT", "FROZEN", "UNRESOLVED"].includes(record.phase) && chainDeadlinePassed);

  async function verifyBackup() {
    try {
      const payload = JSON.parse(backupText) as { context?: Record<string, unknown>; answer?: unknown; salt?: unknown };
      const context = payload.context;
      if (!context || typeof payload.answer !== "string" || typeof payload.salt !== "string") throw new Error("Invalid backup");
      if (
        context.chain !== chainIdDecimal() ||
        context.contract !== requireContractAddress() ||
        context.creator !== record.primary ||
        context.opponent !== record.secondary ||
        context.nonce !== record.domain.nonce ||
        context.clue !== record.base.clue ||
        !/^[0-9a-f]{32}$/.test(payload.salt)
      ) throw new Error("Backup context does not match this case.");
       const normalizedAnswer = validateContractText(payload.answer, 256);
       const digest = await computeCommitment({
        creator: record.primary,
        opponent: record.secondary,
        nonce: record.domain.nonce,
        clue: record.base.clue,
         answer: normalizedAnswer,
        salt: payload.salt,
        chain: chainIdDecimal(),
        contract: requireContractAddress(),
      });
      if (digest !== record.base.commitment) throw new Error("Backup does not reproduce the committed answer.");
       setRevealReady({ answer: normalizedAnswer, salt: payload.salt });
      setLocalError("");
    } catch (error) {
      setRevealReady(null);
      setLocalError(error instanceof Error && error.message.includes("Backup") ? error.message : "This backup does not match the current case.");
    }
  }

  function submitGuess(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signingAvailable) { setLocalError("Signing is disabled until the local journal lock and storage health are restored."); return; }
    let normalizedGuess: string;
    try {
      normalizedGuess = validateContractText(guess, 256);
    } catch {
      setLocalError("Enter public text within the contract's UTF-8 limits; only spaces, tabs and newlines are allowed as controls.");
      return;
    }
    onAction({
      method: "submit_guess",
      args: [BigInt(record.id), normalizedGuess, BigInt(record.revision)],
      journalArgs: [record.id, normalizedGuess, record.revision],
    });
  }

  function reveal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signingAvailable) { setLocalError("Signing is disabled until the local journal lock and storage health are restored."); return; }
    if (!revealReady) { setLocalError("Verify the reveal backup first."); return; }
    onAction({
      method: "reveal_answer",
      args: [BigInt(record.id), revealReady.answer, revealReady.salt, BigInt(record.revision)],
      journalArgs: [record.id, revealReady.answer, revealReady.salt, record.revision],
    });
  }

  function simpleAction(method: Exclude<WriteMethod, "create_match">, args: CalldataEncodable[], journalArgs: unknown[]) {
    if (!signingAvailable) { setLocalError("Signing is disabled until the local journal lock and storage health are restored."); return; }
    onAction({ method, args, journalArgs });
  }

  return (
    <main className="match-page">
      <div className="match-heading"><div><span className="eyebrow">Case #{record.id}</span><h1>{record.base.clue}</h1><p>{MATERIAL_NOTE}</p></div><div className="match-heading-actions"><span className={`phase-pill phase-${record.phase.toLowerCase()}`}>{phaseLabel(record.phase)}</span><button className="secondary-button" type="button" onClick={onRefresh}><RefreshCw size={16} /> Refresh</button></div></div>
      <div className="match-meta"><span>Revision {record.revision}</span><span>Deadline {formatDeadline(record.domain.deadline)}</span><span>{isPrimary ? "You are the creator" : isSecondary ? "You are the guesser" : "Read-only view"}</span></div>
      <section className="match-grid">
        <article className="match-panel evidence-panel"><div className="panel-heading"><div><span className="eyebrow">Evidence</span><h2>What the case holds</h2></div><ShieldCheck size={20} /></div><dl className="evidence-list"><div><dt>Reference clue</dt><dd>{record.base.clue}</dd></div><div><dt>Guess</dt><dd>{record.response_locked && typeof record.response.guess === "string" ? record.response.guess : "Waiting for the assigned guesser"}</dd></div>{isRevealed(record) && <div><dt>Revealed answer</dt><dd>{record.domain.answer}</dd></div>}</dl>{record.outcome && <div className={`outcome-card outcome-${record.outcome.toLowerCase()}`}><span className="eyebrow">Recorded outcome</span><strong>{record.outcome.replaceAll("_", " ")}</strong>{typeof record.result.label === "string" && <span>{record.result.label}</span>}</div>}{record.phase === "UNRESOLVED" && <div className="uncertain-note">The first assessment was not conclusive. A bounded retry remains available after the cooldown.</div>}</article>
         <article className="match-panel action-panel"><div className="panel-heading"><div><span className="eyebrow">Next action</span><h2>{record.phase === "DONE" ? "This case is complete" : "Move the case forward"}</h2></div><ChevronDown size={20} /></div>
           {!signingAvailable && record.phase !== "DONE" && <div className="notice notice-error">Signing is disabled until the local journal lock and storage health are restored. Refresh/export/reconcile remain available.</div>}
           {record.phase === "GUESS_OPEN" && isSecondary && <form className="inline-form" onSubmit={submitGuess}><label className="field"><span>Your one guess</span><input value={guess} onChange={(event) => setGuess(event.target.value)} maxLength={256} placeholder="Enter the answer you want recorded" required /></label><button className="primary-button" type="submit" disabled={busy || !signingAvailable}>{busy ? <LoaderCircle className="spin" size={17} /> : <>Submit guess <ArrowRight size={17} /></>}</button></form>}
          {record.phase === "GUESS_OPEN" && !isSecondary && <EmptyAction text="The assigned guesser wallet can submit one response." />}
           {record.phase === "REVEAL_WAIT" && isPrimary && <form className="inline-form" onSubmit={reveal}><label className="field"><span>Reveal backup JSON</span><textarea value={backupText} onChange={(event) => { setBackupText(event.target.value); setRevealReady(null); }} placeholder="Paste the saved reveal backup here" required /></label><div className="form-actions compact"><button className="secondary-button" type="button" onClick={verifyBackup}>Verify backup</button><button className="primary-button" type="submit" disabled={busy || !signingAvailable || !revealReady}>{busy ? <LoaderCircle className="spin" size={17} /> : <>Reveal answer <ArrowRight size={17} /></>}</button></div>{revealReady && <p className="verified-line"><Check size={16} /> Backup matches this case.</p>}</form>}
          {record.phase === "REVEAL_WAIT" && !isPrimary && <EmptyAction text="The creator wallet must reveal the committed answer." />}
            {record.phase === "FROZEN" && <div className="action-stack"><p className="action-explain">The inputs are frozen. Anyone may request the deterministic or consensus-backed assessment.</p><button className="primary-button" type="button" disabled={busy || !signingAvailable} onClick={() => simpleAction("evaluate_match", [BigInt(record.id), BigInt(record.revision)], [record.id, record.revision])}>{busy ? <LoaderCircle className="spin" size={17} /> : <>Evaluate match <ArrowRight size={17} /></>}</button></div>}
            {record.phase === "UNRESOLVED" && <div className="action-stack"><p className="action-explain">Wait at least 60 seconds from the accepted assessment, then retry the same frozen material.</p><button className="primary-button" type="button" disabled={busy || !signingAvailable} onClick={() => simpleAction("retry_match", [BigInt(record.id), BigInt(record.revision)], [record.id, record.revision])}>{busy ? <LoaderCircle className="spin" size={17} /> : <>Retry assessment <ArrowRight size={17} /></>}</button></div>}
            {["GUESS_OPEN", "REVEAL_WAIT", "FROZEN", "UNRESOLVED", "EXHAUSTED"].includes(record.phase) && <div className="expire-row"><button className="secondary-button" type="button" disabled={busy || !canExpire || !signingAvailable} onClick={() => simpleAction("expire_match", [BigInt(record.id), BigInt(record.revision)], [record.id, record.revision])}>Expire after deadline</button><span>{record.phase === "EXHAUSTED" ? "An exhausted case can be voided without waiting." : canExpire ? "Refreshed chain time is past the recorded deadline." : "Refresh to obtain current chain-time evidence before enabling expiry."}</span></div>}
          {record.phase === "DONE" && <div className="complete-state"><Check size={22} /><p>No further write is available for this case. Its accepted history remains readable.</p></div>}
          {localError && <p className="form-error" role="alert">{localError}</p>}
        </article>
      </section>
      <div className="match-footer-note"><ShieldCheck size={17} /> The chain is authoritative for phase, deadline, finality, and historical readback.</div>
    </main>
  );
}

function EmptyAction({ text }: { text: string }) {
  return <div className="empty-action"><WalletCards size={22} /><p>{text}</p></div>;
}

function JournalPanel({ records, unknown, error, signingAvailable, busyReservation, onRefresh, onReconcile }: { records: JournalRecord[]; unknown: UnknownJournalRecord[]; error: string; signingAvailable: boolean; busyReservation: string | null; onRefresh: () => void; onReconcile: (record: JournalRecord) => void }) {
  const [copied, setCopied] = useState(false);
  function exportJournal() {
    const blob = new Blob([JSON.stringify({ version: 1, records, unknown }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "committed-match-journal.json";
    link.click();
    URL.revokeObjectURL(url);
  }
  async function copySummary() {
    await navigator.clipboard?.writeText(records.map((record) => `${operationLabel(record.method)} — ${journalStatusLabel(record)}`).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  const hasJournalData = records.length > 0 || unknown.length > 0;
  return (
    <section className="journal-section" id="journal">
      <div className="journal-heading">
        <div><span className="eyebrow">Operation journal</span><h2>Keep every attempt traceable.</h2><p>Pending entries remain visible until the same transaction is reconciled.</p></div>
        <div className="journal-actions">
          <button className="secondary-button" type="button" onClick={onRefresh}><RefreshCw size={16} /> Refresh</button>
          <button className="secondary-button" type="button" onClick={exportJournal} disabled={!hasJournalData}><Download size={16} /> Export</button>
          <button className="icon-button" type="button" aria-label="Copy journal summary" onClick={copySummary} disabled={records.length === 0}>{copied ? <Check size={17} /> : <Copy size={17} />}</button>
        </div>
      </div>
      {!signingAvailable && <div className="notice notice-error">Signing is disabled because the durable journal lock or storage health check is unavailable. Journal reading, export and same-hash reconciliation remain available.</div>}
      {unknown.length > 0 && <div className="notice notice-error">Unreadable journal entries are preserved below and included in the raw export. Signing stays disabled until they are recovered or quarantined.</div>}
      {error && <div className="notice notice-error">{error}</div>}
      {!hasJournalData ? <div className="journal-empty"><WalletCards size={26} /><p>No attempts in this browser yet.</p><span>Start a match to create the first durable operation record.</span></div> : <div className="journal-list">
        {[...records].reverse().map((record) => <div className="journal-row" key={record.reservation}>
          <div className="journal-row-icon"><ShieldCheck size={18} /></div>
          <div className="journal-row-copy"><strong>{operationLabel(record.method)}</strong><span>{record.intent.startsWith("create:") ? "New public case" : "Case operation"}</span></div>
          <span className={`journal-status journal-${record.status.toLowerCase()}`}>{journalStatusLabel(record)}</span>
          {["SIGNING", "SUBMITTED", "RECONCILE"].includes(record.status) && <button className="icon-button" type="button" aria-label={`Reconcile ${operationLabel(record.method)}`} onClick={() => onReconcile(record)} disabled={busyReservation !== null}>{busyReservation === record.reservation ? <LoaderCircle className="spin" size={17} /> : <RefreshCw size={17} />}</button>}
        </div>)}
        {unknown.map((entry) => <div className="journal-row" key={entry.key}>
          <div className="journal-row-icon"><X size={18} /></div>
          <div className="journal-row-copy"><strong>Unreadable journal entry</strong><span>{entry.key}</span></div>
          <span className="journal-status journal-reconcile">Raw entry preserved</span>
        </div>)}
      </div>}
    </section>
  );
}

export default function App() {
  const registry = useMemo(() => (typeof window === "undefined" ? null : new WalletRegistry(browserDiscoveryHost())), []);
  const journal = useMemo<DurableJournal>(() => createBrowserJournal(), []);
  const [wallets, setWallets] = useState<WalletCandidate[]>(() => registry?.getWallets() ?? []);
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busyWallet, setBusyWallet] = useState<WalletId | null>(null);
  const [pickerError, setPickerError] = useState("");
  const [view, setView] = useState<View>("home");
  const [caseInput, setCaseInput] = useState("");
  const [loaded, setLoaded] = useState<CaseRead | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [journalRecords, setJournalRecords] = useState<JournalRecord[]>([]);
  const [journalUnknown, setJournalUnknown] = useState<UnknownJournalRecord[]>([]);
  const [journalError, setJournalError] = useState("");
  const [journalReady, setJournalReady] = useState(false);
  const [writeBusy, setWriteBusy] = useState(false);
  const [reconcileBusy, setReconcileBusy] = useState<string | null>(null);
  const [chainNow, setChainNow] = useState<string | null>(null);
  const [transactionProgress, setTransactionProgress] = useState<WriteProgress>(INITIAL_WRITE_PROGRESS);
  const [transactionReservation, setTransactionReservation] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const contractAddress = useMemo(() => {
    try { return requireContractAddress(); } catch { return null; }
  }, []);
  const signingAvailable = journalReady && journal.signingAvailable && journalUnknown.length === 0;

  useEffect(() => registry?.subscribe(() => setWallets(registry.getWallets())), [registry]);

  useEffect(() => () => wallet?.cleanup(), [wallet]);

  async function refreshJournal() {
    try {
      const snapshot = await journal.snapshot();
      setJournalRecords(snapshot.records);
      setJournalUnknown(snapshot.unknown);
      setJournalReady(true);
      setJournalError("");
    } catch (error) {
      setJournalReady(false);
      setJournalError(friendlyError(error));
    }
  }

  useEffect(() => { void refreshJournal(); }, [journal]);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    if (pickerOpen) page.setAttribute("inert", "");
    else page.removeAttribute("inert");
  }, [pickerOpen]);

  async function openCase(value: string) {
    setCaseInput(value);
    setNotice(null);
    setChainNow(null);
    try {
      setLoaded(await readCase(value));
      setView("match");
    } catch (error) {
      setNotice({ tone: "error", text: friendlyError(error) });
    }
  }

  async function refreshCase(value: string) {
    setCaseInput(value);
    setNotice(null);
    setChainNow(null);
    try {
      const next = await readCase(value);
      setLoaded(next);
      setView("match");
      if (["GUESS_OPEN", "REVEAL_WAIT", "FROZEN", "UNRESOLVED"].includes(next.record.phase)) {
        try { setChainNow(await readChainTime()); } catch { setChainNow(null); }
      }
    } catch (error) {
      setNotice({ tone: "error", text: friendlyError(error) });
    }
  }

  async function chooseWallet(candidate: WalletCandidate) {
    setBusyWallet(candidate.id);
    setPickerError("");
    try {
      const connected = await connectWallet(candidate, { reload: () => window.location.reload() });
      setWallet(connected);
      setPickerOpen(false);
      setNotice({ tone: "success", text: `${walletLabel(candidate.id)} is ready for this session.` });
    } catch (error) {
      setPickerError(friendlyError(error));
    } finally {
      setBusyWallet(null);
    }
  }

  function openWalletPicker() {
    setPickerError("");
    setPickerOpen(true);
  }

  function closeWalletPicker() {
    if (busyWallet !== null) return;
    setPickerError("");
    setPickerOpen(false);
  }

  async function createMatch(draft: CreateDraft) {
    if (!wallet || !contractAddress) {
      setNotice({ tone: "error", text: "Connect the creator wallet and configure the contract before creating." });
      return;
    }
    if (!signingAvailable) {
      setNotice({ tone: "error", text: "Signing is disabled until the local journal lock and storage health are restored." });
      return;
    }
    setWriteBusy(true);
    setTransactionProgress({ phase: "IDLE" });
    setTransactionReservation(null);
    setNotice({ tone: "info", text: "The match is being submitted. Approve only the wallet request you initiated." });
    try {
      const adapter = makeWriteAdapter(wallet);
      const argsJson = journalJson(draft.journalArgs);
      const intent = `create:${wallet.account}:${draft.nonce}`;
      const argsHash = await sha256Hex(argsJson);
      const created = { value: null as CaseRead | null };
      let returnedCaseId: string | null = null;
      const outcome = await executeWrite({
        journal: {
          chain: chainIdDecimal(),
          contract: contractAddress,
          account: wallet.account,
          method: "create_match",
          intent,
          argsJson,
          preRevision: "0",
          preHash: ZERO_HASH,
          preStateJson: "",
        },
        submit: () => adapter.submit("create_match", draft.args),
        pollFinalized: async (hash, attempt) => {
          const receipt = await adapter.pollFinalized(hash, attempt);
          if (receipt?.returnedCaseId) returnedCaseId = receipt.returnedCaseId;
          return receipt;
        },
        verifyPost: async () => {
          invalidateReadRequests();
          const id = returnedCaseId ?? await readIdByNonce(wallet.account, draft.nonce);
          if (id === "0") return false;
          const raw = await readVersion(id, "1");
          const record = raw ? parseRecord(raw) : null;
          const valid = Boolean(record && matchesCreatePostcondition({
            record,
            id,
            account: wallet.account,
            opponent: draft.opponent,
            clue: draft.clue,
            nonce: draft.nonce,
            commitment: draft.commitment,
            argsHash,
          }));
          if (valid && raw && record) created.value = { raw, record };
          return valid;
        },
        verifyFinalizedError: async () => {
          invalidateReadRequests();
          const id = returnedCaseId ?? await readIdByNonce(wallet.account, draft.nonce);
          if (id === "0") return resolutionEvidence("UNCHANGED", { nonce: draft.nonce });
          const raw = await readVersion(id, "1");
          const record = raw ? parseRecord(raw) : null;
          if (!raw || !record) return resolutionEvidence("UNKNOWN", { case_id: id, reason: "missing_or_invalid_create_record" });
          const valid = matchesCreatePostcondition({
            record,
            id,
            account: wallet.account,
            opponent: draft.opponent,
            clue: draft.clue,
            nonce: draft.nonce,
            commitment: draft.commitment,
            argsHash,
          });
          return valid
            ? resolutionEvidence("PRESENT", { case_id: id, observed_revision: record.revision, observed_operation: record.last_operation })
            : resolutionEvidence("COMPETING", { case_id: id, observed_revision: record.revision, observed_operation: record.last_operation });
        },
        verifyPre: async () => {
          invalidateReadRequests();
          return (await readIdByNonce(wallet.account, draft.nonce)) === "0";
        },
        progress: setTransactionProgress,
      }, { journal });
      invalidateReadRequests();
      await refreshJournal();
      setTransactionReservation(outcome.journal?.reservation ?? null);
      if (outcome.status === "VERIFIED" && created.value) {
        setLoaded(created.value);
        setCaseInput(created.value.record.id);
        setView("match");
        setNotice({ tone: "success", text: `Match #${created.value.record.id} is verified on-chain.` });
      } else if (outcome.status === "CANCELLED") {
        setNotice({ tone: "info", text: "Wallet approval was cancelled. No transaction was sent." });
      } else if (outcome.status === "FINALIZED_ERROR" && outcome.journal) {
        setNotice({ tone: "error", text: finalizedErrorMessage(outcome.journal) });
      } else {
        setNotice({ tone: "error", text: "The attempt needs reconciliation. It remains in the journal; no second transaction was sent." });
      }
    } catch (error) {
      setTransactionProgress((current) => current.phase === "IDLE" ? { phase: "FAILED", message: friendlyError(error) } : current);
      setNotice({ tone: "error", text: friendlyError(error) });
    } finally {
      setWriteBusy(false);
    }
  }

  async function runCaseAction(action: CaseAction) {
    if (!wallet || !loaded || !contractAddress) {
      setNotice({ tone: "error", text: "Connect the wallet that should sign this action and configure the contract." });
      return;
    }
    if (!signingAvailable) {
      setNotice({ tone: "error", text: "Signing is disabled until the local journal lock and storage health are restored." });
      return;
    }
    setWriteBusy(true);
    setTransactionProgress({ phase: "IDLE" });
    setTransactionReservation(null);
    setNotice({ tone: "info", text: "Preparing the selected case action. Approve only the wallet request you initiated." });
    try {
      const adapter = makeWriteAdapter(wallet);
      const preRevision = loaded.record.revision;
      const postRevision = nextRevision(preRevision);
      const argsJson = journalJson(action.journalArgs);
      const argsHash = await sha256Hex(argsJson);
      const preHash = await sha256Hex(loaded.raw);
      let verified: CaseRead | null = null;
      const outcome = await executeWrite({
        journal: {
          chain: chainIdDecimal(),
          contract: contractAddress,
          account: wallet.account,
          method: action.method,
          intent: `${action.method}:${loaded.record.id}:${preRevision}`,
          argsJson,
          preRevision,
          preHash,
          preStateJson: loaded.raw,
        },
        submit: () => adapter.submit(action.method, action.args),
        pollFinalized: adapter.pollFinalized,
        verifyPost: async () => {
          invalidateReadRequests();
          const raw = await readVersion(loaded.record.id, postRevision);
          const record = raw ? parseRecord(raw) : null;
          const valid = Boolean(record && matchesActionPostcondition({
            before: loaded.record,
            after: record,
            method: action.method,
            caller: wallet.account,
            argsHash,
            args: action.journalArgs,
          }));
          if (valid && raw && record) verified = { raw, record };
          return valid;
        },
        verifyFinalizedError: async () => {
          invalidateReadRequests();
          const raw = await readVersion(loaded.record.id, postRevision);
          if (!raw) return resolutionEvidence("UNCHANGED", { case_id: loaded.record.id, preserved_revision: preRevision });
          const record = parseRecord(raw);
          if (!record) return resolutionEvidence("UNKNOWN", { case_id: loaded.record.id, reason: "invalid_competing_state" });
          const valid = matchesActionPostcondition({
            before: loaded.record,
            after: record,
            method: action.method,
            caller: wallet.account,
            argsHash,
            args: action.journalArgs,
          });
          return valid
            ? resolutionEvidence("PRESENT", { case_id: loaded.record.id, observed_revision: record.revision, observed_operation: record.last_operation })
            : resolutionEvidence("COMPETING", { case_id: loaded.record.id, observed_revision: record.revision, observed_operation: record.last_operation });
        },
        verifyPre: async () => {
          invalidateReadRequests();
          const raw = await readVersion(loaded.record.id, preRevision);
          return raw !== null && await sha256Hex(raw) === preHash;
        },
        progress: setTransactionProgress,
      }, { journal });
      invalidateReadRequests();
      await refreshJournal();
      setTransactionReservation(outcome.journal?.reservation ?? null);
      if (outcome.status === "VERIFIED" && verified) {
        setLoaded(verified);
        setNotice({ tone: "success", text: `${operationLabel(action.method)} is verified on-chain.` });
      } else if (outcome.status === "CANCELLED") {
        setNotice({ tone: "info", text: "Wallet approval was cancelled. No transaction was sent." });
      } else if (outcome.status === "FINALIZED_ERROR" && outcome.journal) {
        setNotice({ tone: "error", text: finalizedErrorMessage(outcome.journal) });
      } else {
        setNotice({ tone: "error", text: "The attempt needs reconciliation. It remains in the journal; no second transaction was sent." });
      }
    } catch (error) {
      setTransactionProgress((current) => current.phase === "IDLE" ? { phase: "FAILED", message: friendlyError(error) } : current);
      setNotice({ tone: "error", text: friendlyError(error) });
    } finally {
      setWriteBusy(false);
    }
  }

  async function reconcileJournalRecord(record: JournalRecord) {
    if (reconcileBusy !== null) return;
    if (!contractAddress || record.chain !== chainIdDecimal() || record.contract !== contractAddress) {
      setNotice({ tone: "error", text: "This journal entry belongs to a different chain or contract and is read-only in this build." });
      return;
    }
    const intent = parseJournalIntent(record);
    if (!intent) {
      setNotice({ tone: "error", text: "This journal entry has an invalid immutable operation context." });
      return;
    }
    const resolvedIntent = intent;
    let args: unknown[];
    try {
      const parsed = JSON.parse(record.args_json) as unknown;
      if (!Array.isArray(parsed)) throw new Error("not an array");
      args = parsed;
    } catch {
      setNotice({ tone: "error", text: "This journal entry has invalid immutable arguments and cannot be reconciled." });
      return;
    }
    const argsHash = await sha256Hex(record.args_json);

    setReconcileBusy(record.reservation);
    setTransactionReservation(record.reservation);
    setTransactionProgress({
      phase: "RECONCILIATION_REQUIRED",
      ...(record.tx_hash !== "" ? { hash: record.tx_hash } : {}),
      message: record.tx_hash === "" ? "No transaction hash is available; no replacement will be sent." : "The existing transaction will be checked once. No replacement will be sent.",
    });
    setNotice({ tone: "info", text: record.tx_hash === "" ? "Checking the matching on-chain state once. No transaction hash is available, so no replacement will be sent." : "Checking the same transaction hash once. No replacement or second transaction will be sent." });
    let returnedCaseId: string | null = null;
    let verified: CaseRead | null = null;
    let before: CaseRecord | null = null;
    let beforeResolved = false;

    async function resolveBefore(): Promise<CaseRecord | null> {
      if (resolvedIntent.kind === "create") return null;
      if (beforeResolved) return before;
      beforeResolved = true;
      try {
        if (record.pre_state_json !== "") {
          const candidate = parseRecord(record.pre_state_json);
          if (candidate && candidate.id === resolvedIntent.caseId && candidate.revision === resolvedIntent.preRevision && await sha256Hex(record.pre_state_json) === record.pre_hash) {
            before = candidate;
            return before;
          }
        }
        invalidateReadRequests();
        const raw = await readVersion(resolvedIntent.caseId, resolvedIntent.preRevision, record.contract);
        if (!raw || await sha256Hex(raw) !== record.pre_hash) return null;
        const candidate = parseRecord(raw);
        if (!candidate || candidate.id !== resolvedIntent.caseId || candidate.revision !== resolvedIntent.preRevision) return null;
        before = candidate;
        return before;
      } catch {
        return null;
      }
    }

    function createArgs(): { nonce: string; opponent: string; clue: string; commitment: string } | null {
      if (resolvedIntent.kind !== "create" || args.length !== 4 || !args.every((value) => typeof value === "string")) return null;
      const [nonce, opponent, clue, commitment] = args as string[];
      return nonce === resolvedIntent.nonce ? { nonce, opponent, clue, commitment } : null;
    }

    async function lookupCreate(): Promise<ResolutionEvidence> {
      const create = createArgs();
      if (!create) return resolutionEvidence("UNKNOWN", { reason: "invalid_create_arguments" });
      invalidateReadRequests();
      const id = await readIdByNonce(record.account, create.nonce, record.contract);
      if (id === "0") return resolutionEvidence("ABSENT", { nonce: create.nonce });
      const raw = await readVersion(id, "1", record.contract);
      const next = raw ? parseRecord(raw) : null;
      if (!raw || !next) return resolutionEvidence("UNKNOWN", { case_id: id, reason: "missing_or_invalid_create_record" });
      const valid = matchesCreatePostcondition({
        record: next,
        id,
        account: record.account,
        opponent: create.opponent,
        clue: create.clue,
        nonce: create.nonce,
        commitment: create.commitment,
        argsHash,
      });
      if (valid) {
        verified = { raw, record: next };
        return resolutionEvidence("PRESENT", { case_id: id, observed_revision: next.revision, observed_operation: next.last_operation });
      }
      return resolutionEvidence("COMPETING", { case_id: id, observed_revision: next.revision, observed_operation: next.last_operation });
    }

    async function lookupAction(): Promise<ResolutionEvidence> {
      if (resolvedIntent.kind !== "action") return resolutionEvidence("UNKNOWN", { reason: "invalid_action_context" });
      const pre = await resolveBefore();
      if (!pre) return resolutionEvidence("UNKNOWN", { reason: "pre_state_unavailable" });
      invalidateReadRequests();
      const raw = await readVersion(resolvedIntent.caseId, nextRevision(resolvedIntent.preRevision), record.contract);
      if (!raw) return resolutionEvidence("ABSENT", { case_id: resolvedIntent.caseId, expected_revision: nextRevision(resolvedIntent.preRevision) });
      const next = parseRecord(raw);
      if (!next) return resolutionEvidence("UNKNOWN", { case_id: resolvedIntent.caseId, reason: "invalid_post_state" });
      const valid = matchesJournalActionPostcondition({
        before: pre,
        record: next,
        method: resolvedIntent.method,
        caller: record.account,
        argsHash,
        args,
        preRevision: resolvedIntent.preRevision,
      });
      if (valid) {
        verified = { raw, record: next };
        return resolutionEvidence("PRESENT", { case_id: resolvedIntent.caseId, observed_revision: next.revision, observed_operation: next.last_operation });
      }
      return resolutionEvidence("COMPETING", { case_id: resolvedIntent.caseId, observed_revision: next.revision, observed_operation: next.last_operation });
    }

    async function finalizedErrorEvidence(): Promise<ResolutionEvidence | null> {
      if (resolvedIntent.kind === "create") return lookupCreate();
      const pre = await resolveBefore();
      if (!pre) return null;
      invalidateReadRequests();
      const raw = await readVersion(resolvedIntent.caseId, nextRevision(resolvedIntent.preRevision), record.contract);
      if (!raw) return resolutionEvidence("UNCHANGED", { case_id: resolvedIntent.caseId, preserved_revision: pre.revision });
      const next = parseRecord(raw);
      if (!next) return resolutionEvidence("UNKNOWN", { case_id: resolvedIntent.caseId, reason: "invalid_competing_state" });
      const valid = matchesJournalActionPostcondition({
        before: pre,
        record: next,
        method: resolvedIntent.method,
        caller: record.account,
        argsHash,
        args,
        preRevision: resolvedIntent.preRevision,
      });
      if (valid) return resolutionEvidence("PRESENT", { case_id: resolvedIntent.caseId, observed_revision: next.revision, observed_operation: next.last_operation });
      return resolutionEvidence("COMPETING", { case_id: resolvedIntent.caseId, observed_revision: next.revision, observed_operation: next.last_operation });
    }

    try {
      const outcome = await reconcileWrite({
        journal: record,
        pollFinalized: async (hash, attempt) => {
          const receipt = await pollFinalized(hash, attempt);
          if (receipt?.returnedCaseId) returnedCaseId = receipt.returnedCaseId;
          return receipt;
        },
        verifyPost: async () => {
          invalidateReadRequests();
          if (resolvedIntent.kind === "create") {
            const create = createArgs();
            const id = returnedCaseId ?? (create ? await readIdByNonce(record.account, create.nonce, record.contract) : "0");
            if (!create || id === "0") return false;
            const raw = await readVersion(id, "1", record.contract);
            const next = raw ? parseRecord(raw) : null;
            if (!next) return false;
            const valid = matchesCreatePostcondition({
              record: next,
              id,
              account: record.account,
              opponent: create.opponent,
              clue: create.clue,
              nonce: create.nonce,
              commitment: create.commitment,
              argsHash,
            });
            if (valid && raw) verified = { raw, record: next };
            return valid;
          }
          const pre = await resolveBefore();
          if (!pre) return false;
          const raw = await readVersion(resolvedIntent.caseId, nextRevision(resolvedIntent.preRevision), record.contract);
          const next = raw ? parseRecord(raw) : null;
          if (!next) return false;
          const valid = matchesJournalActionPostcondition({
            before: pre,
            record: next,
            method: resolvedIntent.method,
            caller: record.account,
            argsHash,
            args,
            preRevision: resolvedIntent.preRevision,
          });
          if (valid && raw) verified = { raw, record: next };
          return valid;
        },
        verifyFinalizedError: finalizedErrorEvidence,
        lookupNoHash: resolvedIntent.kind === "create" ? lookupCreate : lookupAction,
        verifyPre: async () => {
          invalidateReadRequests();
          if (resolvedIntent.kind === "create") return (await readIdByNonce(record.account, resolvedIntent.nonce, record.contract)) === "0";
          return (await resolveBefore()) !== null;
        },
        progress: setTransactionProgress,
      }, { journal });
      invalidateReadRequests();
      await refreshJournal();
      const verifiedRead = verified;
      const resolvedVerified = verified as CaseRead | null;
      const outcomeJournal = outcome.journal;
      if (outcome.status === "VERIFIED" && verifiedRead !== null) {
        setLoaded(verifiedRead);
        setCaseInput((verifiedRead as CaseRead).record.id);
        setView("match");
        setNotice({ tone: "success", text: `${operationLabel(record.method)} is verified from the retained transaction hash.` });
      } else if (outcome.status === "FINALIZED_ERROR" && outcomeJournal) {
        setNotice({ tone: "error", text: finalizedErrorMessage(outcomeJournal, true) });
      } else if (outcomeJournal && resolutionClass(outcomeJournal) === "PRESENT" && resolvedVerified !== null) {
        setLoaded(resolvedVerified);
        setCaseInput(resolvedVerified.record.id);
        setView("match");
        setNotice({ tone: "info", text: "The matching on-chain state is present, but this journal entry has no transaction hash. It remains preserved for audit." });
      } else if (outcomeJournal && resolutionClass(outcomeJournal) === "ABSENT") {
        setNotice({ tone: "info", text: "No matching on-chain state was found for this hashless reservation. It remains preserved; no transaction was sent." });
      } else {
        setNotice({ tone: "info", text: "The retained operation is still not conclusively verified. It remains in the journal; no second transaction was sent." });
      }
    } catch (error) {
      setTransactionProgress((current) => current.phase === "IDLE" ? { phase: "FAILED", message: friendlyError(error) } : current);
      setNotice({ tone: "error", text: friendlyError(error) });
    } finally {
      setReconcileBusy(null);
    }
  }

  function showJournal() {
    setView("home");
    setTimeout(() => document.getElementById("journal")?.scrollIntoView({ behavior: "smooth" }), 0);
  }

  const progressRecord = transactionReservation === null
    ? null
    : journalRecords.find((record) => record.reservation === transactionReservation) ?? null;

  return (
    <div className="app-shell">
      <div ref={pageRef} className="app-page" aria-hidden={pickerOpen ? "true" : undefined}>
        <Header wallet={wallet} onConnect={openWalletPicker} onHome={() => setView("home")} onNew={() => setView("new")} onJournal={showJournal} />
        <div className="content-shell">
          <NoticeBanner notice={notice} onDismiss={() => setNotice(null)} />
          <TransactionProgress
            progress={transactionProgress}
            explorerUrl={transactionProgress.hash ? explorerTransactionUrl(transactionProgress.hash) : undefined}
            onReconcile={progressRecord && reconcileBusy === null ? () => void reconcileJournalRecord(progressRecord) : undefined}
          />
          {view === "home" && <HomeView onNew={() => setView("new")} onOpen={openCase} />}
          {view === "new" && <NewMatchView wallet={wallet} contractAddress={contractAddress} busy={writeBusy} signingAvailable={signingAvailable} onCreate={createMatch} />}
          {view === "match" && loaded && <MatchView loaded={loaded} wallet={wallet} busy={writeBusy || reconcileBusy !== null} signingAvailable={signingAvailable} chainNow={chainNow} onRefresh={() => void refreshCase(loaded.record.id)} onAction={runCaseAction} />}
          {view === "match" && !loaded && <HomeView onNew={() => setView("new")} onOpen={openCase} />}
          <JournalPanel records={journalRecords} unknown={journalUnknown} error={journalError} signingAvailable={signingAvailable} busyReservation={reconcileBusy} onRefresh={() => void refreshJournal()} onReconcile={(record) => void reconcileJournalRecord(record)} />
        </div>
        <footer className="site-footer"><span>Committed Answer Match</span><span>Studionet functional build</span><a href="https://docs.genlayer.com" target="_blank" rel="noreferrer">GenLayer docs <ExternalLink size={14} /></a></footer>
      </div>
      <WalletPicker open={pickerOpen} wallets={wallets} busyId={busyWallet} error={pickerError} onSelect={chooseWallet} onClose={closeWalletPicker} />
    </div>
  );
}
