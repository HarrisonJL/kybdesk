"""
Deterministic tests for EntityStanding using genlayer-test's Direct Mode.

Every Companies House page and GLEIF record these tests serve is a real
capture from the live registers (tests/fixtures/, see PROVENANCE.md and
scripts/build_fixtures.py) - the parser is exercised against genuine page
structure, not hand-written HTML that merely resembles it. Edge cases the
live register didn't happen to contain on capture day (a pending strike-
off application, an overdue deadline with no banner, ...) are built by
editing one element of a real page, never by writing a page from scratch.

Four layers:
1. Registration - input validation and normalisation.
2. Verdicts - one real company per path: GOOD_STANDING, NOT_IN_GOOD_STANDING
   (liquidation, "Active — Active proposal to strike off", dissolved),
   AT_RISK (deterministic and LLM-read), UNVERIFIED (identity, 404,
   unparseable deadlines, LEI binding).
3. Change detection and freshness - officer / status deltas between
   attestations; is_in_good_standing() only true for a fresh GOOD_STANDING.
4. Consensus boundary via direct_vm.run_validator - tampered facts, a
   hidden or fabricated LLM finding, and an LLM claim outside GOOD_STANDING
   are all rejected; an honest leader is accepted.
"""

import datetime
import json
import pathlib
import re
import sys

import pytest

FIXTURES = pathlib.Path(__file__).parent / "fixtures"
CH = "https://find-and-update.company-information.service.gov.uk/company/"
GLEIF = "https://api.gleif.org/api/v1/lei-records/"
NOW = "2026-09-30T12:00:00Z"

TESCO = "00445790"
TESCO_LEI = "2138002P5RNKC5W2JZ46"
LIQUIDATION = "12369751"
STRIKE_OFF_PROPOSED = "14814841"
NEW_COMPANY = "17310988"
DISSOLVED = "NI023233"
BITPANDA_RETIRED_LEI = "5493007WZ7IFULIL8G21"
BITPANDA_CURRENT_LEI = "98450086582EV2FFC109"

LLM_PATTERN = "UNRESOLVED adverse event"


def _fixture(name: str) -> str:
    return (FIXTURES / name).read_text()


def _pages(cn: str) -> dict:
    return {
        "overview": _fixture(f"ch_{cn}_overview.html"),
        "officers": _fixture(f"ch_{cn}_officers.html"),
        "filings": _fixture(f"ch_{cn}_filing-history.html"),
    }


def _replace_once(text: str, old: str, new: str) -> str:
    assert old in text, f"fixture no longer contains {old!r}"
    return text.replace(old, new, 1)


def _set_status(overview_page: str, status: str) -> str:
    new_page, n = re.subn(r'(id="company-status"[^>]*>)\s*[^<]*?\s*(</dd>)', lambda m: m.group(1) + status + m.group(2),
                          overview_page, count=1)
    assert n == 1
    return new_page


def _add_filing(filings_page: str, date: str, form: str, description_html: str) -> str:
    """Insert a newest-first row using Companies House's own row markup."""
    row = (
        "<tr>\n                <td class=\"nowrap\">\n"
        f"{date}                </td>\n"
        "                <td class=\"filing-type sft-toggled js-hidden\">\n"
        f"{form}                </td>\n"
        f"                <td>\n\n{description_html}\n                </td>\n            </tr>\n            "
    )
    new_page, n = re.subn(r'(<tr>\s*<td class="nowrap">)', lambda m: row + m.group(1), filings_page, count=1)
    assert n == 1
    return new_page


def _mock(direct_vm, url: str, body: str, status: int = 200) -> None:
    direct_vm.mock_web(re.escape(url) + "$", {"method": "GET", "status": status, "body": body})


def _serve(direct_vm, cn: str, pages: dict, status: int = 200) -> None:
    _mock(direct_vm, CH + cn, pages["overview"], status)
    _mock(direct_vm, CH + cn + "/officers", pages["officers"], status)
    _mock(direct_vm, CH + cn + "/filing-history", pages["filings"], status)


def _serve_gleif(direct_vm, lei: str, fixture_lei=None, status: int = 200) -> None:
    body = _fixture(f"gleif_{fixture_lei or lei}.json") if status == 200 else "{}"
    _mock(direct_vm, GLEIF + lei, body, status)


