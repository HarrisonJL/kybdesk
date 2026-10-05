// Written by studio-next/snapshot.ts - a snapshot of the live contracts.
window.DESK = {
 "snapshot_at": "2026-10-05T20:06:09.049Z",
 "chain": "GenLayer Studio Next (chain 61997)",
 "explorer": "https://explorer-studio-dev.genlayer.com",
 "desk": {
  "address": "0x962Ee34181C4981Be098527a4B2d8Fe0Ba31D8fB",
  "rules": {
   "approval_days": 30,
   "max_batch": 4,
   "probe_fields": [
    "status_text",
    "accounts_due",
    "confirmation_due",
    "accounts_overdue",
    "confirmation_overdue"
   ]
  },
  "state": {
   "attestation_count": 6,
   "entity_count": 6,
   "probe_count": 1
  }
 },
 "gate": {
  "address": "0xEE0c01f1F73c470b1d5625f5658D916A6e697251",
  "config": {
   "kyb_address": "0x962Ee34181C4981Be098527a4B2d8Fe0Ba31D8fB",
   "max_age_seconds": 86400,
   "owner": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b",
   "payment_count": 2,
   "vendor_count": 2
  },
  "vendors": [
   {
    "approved_until": "2026-11-04T16:11:49.945557+00:00",
    "attestation_id": 1,
    "company_number": "00445790",
    "name": "Tesco PLC",
    "onboarded_at": "2026-10-05T17:50:44.140840+00:00",
    "onboarded_by": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b",
    "paid": 5000
   },
   {
    "approved_until": "2026-11-04T17:49:43.325621+00:00",
    "attestation_id": 4,
    "company_number": "14813324",
    "name": "Peninsula Storage",
    "onboarded_at": "2026-10-05T17:50:51.686082+00:00",
    "onboarded_by": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b",
    "paid": 750
   }
  ],
  "payments": [
   {
    "amount": 750,
    "attestation_id": 4,
    "company_number": "14813324",
    "recorded_at": "2026-10-05T17:51:29.454764+00:00"
   },
   {
    "amount": 5000,
    "attestation_id": 1,
    "company_number": "00445790",
    "recorded_at": "2026-10-05T17:51:23.474437+00:00"
   }
  ]
 },
 "companies": [
  {
   "attestation_count": 1,
   "company_number": "00185647",
   "label": "J Sainsbury plc",
   "lei": "",
   "probe_count": 0,
   "registered_at": "2026-10-05T15:51:12.546142+00:00",
   "registrant": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b",
   "revoked": false,
   "approval": {
    "approved": true,
    "attestation_id": 5,
    "attested_at": "2026-10-05T17:49:43.325621+00:00",
    "company_number": "00185647",
    "reason": "APPROVED",
    "valid_until": "2026-11-04T17:49:43.325621+00:00",
    "verdict": "GOOD_STANDING"
   },
   "history": [
    {
     "accounts_overdue": false,
     "adverse_evidence": "",
     "attestation_id": 5,
     "attested_at": "2026-10-05T17:49:43.325621+00:00",
     "company_name": "J SAINSBURY PLC",
     "company_number": "00185647",
     "confirmation_overdue": false,
     "facts": {
      "accounts_due": "2027-09-06",
      "accounts_overdue": false,
      "accounts_overdue_label": false,
      "active_officers": 11,
      "active_officers_listed": 11,
      "as_of": "2026-10-05",
      "company_name": "J SAINSBURY PLC",
      "company_number": "00185647",
      "company_number_on_page": "00185647",
      "company_type": "Public limited Company",
      "confirmation_due": "2027-08-08",
      "confirmation_overdue": false,
      "confirmation_overdue_label": false,
      "filings_digest": "478d663576467a66470a13e35c86568ff15b5e830c36f68e815e17101f1b1ab2",
      "filings_http": 200,
      "filings_parsed": 25,
      "gleif_legal_name": "",
      "latest_active_appointment": "2025-07-03",
      "latest_officer_filing": "",
      "lei": "",
      "lei_check": "NONE",
      "officer_filings_in_window": 0,
      "officer_window_complete": false,
      "officer_window_days": 90,
      "officers_http": 200,
      "officers_total": 67,
      "overview_http": 200,
      "pre_verdict": "GOOD_STANDING",
      "reasons": [],
      "resignations_total": 56,
      "status_text": "Active",
      "strike_off_application_pending": false
     },
     "officers_changed": "BASELINE",
     "previous_id": null,
     "reasons": [],
     "status_changed": "BASELINE",
     "status_text": "Active",
     "submitted_by": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b",
     "valid_until": "2026-11-04T17:49:43.325621+00:00",
     "verdict": "GOOD_STANDING"
    }
   ]
  },
  {
   "attestation_count": 2,
   "company_number": "00445790",
   "label": "Tesco PLC",
   "lei": "2138002P5RNKC5W2JZ46",
   "probe_count": 1,
   "registered_at": "2026-10-05T15:48:02.713821+00:00",
   "registrant": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b",
   "revoked": false,
   "approval": {
    "approved": true,
    "attestation_id": 1,
    "attested_at": "2026-10-05T16:11:49.945557+00:00",
    "company_number": "00445790",
    "reason": "APPROVED",
    "valid_until": "2026-11-04T16:11:49.945557+00:00",
    "verdict": "GOOD_STANDING"
   },
   "history": [
    {
     "accounts_overdue": false,
     "adverse_evidence": "",
     "attestation_id": 1,
     "attested_at": "2026-10-05T16:11:49.945557+00:00",
     "company_name": "TESCO PLC",
     "company_number": "00445790",
     "confirmation_overdue": false,
     "facts": {
      "accounts_due": "2027-08-26",
      "accounts_overdue": false,
      "accounts_overdue_label": false,
      "active_officers": 11,
      "active_officers_listed": 11,
      "as_of": "2026-10-05",
      "company_name": "TESCO PLC",
      "company_number": "00445790",
      "company_number_on_page": "00445790",
      "company_type": "Public limited Company",
      "confirmation_due": "2027-07-02",
      "confirmation_overdue": false,
      "confirmation_overdue_label": false,
      "filings_digest": "459d20055bf387ea3094f706e3b6436ab5f62895bed29aabe1bce87f5b335166",
      "filings_http": 200,
      "filings_parsed": 25,
      "gleif_legal_name": "TESCO PLC",
      "latest_active_appointment": "2025-04-14",
      "latest_officer_filing": "",
      "lei": "2138002P5RNKC5W2JZ46",
      "lei_check": "BOUND",
      "officer_filings_in_window": 0,
      "officer_window_complete": true,
      "officer_window_days": 90,
      "officers_http": 200,
      "officers_total": 74,
      "overview_http": 200,
      "pre_verdict": "GOOD_STANDING",
      "reasons": [],
      "resignations_total": 63,
      "status_text": "Active",
      "strike_off_application_pending": false
     },
     "officers_changed": "UNCHANGED",
     "previous_id": 0,
     "reasons": [],
     "status_changed": "UNCHANGED",
     "status_text": "Active",
     "submitted_by": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b",
     "valid_until": "2026-11-04T16:11:49.945557+00:00",
     "verdict": "GOOD_STANDING"
    },
    {
     "accounts_overdue": false,
     "adverse_evidence": "",
     "attestation_id": 0,
     "attested_at": "2026-10-05T15:53:22.781316+00:00",
     "company_name": "TESCO PLC",
     "company_number": "00445790",
     "confirmation_overdue": false,
     "facts": {
      "accounts_due": "2027-08-26",
      "accounts_overdue": false,
      "accounts_overdue_label": false,
      "active_officers": 11,
      "active_officers_listed": 11,
      "as_of": "2026-10-05",
      "company_name": "TESCO PLC",
      "company_number": "00445790",
      "company_number_on_page": "00445790",
      "company_type": "Public limited Company",
      "confirmation_due": "2027-07-02",
      "confirmation_overdue": false,
      "confirmation_overdue_label": false,
      "filings_digest": "459d20055bf387ea3094f706e3b6436ab5f62895bed29aabe1bce87f5b335166",
      "filings_http": 200,
      "filings_parsed": 25,
      "gleif_legal_name": "TESCO PLC",
      "latest_active_appointment": "2025-04-14",
      "latest_officer_filing": "",
      "lei": "2138002P5RNKC5W2JZ46",
      "lei_check": "BOUND",
      "officer_filings_in_window": 0,
      "officer_window_complete": true,
      "officer_window_days": 90,
      "officers_http": 200,
      "officers_total": 74,
      "overview_http": 200,
      "pre_verdict": "GOOD_STANDING",
      "reasons": [],
      "resignations_total": 63,
      "status_text": "Active",
      "strike_off_application_pending": false
     },
     "officers_changed": "BASELINE",
     "previous_id": null,
     "reasons": [],
     "status_changed": "BASELINE",
     "status_text": "Active",
     "submitted_by": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b",
     "valid_until": "2026-11-04T15:53:22.781316+00:00",
     "verdict": "GOOD_STANDING"
    }
   ]
  },
  {
   "attestation_count": 1,
   "company_number": "06091951",
   "label": "Thomas Cook Group plc",
   "lei": "",
   "probe_count": 0,
   "registered_at": "2026-10-05T15:48:14.377653+00:00",
   "registrant": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b",
   "revoked": false,
   "approval": {
    "approved": false,
    "attestation_id": 2,
    "attested_at": "2026-10-05T17:49:43.325621+00:00",
    "company_number": "06091951",
    "reason": "VERDICT_NOT_IN_GOOD_STANDING",
    "valid_until": "2026-10-05T17:49:43.325621+00:00",
    "verdict": "NOT_IN_GOOD_STANDING"
   },
   "history": [
    {
     "accounts_overdue": true,
     "adverse_evidence": "",
     "attestation_id": 2,
     "attested_at": "2026-10-05T17:49:43.325621+00:00",
     "company_name": "THOMAS COOK GROUP PLC",
     "company_number": "06091951",
     "confirmation_overdue": true,
     "facts": {
      "accounts_due": "2020-09-30",
      "accounts_overdue": true,
      "accounts_overdue_label": true,
      "active_officers": 0,
      "active_officers_listed": 0,
      "as_of": "2026-10-05",
      "company_name": "THOMAS COOK GROUP PLC",
      "company_number": "06091951",
      "company_number_on_page": "06091951",
      "company_type": "Public limited Company",
      "confirmation_due": "2020-02-28",
      "confirmation_overdue": true,
      "confirmation_overdue_label": true,
      "filings_digest": "23f343f7d4726a86bc0458d068162eadc6a8b9f67e84089d7f741278ae7dbc15",
      "filings_http": 200,
      "filings_parsed": 25,
      "gleif_legal_name": "",
      "latest_active_appointment": "",
      "latest_officer_filing": "",
      "lei": "",
      "lei_check": "NONE",
      "officer_filings_in_window": 0,
      "officer_window_complete": true,
      "officer_window_days": 90,
      "officers_http": 200,
      "officers_total": 44,
      "overview_http": 200,
      "pre_verdict": "NOT_IN_GOOD_STANDING",
      "reasons": [
       "status:Liquidation",
       "accounts_overdue",
       "confirmation_statement_overdue"
      ],
      "resignations_total": 44,
      "status_text": "Liquidation",
      "strike_off_application_pending": false
     },
     "officers_changed": "BASELINE",
     "previous_id": null,
     "reasons": [
      "status:Liquidation",
      "accounts_overdue",
      "confirmation_statement_overdue"
     ],
     "status_changed": "BASELINE",
     "status_text": "Liquidation",
     "submitted_by": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b",
     "valid_until": "2026-10-05T17:49:43.325621+00:00",
     "verdict": "NOT_IN_GOOD_STANDING"
    }
   ]
  },
  {
   "attestation_count": 1,
   "company_number": "14813324",
   "label": "Peninsula Storage Solutions Ltd",
   "lei": "",
   "probe_count": 0,
   "registered_at": "2026-10-05T15:51:06.626211+00:00",
   "registrant": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b",
   "revoked": false,
   "approval": {
    "approved": true,
    "attestation_id": 4,
    "attested_at": "2026-10-05T17:49:43.325621+00:00",
    "company_number": "14813324",
    "reason": "APPROVED",
    "valid_until": "2026-11-04T17:49:43.325621+00:00",
    "verdict": "GOOD_STANDING"
   },
   "history": [
    {
     "accounts_overdue": false,
     "adverse_evidence": "",
     "attestation_id": 4,
     "attested_at": "2026-10-05T17:49:43.325621+00:00",
     "company_name": "PENINSULA STORAGE SOLUTIONS LTD",
     "company_number": "14813324",
     "confirmation_overdue": false,
     "facts": {
      "accounts_due": "2027-01-31",
      "accounts_overdue": false,
      "accounts_overdue_label": false,
      "active_officers": 2,
      "active_officers_listed": 2,
      "as_of": "2026-10-05",
      "company_name": "PENINSULA STORAGE SOLUTIONS LTD",
      "company_number": "14813324",
      "company_number_on_page": "14813324",
      "company_type": "Private limited Company",
      "confirmation_due": "2027-05-02",
      "confirmation_overdue": false,
      "confirmation_overdue_label": false,
      "filings_digest": "af76034f17164fb0df8508e28cd8a140b05b8906c58efe6cdfbb1cb542f2e5e3",
      "filings_http": 200,
      "filings_parsed": 9,
      "gleif_legal_name": "",
      "latest_active_appointment": "2023-04-19",
      "latest_officer_filing": "",
      "lei": "",
      "lei_check": "NONE",
      "officer_filings_in_window": 0,
      "officer_window_complete": true,
      "officer_window_days": 90,
      "officers_http": 200,
      "officers_total": 2,
      "overview_http": 200,
      "pre_verdict": "GOOD_STANDING",
      "reasons": [],
      "resignations_total": 0,
      "status_text": "Active",
      "strike_off_application_pending": false
     },
     "officers_changed": "BASELINE",
     "previous_id": null,
     "reasons": [],
     "status_changed": "BASELINE",
     "status_text": "Active",
     "submitted_by": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b",
     "valid_until": "2026-11-04T17:49:43.325621+00:00",
     "verdict": "GOOD_STANDING"
    }
   ]
  },
  {
   "attestation_count": 1,
   "company_number": "14814841",
   "label": "UAS Business Solutions Ltd",
   "lei": "",
   "probe_count": 0,
   "registered_at": "2026-10-05T15:48:20.336119+00:00",
   "registrant": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b",
   "revoked": false,
   "approval": {
    "approved": false,
    "attestation_id": 3,
    "attested_at": "2026-10-05T17:49:43.325621+00:00",
    "company_number": "14814841",
    "reason": "VERDICT_NOT_IN_GOOD_STANDING",
    "valid_until": "2026-10-05T17:49:43.325621+00:00",
    "verdict": "NOT_IN_GOOD_STANDING"
   },
   "history": [
    {
     "accounts_overdue": false,
     "adverse_evidence": "",
     "attestation_id": 3,
     "attested_at": "2026-10-05T17:49:43.325621+00:00",
     "company_name": "UAS BUSINESS SOLUTIONS LTD",
     "company_number": "14814841",
     "confirmation_overdue": true,
     "facts": {
      "accounts_due": "2027-01-31",
      "accounts_overdue": false,
      "accounts_overdue_label": false,
      "active_officers": 1,
      "active_officers_listed": 1,
      "as_of": "2026-10-05",
      "company_name": "UAS BUSINESS SOLUTIONS LTD",
      "company_number": "14814841",
      "company_number_on_page": "14814841",
      "company_type": "Private limited Company",
      "confirmation_due": "2026-05-02",
      "confirmation_overdue": true,
      "confirmation_overdue_label": true,
      "filings_digest": "fbf244f5c3006a322e6aeb8c10cf996a247e6dbbb8d0af2d78fa826626470cdc",
      "filings_http": 200,
      "filings_parsed": 6,
      "gleif_legal_name": "",
      "latest_active_appointment": "2023-04-19",
      "latest_officer_filing": "",
      "lei": "",
      "lei_check": "NONE",
      "officer_filings_in_window": 0,
      "officer_window_complete": true,
      "officer_window_days": 90,
      "officers_http": 200,
      "officers_total": 1,
      "overview_http": 200,
      "pre_verdict": "NOT_IN_GOOD_STANDING",
      "reasons": [
       "status:Active — Active proposal to strike off",
       "confirmation_statement_overdue"
      ],
      "resignations_total": 0,
      "status_text": "Active — Active proposal to strike off",
      "strike_off_application_pending": false
     },
     "officers_changed": "BASELINE",
     "previous_id": null,
     "reasons": [
      "status:Active — Active proposal to strike off",
      "confirmation_statement_overdue"
     ],
     "status_changed": "BASELINE",
     "status_text": "Active — Active proposal to strike off",
     "submitted_by": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b",
     "valid_until": "2026-10-05T17:49:43.325621+00:00",
     "verdict": "NOT_IN_GOOD_STANDING"
    }
   ]
  },
  {
   "attestation_count": 0,
   "company_number": "17310988",
   "label": "Incorporated July 2026 (never attested)",
   "lei": "",
   "probe_count": 0,
   "registered_at": "2026-10-05T15:51:18.591544+00:00",
   "registrant": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b",
   "revoked": false,
   "approval": {
    "approved": false,
    "company_number": "17310988",
    "reason": "NO_ATTESTATION",
    "valid_until": ""
   },
   "history": []
  }
 ],
 "probes": [
  {
   "attestation_id": 1,
   "changes": [],
   "company_number": "00445790",
   "facts": {
    "accounts_due": "2027-08-26",
    "accounts_overdue": false,
    "as_of": "2026-10-05",
    "company_number": "00445790",
    "confirmation_due": "2027-07-02",
    "confirmation_overdue": false,
    "overview_http": 200,
    "readable": true,
    "status_text": "Active"
   },
   "outcome": "UNCHANGED",
   "probe_id": 0,
   "probed_at": "2026-10-05T17:50:19.070510+00:00",
   "submitted_by": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b"
  }
 ],
 "txs": [
  {
   "step": "register",
   "call": null,
   "args": "00445790",
   "tx": "0x8f97e61e295cfe9e9faa70db67d8065a8b47d5846bceb1874392f92d4da88d6b",
   "result": "FINISHED_WITH_RETURN",
   "revert": ""
  },
  {
   "step": "register",
   "call": null,
   "args": "06091951",
   "tx": "0x4f1b311ad448135d56af2af59f3e50fe3794b3594bf1d06c0a09daabe17f910f",
   "result": "FINISHED_WITH_RETURN",
   "revert": ""
  },
  {
   "step": "register",
   "call": null,
   "args": "14814841",
   "tx": "0x31304c8a43d045e29967fea7fd8167de89c986a7385f43626ed737ef8adf9aed",
   "result": "FINISHED_WITH_RETURN",
   "revert": ""
  },
  {
   "step": "register",
   "call": null,
   "args": "14813324",
   "tx": "0x347635b7ff8566f95bf2b666392e49d7cf74911b12a14bd4bf4f57549bc71e61",
   "result": "FINISHED_WITH_RETURN",
   "revert": ""
  },
  {
   "step": "register",
   "call": null,
   "args": "00185647",
   "tx": "0x90bf7481f6e73b52aa7f621f7f75624b59042ea3ba96a0a68784d99aee64c5a0",
   "result": "FINISHED_WITH_RETURN",
   "revert": ""
  },
  {
   "step": "register",
   "call": null,
   "args": "17310988",
   "tx": "0x2ef07d837b063d8aa08027710ba6e7d7001d4becdfd7c08ac91d6a1c3c0fcfa0",
   "result": "FINISHED_WITH_RETURN",
   "revert": ""
  },
  {
   "step": "attest",
   "call": null,
   "args": "00445790",
   "tx": "0x99fbea08789db53b55d1d84121fcd86f5bd43d1dbe2517985f5a530e676e07ce",
   "result": "FINISHED_WITH_RETURN",
   "revert": ""
  },
  {
   "step": "batch",
   "call": null,
   "args": [
    "06091951",
    "14814841",
    "14813324",
    "00185647"
   ],
   "tx": "0x755b89ca1267e6125010d7a6cec68431bc08ed8fec26ff697ca5afc29a587dde",
   "result": "FINISHED_WITH_RETURN",
   "revert": ""
  },
  {
   "step": "probe",
   "call": null,
   "args": "00445790",
   "tx": "0x0d961a86794bebdf8279980f454fbf513d1fa5e72391efaab75db62384152ad4",
   "result": "FINISHED_WITH_RETURN",
   "revert": ""
  },
  {
   "step": "gate",
   "call": "onboard",
   "args": [
    "00445790",
    "Tesco PLC"
   ],
   "tx": "0xf5272ca67d03513293e1c1e45fa698e34e9248bdf57b4f35d7ad4f5480318d3e",
   "result": "FINISHED_WITH_RETURN",
   "revert": ""
  },
  {
   "step": "gate",
   "call": "onboard",
   "args": [
    "14813324",
    "Peninsula Storage"
   ],
   "tx": "0x1f45ef161a92060179afb33d6bd21c63f4f69d7a23b1369a37f55b4b1bf13333",
   "result": "FINISHED_WITH_RETURN",
   "revert": ""
  },
  {
   "step": "gate",
   "call": "onboard",
   "args": [
    "06091951",
    "Thomas Cook"
   ],
   "tx": "0x18b5680ad4162dcc5541f132e6a1e68c558c15302ddfa8057d60f0281d4ca689",
   "result": "FINISHED_WITH_ERROR",
   "revert": "onboarding 06091951 refused: KYB Desk says VERDICT_NOT_IN_GOOD_STANDING"
  },
  {
   "step": "gate",
   "call": "onboard",
   "args": [
    "14814841",
    "UAS Business Solutions"
   ],
   "tx": "0x527b3b069d8b6e9cb313e9fbd02e2d9875ca61719c9967e9f35a30991bcd29ff",
   "result": "FINISHED_WITH_ERROR",
   "revert": "onboarding 14814841 refused: KYB Desk says VERDICT_NOT_IN_GOOD_STANDING"
  },
  {
   "step": "gate",
   "call": "onboard",
   "args": [
    "17310988",
    "Never attested"
   ],
   "tx": "0xf8fb86a8708a90012f0b3494b7269faceedbc739d47a535c72f2347f24b7698e",
   "result": "FINISHED_WITH_ERROR",
   "revert": "onboarding 17310988 refused: KYB Desk says NO_ATTESTATION"
  },
  {
   "step": "gate",
   "call": "pay",
   "args": [
    "00445790",
    5000
   ],
   "tx": "0x95419b531e73c2d9dba8596df6707b28920e495a08bc9f34451a64310b7cca6e",
   "result": "FINISHED_WITH_RETURN",
   "revert": ""
  },
  {
   "step": "gate",
   "call": "pay",
   "args": [
    "14813324",
    750
   ],
   "tx": "0x9b91b3e262dd1a288cb582edf36066b86fb6e22b613eba2e66226c0c904f41e7",
   "result": "FINISHED_WITH_RETURN",
   "revert": ""
  },
  {
   "step": "gate",
   "call": "pay",
   "args": [
    "06091951",
    100
   ],
   "tx": "0xa76cadc16c53425ab964a8057c5ed17ac20c993573d0a352c2ac04d1e37258fc",
   "result": "FINISHED_WITH_ERROR",
   "revert": "supplier not onboarded"
  }
 ]
};
