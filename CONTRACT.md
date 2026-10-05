# KYB Desk: deployment and live proof

Everything below is on GenLayer Studio Next (chain 61997), produced by `studio-next/prove.ts` on 2026-10-05 and logged in full (every recorded record, every vote) in [`studio-next/live_proof.json`](studio-next/live_proof.json). Explorer: `https://explorer-studio-dev.genlayer.com/tx/<hash>`.

## Deployments

| Contract | Address | Deploy tx |
|---|---|---|
| KYBDesk | `0x962Ee34181C4981Be098527a4B2d8Fe0Ba31D8fB` | `0x9c2292a9e1926930926c060d6fdacbf724a53aa6d5af493902df5933f1e89c60` |
| OnboardingGate (`max_age_seconds` 86400) | `0xEE0c01f1F73c470b1d5625f5658D916A6e697251` | `0xd0f3cf73f50fb443505db2b0de1db7b0c412680367fd4f2817def03ad7e7d0ff` |

Checked against the live runner with `getContractSchemaForCode` before deploying (`studio-next/check_schema.ts`): KYBDesk 18 methods (14 view, 4 write), OnboardingGate 7 (5 view, 2 write).

### Verify the deployed source matches this repo

```bash
cd studio-next && npm ci
npx tsx verify_code.ts 0x962Ee34181C4981Be098527a4B2d8Fe0Ba31D8fB kyb_desk_studio_next.py
npx tsx verify_code.ts 0xEE0c01f1F73c470b1d5625f5658D916A6e697251 onboarding_gate_studio_next.py
```

| File | SHA-256 | On-chain |
|---|---|---|
| `contracts/kyb_desk_studio_next.py` | `3e26ba1b395bf1d70854aab01f0e6ff3cc634e1e4cc4d95998435f9fa580ac10` | identical |
| `contracts/onboarding_gate_studio_next.py` | `1d81570320071f0489f3fb6eda69fb3cff65c2a742ae4f90c27ccb6de7bdc844` | identical |
| `contracts/kyb_desk.py` (tested source) | `6e1887e903bc3be63c528ac3ce3c9f7339ca35a29984b06b211ed7e193b36f7c` | ported mechanically |
| `contracts/onboarding_gate.py` (tested source) | `48536d98ddfd646fd4cd6d481dc5bd6bb0c2532b7b45fdeb9ae067547bc2ca69` | ported mechanically |

`python3 scripts/port_to_studio_next.py contracts/<name>.py` regenerates each `*_studio_next.py` from its tested source; both committed ports are exactly what it produces.

## Live proof

Six real companies, registered on the desk. Every transaction below reached consensus with every voting validator agreeing (3 of the 5 seats vote per round on Studio Next; the rest are `IDLE`).

### 1. Registration

