# Studio incident and replacement-candidate record — 2026-09-05

## Frozen deployed instance

```text
NETWORK: Studionet (chain 61999)
ACCOUNT: 0xeF5D2119416A2f5afa35dCFA209766EFC1BE5902
CONTRACT: 0x1dCcBE4942786Efc15Bb8e78d749e8D89f4fb68c
DEPLOY_TX: 0x1006b81a527f73db301f63c3ed551f70c1c8720dbe23f4262880851f1340d711
DEPLOYED_SOURCE_SHA256: 48B8B3BA0BEB806699CA777F90178020A85ACC6CA2EDB74765F1E109EFFEB18B
LIFECYCLE: INTENTIONALLY FROZEN
DISPOSITION: REJECTED — never upgrade; replace with a new contract after PRE_DEPLOY approval
```

Deployment reached `FINALIZED`, Studio reported consensus and contract deployment,
the normalized on-chain code payload matched the deployed source hash, and finalized
`get_count()` returned `0`.

## Failed S01 attempts

Both fresh `create_match` attempts reached `FINALIZED` but every leader/validator
execution result was `ERROR: BAD_ADDRESS`; neither transaction changed state.

| Attempt | Nonce | Opponent form | Transaction |
|---|---|---|---|
| S01-F1 | `a1b2c3d4e5f60718293a4b5c6d7e8f90` | checksum hex | `0x7a0e1193fe96190b6be2e1a3a9ba331ac0461aa4a8e037df99b1effefbb8b40e` |
| S01-F2 | `b1c2d3e4f5061728394a5b6c7d8e9f01` | lowercase hex | `0x4d4d1f572abd570f5eca49a54998e5fd028e4007c533f91af0688fb9ef2f183b` |

Root cause: `_address()` rejected the runtime's integer address representation.
`create_match()` calls `_sender()` before normalizing the opponent, so the identical
failure under two opponent encodings locates the defect at the shared normalizer,
not at checksum casing. Current official documentation types the message fields as
`Address`; existing verified runtime experience records that hosted Studio can
serialize address values as 160-bit integers.

The applied experience entry is `E:\Genlayer\experience\Task Build Experience.md`,
2026-08-08, “Keep GenVM test doubles narrower than the real runtime” (lines
196–204). Its prevention rule is to probe alternate calldata encodings and
normalize every public address boundary; this incident applies that rule at the
shared `_address()` boundary and adds a regression for a valid 160-bit integer
plus the out-of-range rejection. The entry is experience guidance, not a
substitute for current official Address documentation or replacement Studio
proof.

## Replacement candidate

```text
SOURCE_IMPLEMENTATION_COMMIT: 77a182aa35d661e71facdb183bb6902289e188bd
CONTRACT_SOURCE_SHA256: 5D770C9EF1C6E58063C4604EA1122AC1DE815D788DE34C89C776A610FEE8C6BC
TEST_SOURCE_SHA256: DEFC83A938E0CABCD8EECFCA8B7D199AB49901B8C5F6B511965ECF7E02E0FB9C
SCHEMA_SHA256: B6450B0E994156186EFCA475BCE61F079A468CCFAC38D80E486617B7EC078FAB
DELTA: one shared helper accepts non-bool integers in [0, 2^160) and renders 40 lowercase hex digits
LOCAL_TEST: 13 passed
LINT: PASS (3 checks)
VALIDATION: PASS — CommittedAnswerMatch, 13 methods (7 view, 6 write)
```

No new Studio deployment is permitted until the existing anonymous reviewer approves
this exact replacement source and incident-bound delta. After approval, deploy a new
instance; do not use Studio's upgrade action on the frozen rejected address.