def _mock_reader(direct_vm, adverse: bool, evidence=None) -> None:
    direct_vm.mock_llm(LLM_PATTERN, json.dumps({"adverse": adverse, "evidence": evidence}))


def _warp(direct_vm, timestamp: str) -> None:
    # genlayer-test 0.29.2's warp() refreshes only sender/origin in the SDK's
    # already-imported gl.message_raw, never its datetime - so once a
    # contract is deployed, warp() alone never moves the clock the contract
    # reads (found while writing the freshness test below: a 2-hour-old
    # attestation still passed a 1-hour max age). Live GenVM hands every
    # call a fresh timestamp, confirmed on Studio Next - see CONTRACT.md.
    direct_vm.warp(timestamp)
    gl = sys.modules.get("genlayer.gl")
    if gl is not None and getattr(gl, "message_raw", None) is not None:
        gl.message_raw["datetime"] = timestamp


def _deploy(direct_vm, direct_deploy, direct_owner):
    direct_vm.warp(NOW)
    direct_vm.sender = direct_owner
    contract = direct_deploy("contracts/kyb_desk.py")
    _warp(direct_vm, NOW)  # don't inherit a clock an earlier test moved
    return contract


def _attest(contract, direct_vm, cn: str, pages: dict, lei: str = "", adverse=None, evidence=None) -> dict:
    direct_vm.clear_mocks()
    _serve(direct_vm, cn, pages)
    if adverse is not None:
        _mock_reader(direct_vm, adverse, evidence)
    contract.attest(cn)
    return contract.latest_attestation(cn)


# --- 1. Registration ---------------------------------------------------------


