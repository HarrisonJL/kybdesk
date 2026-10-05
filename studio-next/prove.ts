// Reproducible live proof for KYB Desk + OnboardingGate. Every step's tx hash,
// result and the contract's recorded output are appended to live_proof.json -
// the source for CONTRACT.md's tables.
//
//   npx tsx prove.ts <kyb desk> <onboarding gate> <step>
//   steps: register | attest | batch | probe | gate | read
import * as fs from "fs";
import { client, readClient, write, safeJson } from "./lib";

const TESCO_LEI = "2138002P5RNKC5W2JZ46";
const TESCO = "00445790";
const THOMAS_COOK = "06091951"; // in liquidation since 2019
const UAS = "14814841"; // "Active - Active proposal to strike off"
const PENINSULA = "14813324"; // strike-off history that ends discontinued: the LLM reader must see it as resolved
const SAINSBURY = "00185647"; // healthy; registered here without an LEI
const NEW_CO = "17310988"; // registered, never attested

const COMPANIES: [string, string, string][] = [
  [TESCO, TESCO_LEI, "Tesco PLC"],
  [THOMAS_COOK, "", "Thomas Cook Group plc"],
  [UAS, "", "UAS Business Solutions Ltd"],
  [PENINSULA, "", "Peninsula Storage Solutions Ltd"],
  [SAINSBURY, "", "J Sainsbury plc"],
  [NEW_CO, "", "Incorporated July 2026 (never attested)"],
];

function log(entry: Record<string, unknown>) {
  const all = fs.existsSync("live_proof.json") ? JSON.parse(fs.readFileSync("live_proof.json", "utf-8")) : [];
  all.push(entry);
  fs.writeFileSync("live_proof.json", JSON.stringify(all, null, 1));
}

// The revert message of a failed transaction, wherever the node put it.
function revertMessage(tx: any): string {
  const found: string[] = [];
  const walk = (o: any) => {
    if (typeof o === "string") {
      const m = o.match(/(onboarding [^\n"]*refused[^\n"]*|payment to [^\n"]*blocked[^\n"]*|supplier not onboarded|only the owner[^\n"]*|company_number [^\n"]*not registered)/);
      if (m) found.push(m[0]);
    } else if (o && typeof o === "object") Object.values(o).forEach(walk);
  };
  walk(tx);
  return found[0] ?? "";
}

