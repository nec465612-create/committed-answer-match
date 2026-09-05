import hashlib
import json

import cloudpickle
import pytest


START = "2026-09-05T00:00:00Z"
ALICE_SALT = "11" * 16


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False)


def address_text(value):
    if hasattr(value, "as_bytes"):
        raw = value.as_bytes
        return "0x" + bytes(raw).hex()
    if isinstance(value, bytes):
        return "0x" + value.hex()
    return str(value).lower()


def make_commitment(vm, creator, opponent, nonce, clue, answer, salt):
    preimage = [
        "ANSWER_MATCH_V1",
        str(vm._chain_id),
        address_text(vm._contract_address),
        address_text(creator),
        address_text(opponent),
        nonce,
        clue,
        answer,
        salt,
    ]
    return hashlib.sha256(canonical(preimage).encode("utf-8")).hexdigest()


def deploy(vm, direct_deploy):
    vm.warp(START)
    vm._chain_id = 61127
    return direct_deploy("contracts/main.py")


def create_case(vm, direct_deploy, creator, opponent, *, nonce="00" * 16, clue="What is a concise greeting?", answer="hello", salt=ALICE_SALT):
    contract = deploy(vm, direct_deploy)
    vm.sender = creator
    commitment = make_commitment(vm, creator, opponent, nonce, clue, answer, salt)
    case_id = contract.create_match(nonce, opponent, clue, commitment)
    return contract, case_id, {
        "nonce": nonce,
        "clue": clue,
        "answer": answer,
        "salt": salt,
        "commitment": commitment,
    }


def read_case(contract, case_id):
    return json.loads(contract.get_case(case_id))