def test_initial_state(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    assert es.get_state() == {"entity_count": 0, "attestation_count": 0, "probe_count": 0}


def test_register_normalises_company_number_and_is_readable(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(" 445790 ", "", "Tesco")  # leading zeros dropped, stray spaces
    e = es.get_entity(TESCO)
    assert e["company_number"] == TESCO
    assert e["lei"] == ""
    assert e["attestation_count"] == 0
    assert es.list_entities() == [{"company_number": TESCO, "label": "Tesco", "lei": "", "attestation_count": 0}]
    assert es.latest_verdict(TESCO) == "NONE"
    assert es.is_in_good_standing(TESCO, 10**6) is False


def test_sources_are_built_by_the_contract_not_the_caller(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, TESCO_LEI.lower(), "Tesco")
    assert es.get_sources(TESCO) == [
        CH + TESCO,
        CH + TESCO + "/officers",
        CH + TESCO + "/filing-history",
        GLEIF + TESCO_LEI,
    ]


@pytest.mark.parametrize("bad", ["", "ABC", "123456789", "00-445790", "SC12345/", "00445790?x=1"])
def test_register_rejects_malformed_company_numbers(direct_vm, direct_deploy, direct_owner, bad):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    with pytest.raises(Exception):
        es.register_entity(bad, "", "x")


def test_register_rejects_lei_with_bad_checksum(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    typo = TESCO_LEI[:-1] + ("7" if TESCO_LEI[-1] != "7" else "8")
    with pytest.raises(Exception):
        es.register_entity(TESCO, typo, "Tesco")


def test_register_rejects_duplicate_and_bad_label(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    with pytest.raises(Exception):
        es.register_entity(TESCO, "", "")
    es.register_entity(TESCO, "", "Tesco")
    with pytest.raises(Exception):
        es.register_entity("445790", "", "Tesco again")  # same company once normalised


def test_attest_rejects_unregistered_company(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    with pytest.raises(Exception):
        es.attest(TESCO)


# --- 2. Verdicts on real companies ------------------------------------------


def test_good_standing_active_company_with_deadlines_in_future(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, "", "Tesco")
    a = _attest(es, direct_vm, TESCO, _pages(TESCO), adverse=False)

    assert a["verdict"] == "GOOD_STANDING"
    assert a["reasons"] == []
    assert a["company_name"] == "TESCO PLC"
    assert a["status_text"] == "Active"
    f = a["facts"]
    assert f["company_number_on_page"] == TESCO
    assert f["accounts_due"] == "2027-08-26"
    assert f["confirmation_due"] == "2027-07-02"
    assert f["accounts_overdue"] is False and f["confirmation_overdue"] is False
    assert (f["officers_total"], f["resignations_total"], f["active_officers"]) == (74, 63, 11)
    assert f["active_officers_listed"] == 11
    assert f["filings_parsed"] == 25
    assert a["officers_changed"] == "BASELINE"
    assert a["status_changed"] == "BASELINE"
    assert es.is_in_good_standing(TESCO, 3600) is True


def test_good_standing_new_company_uses_first_deadline_wording(direct_vm, direct_deploy, direct_owner):
    # Incorporated July 2026: its page says "First accounts made up to" and
    # "First statement date". Only matching "Next statement date" made
    # every young company UNVERIFIED - caught by the real-page corpus.
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(NEW_COMPANY, "", "New co")
    a = _attest(es, direct_vm, NEW_COMPANY, _pages(NEW_COMPANY), adverse=False)
    assert a["verdict"] == "GOOD_STANDING"
    assert a["facts"]["accounts_due"] == "2028-04-01"
    assert a["facts"]["confirmation_due"] == "2027-07-14"


def test_liquidation_is_not_in_good_standing_without_consulting_the_llm(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(LIQUIDATION, "", "Liquidation co")
    a = _attest(es, direct_vm, LIQUIDATION, _pages(LIQUIDATION))  # no LLM mock: calling it would fail
    assert a["verdict"] == "NOT_IN_GOOD_STANDING"
    assert a["reasons"] == ["status:Liquidation", "accounts_overdue", "confirmation_statement_overdue"]
    assert a["facts"]["accounts_overdue_label"] is True
    assert es.is_in_good_standing(LIQUIDATION, 10**6) is False


def test_active_proposal_to_strike_off_is_not_good_standing(direct_vm, direct_deploy, direct_owner):
    # The status text starts with "Active" - a substring check would pass it.
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(STRIKE_OFF_PROPOSED, "", "Strike-off co")
    a = _attest(es, direct_vm, STRIKE_OFF_PROPOSED, _pages(STRIKE_OFF_PROPOSED))
    assert a["status_text"] == "Active — Active proposal to strike off"
    assert a["verdict"] == "NOT_IN_GOOD_STANDING"
    assert a["reasons"][0] == "status:Active — Active proposal to strike off"
    assert "confirmation_statement_overdue" in a["reasons"]


def test_dissolved_company_is_not_in_good_standing(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(DISSOLVED, "", "Dissolved co")
    a = _attest(es, direct_vm, DISSOLVED, _pages(DISSOLVED))
    assert a["verdict"] == "NOT_IN_GOOD_STANDING"
    assert a["reasons"] == ["status:Dissolved"]


def test_overdue_by_deadline_date_even_without_the_overdue_banner(direct_vm, direct_deploy, direct_owner):
    # Defence in depth: the banner is one signal, the parsed due date vs the
    # consensus timestamp is another. Either is enough to fail.
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, "", "Tesco")
    pages = _pages(TESCO)
    pages["overview"] = _replace_once(pages["overview"], "<strong>26 August 2027</strong>", "<strong>26 August 2026</strong>")
    a = _attest(es, direct_vm, TESCO, pages)
    assert a["facts"]["accounts_overdue_label"] is False
    assert a["facts"]["accounts_overdue"] is True
    assert a["verdict"] == "NOT_IN_GOOD_STANDING"
    assert a["reasons"] == ["accounts_overdue"]


def test_deadline_on_the_due_date_itself_is_not_overdue(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, "", "Tesco")
    pages = _pages(TESCO)
    pages["overview"] = _replace_once(pages["overview"], "<strong>2 July 2027</strong>", "<strong>30 September 2026</strong>")
    a = _attest(es, direct_vm, TESCO, pages, adverse=False)
    assert a["facts"]["confirmation_overdue"] is False
    assert a["verdict"] == "GOOD_STANDING"


def test_company_name_containing_overdue_wording_does_not_trip_the_banner_check(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, "", "Tesco")
    pages = _pages(TESCO)
    pages["overview"] = pages["overview"].replace("TESCO PLC", "ACCOUNTS OVERDUE AND CONFIRMATION STATEMENT OVERDUE PLC")
    a = _attest(es, direct_vm, TESCO, pages, adverse=False)
    assert a["facts"]["accounts_overdue_label"] is False
    assert a["facts"]["confirmation_overdue_label"] is False
    assert a["verdict"] == "GOOD_STANDING"


def test_pending_strike_off_application_is_at_risk_deterministically(direct_vm, direct_deploy, direct_owner):
    # A company that has applied to strike itself off keeps plain "Active"
    # until the Gazette notice, weeks later. The spine catches the DS01
    # itself - the LLM isn't needed (and isn't consulted: no mock here).
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, "", "Tesco")
    pages = _pages(TESCO)
    pages["filings"] = _add_filing(pages["filings"], "25 Sep 2026", "DS01",
                                   "<strong>Application to strike the company off the register</strong>")
    a = _attest(es, direct_vm, TESCO, pages)
    assert a["facts"]["strike_off_application_pending"] is True
    assert a["verdict"] == "AT_RISK"
    assert a["reasons"] == ["strike_off_application_pending"]
    assert es.is_in_good_standing(TESCO, 10**6) is False


def test_withdrawn_strike_off_application_is_not_pending(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, "", "Tesco")
    pages = _pages(TESCO)
    pages["filings"] = _add_filing(pages["filings"], "20 Sep 2026", "DS01",
                                   "<strong>Application to strike the company off the register</strong>")
    pages["filings"] = _add_filing(pages["filings"], "27 Sep 2026", "DS02",
                                   "<strong>Withdrawal of the application for voluntary strike-off</strong>")
    a = _attest(es, direct_vm, TESCO, pages, adverse=False)
    assert a["facts"]["strike_off_application_pending"] is False
    assert a["verdict"] == "GOOD_STANDING"


def test_llm_reader_downgrades_to_at_risk_with_a_grounded_quote(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, "", "Tesco")
    pages = _pages(TESCO)
    pages["filings"] = _add_filing(pages["filings"], "26 Sep 2026", "RESOLUTIONS",
                                   "<strong>Resolutions</strong>\nLRESSP ‐\nSpecial resolution to wind up on 2026-09-22")
    a = _attest(es, direct_vm, TESCO, pages, adverse=True,
                evidence="Special resolution to wind up on 2026-09-22")
    assert a["verdict"] == "AT_RISK"
    assert a["reasons"] == ["adverse_filing"]
    assert a["adverse_evidence"] == "Special resolution to wind up on 2026-09-22"
    assert es.is_in_good_standing(TESCO, 10**6) is False


def test_llm_finding_that_quotes_no_real_filing_is_discarded(direct_vm, direct_deploy, direct_owner):
    # The reader can only downgrade by pointing at a filing that exists. A
    # claim it can't quote is not published about a real, named company.
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, "", "Tesco")
    a = _attest(es, direct_vm, TESCO, _pages(TESCO), adverse=True,
                evidence="Notice of appointment of an administrator")
    assert a["verdict"] == "GOOD_STANDING"
    assert a["adverse_evidence"] == ""


def test_llm_quote_too_short_to_identify_a_filing_is_discarded(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, "", "Tesco")
    a = _attest(es, direct_vm, TESCO, _pages(TESCO), adverse=True, evidence="shares")  # appears, but identifies nothing
    assert a["verdict"] == "GOOD_STANDING"


def test_identity_mismatch_is_unverified(direct_vm, direct_deploy, direct_owner):
    # Registered 00445791 but the register returns Tesco's page (00445790):
    # nothing on it may be attributed to the company actually asked about.
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity("00445791", "", "Wrong number")
    a = _attest(es, direct_vm, "00445791", _pages(TESCO))
    assert a["verdict"] == "UNVERIFIED"
    assert a["reasons"] == ["identity_mismatch", "identity_mismatch:officers", "identity_mismatch:filing_history"]


@pytest.mark.parametrize("page,reason", [
    ("officers", "identity_mismatch:officers"),
    ("filings", "identity_mismatch:filing_history"),
])
def test_each_page_is_tied_to_the_company_independently(direct_vm, direct_deploy, direct_owner, page, reason):
    # Tesco's real overview, but one supporting page belongs to another
    # company: facts from it must not be attributed to Tesco.
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, "", "Tesco")
    pages = _pages(TESCO)
    pages[page] = _pages(LIQUIDATION)[page]
    a = _attest(es, direct_vm, TESCO, pages)
    assert a["verdict"] == "UNVERIFIED"
    assert a["reasons"] == [reason]


def test_unknown_company_number_is_unverified(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity("99999999", "", "Nobody")
    direct_vm.clear_mocks()
    _serve(direct_vm, "99999999", {"overview": "Not found", "officers": "Not found", "filings": "Not found"}, status=404)
    es.attest("99999999")
    a = es.latest_attestation("99999999")
    assert a["verdict"] == "UNVERIFIED"
    assert a["reasons"] == ["company_not_found", "officers_http_404", "filing_history_http_404"]


def test_unparseable_deadlines_fail_closed(direct_vm, direct_deploy, direct_owner):
    # If Companies House changed its layout, "no overdue date found" must
    # not read as "not overdue".
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, "", "Tesco")
    pages = _pages(TESCO)
    pages["overview"] = _replace_once(pages["overview"], "due by\n", "payable on\n")
    a = _attest(es, direct_vm, TESCO, pages)
    assert a["facts"]["accounts_due"] == ""
    assert a["verdict"] == "UNVERIFIED"
    assert a["reasons"] == ["filing_deadlines_unparsed"]


def test_unreadable_officers_page_fails_closed(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, "", "Tesco")
    pages = _pages(TESCO)
    pages["officers"] = "<html><body>People for TESCO PLC (00445790): temporarily unavailable</body></html>"
    a = _attest(es, direct_vm, TESCO, pages)
    assert a["verdict"] == "UNVERIFIED"
    assert a["reasons"] == ["officer_counts_unparsed"]


def test_lei_bound_through_gleif(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, TESCO_LEI, "Tesco")
    direct_vm.clear_mocks()
    _serve(direct_vm, TESCO, _pages(TESCO))
    _serve_gleif(direct_vm, TESCO_LEI)
    _mock_reader(direct_vm, False)
    es.attest(TESCO)
    a = es.latest_attestation(TESCO)
    assert a["facts"]["lei_check"] == "BOUND"
    assert a["facts"]["gleif_legal_name"] == "TESCO PLC"
    assert a["verdict"] == "GOOD_STANDING"


def test_lei_of_a_different_entity_is_unverified(direct_vm, direct_deploy, direct_owner):
    # A real, current LEI - but GLEIF says it belongs to an Austrian company,
    # not Companies House number 00445790.
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, BITPANDA_CURRENT_LEI, "Tesco?")
    direct_vm.clear_mocks()
    _serve(direct_vm, TESCO, _pages(TESCO))
    _serve_gleif(direct_vm, BITPANDA_CURRENT_LEI)
    es.attest(TESCO)
    a = es.latest_attestation(TESCO)
    assert a["verdict"] == "UNVERIFIED"
    assert a["reasons"] == ["lei_check:NOT_THIS_COMPANY"]


def test_retired_lei_is_unverified(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, BITPANDA_RETIRED_LEI, "Retired LEI")
    direct_vm.clear_mocks()
    _serve(direct_vm, TESCO, _pages(TESCO))
    _serve_gleif(direct_vm, BITPANDA_RETIRED_LEI)
    es.attest(TESCO)
    assert es.latest_attestation(TESCO)["reasons"] == ["lei_check:LEI_NOT_CURRENT"]


def _gleif_variant(direct_vm, lei: str, registration_status: str, entity_status: str) -> None:
    doc = json.loads(_fixture(f"gleif_{lei}.json"))
    doc["data"]["attributes"]["registration"]["status"] = registration_status
    doc["data"]["attributes"]["entity"]["status"] = entity_status
    _mock(direct_vm, GLEIF + lei, json.dumps(doc))


@pytest.mark.parametrize("registration_status,entity_status,expected", [
    ("RETIRED", "ACTIVE", "LEI_NOT_CURRENT"),     # the LEI itself is no longer valid
    ("ANNULLED", "ACTIVE", "LEI_NOT_CURRENT"),
    ("ISSUED", "INACTIVE", "LEI_NOT_CURRENT"),    # the legal entity has ceased
    ("LAPSED", "ACTIVE", "BOUND"),                # unpaid renewal only - identity unchanged
])
def test_lei_registration_and_entity_status_each_checked(direct_vm, direct_deploy, direct_owner,
                                                         registration_status, entity_status, expected):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, TESCO_LEI, "Tesco")
    direct_vm.clear_mocks()
    _serve(direct_vm, TESCO, _pages(TESCO))
    _gleif_variant(direct_vm, TESCO_LEI, registration_status, entity_status)
    _mock_reader(direct_vm, False)
    es.attest(TESCO)
    a = es.latest_attestation(TESCO)
    assert a["facts"]["lei_check"] == expected
    assert a["verdict"] == ("GOOD_STANDING" if expected == "BOUND" else "UNVERIFIED")


def test_gleif_record_for_a_different_lei_is_rejected(direct_vm, direct_deploy, direct_owner):
    # A well-formed, current record - just not the one that was asked for.
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, TESCO_LEI, "Tesco")
    direct_vm.clear_mocks()
    _serve(direct_vm, TESCO, _pages(TESCO))
    _serve_gleif(direct_vm, TESCO_LEI, fixture_lei=BITPANDA_CURRENT_LEI)
    es.attest(TESCO)
    assert es.latest_attestation(TESCO)["reasons"] == ["lei_check:GLEIF_RECORD_MISMATCH"]


