"""
Captures the real Companies House pages and GLEIF records the tests run
against, so the parser is tested on genuine page structure rather than
hand-written HTML that merely looks similar.

Personal data is removed before anything is written to disk:
- overview pages: the registered-office address (for small companies this
  is often a home address) is replaced.
- officers pages are reduced to exactly what the contract reads - the
  "N officers / M resignations" header and each officer's status tag and
  appointment date, in Companies House's own markup. Names, dates of
  birth, nationality, addresses and identity-verification text are
  dropped entirely.
- filing-history pages: individual people's names inside descriptions
  ("Termination of appointment of <name> as a director ...") are replaced.

Usage (from the repo root):  python3 scripts/build_fixtures.py
Re-running refreshes the fixtures from the live register; the capture
date is written to tests/fixtures/PROVENANCE.md.
"""

import datetime
import json
import pathlib
import re
import urllib.request

CH = "https://find-and-update.company-information.service.gov.uk/company/"
GLEIF = "https://api.gleif.org/api/v1/lei-records/"
OUT = pathlib.Path(__file__).resolve().parent.parent / "tests" / "fixtures"

COMPANIES = {
    "00445790": "TESCO PLC - active, filings up to date",
    "12369751": "ABLAWIN TRADING COMPANY LTD - in liquidation, accounts and confirmation statement overdue",
    "14814841": "Active - Active proposal to strike off (a substring check for 'Active' would pass it)",
    "17310988": "incorporated July 2026 - 'First accounts' / 'First statement date' wording",
    "NI023233": "dissolved (Northern Ireland number format)",
}
LEIS = {
    "2138002P5RNKC5W2JZ46": "TESCO PLC - registered at Companies House (RA000585) as 00445790",
    "5493007WZ7IFULIL8G21": "Bitpanda GmbH - RETIRED at GLEIF (merged into a successor LEI)",
    "98450086582EV2FFC109": "Bitpanda GmbH - current LEI, registered in Austria (not Companies House)",
}


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (fixture capture)"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8")


def redact_overview(page: str) -> str:
    return re.sub(
        r'(<span class="text data" id="roa-address">)(.*?)(</span>)',
        r"\1[registered office address removed from test fixture]\3",
        page,
        flags=re.S,
    )


def reduce_officers(page: str) -> str:
    head_end = page.index('<div class="appointments-list">')
    header = page[:head_end]
    blocks = re.findall(r'<div class="appointment-(\d+)">(.*?)(?=<div class="appointment-\d+">|</div>\s*</div>\s*<nav|\Z)',
                        page[head_end:], re.S)
    kept = []
    for idx, block in blocks:
        parts = [f'<div class="appointment-{idx}">']
        for pattern in (
            rf'<span id="officer-status-tag-{idx}"[^>]*>[^<]*</span>',
            rf'<dd id="officer-appointed-on-{idx}"[^>]*>[^<]*</dd>',
            rf'<dd id="officer-resigned-on-{idx}"[^>]*>[^<]*</dd>',
        ):
            m = re.search(pattern, block, re.S)
            if m:
                parts.append("    " + m.group(0))
        parts.append("</div>")
        kept.append("\n".join(parts))
    footer = "\n</div>\n<!-- officer names, dates of birth, nationality and addresses removed from this test fixture -->\n</body>\n</html>\n"
    return header + '<div class="appointments-list">\n' + "\n".join(kept) + footer


def redact_filings(page: str) -> str:
    # "<strong>Termination of appointment</strong> of NAME as a director on ..."
    page = re.sub(r"(</strong>\s*of\s+)([^<]+?)(\s+as an?\s)", r"\1[name removed]\3", page)
    # "<strong>Director's details changed</strong> for NAME on ..."
    page = re.sub(r"(</strong>\s*for\s+)([^<]+?)(\s+on\s+\d)", r"\1[name removed]\3", page)
    # "Notification of NAME as a person with significant control" / "Cessation of ..."
    page = re.sub(r"((?:Notification|Cessation) of\s+)([^<]+?)(\s+as a person with significant control)",
                  r"\1[name removed]\3", page)
    # "<strong>Registered office address changed</strong> from A to B on ..." -
    # for a small company either address can be someone's home.
    page = re.sub(r"(Registered office address changed</strong>\s*from\s+)([^<]+?)(\s+on\s+\d)",
                  r"\1[addresses removed]\3", page)
    return page


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for cn in COMPANIES:
        (OUT / f"ch_{cn}_overview.html").write_text(redact_overview(fetch(CH + cn)))
        (OUT / f"ch_{cn}_officers.html").write_text(reduce_officers(fetch(CH + cn + "/officers")))
        (OUT / f"ch_{cn}_filing-history.html").write_text(redact_filings(fetch(CH + cn + "/filing-history")))
    for lei in LEIS:
        doc = json.loads(fetch(GLEIF + lei))
        (OUT / f"gleif_{lei}.json").write_text(json.dumps(doc, indent=1))

    lines = [
        "# Test fixture provenance",
        "",
        f"Captured {datetime.date.today().isoformat()} by `scripts/build_fixtures.py` from the live public registers.",
        "Personal data (officer names, dates of birth, nationality, addresses, and people's names inside",
        "filing descriptions) was removed at capture time - see the script's docstring.",
        "",
        "## Companies House (" + CH + "<number>)",
        "",
    ]
    lines += [f"- `{cn}` - {why}" for cn, why in COMPANIES.items()]
    lines += ["", "## GLEIF (" + GLEIF + "<lei>)", ""]
    lines += [f"- `{lei}` - {why}" for lei, why in LEIS.items()]
    (OUT / "PROVENANCE.md").write_text("\n".join(lines) + "\n")
    print(f"wrote fixtures to {OUT}")


if __name__ == "__main__":
    main()
