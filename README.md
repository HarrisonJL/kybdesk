# KYB Desk

**A know-your-business desk for UK companies, built on a public register: approvals that expire, a tripwire that revokes them when the register changes, and batch checks.** A GenLayer Intelligent Contract plus a consumer contract that only pays suppliers it can *currently* approve.

| | |
|---|---|
| Network | GenLayer Studio Next (chain 61997) |
| KYBDesk | [`0x962Ee34181C4981Be098527a4B2d8Fe0Ba31D8fB`](https://explorer-studio-dev.genlayer.com/address/0x962Ee34181C4981Be098527a4B2d8Fe0Ba31D8fB) |
| OnboardingGate (consumer) | [`0xEE0c01f1F73c470b1d5625f5658D916A6e697251`](https://explorer-studio-dev.genlayer.com/address/0xEE0c01f1F73c470b1d5625f5658D916A6e697251) |
| Live proof | [CONTRACT.md](CONTRACT.md): six real companies, a four-company batch, a probe, eight gate calls, every transaction unanimous |
| Tests | 96 Direct Mode tests on real Companies House captures; 52/52 safety mutations killed |
| Frontend | [`frontend/index.html`](frontend/index.html): a static desk view of the live contracts (see "Frontend") |

## What this builds on, and what it adds

KYB Desk is **EntityStanding v2**. It extends [EntityStanding](https://github.com/HarrisonJL/entitystanding) (deployed at `0xC332c97876643E5037F5a8069Eb92b442c70ae49`), a good-standing attestation for UK companies, and does not re-derive its core. Every line of this contract from the imports down to the storage classes (the parsers, the evaluation, the fetch helpers and the reader: 450 lines) is v1's code, byte for byte, and v1's 54 tests run unchanged against it (`tests/test_kyb_desk.py`; the only edits are the batch-shaped leader payload and one extra field in `get_state`). That core is:

- **A deterministic spine.** The contract builds every Companies House and GLEIF URL itself; status, filing deadlines, officers and filings are parsed with plain code from Companies House's own element IDs; identity is bound on every page and, optionally, through the LEI; status must be *exactly* `Active`.
- **An LLM early-warning reader that can only downgrade** `GOOD_STANDING` to `AT_RISK`, and only with a verbatim quote that every validator finds in its own copy of the filings.
- **Fail-closed `UNVERIFIED`.**

What v2 adds, because a single "good standing" fact isn't what an onboarding desk uses. A desk needs approvals that **expire**, **react** to the register, and cover **many suppliers**:

| New | What it does |
|---|---|
| **`valid_until`** | A `GOOD_STANDING` approval lasts 30 days at most, and **never reaches the start of the day a filing deadline falls**. A company's accounts and confirmation-statement deadlines are the one thing about its standing known in advance, and a filing made on the deadline day only shows on the register later. Every other verdict is already expired when recorded. |
| **`probe(company)`** | The tripwire: **one page fetch, no LLM**. It re-reads the fields the approval rests on (status, both filing deadlines, both overdue flags) and compares them with the attestation that granted it. Any difference **revokes the approval at once**; re-attesting (a full read) is the only way back. It reacts to the register, not the clock, at a fraction of a full attestation's cost. |
| **`attest_batch([…])`** | Up to four companies in **one transaction**. Each validator re-reads every company and must agree on each one's facts and reading. Live: four companies in 28 seconds. |
| **`get_history(company, n)`** | A company's own attestation chain, newest first, by following `previous_id` links. Interleaved attestations of other companies don't matter. |
| **`get_approval` / `is_approved`** | *Why* a company is or isn't approved right now: `APPROVED`, `NO_ATTESTATION`, `VERDICT_<X>`, `REVOKED`, `EXPIRED` or `STALE` (the caller's own `max_age_seconds`). `is_approved` is the consumer view. |

`is_in_good_standing` (EntityStanding v1's name for the question) is exactly `is_approved`: there is one approval semantics, and no view that is true for an expired or revoked approval.

## How an approval is decided, and ends

1. **Attest** (single or batch). The spine decides the verdict. Only `GOOD_STANDING` is an approval, with `valid_until = min(attested_at + 30 days, start of the earliest filing-deadline day)`.
2. **Probe** any time. If the status, a deadline or an overdue flag differs from the attestation, the approval is **revoked** (`REVOKED`). An unreadable overview page *neither revokes nor confirms*: it records `UNREADABLE` and the approval stands on its own expiry. A probe is only allowed against a live, unrevoked approval.
3. **Expire.** At `valid_until` the approval lapses (`EXPIRED`), whatever the register says.
4. **Re-attest.** A fresh full read supersedes any tripwire and starts a new chain link.

A consumer reads one view, `get_approval(company, max_age_seconds)`, and gets the first reason that applies, in this order: `NO_ATTESTATION`, `VERDICT_*`, `REVOKED`, `EXPIRED`, `STALE`, `APPROVED`.

## Equivalence principle

A custom leader/validator pair (`gl.vm.run_nondet`), not `strict_eq` over free text:

- **Attestation (single or batch): exact agreement on every deterministic fact**, including a digest of the filings the LLM reads, for *each* company in the transaction. The reader's decision (adverse or not) must agree, and its quote must exist in the validator's own copy. A batch is rejected if any company fails, or if the leader drops, adds or reorders one.
- **Probe: exact agreement** on the overview-derived facts. The outcome (`UNCHANGED` / `CHANGED` / `UNREADABLE`) is recomputed from those facts and the on-chain attestation, never taken from the leader.
- **The verdict, `valid_until` and the revocation are never taken from the leader.** They are computed after consensus from the agreed facts.

The consensus-boundary tests (`tests/test_kyb_desk.py` section 4 and `tests/test_kyb_desk_v2.py` sections 4 and 5) show validators rejecting: forged facts, a hidden adverse filing, a fabricated quote, a dropped, invented or reordered batch member, a probe leader that hides a change, and each probe field tampered.

## Using it from another contract

`contracts/onboarding_gate.py` is a deployed, working example. A company can only be **onboarded** while KYB Desk approves it, and **paid** only if it is approved *at the time of payment*. Onboarding is a record, never a standing permission:

```python
desk = gl.contract.get_at(self.kyb_address)
approval = desk.view().get_approval(company_number, self.max_age_seconds)
if not approval["approved"]:
    raise gl.vm.UserError(f"payment to {company_number} blocked: KYB Desk says {approval['reason']}")
```

Live: Tesco and Peninsula Storage were onboarded and paid. Thomas Cook (in liquidation) and UAS (an *Active, proposal to strike off* status that a substring check would pass) were refused with `VERDICT_NOT_IN_GOOD_STANDING`, a company never attested with `NO_ATTESTATION`, and a payment to a supplier never onboarded reverted (CONTRACT.md).

| Method | |
|---|---|
| `register_entity(company_number, lei, label)` | Permissionless and immutable, with optional LEI binding. |
| `attest(company_number)` / `attest_batch(company_numbers)` | Permissionless: a fresh full read (1 to 4 companies per batch). |
| `probe(company_number)` | Permissionless tripwire; needs a live, unrevoked approval. |
| `get_approval(cn, max_age)` / `is_approved(cn, max_age)` | The consumer views. |
| `latest_attestation` / `latest_verdict` / `get_attestation(s)` / `get_history(cn, n)` / `get_probes(offset, limit)` | History and evidence. |
| `get_entity` / `list_entities` / `get_sources` / `get_rules` / `get_state` | |

## Testing

```bash
python3 -m venv .venv && .venv/bin/pip install genlayer-test==0.29.2 genvm-linter==0.11.0 pytest
.venv/bin/pytest tests -q                     # 96 tests
python3 scripts/mutation_check.py             # 52/52 mutations killed
.venv/bin/genvm-lint check contracts/kyb_desk.py
```

- **Real pages.** Every Companies House page and GLEIF record is a real capture (`tests/fixtures/PROVENANCE.md`, built by `scripts/build_fixtures.py`) with personal data removed at capture time. Edge cases are made by editing one element of a real page: a deadline moved to 10 October, a status set to "Active - Active proposal to strike off".
- **v1's 54 tests, unchanged**, plus **31 new** in `test_kyb_desk_v2.py` covering expiry (30-day cap, either deadline, a deadline falling today, non-approvals), `get_approval`'s reasons in order, history across interleaved companies, batches (mixed verdicts, an adverse company among clean ones, malformed batches that record nothing, a network failure that records nothing, the validator rejecting each kind of tampering), and the tripwire (each field, revocation, restoration by re-attesting, unreadable pages, preconditions, validator rejection of a probe that hides a change).
- **11 gate tests** for everything before OnboardingGate's cross-contract call. That call can't run in Direct Mode (no glsim hook), so it's proven live: allowed and refused onboardings and payments, with the desk's reason in each revert message.
- **Mutation check.** `tests/mutations.txt` lists 52 deliberate breakages (24 inherited from EntityStanding v1, retargeted to where the code now lives, and 28 for what's new), each removing one safety property, such as the deadline clamp, the revocation, the batch's member check and the history chain. `scripts/mutation_check.py` confirms the suite catches every one. It runs each suite in its own process group with a timeout and restores the contract however it ends.
- `contracts/*.py` are the tested sources (GenVM v0.2.11); `contracts/*_studio_next.py` are mechanical ports (`scripts/port_to_studio_next.py`), and the on-chain code is byte-identical to them (`studio-next/verify_code.ts`).

## Frontend

`frontend/index.html` is a static page (no build step) that shows the desk as a supplier-risk officer would use it. For each counterparty: its approval, why, and how long it lasts; a timeline of its attestations; its probes; and the gate's ledger. It renders `frontend/desk.js`, a snapshot of the live contracts written by `npm run snapshot` in `studio-next/` (it reads both contracts through genlayer-js and records when; being a plain script, the page also works opened straight from disk). Countdowns, and whether the gate would pay or refuse *now*, are computed in the browser against the clock, so an approval visibly runs out and a stale snapshot ages honestly. The page says when its snapshot was taken and links every contract and transaction to the explorer.

## Known limitations

- **UK Companies House only**, and layout-dependent: if its markup changes, affected fields stop parsing and results become `UNVERIFIED`, never a silent pass.
- **A probe compares a small set of fields.** It sees a change of status, a filing deadline moving (including a filing being made, which moves the deadline a year on) or an overdue flag flipping. It does not see an officer change or a new filing. Any change it flags needs a full re-attest to restore the approval: conservative by design. The full attestation reads the officers and filings.
- **Revocation and expiry are proven in tests, not live.** Live, no real company's register changed between an attestation and its probe, and no live approval was within 30 days of a deadline. The live proof shows the probe's `UNCHANGED` path, `valid_until` at the 30-day cap, and the gate's reasons. The `REVOKED` and `EXPIRED` paths, the deadline clamp and revocation of a payment are exercised on real captured pages in the tests, and the docs don't claim otherwise.
- **Batches are capped at four.** A four-company batch (two reader calls) took 28 seconds live (42 seconds on the first deployment). A bigger batch needs a longer round, so the cap stays where it was proven.
- **`AT_RISK` hasn't occurred live** (inherited from v1): it needs an *Active*, up-to-date company with an unresolved adverse filing, which didn't exist on the demo day. It is proven in tests built from real pages, and the reader is proven live on its hardest negative case (a discontinued strike-off, read `GOOD_STANDING` inside the live batch).
- **Good standing is not creditworthiness.** This attests what the public register says; it is not legal, credit or investment advice.

- **Availability is never traded for safety.** Anyone can pay for a fresh check, and the latest check wins. If a source is momentarily unreachable, that check records `UNVERIFIED` (or fails and records nothing), and consumers fail closed until the next good check. A griefer can make a good approval temporarily unavailable, never a bad one look good, and the next check restores it.
- **Prompt injection.** As EntityStanding: some filing descriptions carry company-supplied wording; the reader treats it as untrusted data and can only *downgrade*, so an injection could at worst suppress an early-warning downgrade, never produce `GOOD_STANDING`, which the deterministic spine alone grants.
- **Company numbers are first-come, and the LEI binding is immutable** (inherited from EntityStanding). A stranger who registers a company number with an LEI that isn't the company's makes that number read `UNVERIFIED` (`lei_check:NOT_THIS_COMPANY`), and it can't be re-registered. It is visible and attributable (`get_entity` shows the LEI and the registrant), so a consumer should read it and fail closed, but it is a real griefing path; keying entities by an id the registrant chooses would remove it. `OnboardingGate` is owner-only and takes the owner's chosen company numbers, to show the gate.
## Repository layout

```
contracts/kyb_desk.py                    tested source (GenVM v0.2.11)
contracts/kyb_desk_studio_next.py        deployed port (Studio Next)
contracts/onboarding_gate*.py            consumer contract + port
tests/                                   v1's 54 tests (test_kyb_desk.py), v2's 31, the gate's 11, fixtures, mutations.txt
scripts/                                 fixture capture, port, mutation check
studio-next/                             deploy, schema check, snapshot, live proof (prove.ts, live_proof.json), verify_code.ts
frontend/                                static desk view (index.html) + data snapshot (desk.js)
research/                                v1's connectivity probes (why a plain HTTP fetch of Companies House works on Studio Next)
```