def test_lei_unknown_to_gleif_is_unverified(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, TESCO_LEI, "Tesco")
    direct_vm.clear_mocks()
    _serve(direct_vm, TESCO, _pages(TESCO))
    _serve_gleif(direct_vm, TESCO_LEI, status=404)
    es.attest(TESCO)
    assert es.latest_attestation(TESCO)["reasons"] == ["lei_check:LEI_NOT_FOUND"]


# --- 3. Change detection, officer window, freshness --------------------------


def test_officer_and_status_changes_are_detected_between_attestations(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, "", "Tesco")
    assert _attest(es, direct_vm, TESCO, _pages(TESCO), adverse=False)["officers_changed"] == "BASELINE"

    second = _attest(es, direct_vm, TESCO, _pages(TESCO), adverse=False)
    assert second["officers_changed"] == "UNCHANGED"
    assert second["status_changed"] == "UNCHANGED"

    # One new appointment anywhere in the company's history moves the total,
    # even though the officer list itself is paginated and unordered.
    pages = _pages(TESCO)
    pages["officers"] = pages["officers"].replace("74 officers / 63 resignations", "75 officers / 63 resignations")
    third = _attest(es, direct_vm, TESCO, pages, adverse=False)
    assert third["officers_changed"] == "CHANGED"
    assert third["facts"]["active_officers"] == 12

    pages = _pages(TESCO)
    pages["overview"] = _set_status(pages["overview"], "Liquidation")
    fourth = _attest(es, direct_vm, TESCO, pages)
    assert fourth["status_changed"] == "CHANGED"
    assert fourth["verdict"] == "NOT_IN_GOOD_STANDING"
    assert es.get_entity(TESCO)["attestation_count"] == 4
    assert [a["verdict"] for a in es.get_attestations(0, 10)] == [
        "NOT_IN_GOOD_STANDING", "GOOD_STANDING", "GOOD_STANDING", "GOOD_STANDING"]


