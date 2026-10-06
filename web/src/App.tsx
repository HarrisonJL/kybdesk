import { useCallback, useEffect, useState } from "react";
import { AccountPanel, Pill, Section, TxPanel } from "./components/ui";
import { addressLink, errorText, onThrottle, short, type Signer } from "./lib/genlayer";
import { duration, fmtDay, fmtTime } from "./lib/format";
import {
  DESK, GATE, MAX_AGE_SECONDS, MAX_BATCH, boundAttestations, boundEntity, boundProbe, countBefore, isCompanyNumber,
  cachedDesk, loadDesk, normalizeCompanyNumber, type Company, type DeskData,
} from "./lib/kyb";
import { useTransaction } from "./lib/useTransaction";

const VERDICT_TONE: Record<string, "ok" | "warn" | "bad" | "none"> = {
  GOOD_STANDING: "ok", AT_RISK: "warn", NOT_IN_GOOD_STANDING: "bad", UNVERIFIED: "none",
};
const REASON_TEXT: Record<string, string> = {
  APPROVED: "Approved: a fresh, unexpired GOOD_STANDING attestation.",
  NO_ATTESTATION: "Never checked, so there is nothing to approve. Run a check.",
  VERDICT_NOT_IN_GOOD_STANDING: "The latest check found the company not in good standing.",
  VERDICT_AT_RISK: "The latest check flagged risk: an adverse filing or a pending strike-off application.",
  VERDICT_UNVERIFIED: "The register couldn't be read or tied to this company, so no claim is made.",
  REVOKED: "A probe found the register changed since the check. Run a check to restore approval.",
  EXPIRED: "The approval ran out: 30 days, or the day a filing deadline falls.",
  STALE: "Older than the gate's freshness limit.",
};
const tone = (reason: string) => reason === "APPROVED" ? "ok" : reason === "EXPIRED" || reason === "STALE" ? "warn" : reason === "NO_ATTESTATION" ? "none" : "bad";

/** The chain's answer, aged: an approval visibly runs out while the page is open. */
function liveReason(c: Company): string {
  const ap = c.approval;
  if (ap.reason !== "APPROVED") return ap.reason;
  if (Date.now() >= new Date(ap.valid_until).getTime()) return "EXPIRED";
  return "APPROVED";
}