| Company | Tx |
|---|---|
| `00445790` Tesco PLC | [`0x8f97e61e…`](https://explorer-studio-dev.genlayer.com/tx/0x8f97e61e295cfe9e9faa70db67d8065a8b47d5846bceb1874392f92d4da88d6b) |
| `06091951` Thomas Cook Group | [`0x4f1b311a…`](https://explorer-studio-dev.genlayer.com/tx/0x4f1b311ad448135d56af2af59f3e50fe3794b3594bf1d06c0a09daabe17f910f) |
| `14814841` UAS Business Solutions | [`0x31304c8a…`](https://explorer-studio-dev.genlayer.com/tx/0x31304c8a43d045e29967fea7fd8167de89c986a7385f43626ed737ef8adf9aed) |
| `14813324` Peninsula Storage Solutions | [`0x347635b7…`](https://explorer-studio-dev.genlayer.com/tx/0x347635b7ff8566f95bf2b666392e49d7cf74911b12a14bd4bf4f57549bc71e61) |
| `00185647` J Sainsbury | [`0x90bf7481…`](https://explorer-studio-dev.genlayer.com/tx/0x90bf7481f6e73b52aa7f621f7f75624b59042ea3ba96a0a68784d99aee64c5a0) |
| `17310988` (incorporated July 2026) | [`0x2ef07d83…`](https://explorer-studio-dev.genlayer.com/tx/0x2ef07d837b063d8aa08027710ba6e7d7001d4becdfd7c08ac91d6a1c3c0fcfa0) |

### 2. Attestations of Tesco (a chain of two)

| Tx | Verdict | `valid_until` | Agree |
|---|---|---|---|
| *(not captured, see "One record the log is missing")* | attestation `#0`: **GOOD_STANDING**, the baseline | 30 days after it | — |
| [`0x99fbea08…`](https://explorer-studio-dev.genlayer.com/tx/0x99fbea08789db53b55d1d84121fcd86f5bd43d1dbe2517985f5a530e676e07ce) | `#1`: **GOOD_STANDING**, officers `UNCHANGED`, previous attestation `0` | `2026-11-04T16:11:49.945557+00:00` (attested + 30 days) | 3/3 |

### 3. One batch of four companies, one transaction

[`0x755b89ca…`](https://explorer-studio-dev.genlayer.com/tx/0x755b89ca1267e6125010d7a6cec68431bc08ed8fec26ff697ca5afc29a587dde), decided in **28 s**, 3/3 agree. Two of the four are `GOOD_STANDING`, so each validator also ran the LLM reader twice.

| Company | Verdict | Reasons | `valid_until` |
|---|---|---|---|
| `06091951` Thomas Cook Group | **NOT_IN_GOOD_STANDING** | `status:Liquidation`, `accounts_overdue`, `confirmation_statement_overdue` | `2026-10-05T17:49:43.325621+00:00` |
| `14814841` UAS Business Solutions | **NOT_IN_GOOD_STANDING** | `status:Active — Active proposal to strike off`, `confirmation_statement_overdue` | `2026-10-05T17:49:43.325621+00:00` |
| `14813324` Peninsula Storage Solutions | **GOOD_STANDING** | — | `2026-11-04T17:49:43.325621+00:00` |
| `00185647` J Sainsbury | **GOOD_STANDING** | — | `2026-11-04T17:49:43.325621+00:00` |

### 4. The tripwire and the history

[`0x0d961a86…`](https://explorer-studio-dev.genlayer.com/tx/0x0d961a86794bebdf8279980f454fbf513d1fa5e72391efaab75db62384152ad4): `probe("00445790")` → **`UNCHANGED`**, changes `[]`, compared against attestation `1`; the entity's `revoked` stays `false`; 3/4 agree. One page fetch, no LLM.

`get_history("00445790", 10)` → attestation ids `[1, 0]`, each pointing at its predecessor (`previous_id` `[0, None]`).

### 5. OnboardingGate

| Call | Tx | Result | Agree |
|---|---|---|---|
| `onboard(00445790, Tesco PLC)` | [`0xf5272ca6…`](https://explorer-studio-dev.genlayer.com/tx/0xf5272ca67d03513293e1c1e45fa698e34e9248bdf57b4f35d7ad4f5480318d3e) | ✓ recorded | 3/3 |
| `onboard(14813324, Peninsula Storage)` | [`0x1f45ef16…`](https://explorer-studio-dev.genlayer.com/tx/0x1f45ef161a92060179afb33d6bd21c63f4f69d7a23b1369a37f55b4b1bf13333) | ✓ recorded | 3/3 |
| `onboard(06091951, Thomas Cook)` | [`0x18b5680a…`](https://explorer-studio-dev.genlayer.com/tx/0x18b5680ad4162dcc5541f132e6a1e68c558c15302ddfa8057d60f0281d4ca689) | reverted: `onboarding 06091951 refused: KYB Desk says VERDICT_NOT_IN_GOOD_STANDING` | 3/3 |
| `onboard(14814841, UAS Business Solutions)` | [`0x527b3b06…`](https://explorer-studio-dev.genlayer.com/tx/0x527b3b069d8b6e9cb313e9fbd02e2d9875ca61719c9967e9f35a30991bcd29ff) | reverted: `onboarding 14814841 refused: KYB Desk says VERDICT_NOT_IN_GOOD_STANDING` | 3/3 |
| `onboard(17310988, Never attested)` | [`0xf8fb86a8…`](https://explorer-studio-dev.genlayer.com/tx/0xf8fb86a8708a90012f0b3494b7269faceedbc739d47a535c72f2347f24b7698e) | reverted: `onboarding 17310988 refused: KYB Desk says NO_ATTESTATION` | 3/3 |
| `pay(00445790, 5000)` | [`0x95419b53…`](https://explorer-studio-dev.genlayer.com/tx/0x95419b531e73c2d9dba8596df6707b28920e495a08bc9f34451a64310b7cca6e) | ✓ recorded | 3/3 |
| `pay(14813324, 750)` | [`0x9b91b3e2…`](https://explorer-studio-dev.genlayer.com/tx/0x9b91b3e262dd1a288cb582edf36066b86fb6e22b613eba2e66226c0c904f41e7) | ✓ recorded | 3/3 |
| `pay(06091951, 100)` | [`0xa76cadc1…`](https://explorer-studio-dev.genlayer.com/tx/0xa76cadc16c53425ab964a8057c5ed17ac20c993573d0a352c2ac04d1e37258fc) | reverted: `supplier not onboarded` | 3/3 |

### 6. Reads after the run

| Company | `get_approval(cn, 86400)` | `is_approved(cn, 86400)` | `is_approved(cn, 1)` |
|---|---|---|---|
| `00445790` Tesco PLC | `APPROVED` | true | false |
| `06091951` Thomas Cook Group | `VERDICT_NOT_IN_GOOD_STANDING` | false | false |
| `14814841` UAS Business Solutions | `VERDICT_NOT_IN_GOOD_STANDING` | false | false |
| `14813324` Peninsula Storage Solutions | `APPROVED` | true | false |
| `00185647` J Sainsbury | `APPROVED` | true | false |
| `17310988` (incorporated July 2026) | `NO_ATTESTATION` | false | false |

## What the live run does not show

- **Revocation and expiry never fired.** No real company's register changed between an attestation and its probe, and no live approval was within 30 days of a filing deadline. Live shows the probe's `UNCHANGED` path, `valid_until` at the 30-day cap (attested + 30 days exactly), and `get_approval`'s reasons `APPROVED`, `VERDICT_NOT_IN_GOOD_STANDING` and `NO_ATTESTATION`. `REVOKED`, `EXPIRED`, `STALE`, the deadline clamp, and a payment refused after revocation are exercised on real captured pages in `tests/test_kyb_desk_v2.py`.
- **`AT_RISK`** hasn't occurred on any live company (inherited from EntityStanding v1). Tests cover it. The LLM reader's hardest negative case did run live: Peninsula Storage's history reads *compulsory strike-off → suspended → discontinued*, and every validator's reader called it resolved (`GOOD_STANDING`) inside the live batch.
- The gate's cross-contract call can't run in genlayer-test's Direct Mode, so the allowed and refused onboardings and payments above are its test.

## One record the log is missing

Tesco's chain is `#0 → #1`. The first attest of this run was submitted from a command that was moved to the background, and the network was slow to decide it: attestation `#0` was recorded on-chain, but its transaction hash was not captured, and the log entry for `#1` was backfilled from the chain (its entry carries a `note`). Both attestations are on the chain under the KYBDesk address.

## Superseded deployments

| Contract | Address | Why |
|---|---|---|
| KYBDesk (second) | `0xc9C8Dd8Fe79Ae433169A9Fb6cd1eA1E6069822fF` (deploy `0x79d03c0d05bf4ca499de41cc24ac61fb664293422cbf207682766a054d724e78`) | Kept a v1-compatible view, `is_in_good_standing`, that ignored expiry and revocation: true for a revoked or expired approval. A consumer calling it would have stayed fail-open after a probe revoked an approval. The view is now exactly `is_approved`, so there is one approval semantics. Proof log of that deployment: [`studio-next/live_proof_superseded_v2.json`](studio-next/live_proof_superseded_v2.json). |
| OnboardingGate (second) | `0xf97448d11167F5c05043e97307325A8aa76121E1` (deploy `0xc8f37cf6915b0660294250f6df484a4dde06770ba4af5fd7eebd03cb20a33519`) | Pointed at the second KYBDesk. |
| KYBDesk (first) | `0x177581995cAF8b6966ebA5dE595411667A539c24` (deploy `0xef1c66ac26e290459e5679dd3907682bacad08cc7d95e688054731c6ed41bea4`) | Same logic as the second. Its header comment overstated what was unchanged from EntityStanding v1. Proof log: [`studio-next/live_proof_superseded_v1.json`](studio-next/live_proof_superseded_v1.json). |
| OnboardingGate (first) | `0xC9621A47C1ad9CbcD37d40038f59608b8a146b62` (deploy `0x80d2c521eee8702d6f6209931cb4193ef8e724aedf27a5372a723139a5e9216e`) | Pointed at the first KYBDesk. |
| OnboardingGate (failed deploy) | `0x70d61D2DEFfbD3f4429A5446eD0308c61D1c8e92` (deploy `0x94bdddc20ff3132078e23e2ac7002adff41d51dacd9ebc29b75368b9e612ff54`) | `FINISHED_WITH_ERROR`: the deploy script of that moment passed no constructor arguments. Never used. |
