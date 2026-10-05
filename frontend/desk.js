// Written by studio-next/snapshot.ts - a snapshot of the live contracts.
window.DESK = {
 "snapshot_at": "2026-10-05T13:06:23.923Z",
 "chain": "GenLayer Studio Next (chain 61997)",
 "explorer": "https://explorer-studio-dev.genlayer.com",
 "desk": {
  "address": "0xc9C8Dd8Fe79Ae433169A9Fb6cd1eA1E6069822fF",
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
  "address": "0xf97448d11167F5c05043e97307325A8aa76121E1",
  "config": {
   "kyb_address": "0xc9C8Dd8Fe79Ae433169A9Fb6cd1eA1E6069822fF",
   "max_age_seconds": 86400,
   "owner": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b",
   "payment_count": 2,
   "vendor_count": 2
  },
  "vendors": [
   {
    "approved_until": "2026-11-04T12:22:21.295020+00:00",
    "attestation_id": 1,
    "company_number": "00445790",
    "name": "Tesco PLC",
    "onboarded_at": "2026-10-05T12:23:27.148790+00:00",
    "onboarded_by": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b",
    "paid": 5000
   },
   {
    "approved_until": "2026-11-04T12:22:44.124673+00:00",
    "attestation_id": 4,
    "company_number": "14813324",
    "name": "Peninsula Storage",
    "onboarded_at": "2026-10-05T12:23:33.348148+00:00",
    "onboarded_by": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b",
    "paid": 750
   }
  ],
  "payments": [
   {
    "amount": 750,
    "attestation_id": 4,
    "company_number": "14813324",
    "recorded_at": "2026-10-05T12:24:04.622390+00:00"
   },
   {
    "amount": 5000,
    "attestation_id": 1,
    "company_number": "00445790",
    "recorded_at": "2026-10-05T12:23:57.606190+00:00"
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
   "registered_at": "2026-10-05T12:21:36.438318+00:00",
   "registrant": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b",
   "revoked": false,
   "approval": {
    "approved": true,
    "attestation_id": 5,
    "attested_at": "2026-10-05T12:22:44.124673+00:00",
    "company_number": "00185647",
    "reason": "APPROVED",
    "valid_until": "2026-11-04T12:22:44.124673+00:00",
    "verdict": "GOOD_STANDING"
   },
   "history": [
    {
     "accounts_overdue": false,
     "adverse_evidence": "",
     "attestation_id": 5,
     "attested_at": "2026-10-05T12:22:44.124673+00:00",
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
     "valid_until": "2026-11-04T12:22:44.124673+00:00",
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
   "registered_at": "2026-10-05T12:21:10.216911+00:00",
   "registrant": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b",
   "revoked": false,
   "approval": {
    "approved": true,
    "attestation_id": 1,
    "attested_at": "2026-10-05T12:22:21.295020+00:00",
    "company_number": "00445790",
    "reason": "APPROVED",
    "valid_until": "2026-11-04T12:22:21.295020+00:00",
    "verdict": "GOOD_STANDING"
   },
   "history": [
    {
     "accounts_overdue": false,
     "adverse_evidence": "",
     "attestation_id": 1,
     "attested_at": "2026-10-05T12:22:21.295020+00:00",
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
     "valid_until": "2026-11-04T12:22:21.295020+00:00",
     "verdict": "GOOD_STANDING"
    },
    {
     "accounts_overdue": false,
     "adverse_evidence": "",
     "attestation_id": 0,
     "attested_at": "2026-10-05T12:21:53.149618+00:00",
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
     "valid_until": "2026-11-04T12:21:53.149618+00:00",
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
   "registered_at": "2026-10-05T12:21:16.337260+00:00",
   "registrant": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b",
   "revoked": false,
   "approval": {
    "approved": false,
    "attestation_id": 2,
    "attested_at": "2026-10-05T12:22:44.124673+00:00",
    "company_number": "06091951",
    "reason": "VERDICT_NOT_IN_GOOD_STANDING",
    "valid_until": "2026-10-05T12:22:44.124673+00:00",
    "verdict": "NOT_IN_GOOD_STANDING"
   },
   "history": [
    {
     "accounts_overdue": true,
     "adverse_evidence": "",
     "attestation_id": 2,
     "attested_at": "2026-10-05T12:22:44.124673+00:00",
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
     "valid_until": "2026-10-05T12:22:44.124673+00:00",
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
   "registered_at": "2026-10-05T12:21:30.450750+00:00",
   "registrant": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b",
   "revoked": false,
   "approval": {
    "approved": true,
    "attestation_id": 4,
    "attested_at": "2026-10-05T12:22:44.124673+00:00",
    "company_number": "14813324",
    "reason": "APPROVED",
    "valid_until": "2026-11-04T12:22:44.124673+00:00",
    "verdict": "GOOD_STANDING"
   },
   "history": [
    {
     "accounts_overdue": false,
     "adverse_evidence": "",
     "attestation_id": 4,
     "attested_at": "2026-10-05T12:22:44.124673+00:00",
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
     "valid_until": "2026-11-04T12:22:44.124673+00:00",
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
   "registered_at": "2026-10-05T12:21:23.206600+00:00",
   "registrant": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b",
   "revoked": false,
   "approval": {
    "approved": false,
    "attestation_id": 3,
    "attested_at": "2026-10-05T12:22:44.124673+00:00",
    "company_number": "14814841",
    "reason": "VERDICT_NOT_IN_GOOD_STANDING",
    "valid_until": "2026-10-05T12:22:44.124673+00:00",
    "verdict": "NOT_IN_GOOD_STANDING"
   },
   "history": [
    {
     "accounts_overdue": false,
     "adverse_evidence": "",
     "attestation_id": 3,
     "attested_at": "2026-10-05T12:22:44.124673+00:00",
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
     "valid_until": "2026-10-05T12:22:44.124673+00:00",
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
   "registered_at": "2026-10-05T12:21:42.372726+00:00",
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
   "probed_at": "2026-10-05T12:23:18.414540+00:00",
   "submitted_by": "0x5cdb5699bc1038e115A973bb91A646f7E98C075b"
  }
 ],
 "txs": [
  {
   "step": "register",
   "call": null,
   "args": "00445790",
   "tx": "0x87a24cc2561d7c8b7fdfe5bbc017f2081fa5ce840158ba4b8d0022f1e318ca81",
   "result": "FINISHED_WITH_RETURN",
   "revert": ""
  },
  {
   "step": "register",
   "call": null,
   "args": "06091951",
   "tx": "0xa455132017cb213434d9d9064c4d6dec68dfce1f5826dde8b09922c77d291247",
   "result": "FINISHED_WITH_RETURN",
   "revert": ""
  },
  {
   "step": "register",
   "call": null,
   "args": "14814841",
   "tx": "0xd995bd689d39e8c49d5119ca729d8c6673df50f5bbffa071ac3857068d5b42aa",
   "result": "FINISHED_WITH_RETURN",
   "revert": ""
  },
  {
   "step": "register",
   "call": null,
   "args": "14813324",
   "tx": "0x7cfa3a644abb5b0550e90de98fe4a24d5482f3495e331951a31825dcb957bcc6",
   "result": "FINISHED_WITH_RETURN",
   "revert": ""
  },
  {
   "step": "register",
   "call": null,
   "args": "00185647",
   "tx": "0x439625d6c2aa83467927cb372a9ea1010e930d2ed48c4f537efbb13e54cb0a52",
   "result": "FINISHED_WITH_RETURN",
   "revert": ""
  },
  {
   "step": "register",
   "call": null,
   "args": "17310988",
   "tx": "0x4c227230ed1410e96540c752bd640d05b60f418f48ea1a6fa3eb5f16aeb47169",
   "result": "FINISHED_WITH_RETURN",
   "revert": ""
  },
  {
   "step": "attest",
   "call": null,
   "args": "00445790",
   "tx": "0xd7ad1e87d39417924be6913b0c322e1f31906b42692bc95749f943a83663eeb7",
   "result": "FINISHED_WITH_RETURN",
   "revert": ""
  },
  {
   "step": "attest",
   "call": null,
   "args": "00445790",
   "tx": "0x251b970f6070aa588bb1cfb111853f2a5176e02f652c32fb82f3c8c3b497a371",
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
   "tx": "0x6b03c449e41ab25cd904a521784a908234318ee58f820b16e4814f2ec1b49cb0",
   "result": "FINISHED_WITH_RETURN",
   "revert": ""
  },
  {
   "step": "probe",
   "call": null,
   "args": "00445790",
   "tx": "0x954b7fdc52311fc24284c70e73b500114a5943681b376d760f6847541130f450",
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
   "tx": "0xedbe97e3f62f8b385dc94e6d4d66e72b91ee39b07c62ea5d9440d26fb3e3a10b",
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
   "tx": "0x9bccf3b28bee21f43cea2add933da9f605202b7522b4df5021844973c15c3e2a",
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
   "tx": "0x7a9b45f6f00b05d53492835120ea2f325198321521af5fbf8312ff2eb323cad6",
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
   "tx": "0xcec6de49b9420c720cdb358b1a589d84780522c56d71abbe688853dd6ed8c801",
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
   "tx": "0x14dde92e9994101a50c9e0029564129c2af3cf9e36ca8563aee89bb334d4d0d2",
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
   "tx": "0xe9d4429b838d02e1172d6e7fda557118f56ae3df864fad56c4642574fe4df2dc",
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
   "tx": "0x9a680b02799f8f2b7c97bce3d2dc94f47f9cdf985f28784162888386a2f274e1",
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
   "tx": "0xd2090303ec9c70768a6b3cae2cfa6528b3c2ae812879fdb6f0a096f6cfec818c",
   "result": "FINISHED_WITH_ERROR",
   "revert": "supplier not onboarded"
  }
 ]
};
