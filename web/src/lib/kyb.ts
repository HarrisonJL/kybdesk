import { view, type Signer } from "./genlayer";

// The deployed contracts (see CONTRACT.md in the repo root).
export const DESK = "0x962Ee34181C4981Be098527a4B2d8Fe0Ba31D8fB";
export const GATE = "0xEE0c01f1F73c470b1d5625f5658D916A6e697251";
// The gate pays only on a fresh approval: its own freshness limit.
export const MAX_AGE_SECONDS = 86400;
export const MAX_BATCH = 4;

/** Companies House numbers as the contract normalises them (bare digits are zero-padded). */
export function normalizeCompanyNumber(raw: string): string {
  const cn = raw.replace(/\s+/g, "").toUpperCase();
  return /^\d{1,8}$/.test(cn) ? cn.padStart(8, "0") : cn;
}
export const isCompanyNumber = (cn: string) => /^[A-Z0-9]{8}$/.test(cn);

export type Company = {
  company_number: string;
  label: string;
  lei: string;
  attestation_count: number;
  approval: any;
  history: any[];
};

export type DeskData = {
  state: { entity_count: number; attestation_count: number; probe_count: number };
  rules: { approval_days: number; max_batch: number };
  companies: Company[];
  gate: { vendors: any[]; payments: any[]; config: any };
  loadedAt: Date;
};

// The last good read is kept in localStorage so a reload paints at once (and says
// it is a past read) while the live read is paced under the RPC's rate limit.
const CACHE_KEY = `kybdesk-snapshot-${DESK.toLowerCase()}`;
export function cachedDesk(): DeskData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return { ...d, loadedAt: new Date(d.loadedAt) };
  } catch { return null; }
}
function cacheDesk(d: DeskData): void {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(d)); } catch { /* optional */ }
}

let inflight: Promise<DeskData> | null = null;
/** One live read at a time: overlapping callers (a refresh during a load, a double-mounted effect) share it. */
export function loadDesk(): Promise<DeskData> {
  inflight ??= readDesk().then((d) => { cacheDesk(d); return d; }).finally(() => { inflight = null; });
  return inflight;
}

async function readPass(): Promise<DeskData> {
  const [state, rules, entities, vendors, payments, config] = await Promise.all([
    view(DESK, "get_state"), view(DESK, "get_rules"), view(DESK, "list_entities"),
    view(GATE, "list_vendors"), view(GATE, "get_payments", [0, 10]), view(GATE, "get_config"),
  ]);
  const companies: Company[] = await Promise.all(entities.map(async (e: any) => {
    const [approval, history] = await Promise.all([
      view(DESK, "get_approval", [e.company_number, MAX_AGE_SECONDS]),
      view(DESK, "get_history", [e.company_number, 3]),
    ]);
    return { ...e, approval, history };
  }));
  return { state, rules, companies, gate: { vendors, payments, config }, loadedAt: new Date() };
}

const moved = (a: DeskData["state"], b: DeskData["state"]) =>
  a.entity_count !== b.entity_count || a.attestation_count !== b.attestation_count || a.probe_count !== b.probe_count;

/**
 * The reads above take a while (they are paced), so a transaction can land
 * halfway through and leave a card that mixes two moments (a count from before,
 * a history from after). The desk's own counters bracket the pass: if they moved,
 * read again, so what is shown is one consistent snapshot.
 */
async function readDesk(): Promise<DeskData> {
  for (let pass = 1; ; pass++) {
    const data = await readPass();
    const after = await view(DESK, "get_state");
    if (!moved(data.state, after) || pass >= 3) return { ...data, state: after };
  }
}

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

// --- Bind a transaction to the record IT created --------------------------------
// Each reads contract state before the call (the count to compare against) and
// after it (the records at or past that count, from this sender, about this subject).

export const countBefore = async () => (await view(DESK, "get_state")) as DeskData["state"];

export async function boundAttestations(before: number, signer: Signer, numbers: string[]): Promise<any[]> {
  const recent: any[] = await view(DESK, "get_attestations", [0, 12]);
  const mine = recent.filter((a) => a.attestation_id >= before && same(a.submitted_by, signer.address)
                                    && numbers.includes(a.company_number));
  const found = new Set(mine.map((a) => a.company_number));
  const missing = numbers.filter((n) => !found.has(n));
  if (missing.length) throw new Error(`no new attestation from this account for ${missing.join(", ")}`);
  return mine.sort((a, b) => a.attestation_id - b.attestation_id);
}

export async function boundProbe(before: number, signer: Signer, number: string): Promise<any> {
  const recent: any[] = await view(DESK, "get_probes", [0, 6]);
  const hit = recent.find((p) => p.probe_id >= before && same(p.submitted_by, signer.address) && p.company_number === number);
  if (!hit) throw new Error(`no new probe from this account for ${number}`);
  return hit;
}

export async function boundEntity(signer: Signer, number: string): Promise<any> {
  const e = await view(DESK, "get_entity", [number]);
  if (!same(e.registrant, signer.address)) throw new Error("the entity was registered by a different account");
  return e;
}
