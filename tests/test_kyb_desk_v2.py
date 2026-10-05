"""
Tests for what KYB Desk adds to EntityStanding v1: approval expiry, the
change tripwire (probe), batch attestation, per-company history, and
get_approval / is_approved. (tests/test_kyb_desk.py is v1's 54 tests, run
unchanged against this contract - the spine is untouched.)

Same inputs as v1: every Companies House page is a real capture
(tests/fixtures/). Edge cases are made by editing one element of a real page.

Dates in the Tesco capture: accounts due 26 August 2027, confirmation
statement due 2 July 2027. With the tests' clock at 2026-09-30T12:00Z an
approval therefore lasts the full APPROVAL_DAYS (30) -> 2026-10-30T12:00Z,
until a test moves a deadline inside that window.
"""

import json

import pytest

from test_kyb_desk import (
    CH, LIQUIDATION, NOW, STRIKE_OFF_PROPOSED, TESCO, _attest, _deploy, _mock, _mock_reader, _pages,
    _replace_once, _serve, _set_status, _warp,
)

TESCO_ACCOUNTS_DUE = "<strong>26 August 2027</strong>"
TESCO_CONFIRMATION_DUE = "<strong>2 July 2027</strong>"
VALID_FULL = "2026-10-30T12:00:00+00:00"  # NOW + 30 days


def _register(es, *cns):
    for cn in cns:
        es.register_entity(cn, "", cn)


def _with_deadline(pages: dict, field: str, date_text: str) -> dict:
    out = dict(pages)
    out["overview"] = _replace_once(pages["overview"], field, f"<strong>{date_text}</strong>")
    return out


def _probe(es, direct_vm, cn: str, overview: str, status: int = 200) -> dict:
    """Serve only the overview page: a probe that fetched anything else would
    fail on the missing mock."""
    direct_vm.clear_mocks()
    _mock(direct_vm, CH + cn, overview, status)
    es.probe(cn)
    return es.get_probes(0, 1)[0]