def test_previous_unreadable_status_is_unknown_not_changed(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, "", "Tesco")
    direct_vm.clear_mocks()
    _serve(direct_vm, TESCO, {"overview": "x", "officers": "x", "filings": "x"}, status=503)
    es.attest(TESCO)
    assert es.latest_verdict(TESCO) == "UNVERIFIED"
    a = _attest(es, direct_vm, TESCO, _pages(TESCO), adverse=False)
    assert a["status_changed"] == "UNKNOWN"
    assert a["officers_changed"] == "UNKNOWN"


def test_officer_changes_in_window_counted_with_honest_completeness(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(LIQUIDATION, "", "Small history")
    # The liquidation company's 25 most recent filings reach back to 2021,
    # far past the 90-day window - so page 1 covers the window completely.
    a = _attest(es, direct_vm, LIQUIDATION, _pages(LIQUIDATION))
    assert a["facts"]["officer_window_complete"] is True
    assert a["facts"]["officer_filings_in_window"] == 0

    pages = _pages(LIQUIDATION)
    pages["filings"] = _add_filing(pages["filings"], "15 Sep 2026", "TM01",
                                   "<strong>Termination of appointment</strong> of [name removed] as a director on 12 September 2026")
    pages["filings"] = _add_filing(pages["filings"], "16 Sep 2026", "AP01",
                                   "<strong>Appointment</strong> of [name removed] as a director on 14 September 2026")
    b = _attest(es, direct_vm, LIQUIDATION, pages)
    assert b["facts"]["officer_filings_in_window"] == 2
    assert b["facts"]["latest_officer_filing"] == "2026-09-16"


def test_officer_window_completeness_is_reported_honestly(direct_vm, direct_deploy, direct_owner):
    # Page 1 holds the 25 most recent filings. It only covers the 90-day
    # window completely if its oldest filing predates the window - for a
    # busy company it may not, and then the count is a floor and the facts
    # say so instead of implying completeness.
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, "", "Tesco")
    f = _attest(es, direct_vm, TESCO, _pages(TESCO), adverse=False)["facts"]
    dates = [datetime.datetime.strptime(d, "%d %b %Y").date()
             for d in re.findall(r'<td class="nowrap">\s*(\d{2} \w{3} \d{4})', _pages(TESCO)["filings"])]
    assert len(dates) == 25
    window_start = datetime.date(2026, 9, 30) - datetime.timedelta(days=90)
    assert f["officer_window_complete"] is (min(dates) < window_start)

    # The same 25 real rows, all re-dated inside the window: page 1 can no
    # longer prove there was nothing older inside the window.
    pages = _pages(TESCO)
    pages["filings"] = re.sub(r'(<td class="nowrap">\s*)\d{2} \w{3} \d{4}', r"\g<1>20 Sep 2026", pages["filings"])
    busy = _attest(es, direct_vm, TESCO, pages, adverse=False)["facts"]
    assert busy["filings_parsed"] == 25
    assert busy["officer_window_complete"] is False


