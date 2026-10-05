"""
Direct Mode tests for OnboardingGate.

Direct Mode can't simulate cross-contract calls without a "glsim" hook (the
same documented limitation as this account's earlier consumers -
TreasuryPolicy, CollateralPolicy, ListingGate), so the calls to KYB Desk's
get_approval() are proven live instead: an allowed onboarding and payment,
and refused ones, all linked in CONTRACT.md. What is tested here is every
check that runs before that call.
"""

import pytest

DESK = "0x" + "44" * 20  # never actually called in these tests


def _deploy(direct_vm, direct_deploy, owner, max_age=3600):
    direct_vm.sender = owner
    return direct_deploy("contracts/onboarding_gate.py", DESK, max_age)


def test_config_and_empty_state(direct_vm, direct_deploy, direct_owner):
    g = _deploy(direct_vm, direct_deploy, direct_owner)
    cfg = g.get_config()
    assert cfg["max_age_seconds"] == 3600 and cfg["vendor_count"] == 0 and cfg["payment_count"] == 0
    assert cfg["kyb_address"].lower() == DESK
    assert g.list_vendors() == [] and g.get_payments(0, 10) == [] and g.total_paid("445790") == 0


def test_zero_max_age_is_rejected(direct_vm, direct_deploy, direct_owner):
    with pytest.raises(Exception):
        _deploy(direct_vm, direct_deploy, direct_owner, max_age=0)


def test_only_the_owner_can_onboard_or_pay(direct_vm, direct_deploy, direct_owner, direct_alice):
    g = _deploy(direct_vm, direct_deploy, direct_owner)
    direct_vm.sender = direct_alice
    with pytest.raises(Exception, match="only the owner can onboard"):
        g.onboard("00445790", "Tesco")
    with pytest.raises(Exception, match="only the owner can pay"):
        g.pay("00445790", 100)


@pytest.mark.parametrize("call, message", [
    (lambda g: g.onboard("not a number", "x"), "company_number must be"),
    (lambda g: g.onboard("00445790", ""), "name must be"),
    (lambda g: g.onboard("00445790", "x" * 101), "name must be"),
    (lambda g: g.pay("not a number", 1), "company_number must be"),
    (lambda g: g.pay("00445790", 0), "amount must be positive"),
    (lambda g: g.pay("00445790", 100), "supplier not onboarded"),
    (lambda g: g.get_vendor("00445790"), "supplier not onboarded"),
])
def test_invalid_calls_are_rejected_before_any_cross_contract_call(direct_vm, direct_deploy, direct_owner,
                                                                  call, message):
    g = _deploy(direct_vm, direct_deploy, direct_owner)
    with pytest.raises(Exception, match=message):
        call(g)


def test_onboard_reaches_kyb_desk_which_direct_mode_cannot_simulate(direct_vm, direct_deploy, direct_owner):
    # Documented, not silently skipped: a valid onboard() goes on to
    # gl.get_contract_at(...).view().get_approval(...), which needs glsim.
    g = _deploy(direct_vm, direct_deploy, direct_owner)
    with pytest.raises(Exception) as excinfo:
        g.onboard("445790", "Tesco")  # also normalised: no number-format error
    assert "company_number must be" not in str(excinfo.value) and "already onboarded" not in str(excinfo.value)
    assert g.get_config()["vendor_count"] == 0