function CompanyCard({ c, signer, busy, onCheck, onProbe }: {
  c: Company; signer: Signer | null; busy: boolean; onCheck: (n: string) => void; onProbe: (n: string) => void;
}) {
  const latest = c.history[0];
  const f = latest?.facts;
  const reason = liveReason(c);
  const canProbe = !!latest && latest.verdict === "GOOD_STANDING" && c.approval.reason !== "REVOKED";
  let bar = null;
  if (latest?.verdict === "GOOD_STANDING") {
    const a = new Date(latest.attested_at).getTime(), u = new Date(latest.valid_until).getTime(), now = Date.now();
    const pct = Math.min(100, Math.max(0, ((now - a) / (u - a)) * 100));
    bar = (
      <>
        <div className={`bar ${reason === "APPROVED" ? "" : "dead"}`} role="img" aria-label={`${pct.toFixed(0)}% of the approval elapsed`}><i style={{ width: `${pct}%` }} /></div>
        <div className="barlab"><span>checked {fmtTime(latest.attested_at)}</span>
          <span><b>{u > now ? `expires in ${duration(u - now)}` : `expired ${duration(now - u)} ago`}</b> · {fmtTime(latest.valid_until)}</span></div>
      </>
    );
  }
  const vendor = c.company_number;
  return (
    <article className="card">
      <div className="row">
        <div>
          <div className="name">{f?.company_name || c.label}</div>
          <div className="num">{vendor} · {c.attestation_count} check{c.attestation_count === 1 ? "" : "s"}{c.lei ? ` · LEI ${c.lei}` : ""}</div>
        </div>
        <Pill tone={tone(reason)}>{reason.replaceAll("_", " ")}</Pill>
      </div>
      <p className="why">{REASON_TEXT[reason] ?? reason}</p>
      {bar}
      {f && (
        <div className="facts">
          <div><span>Register status</span>{f.status_text || "unreadable"}</div>
          <div><span>Accounts due</span>{fmtDay(f.accounts_due)}{f.accounts_overdue ? " · overdue" : ""}</div>
          <div><span>Confirmation statement due</span>{fmtDay(f.confirmation_due)}{f.confirmation_overdue ? " · overdue" : ""}</div>
          <div><span>Officers vs previous check</span>{latest.officers_changed}</div>
          {latest.reasons.length > 0 && <div><span>Reasons</span>{latest.reasons.join(", ")}</div>}
        </div>
      )}
      {c.history.length > 0 && (
        <div className="chain">
          {c.history.map((h: any) => (
            <div key={h.attestation_id}>
              <i className="dot" style={{ background: `var(--${VERDICT_TONE[h.verdict] ?? "none"})` }} />
              <b>#{h.attestation_id}</b> {h.verdict.replaceAll("_", " ").toLowerCase()}
              <span className="when">{fmtTime(h.attested_at)}{h.previous_id === null ? " · first" : ` · after #${h.previous_id}`}</span>
            </div>
          ))}
        </div>
      )}
      <div className="actions">
        <button disabled={!signer || busy} onClick={() => onCheck(c.company_number)} title={signer ? "" : "Sign in first"}>Check now</button>
        <button className="secondary" disabled={!signer || busy || !canProbe} onClick={() => onProbe(c.company_number)}
                title={canProbe ? "One page, no LLM: revokes the approval if the register changed" : "A probe needs a live, unrevoked approval"}>
          Probe (tripwire)
        </button>
      </div>
    </article>
  );
}

function AttestationResult({ a }: { a: any }) {
  return (
    <div className="result">
      <div><b>{a.company_name || a.company_number}</b> <Pill tone={VERDICT_TONE[a.verdict] ?? "none"}>{a.verdict.replaceAll("_", " ")}</Pill></div>
      <div className="sm">
        attestation #{a.attestation_id}{a.previous_id !== null ? ` after #${a.previous_id}` : " (first)"} · valid until {fmtTime(a.valid_until)}
        {a.reasons.length > 0 && ` · ${a.reasons.join(", ")}`}
      </div>
    </div>
  );
}