def test_is_in_good_standing_requires_freshness(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, "", "Tesco")
    _attest(es, direct_vm, TESCO, _pages(TESCO), adverse=False)
    _warp(direct_vm, "2026-09-30T12:30:00Z")
    assert es.is_in_good_standing(TESCO, 3600) is True
    _warp(direct_vm, "2026-09-30T14:00:01Z")
    assert es.is_in_good_standing(TESCO, 3600) is False
    assert es.is_in_good_standing(TESCO, 86400) is True
    assert es.is_in_good_standing("00000001", 86400) is False


def test_a_later_bad_attestation_replaces_an_earlier_good_one(direct_vm, direct_deploy, direct_owner):
    # Consumers read the LATEST verdict, not "was it ever good".
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, "", "Tesco")
    _attest(es, direct_vm, TESCO, _pages(TESCO), adverse=False)
    assert es.is_in_good_standing(TESCO, 3600) is True
    pages = _pages(TESCO)
    pages["overview"] = _set_status(pages["overview"], "Liquidation")
    _attest(es, direct_vm, TESCO, pages)
    assert es.is_in_good_standing(TESCO, 3600) is False
    assert es.latest_verdict(TESCO) == "NOT_IN_GOOD_STANDING"


# --- 4. Consensus boundary -----------------------------------------------------


