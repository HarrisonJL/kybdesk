// Reads the live KYB Desk and OnboardingGate and writes the data the static
// frontend renders: ../frontend/desk.js (a plain <script>, so the page also
// works opened straight from disk).
//
//   npx tsx snapshot.ts [kyb desk address] [onboarding gate address]
import * as fs from "fs";
import { readClient, safeJson, EXPLORER } from "./lib";

const DESK = process.argv[2] ?? "0xc9C8Dd8Fe79Ae433169A9Fb6cd1eA1E6069822fF";
const GATE = process.argv[3] ?? "0xf97448d11167F5c05043e97307325A8aa76121E1";

async function main() {
  const r = readClient();
  const view = async (address: string, fn: string, args: unknown[] = []) =>
    JSON.parse(safeJson(await r.readContract({ address, functionName: fn, args })));

  const config = await view(GATE, "get_config");
  const maxAge: number = Number(config.max_age_seconds);
  const entities: any[] = await view(DESK, "list_entities");
  const companies = [];
  for (const e of entities) {
    const cn = e.company_number;
    companies.push({
      ...(await view(DESK, "get_entity", [cn])),
      approval: await view(DESK, "get_approval", [cn, maxAge]),
      history: await view(DESK, "get_history", [cn, 10]),
    });
  }
  const vendors = [];
  for (const v of await view(GATE, "list_vendors")) vendors.push(await view(GATE, "get_vendor", [v.company_number]));

  // The proof run's transactions, for the "refused at the gate" ledger and links.
  const proof = fs.existsSync("live_proof.json") ? JSON.parse(fs.readFileSync("live_proof.json", "utf-8")) : [];
  const txs = proof
    .filter((p: any) => p.tx)
    .map((p: any) => ({ step: p.step, call: p.call ?? null, args: p.args ?? p.companies ?? p.company_number ?? null,
                        tx: p.tx, result: p.result, revert: p.revert ?? "" }));

  const data = {
    snapshot_at: new Date().toISOString(),
    chain: "GenLayer Studio Next (chain 61997)",
    explorer: EXPLORER,
    desk: { address: DESK, rules: await view(DESK, "get_rules"), state: await view(DESK, "get_state") },
    gate: { address: GATE, config, vendors, payments: await view(GATE, "get_payments", [0, 50]) },
    companies,
    probes: await view(DESK, "get_probes", [0, 50]),
    txs,
  };
  fs.mkdirSync("../frontend", { recursive: true });
  fs.writeFileSync("../frontend/desk.js", "// Written by studio-next/snapshot.ts - a snapshot of the live contracts.\nwindow.DESK = " + JSON.stringify(data, null, 1) + ";\n");
  console.log(`wrote ../frontend/desk.js: ${companies.length} companies, ${data.probes.length} probes, ${vendors.length} vendors, ${data.gate.payments.length} payments`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e?.shortMessage ?? e?.message ?? e);
  process.exit(1);
});