export default function App() {
  const [signer, setSigner] = useState<Signer | null>(null);
  const [data, setData] = useState<DeskData | null>(() => cachedDesk());
  const [stale, setStale] = useState(() => cachedDesk() !== null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [waitSec, setWaitSec] = useState(0);
  useEffect(() => onThrottle(setWaitSec), []);
  const tx = useTransaction();
  const busy = tx.state.stage === "submitting" || tx.state.stage === "waiting";

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await loadDesk()); setStale(false); } catch (e: any) { setError(errorText(e)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 30000); return () => clearInterval(t); }, []);

  async function check(numbers: string[]) {
    if (!signer) return;
    const single = numbers.length === 1;
    const label = single ? `Check ${numbers[0]}` : `Check ${numbers.length} companies in one transaction`;
    let before: number;
    try { before = (await countBefore()).attestation_count; } catch (e) { return tx.fail(label, e); }
    const ok = await tx.run(signer, DESK, single ? "attest" : "attest_batch", single ? [numbers[0]] : [numbers],
      single ? `Check ${numbers[0]}` : `Check ${numbers.length} companies in one transaction`,
      "that company number isn't registered.", () => boundAttestations(before, signer, numbers));
    if (ok) void refresh();
  }
  async function probe(number: string) {
    if (!signer) return;
    let before: number;
    try { before = (await countBefore()).probe_count; } catch (e) { return tx.fail(`Probe ${number}`, e); }
    const ok = await tx.run(signer, DESK, "probe", [number], `Probe ${number}`,
      "a probe needs a registered company with a live, unrevoked approval.", () => boundProbe(before, signer, number));
    if (ok) void refresh();
  }

  const [cn, setCn] = useState("");
  const [lei, setLei] = useState("");
  const [label, setLabel] = useState("");
  async function register() {
    if (!signer) return;
    const number = normalizeCompanyNumber(cn);
    const ok = await tx.run(signer, DESK, "register_entity", [number, lei.trim(), label.trim()], `Register ${number}`,
      "that company number is already registered, or an input is invalid.", () => boundEntity(signer, number));
    if (ok) { setCn(""); setLei(""); setLabel(""); void refresh(); }
  }
  const number = normalizeCompanyNumber(cn);
  const registerOk = isCompanyNumber(number) && label.trim().length >= 1 && label.length <= 100;

  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (n: string) => setPicked((p) => p.includes(n) ? p.filter((x) => x !== n) : p.length < MAX_BATCH ? [...p, n] : p);

  const approved = data?.companies.filter((c) => liveReason(c) === "APPROVED").length ?? 0;

  return (
    <main>
      <div className="top">
        <div>
          <h1>KYB Desk</h1>
          <p className="sub">Supplier approvals for UK companies that expire, react to the public Companies House register, and gate payments. Every check is read independently by a committee of validators.</p>
        </div>
        <div className="meta">GenLayer Studio Next (chain 61997)<br />
          KYBDesk <a className="mono" href={addressLink(DESK)} target="_blank" rel="noreferrer">{short(DESK)}</a> · OnboardingGate{" "}
          <a className="mono" href={addressLink(GATE)} target="_blank" rel="noreferrer">{short(GATE)}</a><br />
          {data
            ? stale
              ? `Showing the last read, from ${data.loadedAt.toLocaleString()}${loading ? " · reading the chain now…" : ""}`
              : `Read live from the chain at ${data.loadedAt.toLocaleTimeString()}`
            : loading ? "Reading the chain…" : ""}{" "}
          <button className="link" onClick={() => void refresh()} disabled={loading}>Refresh</button>
          {loading && waitSec > 0 && <><br />Pacing reads to the public RPC's 30-a-minute limit (about {waitSec}s)…</>}</div>
      </div>

      <AccountPanel signer={signer} onSigner={setSigner} />
      <TxPanel state={tx.state} onReset={tx.reset}>
        {(bound) => Array.isArray(bound)
          ? bound.map((a: any) => <AttestationResult key={a.attestation_id} a={a} />)
          : bound?.probe_id !== undefined
            ? <div className="result"><b>{bound.company_number}</b>: <Pill tone={bound.outcome === "CHANGED" ? "bad" : bound.outcome === "UNCHANGED" ? "ok" : "none"}>{bound.outcome}</Pill>{" "}
                <span className="sm">compared against attestation #{bound.attestation_id}{bound.changes.length ? ` · changed: ${bound.changes.join(", ")}` : ""}</span></div>
            : <div className="result"><b>{bound?.company_number}</b> registered by this account.</div>}
      </TxPanel>

      {data && (
        <div className="stats">
          <div className="stat"><b>{approved}</b><span>approved right now</span></div>
          <div className="stat"><b>{data.companies.length - approved}</b><span>not approved</span></div>
          <div className="stat"><b>{data.state.attestation_count}</b><span>checks on-chain</span></div>
          <div className="stat"><b>{data.state.probe_count}</b><span>tripwire probes</span></div>
          <div className="stat"><b>{data.gate.config.payment_count}</b><span>payments the gate allowed</span></div>
        </div>
      )}

      <Section title="How an approval works">
        <div className="rules">
          <div><b>1 · Check</b><span>Validators read Companies House and agree. Only GOOD_STANDING is an approval, valid for {data?.rules.approval_days ?? 30} days or until the day a filing deadline falls, whichever is first. Up to {MAX_BATCH} companies per transaction.</span></div>
          <div><b>2 · Probe</b><span>One page, no LLM. If the status, a deadline or an overdue flag no longer matches the check, the approval is revoked at once.</span></div>
          <div><b>3 · Expire</b><span>At the end of its validity the approval lapses, whatever the register says. A fresh check is the only way back.</span></div>
          <div><b>4 · Gate</b><span>A supplier is paid only if approved at the moment of payment (within {MAX_AGE_SECONDS / 3600} hours of its check). Onboarding is a record, never a standing permission.</span></div>
        </div>
      </Section>

      <Section title="Counterparties" aside={<span className="sm">live from KYBDesk</span>}>
        {error && <div className="err">Couldn't read the chain: {error}</div>}
        {!data && !error && <p className="sub">Reading the chain…</p>}
        {data?.companies.map((c) => (
          <CompanyCard key={c.company_number} c={c} signer={signer} busy={busy} onCheck={(n) => void check([n])} onProbe={(n) => void probe(n)} />
        ))}
      </Section>

      <Section title="Check several at once">
        <div className="panel">
          <div className="sm">Pick up to {MAX_BATCH} registered companies: one transaction, every validator re-reads each of them.</div>
          <div className="picks">
            {data?.companies.map((c) => (
              <label key={c.company_number} className={picked.includes(c.company_number) ? "pick on" : "pick"}>
                <input type="checkbox" checked={picked.includes(c.company_number)} onChange={() => toggle(c.company_number)} />
                {c.label.length > 28 ? c.label.slice(0, 28) + "…" : c.label} <span className="num">{c.company_number}</span>
              </label>
            ))}
          </div>
          <div className="actions">
            <button disabled={!signer || busy || picked.length < 2} onClick={() => void check(picked)}
                    title={picked.length < 2 ? "Pick at least two (a single check is the button on its card)" : ""}>
              Check {picked.length || ""} selected
            </button>
          </div>
        </div>
      </Section>

      <Section title="Register a company">
        <div className="panel form">
          <label>Companies House number<input value={cn} onChange={(e) => setCn(e.target.value)} placeholder="00445790 or SC123456" /></label>
          <label>LEI (optional, binds the company's identity through GLEIF)<input value={lei} onChange={(e) => setLei(e.target.value)} placeholder="2138002P5RNKC5W2JZ46" /></label>
          <label>Label<input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Tesco PLC" maxLength={100} /></label>
          <div className="actions">
            <button disabled={!signer || busy || !registerOk} onClick={() => void register()}>Register</button>
            {cn && !isCompanyNumber(number) && <span className="sm">A Companies House number is 8 letters/digits.</span>}
          </div>
          <div className="sm">Registration is permissionless and immutable, including the LEI. Register a company number you care about yourself rather than assuming nobody else has.</div>
        </div>
      </Section>

      <Section title="OnboardingGate ledger" aside={<span className="sm">owner-only writes, so read-only here</span>}>
        {data && (
          <div className="tablewrap"><table className="list">
            <thead><tr><th>Supplier</th><th>Paid</th></tr></thead>
            <tbody>
              {data.gate.vendors.map((v: any) => <tr key={v.company_number}><td>{v.name} <span className="num">{v.company_number}</span></td><td>{Number(v.paid).toLocaleString()}</td></tr>)}
              {data.gate.vendors.length === 0 && <tr><td colSpan={2}>No suppliers onboarded yet.</td></tr>}
            </tbody>
          </table></div>
        )}
        <p className="sm">Onboarding and payments are owner-only by design (the gate is a demonstration of a consumer): it onboards a company only while KYB Desk approves it, and pays only if the company is approved at the moment of payment. Every refused call, with the desk's reason, is in the repository's CONTRACT.md.</p>
      </Section>

      <footer>
        <p>An approval says what the public register said when it was read, and that a committee of validators agreed. It is not legal, credit or investment advice. Source, tests and every transaction: <a href="https://github.com/HarrisonJL/kybdesk" target="_blank" rel="noreferrer">github.com/HarrisonJL/kybdesk</a>.</p>
      </footer>
    </main>
  );
}