def _leader_payload(a: dict, adverse=False, evidence=None, **fact_overrides) -> str:
    facts = dict(a["facts"])
    facts.update(fact_overrides)
    # attest() is a batch of one: the leader returns a list with one item.
    return json.dumps([{"facts": facts, "adverse": adverse, "evidence": evidence}], sort_keys=True)


def test_validator_accepts_an_honest_leader(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, "", "Tesco")
    a = _attest(es, direct_vm, TESCO, _pages(TESCO), adverse=False)
    assert direct_vm.run_validator() is True
    assert direct_vm.run_validator(leader_result=_leader_payload(a)) is True


def test_validator_rejects_tampered_facts(direct_vm, direct_deploy, direct_owner):
    # A leader claiming the liquidation company is Active and GOOD_STANDING.
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(LIQUIDATION, "", "Liquidation co")
    a = _attest(es, direct_vm, LIQUIDATION, _pages(LIQUIDATION))
    forged = _leader_payload(a, status_text="Active", pre_verdict="GOOD_STANDING", reasons=[],
                             accounts_overdue=False, confirmation_overdue=False)
    assert direct_vm.run_validator(leader_result=forged) is False


def test_validator_rejects_leader_hiding_a_grounded_adverse_filing(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, "", "Tesco")
    pages = _pages(TESCO)
    pages["filings"] = _add_filing(pages["filings"], "26 Sep 2026", "RESOLUTIONS",
                                   "<strong>Resolutions</strong>\nLRESSP ‐\nSpecial resolution to wind up on 2026-09-22")
    a = _attest(es, direct_vm, TESCO, pages, adverse=True, evidence="Special resolution to wind up on 2026-09-22")
    assert direct_vm.run_validator() is True
    hidden = _leader_payload(a, adverse=False, evidence=None, pre_verdict="GOOD_STANDING", reasons=[])
    assert direct_vm.run_validator(leader_result=hidden) is False


