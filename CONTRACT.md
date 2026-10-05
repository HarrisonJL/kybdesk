# KYB Desk: deployment and live proof

Everything below is on GenLayer Studio Next (chain 61997), produced by `studio-next/prove.ts` on 2026-10-05 and logged in full (every recorded record, every vote) in [`studio-next/live_proof.json`](studio-next/live_proof.json). Explorer: `https://explorer-studio-dev.genlayer.com/tx/<hash>`.

## Deployments

| Contract | Address | Deploy tx |
|---|---|---|
| KYBDesk | `0xc9C8Dd8Fe79Ae433169A9Fb6cd1eA1E6069822fF` | `0x79d03c0d05bf4ca499de41cc24ac61fb664293422cbf207682766a054d724e78` |
| OnboardingGate (`max_age_seconds` 86400) | `0xf97448d11167F5c05043e97307325A8aa76121E1` | `0xc8f37cf6915b0660294250f6df484a4dde06770ba4af5fd7eebd03cb20a33519` |

Checked against the live runner with `getContractSchemaForCode` before deploying (`studio-next/check_schema.ts`): KYBDesk 18 methods (14 view, 4 write), OnboardingGate 7 (5 view, 2 write).

### Verify the deployed source matches this repo

```bash
cd studio-next && npm ci
npx tsx verify_code.ts 0xc9C8Dd8Fe79Ae433169A9Fb6cd1eA1E6069822fF kyb_desk_studio_next.py
npx tsx verify_code.ts 0xf97448d11167F5c05043e97307325A8aa76121E1 onboarding_gate_studio_next.py
```

| File | SHA-256 | On-chain |
|---|---|---|
| `contracts/kyb_desk_studio_next.py` | `7a43f7da8c37fbeb6c6d367917e5c4c9f2428be069c3c67803e6d614477e239c` | identical |
| `contracts/onboarding_gate_studio_next.py` | `1d81570320071f0489f3fb6eda69fb3cff65c2a742ae4f90c27ccb6de7bdc844` | identical |
| `contracts/kyb_desk.py` (tested source) | `e62c5f2bcb021065eeed6a289b8c6d60e7a29f5b86b1441aca3c7e866640a96b` | ported mechanically |
| `contracts/onboarding_gate.py` (tested source) | `48536d98ddfd646fd4cd6d481dc5bd6bb0c2532b7b45fdeb9ae067547bc2ca69` | ported mechanically |

## Live proof

Six real companies, registered on the desk. Every transaction below reached consensus with every voting validator agreeing (3 of the 5 seats vote per round on Studio Next; the rest are `IDLE`).

### 1. Registration