def test_create_is_idempotent_and_binds_context(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, case_id, data = create_case(direct_vm, direct_deploy, direct_alice, direct_bob)
    first = read_case(contract, case_id)

    assert case_id == 1
    assert contract.get_count() == 1
    assert first["phase"] == "GUESS_OPEN"
    assert first["revision"] == "1"
    assert first["base"] == {"clue": data["clue"], "commitment": data["commitment"]}
    assert first["domain"]["nonce"] == data["nonce"]
    assert first["domain"]["answer"] == ""
    assert first["response"] == {}

    assert contract.create_match(data["nonce"], direct_bob, data["clue"], data["commitment"]) == 1
    assert read_case(contract, 1)["revision"] == "1"

    with direct_vm.expect_revert("NONCE_CONFLICT"):
        contract.create_match(data["nonce"], direct_bob, "A different clue", data["commitment"])
    assert read_case(contract, 1) == first


def test_guess_reveal_and_digest_failure_are_atomic(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, case_id, data = create_case(direct_vm, direct_deploy, direct_alice, direct_bob)
    initial = read_case(contract, case_id)

    with direct_vm.prank(direct_alice):
        with direct_vm.expect_revert("UNAUTHORIZED"):
            contract.submit_guess(case_id, "hello", 1)
    assert read_case(contract, case_id)["revision"] == "1"

    with direct_vm.prank(direct_bob):
        contract.submit_guess(case_id, "hello", 1)
    after_guess = read_case(contract, case_id)
    assert after_guess["phase"] == "REVEAL_WAIT"
    assert after_guess["response"] == {"guess": "hello"}
    assert after_guess["revision"] == "2"
    assert after_guess["domain"]["deadline"] == initial["domain"]["deadline"]
    assert after_guess["last_operation"] == {
        "method": "submit_guess",
        "caller": address_text(direct_bob),
        "args_hash": hashlib.sha256(canonical(["1", "hello", "1"]).encode("utf-8")).hexdigest(),
    }

    before_bad_reveal = after_guess
    with direct_vm.prank(direct_alice):
        with direct_vm.expect_revert("BAD_REVEAL"):
            contract.reveal_answer(case_id, "hello", "22" * 16, 2)
    assert read_case(contract, case_id) == before_bad_reveal

    with direct_vm.prank(direct_alice):
        contract.reveal_answer(case_id, data["answer"], data["salt"], 2)
    frozen = read_case(contract, case_id)
    assert frozen["phase"] == "FROZEN"
    assert frozen["revision"] == "3"
    assert frozen["domain"]["answer"] == data["answer"]
    assert frozen["domain"]["salt"] == data["salt"]
    assert frozen["last_operation"]["method"] == "reveal_answer"
    assert frozen["last_operation"]["caller"] == address_text(direct_alice)


def test_exact_match_evaluates_without_llm_and_keeps_history(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract, case_id, data = create_case(direct_vm, direct_deploy, direct_alice, direct_bob)
    with direct_vm.prank(direct_bob):
        contract.submit_guess(case_id, data["answer"], 1)
    with direct_vm.prank(direct_alice):
        contract.reveal_answer(case_id, data["answer"], data["salt"], 2)

    with direct_vm.prank(direct_charlie):
        contract.evaluate_match(case_id, 3)
    result = read_case(contract, case_id)
    assert result["phase"] == "DONE"
    assert result["outcome"] == "MATCH"
    assert result["result"] == {"v": 1, "label": "MATCH"}
    assert result["accepted_attempts"] == 1
    assert json.loads(contract.get_version(case_id, 3))["phase"] == "FROZEN"
    assert json.loads(contract.get_version(case_id, 4))["outcome"] == "MATCH"


def prepare_semantic_case(vm, direct_deploy, creator, opponent, answer="correct reference", guess="different wording"):
    contract, case_id, data = create_case(
        vm,
        direct_deploy,
        creator,
        opponent,
        nonce="01" * 16,
        answer=answer,
        salt="33" * 16,
    )
    with vm.prank(opponent):
        contract.submit_guess(case_id, guess, 1)
    with vm.prank(creator):
        contract.reveal_answer(case_id, answer, data["salt"], 2)
    return contract, case_id, data


def test_semantic_no_match_requires_consensus_and_validator_rederivation(direct_vm, direct_deploy, direct_alice, direct_bob):
    direct_vm.mock_llm(r"Return exactly", '{"v":1,"label":"NO_MATCH"}')
    contract, case_id, _ = prepare_semantic_case(direct_vm, direct_deploy, direct_alice, direct_bob)
    contract.evaluate_match(case_id, 3)
    result = read_case(contract, case_id)
    assert result["outcome"] == "NO_MATCH"
    assert result["phase"] == "DONE"

    direct_vm.clear_mocks()
    direct_vm.mock_llm(r"Return exactly", '{"v":1,"label":"MATCH"}')
    assert direct_vm.run_validator() is False


def test_semantic_closures_are_pickling_safe(direct_vm, direct_deploy, direct_alice, direct_bob):
    direct_vm.check_pickling = True
    direct_vm.mock_llm(r"Return exactly", '{"v":1,"label":"NO_MATCH"}')
    contract, case_id, _ = prepare_semantic_case(direct_vm, direct_deploy, direct_alice, direct_bob)

    contract.evaluate_match(case_id, 3)

    assert len(direct_vm._captured_validators) == 1
    for _, leader_fn, validator_fn in direct_vm._captured_validators:
        cloudpickle.dumps(leader_fn)
        cloudpickle.dumps(validator_fn)


def test_unknown_is_retryable_then_exhausts(direct_vm, direct_deploy, direct_alice, direct_bob):
    direct_vm.mock_llm(r"Return exactly", '{"v":1,"label":"UNKNOWN"}')
    contract, case_id, _ = prepare_semantic_case(direct_vm, direct_deploy, direct_alice, direct_bob)

    contract.evaluate_match(case_id, 3)
    first = read_case(contract, case_id)
    assert first["phase"] == "UNRESOLVED"
    assert first["accepted_attempts"] == 1
    assert first["outcome"] == ""

    with direct_vm.expect_revert("TOO_SOON"):
        direct_vm.warp("2026-09-05T00:00:59Z")
        contract.retry_match(case_id, 4)

    direct_vm.warp("2026-09-05T00:01:00Z")
    contract.retry_match(case_id, 4)
    assert read_case(contract, case_id)["accepted_attempts"] == 2

    direct_vm.warp("2026-09-05T00:02:00Z")
    contract.retry_match(case_id, 5)
    exhausted = read_case(contract, case_id)
    assert exhausted["phase"] == "EXHAUSTED"
    assert exhausted["accepted_attempts"] == 3
    assert exhausted["result"] == {"v": 1, "label": "UNKNOWN"}


def test_expiry_is_explicit_and_voids_without_model_call(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, case_id, _ = create_case(direct_vm, direct_deploy, direct_alice, direct_bob)
    direct_vm.warp("2026-09-05T00:30:00Z")
    with direct_vm.expect_revert("TOO_EARLY"):
        contract.expire_match(case_id, 1)
    assert read_case(contract, case_id)["revision"] == "1"

    direct_vm.warp("2026-09-05T00:30:01Z")
    contract.expire_match(case_id, 1)
    expired = read_case(contract, case_id)
    assert expired["phase"] == "DONE"
    assert expired["outcome"] == "VOID"
    assert expired["accepted_attempts"] == 0
    assert expired["revision"] == "2"


def test_malformed_consensus_result_does_not_mutate(direct_vm, direct_deploy, direct_alice, direct_bob):
    direct_vm.mock_llm(r"Return exactly", '{"v":1,"label":"NOT_A_LABEL"}')
    contract, case_id, _ = prepare_semantic_case(direct_vm, direct_deploy, direct_alice, direct_bob)
    before = read_case(contract, case_id)
    with pytest.raises(Exception):
        contract.evaluate_match(case_id, 3)
    assert read_case(contract, case_id) == before


def test_stale_revision_and_wrong_phase_are_atomic(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract, case_id, data = create_case(direct_vm, direct_deploy, direct_alice, direct_bob)

    with direct_vm.prank(direct_bob):
        contract.submit_guess(case_id, "hello", 1)
    after_guess = read_case(contract, case_id)

    with direct_vm.prank(direct_bob):
        with direct_vm.expect_revert("STALE_REVISION"):
            contract.submit_guess(case_id, "hello", 1)
    assert read_case(contract, case_id) == after_guess

    with direct_vm.prank(direct_charlie):
        with direct_vm.expect_revert("BAD_PHASE"):
            contract.evaluate_match(case_id, 2)
    assert read_case(contract, case_id) == after_guess

    with direct_vm.prank(direct_alice):
        contract.reveal_answer(case_id, data["answer"], data["salt"], 2)
    frozen = read_case(contract, case_id)
    with direct_vm.prank(direct_charlie):
        with direct_vm.expect_revert("STALE_REVISION"):
            contract.evaluate_match(case_id, 2)
    assert read_case(contract, case_id) == frozen


def test_deadline_is_inclusive_for_writes(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, case_id, data = create_case(direct_vm, direct_deploy, direct_alice, direct_bob)

    direct_vm.warp("2026-09-05T00:30:00Z")
    with direct_vm.prank(direct_bob):
        contract.submit_guess(case_id, data["answer"], 1)

    direct_vm.warp("2026-09-05T01:00:00Z")
    with direct_vm.prank(direct_alice):
        contract.reveal_answer(case_id, data["answer"], data["salt"], 2)
    assert read_case(contract, case_id)["phase"] == "FROZEN"


def test_commitment_rejects_wrong_chain_context(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy(direct_vm, direct_deploy)
    nonce = "44" * 16
    clue = "Context-bound clue"
    answer = "hello"
    salt = "55" * 16
    original_chain = direct_vm._chain_id
    direct_vm._chain_id = original_chain + 1
    wrong_commitment = make_commitment(direct_vm, direct_alice, direct_bob, nonce, clue, answer, salt)
    direct_vm._chain_id = original_chain

    with direct_vm.prank(direct_alice):
        case_id = contract.create_match(nonce, direct_bob, clue, wrong_commitment)
    with direct_vm.prank(direct_bob):
        contract.submit_guess(case_id, answer, 1)
    before = read_case(contract, case_id)

    with direct_vm.prank(direct_alice):
        with direct_vm.expect_revert("BAD_REVEAL"):
            contract.reveal_answer(case_id, answer, salt, 2)
    assert read_case(contract, case_id) == before


def test_lists_are_bounded_and_actor_indexed(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, case_id, _ = create_case(direct_vm, direct_deploy, direct_alice, direct_bob)
    assert json.loads(contract.list_cases(1, 4)) == {"ids": ["1"], "next": "0"}
    assert json.loads(contract.list_actor(direct_alice, 0, 4)) == {"ids": ["1"], "next": "0"}
    assert json.loads(contract.list_actor(direct_bob, 0, 4)) == {"ids": ["1"], "next": "0"}
    assert json.loads(contract.list_children(0, 0, 4)) == {"ids": [], "next": "0"}
    assert contract.get_version(case_id, 99) == "null"

    with direct_vm.expect_revert("BAD_PAGE"):
        contract.list_cases(1, 5)
    with direct_vm.expect_revert("BAD_PAGE"):
        contract.list_actor(direct_alice, 0, 5)