def test_validator_rejects_adverse_claim_quoting_a_filing_it_cannot_find(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, "", "Tesco")
    pages = _pages(TESCO)
    pages["filings"] = _add_filing(pages["filings"], "26 Sep 2026", "RESOLUTIONS",
                                   "<strong>Resolutions</strong>\nLRESSP ‐\nSpecial resolution to wind up on 2026-09-22")
    a = _attest(es, direct_vm, TESCO, pages, adverse=True, evidence="Special resolution to wind up on 2026-09-22")
    fabricated = _leader_payload(a, adverse=True, evidence="Order of court to wind up the company")
    assert direct_vm.run_validator(leader_result=fabricated) is False


def test_validator_rejects_adverse_claim_its_own_reader_does_not_share(direct_vm, direct_deploy, direct_owner):
    # Disagreement on the reader's DECISION is itself grounds to reject,
    # independent of whether the leader attached a quote.
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, "", "Tesco")
    a = _attest(es, direct_vm, TESCO, _pages(TESCO), adverse=False)  # my reader: not adverse
    assert direct_vm.run_validator(leader_result=_leader_payload(a, adverse=True, evidence=None)) is False
    real_row = "Purchase of own shares."
    assert real_row in json.dumps(_pages(TESCO)["filings"])
    assert direct_vm.run_validator(leader_result=_leader_payload(a, adverse=True, evidence=real_row)) is False


def test_validator_rejects_llm_claim_outside_good_standing(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(LIQUIDATION, "", "Liquidation co")
    a = _attest(es, direct_vm, LIQUIDATION, _pages(LIQUIDATION))
    invented = _leader_payload(a, adverse=True, evidence="Appointment of a voluntary liquidator")
    assert direct_vm.run_validator(leader_result=invented) is False


def test_validator_rejects_error_and_garbage_leader_results(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, "", "Tesco")
    _attest(es, direct_vm, TESCO, _pages(TESCO), adverse=False)
    assert direct_vm.run_validator(leader_error=Exception("fetch failed")) is False
    assert direct_vm.run_validator(leader_result="not json") is False
    assert direct_vm.run_validator(leader_result=json.dumps(["a", "list"])) is False


def test_validator_rejects_leader_that_saw_different_filings(direct_vm, direct_deploy, direct_owner):
    # Same verdict, but the leader's filings digest doesn't match mine - so
    # its LLM read different evidence than every other validator's did.
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    es.register_entity(TESCO, "", "Tesco")
    a = _attest(es, direct_vm, TESCO, _pages(TESCO), adverse=False)
    assert direct_vm.run_validator(leader_result=_leader_payload(a, filings_digest="0" * 64)) is False