async function main() {
  const [desk, gate, step] = process.argv.slice(2);
  const c = client();
  const r = readClient();
  const votes = (tx: any) => tx.last_round?.validator_votes_name ?? [];
  // Studio Next's RPC allows 30 requests a minute: pace reads under it.
  const view = async (address: string, fn: string, args: unknown[]) => {
    await new Promise((res) => setTimeout(res, 2200));
    return JSON.parse(safeJson(await r.readContract({ address, functionName: fn, args })));
  };

  if (step === "register") {
    const have = new Set((await view(desk, "list_entities", [])).map((e: any) => e.company_number));
    for (const [cn, lei, label] of COMPANIES) {
      if (have.has(cn)) continue; // idempotent: a re-run after a transient RPC error skips what is registered
      const { hash, tx } = await write(c, desk, "register_entity", [cn, lei, label]);
      log({ step: "register", company_number: cn, tx: hash, result: tx.txExecutionResultName, votes: votes(tx) });
    }
  } else if (step === "attest") {
    for (const cn of [TESCO, TESCO]) {
      const { hash, tx } = await write(c, desk, "attest", [cn]);
      const a = await view(desk, "latest_attestation", [cn]);
      log({ step: "attest", company_number: cn, tx: hash, result: tx.txExecutionResultName, votes: votes(tx), attestation: a });
      console.log(`  ${cn}: ${a.verdict} valid_until ${a.valid_until} officers=${a.officers_changed} previous=${a.previous_id}`);
    }
  } else if (step === "batch") {
    const batch = [THOMAS_COOK, UAS, PENINSULA, SAINSBURY];
    const started = Date.now();
    const { hash, tx } = await write(c, desk, "attest_batch", [batch]);
    const seconds = Math.round((Date.now() - started) / 1000);
    const recorded = await view(desk, "get_attestations", [0, batch.length]);
    log({ step: "batch", companies: batch, seconds, tx: hash, result: tx.txExecutionResultName, votes: votes(tx), attestations: recorded });
    for (const a of recorded.reverse()) console.log(`  ${a.company_number}: ${a.verdict} ${safeJson(a.reasons)} valid_until ${a.valid_until}`);
    console.log(`  batch of ${batch.length} decided in ${seconds}s`);
  } else if (step === "probe") {
    const { hash, tx } = await write(c, desk, "probe", [TESCO]);
    const p = (await view(desk, "get_probes", [0, 1]))[0];
    const e = await view(desk, "get_entity", [TESCO]);
    log({ step: "probe", company_number: TESCO, tx: hash, result: tx.txExecutionResultName, votes: votes(tx), probe: p, entity: e });
    console.log(`  probe ${TESCO}: ${p.outcome} ${safeJson(p.changes)} against attestation ${p.attestation_id}; revoked=${e.revoked}`);
    const hist = await view(desk, "get_history", [TESCO, 10]);
    log({ step: "history", company_number: TESCO, ids: hist.map((h: any) => h.attestation_id), previous: hist.map((h: any) => h.previous_id) });
    console.log(`  history ${TESCO}: ids ${safeJson(hist.map((h: any) => h.attestation_id))}, previous ${safeJson(hist.map((h: any) => h.previous_id))}`);
  } else if (step === "gate") {
    const calls: [string, unknown[]][] = [
      ["onboard", [TESCO, "Tesco PLC"]],            // approved: allowed
      ["onboard", [PENINSULA, "Peninsula Storage"]], // approved (LLM-read history): allowed
      ["onboard", [THOMAS_COOK, "Thomas Cook"]],     // liquidation: refused
      ["onboard", [UAS, "UAS Business Solutions"]],  // "Active - proposal to strike off": refused
      ["onboard", [NEW_CO, "Never attested"]],       // no attestation: refused
      ["pay", [TESCO, 5000]],                        // onboarded and approved now: allowed
      ["pay", [PENINSULA, 750]],                     // allowed
      ["pay", [THOMAS_COOK, 100]],                   // never onboarded: refused
    ];
    for (const [fn, args] of calls) {
      const { hash, tx } = await write(c, gate, fn, args);
      const message = tx.txExecutionResultName === "FINISHED_WITH_ERROR" ? revertMessage(tx) : "";
      log({ step: "gate", call: fn, args, tx: hash, result: tx.txExecutionResultName, votes: votes(tx), revert: message });
      console.log(`  ${fn}(${args.join(", ")}) -> ${tx.txExecutionResultName} ${message}`);
    }
  } else if (step === "read") {
    const done = new Set(JSON.parse(fs.existsSync("live_proof.json") ? fs.readFileSync("live_proof.json", "utf-8") : "[]")
      .filter((e: any) => e.step === "read").map((e: any) => e.company_number));
    for (const [cn] of COMPANIES) {
      if (done.has(cn)) continue; // resumable after a transient RPC error
      const ap = await view(desk, "get_approval", [cn, 86400]);
      const ok = await view(desk, "is_approved", [cn, 86400]);
      const tight = await view(desk, "is_approved", [cn, 1]);
      log({ step: "read", company_number: cn, approval: ap, is_approved_86400: ok, is_approved_1: tight });
      console.log(`  ${cn}: ${ap.reason} approved=${ok} (max_age 1s: ${tight}) valid_until ${ap.valid_until}`);
    }
    console.log("  vendors:", safeJson(await view(gate, "list_vendors", [])));
    console.log("  payments:", safeJson(await view(gate, "get_payments", [0, 10])));
    console.log("  config:", safeJson(await view(gate, "get_config", [])));
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e?.shortMessage ?? e?.message ?? e);
  process.exit(1);
});