| Company | Tx |
|---|---|
| `00445790` Tesco PLC | [`0x87a24cc2…`](https://explorer-studio-dev.genlayer.com/tx/0x87a24cc2561d7c8b7fdfe5bbc017f2081fa5ce840158ba4b8d0022f1e318ca81) |
| `06091951` Thomas Cook Group | [`0xa4551320…`](https://explorer-studio-dev.genlayer.com/tx/0xa455132017cb213434d9d9064c4d6dec68dfce1f5826dde8b09922c77d291247) |
| `14814841` UAS Business Solutions | [`0xd995bd68…`](https://explorer-studio-dev.genlayer.com/tx/0xd995bd689d39e8c49d5119ca729d8c6673df50f5bbffa071ac3857068d5b42aa) |
| `14813324` Peninsula Storage Solutions | [`0x7cfa3a64…`](https://explorer-studio-dev.genlayer.com/tx/0x7cfa3a644abb5b0550e90de98fe4a24d5482f3495e331951a31825dcb957bcc6) |
| `00185647` J Sainsbury | [`0x439625d6…`](https://explorer-studio-dev.genlayer.com/tx/0x439625d6c2aa83467927cb372a9ea1010e930d2ed48c4f537efbb13e54cb0a52) |
| `17310988` (incorporated July 2026) | [`0x4c227230…`](https://explorer-studio-dev.genlayer.com/tx/0x4c227230ed1410e96540c752bd640d05b60f418f48ea1a6fa3eb5f16aeb47169) |

### 2. Single attestations (Tesco, twice)

| Tx | Verdict | `valid_until` | Agree |
|---|---|---|---|
| [`0xd7ad1e87…`](https://explorer-studio-dev.genlayer.com/tx/0xd7ad1e87d39417924be6913b0c322e1f31906b42692bc95749f943a83663eeb7) | **GOOD_STANDING**, officers `BASELINE`, previous attestation `None` | `2026-11-04T12:21:53.149618+00:00` (attested + 30 days) | 3/3 |
| [`0x251b970f…`](https://explorer-studio-dev.genlayer.com/tx/0x251b970f6070aa588bb1cfb111853f2a5176e02f652c32fb82f3c8c3b497a371) | **GOOD_STANDING**, officers `UNCHANGED`, previous attestation `0` | `2026-11-04T12:22:21.295020+00:00` (attested + 30 days) | 3/3 |

### 3. One batch of four companies, one transaction

[`0x6b03c449…`](https://explorer-studio-dev.genlayer.com/tx/0x6b03c449e41ab25cd904a521784a908234318ee58f820b16e4814f2ec1b49cb0), decided in **28 s**, 3/3 agree. Two of the four are `GOOD_STANDING`, so each validator also ran the LLM reader twice.

| Company | Verdict | Reasons | `valid_until` |
|---|---|---|---|
| `06091951` Thomas Cook Group | **NOT_IN_GOOD_STANDING** | `status:Liquidation`, `accounts_overdue`, `confirmation_statement_overdue` | `2026-10-05T12:22:44.124673+00:00` |
| `14814841` UAS Business Solutions | **NOT_IN_GOOD_STANDING** | `status:Active — Active proposal to strike off`, `confirmation_statement_overdue` | `2026-10-05T12:22:44.124673+00:00` |
| `14813324` Peninsula Storage Solutions | **GOOD_STANDING** | — | `2026-11-04T12:22:44.124673+00:00` |
| `00185647` J Sainsbury | **GOOD_STANDING** | — | `2026-11-04T12:22:44.124673+00:00` |

### 4. The tripwire and the history

[`0x954b7fdc…`](https://explorer-studio-dev.genlayer.com/tx/0x954b7fdc52311fc24284c70e73b500114a5943681b376d760f6847541130f450): `probe("00445790")` → **`UNCHANGED`**, changes `[]`, compared against attestation `1`; the entity's `revoked` stays `false`; 3/3 agree. One page fetch, no LLM.

`get_history("00445790", 10)` → attestation ids `[1, 0]`, each pointing at its predecessor (`previous_id` `[0, None]`).

### 5. OnboardingGate

| Call | Tx | Result | Agree |
|---|---|---|---|
| `onboard(00445790, Tesco PLC)` | [`0xedbe97e3…`](https://explorer-studio-dev.genlayer.com/tx/0xedbe97e3f62f8b385dc94e6d4d66e72b91ee39b07c62ea5d9440d26fb3e3a10b) | ✓ recorded | 3/3 |
| `onboard(14813324, Peninsula Storage)` | [`0x9bccf3b2…`](https://explorer-studio-dev.genlayer.com/tx/0x9bccf3b28bee21f43cea2add933da9f605202b7522b4df5021844973c15c3e2a) | ✓ recorded | 3/3 |
| `onboard(06091951, Thomas Cook)` | [`0x7a9b45f6…`](https://explorer-studio-dev.genlayer.com/tx/0x7a9b45f6f00b05d53492835120ea2f325198321521af5fbf8312ff2eb323cad6) | reverted: `onboarding 06091951 refused: KYB Desk says VERDICT_NOT_IN_GOOD_STANDING` | 3/3 |
| `onboard(14814841, UAS Business Solutions)` | [`0xcec6de49…`](https://explorer-studio-dev.genlayer.com/tx/0xcec6de49b9420c720cdb358b1a589d84780522c56d71abbe688853dd6ed8c801) | reverted: `onboarding 14814841 refused: KYB Desk says VERDICT_NOT_IN_GOOD_STANDING` | 3/3 |
| `onboard(17310988, Never attested)` | [`0x14dde92e…`](https://explorer-studio-dev.genlayer.com/tx/0x14dde92e9994101a50c9e0029564129c2af3cf9e36ca8563aee89bb334d4d0d2) | reverted: `onboarding 17310988 refused: KYB Desk says NO_ATTESTATION` | 3/3 |
| `pay(00445790, 5000)` | [`0xe9d4429b…`](https://explorer-studio-dev.genlayer.com/tx/0xe9d4429b838d02e1172d6e7fda557118f56ae3df864fad56c4642574fe4df2dc) | ✓ recorded | 3/3 |
| `pay(14813324, 750)` | [`0x9a680b02…`](https://explorer-studio-dev.genlayer.com/tx/0x9a680b02799f8f2b7c97bce3d2dc94f47f9cdf985f28784162888386a2f274e1) | ✓ recorded | 3/3 |
| `pay(06091951, 100)` | [`0xd2090303…`](https://explorer-studio-dev.genlayer.com/tx/0xd2090303ec9c70768a6b3cae2cfa6528b3c2ae812879fdb6f0a096f6cfec818c) | reverted: `supplier not onboarded` | 3/3 |

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

## Superseded deployments

| Contract | Address | Why |
|---|---|---|
| KYBDesk (first) | `0x177581995cAF8b6966ebA5dE595411667A539c24` (deploy `0xef1c66ac26e290459e5679dd3907682bacad08cc7d95e688054731c6ed41bea4`) | Same logic. Its header comment said everything above the "KYB Desk" section was unchanged from EntityStanding v1, but the storage classes above that marker gained fields. A comment on-chain should be exact, so the comment was corrected and the contract redeployed. The tested source and the 25-record proof log of that deployment are kept in [`studio-next/live_proof_superseded_v1.json`](studio-next/live_proof_superseded_v1.json), with the same outcomes. |
| OnboardingGate (first) | `0xC9621A47C1ad9CbcD37d40038f59608b8a146b62` (deploy `0x80d2c521eee8702d6f6209931cb4193ef8e724aedf27a5372a723139a5e9216e`) | Pointed at the first KYBDesk. |
| OnboardingGate (failed deploy) | `0x70d61D2DEFfbD3f4429A5446eD0308c61D1c8e92` (deploy `0x94bdddc20ff3132078e23e2ac7002adff41d51dacd9ebc29b75368b9e612ff54`) | `FINISHED_WITH_ERROR`: the deploy script of that moment passed no constructor arguments (`TypeError: __init__() missing 2 required positional arguments`). Never used. |

One more thing about the first proof log: its Tesco chain has three links, not two, because an interrupted run of the same script had already recorded one attestation before it was re-run. The second deployment's proof, above, was run once, start to finish.
