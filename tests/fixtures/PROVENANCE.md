# Test fixture provenance

Captured 2026-09-30 by `scripts/build_fixtures.py` from the live public registers.
Personal data (officer names, dates of birth, nationality, addresses, and people's names inside
filing descriptions) was removed at capture time - see the script's docstring.

## Companies House (https://find-and-update.company-information.service.gov.uk/company/<number>)

- `00445790` - TESCO PLC - active, filings up to date
- `12369751` - ABLAWIN TRADING COMPANY LTD - in liquidation, accounts and confirmation statement overdue
- `14814841` - Active - Active proposal to strike off (a substring check for 'Active' would pass it)
- `17310988` - incorporated July 2026 - 'First accounts' / 'First statement date' wording
- `NI023233` - dissolved (Northern Ireland number format)

## GLEIF (https://api.gleif.org/api/v1/lei-records/<lei>)

- `2138002P5RNKC5W2JZ46` - TESCO PLC - registered at Companies House (RA000585) as 00445790
- `5493007WZ7IFULIL8G21` - Bitpanda GmbH - RETIRED at GLEIF (merged into a successor LEI)
- `98450086582EV2FFC109` - Bitpanda GmbH - current LEI, registered in Austria (not Companies House)