def _approved_tesco(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    _register(es, TESCO)
    _attest(es, direct_vm, TESCO, _pages(TESCO), adverse=False)
    return es


# --- 1. valid_until ----------------------------------------------------------


def test_approval_lasts_thirty_days_when_no_deadline_is_sooner(direct_vm, direct_deploy, direct_owner):
    es = _approved_tesco(direct_vm, direct_deploy, direct_owner)
    a = es.latest_attestation(TESCO)
    assert a["verdict"] == "GOOD_STANDING" and a["valid_until"] == VALID_FULL
    assert es.get_rules()["approval_days"] == 30


def test_approval_never_reaches_the_day_a_filing_deadline_falls(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    _register(es, TESCO)
    pages = _with_deadline(_pages(TESCO), TESCO_CONFIRMATION_DUE, "10 October 2026")
    a = _attest(es, direct_vm, TESCO, pages, adverse=False)
    assert a["verdict"] == "GOOD_STANDING"
    assert a["valid_until"] == "2026-10-10T00:00:00+00:00"  # the start of the due day, 20 days out


def test_the_earlier_of_the_two_deadlines_wins(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    _register(es, TESCO)
    pages = _with_deadline(_pages(TESCO), TESCO_CONFIRMATION_DUE, "20 October 2026")
    pages = _with_deadline(pages, TESCO_ACCOUNTS_DUE, "12 October 2026")
    a = _attest(es, direct_vm, TESCO, pages, adverse=False)
    assert a["valid_until"] == "2026-10-12T00:00:00+00:00"


def test_a_deadline_falling_today_gives_an_approval_that_is_already_expired(direct_vm, direct_deploy, direct_owner):
    # Not overdue yet (the deadline is today), so the verdict is GOOD_STANDING -
    # but an approval must not reach into the day the company could miss it.
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    _register(es, TESCO)
    pages = _with_deadline(_pages(TESCO), TESCO_ACCOUNTS_DUE, "30 September 2026")
    a = _attest(es, direct_vm, TESCO, pages, adverse=False)
    assert a["verdict"] == "GOOD_STANDING" and a["valid_until"] == a["attested_at"]
    ap = es.get_approval(TESCO, 10**6)
    assert ap["approved"] is False and ap["reason"] == "EXPIRED"


@pytest.mark.parametrize("cn", [LIQUIDATION, STRIKE_OFF_PROPOSED])
def test_a_verdict_that_is_not_an_approval_is_expired_when_recorded(direct_vm, direct_deploy, direct_owner, cn):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    _register(es, cn)
    a = _attest(es, direct_vm, cn, _pages(cn))
    assert a["verdict"] == "NOT_IN_GOOD_STANDING" and a["valid_until"] == a["attested_at"]
    assert es.get_approval(cn, 10**6)["reason"] == "VERDICT_NOT_IN_GOOD_STANDING"


# --- 2. get_approval / is_approved --------------------------------------------


def test_approval_reasons_in_order(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    _register(es, TESCO)
    assert es.get_approval(TESCO, 3600) == {"company_number": TESCO, "approved": False,
                                            "reason": "NO_ATTESTATION", "valid_until": ""}
    assert es.get_approval("99999998", 3600)["reason"] == "NO_ATTESTATION"  # not even registered
    _attest(es, direct_vm, TESCO, _pages(TESCO), adverse=False)
    ap = es.get_approval(TESCO, 3600)
    assert ap["approved"] is True and ap["reason"] == "APPROVED" and ap["valid_until"] == VALID_FULL
    assert ap["attestation_id"] == 0 and ap["verdict"] == "GOOD_STANDING"
    assert es.is_approved(TESCO, 3600) is True

    _warp(direct_vm, "2026-09-30T14:00:00Z")  # two hours on
    assert es.get_approval(TESCO, 3600)["reason"] == "STALE"  # caller's own limit
    assert es.get_approval(TESCO, 7200 + 1)["reason"] == "APPROVED"
    assert es.is_approved(TESCO, 3600) is False

    _warp(direct_vm, "2026-10-30T11:59:59Z")
    assert es.get_approval(TESCO, 10**9)["reason"] == "APPROVED"
    _warp(direct_vm, VALID_FULL.replace("+00:00", "Z"))  # exactly valid_until: expired
    assert es.get_approval(TESCO, 10**9)["reason"] == "EXPIRED"
    assert es.is_approved(TESCO, 10**9) is False
    # EntityStanding v1's name for the same question is the same answer.
    assert es.is_in_good_standing(TESCO, 10**9) is False


# --- 3. History ----------------------------------------------------------------


def test_history_walks_one_companys_own_chain(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    _register(es, TESCO, LIQUIDATION)
    _attest(es, direct_vm, TESCO, _pages(TESCO), adverse=False)        # id 0
    _attest(es, direct_vm, LIQUIDATION, _pages(LIQUIDATION))           # id 1
    _attest(es, direct_vm, TESCO, _pages(TESCO), adverse=False)        # id 2
    _attest(es, direct_vm, LIQUIDATION, _pages(LIQUIDATION))           # id 3
    _attest(es, direct_vm, TESCO, _pages(TESCO), adverse=False)        # id 4
    history = es.get_history(TESCO, 10)
    assert [h["attestation_id"] for h in history] == [4, 2, 0]
    assert [h["previous_id"] for h in history] == [2, 0, None]
    assert {h["company_number"] for h in history} == {TESCO}
    assert [h["attestation_id"] for h in es.get_history(LIQUIDATION, 10)] == [3, 1]
    assert [h["attestation_id"] for h in es.get_history(TESCO, 2)] == [4, 2]
    assert es.get_history(TESCO, 0) == []
    assert es.get_history(TESCO, 10)[0]["officers_changed"] == "UNCHANGED"
    assert es.get_history(TESCO, 10)[-1]["officers_changed"] == "BASELINE"


def test_history_of_a_registered_company_with_no_attestation_is_empty(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    _register(es, TESCO)
    assert es.get_history(TESCO, 10) == []
    with pytest.raises(Exception, match="not registered"):
        es.get_history(LIQUIDATION, 10)


# --- 4. Batches ----------------------------------------------------------------


def _serve_all(direct_vm, cns):
    direct_vm.clear_mocks()
    for cn in cns:
        _serve(direct_vm, cn, _pages(cn))
    _mock_reader(direct_vm, False)


def test_a_batch_attests_every_company_in_one_transaction(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    cns = [TESCO, LIQUIDATION, STRIKE_OFF_PROPOSED]
    _register(es, *cns)
    _serve_all(direct_vm, cns)
    es.attest_batch(cns)
    assert es.get_state() == {"entity_count": 3, "attestation_count": 3, "probe_count": 0}
    assert [es.latest_verdict(cn) for cn in cns] == ["GOOD_STANDING", "NOT_IN_GOOD_STANDING", "NOT_IN_GOOD_STANDING"]
    assert [a["company_number"] for a in es.get_attestations(0, 10)] == cns[::-1]
    assert es.get_approval(TESCO, 3600)["approved"] is True
    assert es.get_approval(LIQUIDATION, 3600)["approved"] is False


def test_batch_numbers_are_normalised_like_single_attests(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    _register(es, TESCO)
    _serve_all(direct_vm, [TESCO])
    es.attest_batch([" 445790 "])
    assert es.latest_attestation(TESCO)["company_number"] == TESCO


def test_a_batch_with_one_adverse_company_keeps_the_others_clean(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    cns = [TESCO, STRIKE_OFF_PROPOSED]
    _register(es, *cns)
    pages = _pages(TESCO)
    from test_kyb_desk import _add_filing
    pages["filings"] = _add_filing(pages["filings"], "26 Sep 2026", "RESOLUTIONS",
                                   "<strong>Resolutions</strong>\nLRESSP ‐\nSpecial resolution to wind up on 2026-09-22")
    direct_vm.clear_mocks()
    _serve(direct_vm, TESCO, pages)
    _serve(direct_vm, STRIKE_OFF_PROPOSED, _pages(STRIKE_OFF_PROPOSED))
    _mock_reader(direct_vm, True, "Special resolution to wind up on 2026-09-22")
    es.attest_batch(cns)
    assert es.latest_verdict(TESCO) == "AT_RISK"
    assert es.latest_verdict(STRIKE_OFF_PROPOSED) == "NOT_IN_GOOD_STANDING"  # the reader is never asked about it
    assert es.latest_attestation(TESCO)["valid_until"] == es.latest_attestation(TESCO)["attested_at"]


@pytest.mark.parametrize("batch, message", [
    ([], "a batch holds 1-4 companies"),
    ([TESCO, LIQUIDATION, STRIKE_OFF_PROPOSED, "17310988", "NI023233"], "a batch holds 1-4 companies"),
    ([TESCO, TESCO], "once per batch"),
    ([TESCO, "445790"], "once per batch"),
    ([TESCO, "99999998"], "99999998 not registered"),
    (["not a number"], "company_number must be"),
])
def test_a_malformed_batch_is_refused_and_records_nothing(direct_vm, direct_deploy, direct_owner, batch, message):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    _register(es, TESCO, LIQUIDATION, STRIKE_OFF_PROPOSED, "17310988", "NI023233")
    direct_vm.clear_mocks()  # nothing is served: a refusal must come before any fetch
    with pytest.raises(Exception, match=message):
        es.attest_batch(batch)
    assert es.get_state()["attestation_count"] == 0


def test_a_network_failure_on_any_company_records_nothing_for_the_batch(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    _register(es, TESCO, LIQUIDATION)
    direct_vm.clear_mocks()
    _serve(direct_vm, TESCO, _pages(TESCO))
    _mock_reader(direct_vm, False)  # LIQUIDATION is never served
    with pytest.raises(Exception):
        es.attest_batch([TESCO, LIQUIDATION])
    assert es.get_state()["attestation_count"] == 0


def _leader(direct_vm) -> list:
    stored, _l, _v = direct_vm._captured_validators[-1]
    return json.loads(stored)


def test_batch_validator_accepts_an_honest_leader_and_rejects_any_tampering(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    cns = [TESCO, LIQUIDATION]
    _register(es, *cns)
    _serve_all(direct_vm, cns)
    es.attest_batch(cns)
    assert direct_vm.run_validator() is True

    honest = _leader(direct_vm)
    assert len(honest) == 2

    forged = json.loads(json.dumps(honest))
    forged[1]["facts"]["pre_verdict"] = "GOOD_STANDING"  # the second company's verdict inflated
    assert direct_vm.run_validator(leader_result=json.dumps(forged)) is False

    forged = json.loads(json.dumps(honest))
    forged[0]["facts"]["accounts_due"] = "2030-01-01"
    assert direct_vm.run_validator(leader_result=json.dumps(forged)) is False

    assert direct_vm.run_validator(leader_result=json.dumps(honest[:1])) is False        # a company dropped
    assert direct_vm.run_validator(leader_result=json.dumps(honest + honest[:1])) is False  # one invented
    assert direct_vm.run_validator(leader_result=json.dumps(honest[::-1])) is False      # reordered
    assert direct_vm.run_validator(leader_result=json.dumps(honest[0])) is False         # a v1-shaped payload
    assert direct_vm.run_validator(leader_result="not json") is False
    assert direct_vm.run_validator(leader_error=Exception("fetch failed")) is False


# --- 5. The tripwire -----------------------------------------------------------


def test_an_unchanged_register_leaves_the_approval_standing(direct_vm, direct_deploy, direct_owner):
    es = _approved_tesco(direct_vm, direct_deploy, direct_owner)
    p = _probe(es, direct_vm, TESCO, _pages(TESCO)["overview"])
    assert p["outcome"] == "UNCHANGED" and p["changes"] == [] and p["attestation_id"] == 0
    assert p["facts"]["status_text"] == "Active" and p["facts"]["readable"] is True
    assert es.get_approval(TESCO, 3600)["reason"] == "APPROVED"
    e = es.get_entity(TESCO)
    assert e["revoked"] is False and e["probe_count"] == 1
    assert es.get_state()["attestation_count"] == 1  # a probe records no attestation


@pytest.mark.parametrize("edit, changes", [
    (lambda ov: _set_status(ov, "Active - Active proposal to strike off"), ["status_text"]),
    (lambda ov: _set_status(ov, "Liquidation"), ["status_text"]),
    (lambda ov: _replace_once(ov, TESCO_ACCOUNTS_DUE, "<strong>26 August 2028</strong>"), ["accounts_due"]),
    (lambda ov: _replace_once(ov, TESCO_CONFIRMATION_DUE, "<strong>2 July 2026</strong>"),
     ["confirmation_due", "confirmation_overdue"]),
])
def test_any_change_to_what_the_approval_rests_on_revokes_it(direct_vm, direct_deploy, direct_owner, edit, changes):
    es = _approved_tesco(direct_vm, direct_deploy, direct_owner)
    p = _probe(es, direct_vm, TESCO, edit(_pages(TESCO)["overview"]))
    assert p["outcome"] == "CHANGED" and p["changes"] == changes
    ap = es.get_approval(TESCO, 3600)
    assert ap["approved"] is False and ap["reason"] == "REVOKED"
    assert es.is_approved(TESCO, 3600) is False
    assert es.get_entity(TESCO)["revoked"] is True
    # The attestation itself is untouched: only the approval is revoked - and
    # no view reports a revoked approval as good standing.
    assert es.latest_verdict(TESCO) == "GOOD_STANDING" and es.is_in_good_standing(TESCO, 3600) is False


def test_reattesting_is_the_only_way_to_restore_a_revoked_approval(direct_vm, direct_deploy, direct_owner):
    es = _approved_tesco(direct_vm, direct_deploy, direct_owner)
    _probe(es, direct_vm, TESCO, _set_status(_pages(TESCO)["overview"], "Active - Active proposal to strike off"))
    with pytest.raises(Exception, match="already revoked"):
        es.probe(TESCO)
    assert es.get_approval(TESCO, 3600)["reason"] == "REVOKED"

    a = _attest(es, direct_vm, TESCO, _pages(TESCO), adverse=False)  # the register is fine again
    assert a["attestation_id"] == 1 and a["previous_id"] == 0
    assert es.get_approval(TESCO, 3600)["reason"] == "APPROVED"
    assert es.get_entity(TESCO)["revoked"] is False
    # ... and the new attestation is what the next probe compares with.
    p = _probe(es, direct_vm, TESCO, _pages(TESCO)["overview"])
    assert p["outcome"] == "UNCHANGED" and p["attestation_id"] == 1


def test_a_probe_that_cannot_read_the_overview_neither_revokes_nor_confirms(direct_vm, direct_deploy, direct_owner):
    es = _approved_tesco(direct_vm, direct_deploy, direct_owner)
    p = _probe(es, direct_vm, TESCO, "<html>Service unavailable</html>", status=503)
    assert p["outcome"] == "UNREADABLE" and p["changes"] == ["overview_unreadable"]
    assert es.get_approval(TESCO, 3600)["reason"] == "APPROVED" and es.get_entity(TESCO)["revoked"] is False
    # A page for a different company is not a reading of this one either.
    p = _probe(es, direct_vm, TESCO, _pages(LIQUIDATION)["overview"])
    assert p["outcome"] == "UNREADABLE"
    assert es.get_approval(TESCO, 3600)["reason"] == "APPROVED"


def test_a_probe_reads_only_the_overview_page(direct_vm, direct_deploy, direct_owner):
    # _probe() serves nothing but the overview; the officers and filing
    # pages would hit a missing mock. Also: a network failure records nothing.
    es = _approved_tesco(direct_vm, direct_deploy, direct_owner)
    direct_vm.clear_mocks()
    with pytest.raises(Exception):
        es.probe(TESCO)
    assert es.get_entity(TESCO)["probe_count"] == 0 and es.get_probes(0, 10) == []


def test_probe_preconditions(direct_vm, direct_deploy, direct_owner):
    es = _deploy(direct_vm, direct_deploy, direct_owner)
    _register(es, TESCO, LIQUIDATION)
    direct_vm.clear_mocks()
    with pytest.raises(Exception, match="not registered"):
        es.probe("99999998")
    with pytest.raises(Exception, match="attest first"):
        es.probe(TESCO)
    _attest(es, direct_vm, LIQUIDATION, _pages(LIQUIDATION))
    with pytest.raises(Exception, match="not an approval"):
        es.probe(LIQUIDATION)


def test_probe_validator_requires_exactly_the_same_overview_facts(direct_vm, direct_deploy, direct_owner):
    es = _approved_tesco(direct_vm, direct_deploy, direct_owner)
    _probe(es, direct_vm, TESCO, _pages(TESCO)["overview"])
    assert direct_vm.run_validator() is True
    stored, _l, _v = direct_vm._captured_validators[-1]
    honest = json.loads(stored)
    for tamper in (lambda f: f.update(status_text="Liquidation"),
                   lambda f: f.update(accounts_due="2030-01-01"),
                   lambda f: f.update(readable=False),
                   lambda f: f.update(accounts_overdue=True),
                   lambda f: f.pop("as_of"),
                   lambda f: f.update(extra=1)):
        forged = json.loads(json.dumps(honest))
        tamper(forged)
        assert direct_vm.run_validator(leader_result=json.dumps(forged)) is False
    assert direct_vm.run_validator(leader_result="not json") is False
    assert direct_vm.run_validator(leader_error=Exception("fetch failed")) is False


def test_a_probe_leader_hiding_a_change_is_rejected(direct_vm, direct_deploy, direct_owner):
    # The leader claims the register is as attested; this validator sees a
    # company that has entered liquidation.
    es = _approved_tesco(direct_vm, direct_deploy, direct_owner)
    _probe(es, direct_vm, TESCO, _pages(TESCO)["overview"])
    stored, _l, _v = direct_vm._captured_validators[-1]
    direct_vm.clear_mocks()
    _mock(direct_vm, CH + TESCO, _set_status(_pages(TESCO)["overview"], "Liquidation"))
    assert direct_vm.run_validator(leader_result=stored) is False
