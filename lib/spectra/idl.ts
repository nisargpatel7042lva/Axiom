import type { Idl } from "@coral-xyz/anchor";

/**
 * Synced from anchor build: target/idl/spectra_vault.json
 * Regenerate: node scripts/sync-idl.mjs
 */
export const IDL = {
  "address": "JBagp4qXz26XMHce1tXMpEwgVKPBpRGj7ejvsJXaoQhH",
  "metadata": {
    "name": "spectra_vault",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Spectra Vaults — prediction market ETFs on Solana"
  },
  "instructions": [
    {
      "name": "approve_operation",
      "discriminator": [
        13,
        149,
        177,
        120,
        180,
        11,
        252,
        61
      ],
      "accounts": [
        {
          "name": "approver",
          "docs": [
            "Must be one of the authorized signers"
          ],
          "signer": true
        },
        {
          "name": "vault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.vault_id",
                "account": "VaultState"
              }
            ]
          }
        },
        {
          "name": "multisig_config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  117,
                  108,
                  116,
                  105,
                  115,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "pending_operation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  112,
                  101,
                  114,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "account",
                "path": "pending_operation.operation_id",
                "account": "PendingOperation"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "bootstrap_vault",
      "discriminator": [
        229,
        147,
        236,
        219,
        228,
        210,
        172,
        52
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "vault_id"
              }
            ]
          }
        },
        {
          "name": "asset_mint"
        },
        {
          "name": "shares_mint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  104,
                  97,
                  114,
                  101,
                  115,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "token_2022_program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "vault_id",
          "type": "u64"
        },
        {
          "name": "strategy_type",
          "type": "u8"
        },
        {
          "name": "performance_fee_bps",
          "type": "u16"
        }
      ]
    },
    {
      "name": "cancel_operation",
      "discriminator": [
        64,
        80,
        246,
        116,
        95,
        207,
        78,
        13
      ],
      "accounts": [
        {
          "name": "canceller",
          "docs": [
            "Must be one of the authorized signers"
          ],
          "signer": true
        },
        {
          "name": "vault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.vault_id",
                "account": "VaultState"
              }
            ]
          }
        },
        {
          "name": "multisig_config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  117,
                  108,
                  116,
                  105,
                  115,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "pending_operation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  112,
                  101,
                  114,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "account",
                "path": "pending_operation.operation_id",
                "account": "PendingOperation"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "collect_performance_fee",
      "discriminator": [
        229,
        161,
        124,
        196,
        71,
        241,
        11,
        48
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "vault"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.vault_id",
                "account": "VaultState"
              }
            ]
          }
        },
        {
          "name": "shares_mint",
          "writable": true
        },
        {
          "name": "authority_shares_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "token_2022_program"
              },
              {
                "kind": "account",
                "path": "shares_mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "token_2022_program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "associated_token_program",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "create_asset_vault",
      "discriminator": [
        94,
        30,
        247,
        39,
        125,
        131,
        74,
        41
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.vault_id",
                "account": "VaultState"
              }
            ]
          }
        },
        {
          "name": "asset_mint"
        },
        {
          "name": "asset_vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  115,
                  115,
                  101,
                  116,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "deposit",
      "discriminator": [
        242,
        35,
        198,
        137,
        82,
        225,
        242,
        182
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.vault_id",
                "account": "VaultState"
              }
            ]
          }
        },
        {
          "name": "asset_mint"
        },
        {
          "name": "shares_mint",
          "writable": true
        },
        {
          "name": "asset_vault",
          "writable": true
        },
        {
          "name": "user_asset_account",
          "writable": true
        },
        {
          "name": "user_shares_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "token_2022_program"
              },
              {
                "kind": "account",
                "path": "shares_mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "token_2022_program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "associated_token_program",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "emergency_drain",
      "docs": [
        "Drains all vault reserves to the authority after a multisig-approved",
        "EmergencyWithdraw has paused the vault."
      ],
      "discriminator": [
        157,
        136,
        148,
        14,
        161,
        111,
        54,
        215
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "vault"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.vault_id",
                "account": "VaultState"
              }
            ]
          }
        },
        {
          "name": "asset_mint"
        },
        {
          "name": "asset_vault",
          "writable": true
        },
        {
          "name": "authority_asset_account",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "execute_operation",
      "discriminator": [
        105,
        240,
        250,
        159,
        65,
        132,
        111,
        185
      ],
      "accounts": [
        {
          "name": "executor",
          "writable": true,
          "signer": true
        },
        {
          "name": "multisig_config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  117,
                  108,
                  116,
                  105,
                  115,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "pending_operation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  112,
                  101,
                  114,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "account",
                "path": "pending_operation.operation_id",
                "account": "PendingOperation"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.vault_id",
                "account": "VaultState"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "execute_strategy_change",
      "discriminator": [
        224,
        215,
        145,
        225,
        25,
        100,
        28,
        40
      ],
      "accounts": [
        {
          "name": "executor",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.vault_id",
                "account": "VaultState"
              }
            ]
          }
        },
        {
          "name": "strategy_proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "account",
                "path": "strategy_proposal.proposal_id",
                "account": "StrategyProposal"
              }
            ]
          }
        },
        {
          "name": "strategy_config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  97,
                  116,
                  101,
                  103,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "initialize_multisig",
      "discriminator": [
        220,
        130,
        117,
        21,
        27,
        227,
        78,
        213
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "admin",
          "docs": [
            "The admin/authority initializing the multisig"
          ],
          "signer": true
        },
        {
          "name": "vault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.vault_id",
                "account": "VaultState"
              }
            ]
          }
        },
        {
          "name": "multisig_config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  117,
                  108,
                  116,
                  105,
                  115,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "signers",
          "type": {
            "vec": "pubkey"
          }
        },
        {
          "name": "threshold",
          "type": "u8"
        }
      ]
    },
    {
      "name": "initialize_strategy_config",
      "discriminator": [
        124,
        143,
        218,
        151,
        66,
        90,
        114,
        196
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.vault_id",
                "account": "VaultState"
              }
            ]
          }
        },
        {
          "name": "strategy_config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  97,
                  116,
                  101,
                  103,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "min_probability",
          "type": "u16"
        },
        {
          "name": "max_probability",
          "type": "u16"
        },
        {
          "name": "max_position_pct",
          "type": "u16"
        },
        {
          "name": "lend_allocation_pct",
          "type": "u16"
        },
        {
          "name": "categories",
          "type": {
            "vec": "string"
          }
        }
      ]
    },
    {
      "name": "pause",
      "discriminator": [
        211,
        22,
        221,
        251,
        74,
        121,
        193,
        47
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "vault"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.vault_id",
                "account": "VaultState"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "propose_operation",
      "discriminator": [
        138,
        188,
        18,
        209,
        140,
        122,
        139,
        187
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "proposer",
          "docs": [
            "Must be one of the authorized signers"
          ],
          "signer": true
        },
        {
          "name": "vault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.vault_id",
                "account": "VaultState"
              }
            ]
          }
        },
        {
          "name": "multisig_config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  117,
                  108,
                  116,
                  105,
                  115,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "pending_operation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  112,
                  101,
                  114,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "arg",
                "path": "operation_id"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "operation_id",
          "type": "u64"
        },
        {
          "name": "operation_type",
          "type": {
            "defined": {
              "name": "OperationType"
            }
          }
        }
      ]
    },
    {
      "name": "propose_strategy_change",
      "discriminator": [
        233,
        158,
        231,
        49,
        242,
        220,
        89,
        175
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "proposer",
          "docs": [
            "Must be an authorized multisig signer"
          ],
          "signer": true
        },
        {
          "name": "vault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.vault_id",
                "account": "VaultState"
              }
            ]
          }
        },
        {
          "name": "multisig_config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  117,
                  108,
                  116,
                  105,
                  115,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "strategy_proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "arg",
                "path": "proposal_id"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "proposal_id",
          "type": "u64"
        },
        {
          "name": "change_type",
          "type": {
            "defined": {
              "name": "StrategyChangeType"
            }
          }
        },
        {
          "name": "new_value",
          "type": "u64"
        },
        {
          "name": "voting_duration_seconds",
          "type": "i64"
        }
      ]
    },
    {
      "name": "sync_nav",
      "discriminator": [
        120,
        176,
        60,
        90,
        47,
        88,
        150,
        125
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "vault"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.vault_id",
                "account": "VaultState"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "new_total_assets",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unpause",
      "discriminator": [
        169,
        144,
        4,
        38,
        10,
        141,
        188,
        255
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "vault"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.vault_id",
                "account": "VaultState"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "vote_on_strategy",
      "discriminator": [
        210,
        223,
        235,
        121,
        64,
        253,
        219,
        243
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "voter",
          "docs": [
            "The voter (must hold vault shares)"
          ],
          "signer": true
        },
        {
          "name": "vault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.vault_id",
                "account": "VaultState"
              }
            ]
          }
        },
        {
          "name": "shares_mint",
          "docs": [
            "Vault's share mint (Token-2022); used to validate voter_shares_account"
          ]
        },
        {
          "name": "voter_shares_account",
          "docs": [
            "Voter's share token account — vote weight is drawn from its balance"
          ]
        },
        {
          "name": "strategy_proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "account",
                "path": "strategy_proposal.proposal_id",
                "account": "StrategyProposal"
              }
            ]
          }
        },
        {
          "name": "user_vote",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  118,
                  111,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "strategy_proposal"
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "token_2022_program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "voted_for",
          "type": "bool"
        }
      ]
    },
    {
      "name": "withdraw",
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vault.vault_id",
                "account": "VaultState"
              }
            ]
          }
        },
        {
          "name": "asset_mint"
        },
        {
          "name": "shares_mint",
          "writable": true
        },
        {
          "name": "asset_vault",
          "writable": true
        },
        {
          "name": "user_asset_account",
          "writable": true
        },
        {
          "name": "user_shares_account",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "token_2022_program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "shares",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "MultisigConfig",
      "discriminator": [
        44,
        62,
        172,
        225,
        246,
        3,
        178,
        33
      ]
    },
    {
      "name": "PendingOperation",
      "discriminator": [
        124,
        146,
        84,
        123,
        121,
        210,
        217,
        118
      ]
    },
    {
      "name": "StrategyConfig",
      "discriminator": [
        103,
        12,
        123,
        61,
        47,
        87,
        129,
        57
      ]
    },
    {
      "name": "StrategyProposal",
      "discriminator": [
        242,
        10,
        114,
        75,
        229,
        116,
        66,
        211
      ]
    },
    {
      "name": "UserVote",
      "discriminator": [
        136,
        163,
        243,
        202,
        202,
        124,
        112,
        53
      ]
    },
    {
      "name": "VaultState",
      "discriminator": [
        228,
        196,
        82,
        165,
        98,
        210,
        235,
        152
      ]
    }
  ],
  "events": [
    {
      "name": "DepositEvent",
      "discriminator": [
        120,
        248,
        61,
        83,
        31,
        142,
        107,
        144
      ]
    },
    {
      "name": "EmergencyDrainEvent",
      "discriminator": [
        75,
        127,
        185,
        108,
        30,
        124,
        225,
        16
      ]
    },
    {
      "name": "MultisigInitializedEvent",
      "discriminator": [
        136,
        56,
        221,
        200,
        217,
        17,
        232,
        94
      ]
    },
    {
      "name": "NavSyncEvent",
      "discriminator": [
        49,
        198,
        186,
        73,
        11,
        174,
        152,
        149
      ]
    },
    {
      "name": "OperationApprovedEvent",
      "discriminator": [
        211,
        98,
        219,
        29,
        25,
        202,
        102,
        191
      ]
    },
    {
      "name": "OperationCancelledEvent",
      "discriminator": [
        149,
        8,
        193,
        1,
        100,
        119,
        102,
        122
      ]
    },
    {
      "name": "OperationExecutedEvent",
      "discriminator": [
        210,
        224,
        175,
        122,
        117,
        133,
        29,
        48
      ]
    },
    {
      "name": "OperationProposedEvent",
      "discriminator": [
        134,
        181,
        159,
        27,
        63,
        242,
        149,
        141
      ]
    },
    {
      "name": "StrategyProposalCreatedEvent",
      "discriminator": [
        23,
        96,
        120,
        173,
        179,
        249,
        246,
        97
      ]
    },
    {
      "name": "StrategyProposalExecutedEvent",
      "discriminator": [
        164,
        9,
        33,
        89,
        13,
        18,
        229,
        248
      ]
    },
    {
      "name": "StrategyUpdateEvent",
      "discriminator": [
        203,
        89,
        37,
        78,
        232,
        158,
        222,
        60
      ]
    },
    {
      "name": "VoteCastEvent",
      "discriminator": [
        241,
        151,
        159,
        134,
        250,
        234,
        71,
        234
      ]
    },
    {
      "name": "WithdrawEvent",
      "discriminator": [
        22,
        9,
        133,
        26,
        160,
        44,
        71,
        192
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Signer is not the vault authority"
    },
    {
      "code": 6001,
      "name": "VaultPaused",
      "msg": "Vault is currently paused"
    },
    {
      "code": 6002,
      "name": "VaultNotPaused",
      "msg": "Vault is not paused"
    },
    {
      "code": 6003,
      "name": "InvalidAmount",
      "msg": "Deposit amount must be greater than zero"
    },
    {
      "code": 6004,
      "name": "InsufficientShares",
      "msg": "Insufficient shares balance for withdrawal"
    },
    {
      "code": 6005,
      "name": "MathOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6006,
      "name": "InvalidStrategyType",
      "msg": "Invalid strategy type (must be 0, 1, or 2)"
    },
    {
      "code": 6007,
      "name": "NoFeeToCollect",
      "msg": "No performance fee to collect — PPS is at or below high-water mark"
    },
    {
      "code": 6008,
      "name": "InvalidProbabilityRange",
      "msg": "min_probability must be less than or equal to max_probability"
    },
    {
      "code": 6009,
      "name": "InsufficientVaultBalance",
      "msg": "Vault reserves insufficient to cover withdrawal"
    },
    {
      "code": 6010,
      "name": "TooManyCategories",
      "msg": "Too many categories (max 8)"
    },
    {
      "code": 6011,
      "name": "CategoryTooLong",
      "msg": "Category string too long (max 32 bytes)"
    },
    {
      "code": 6012,
      "name": "InvalidFeeBps",
      "msg": "Performance fee basis points out of range (max 5000)"
    },
    {
      "code": 6013,
      "name": "UnauthorizedSigner",
      "msg": "Signer is not authorized in multisig"
    },
    {
      "code": 6014,
      "name": "InvalidThreshold",
      "msg": "Threshold must be between 1 and MAX_MULTISIG_THRESHOLD"
    },
    {
      "code": 6015,
      "name": "TooManySigners",
      "msg": "Too many signers (max 5)"
    },
    {
      "code": 6016,
      "name": "AlreadyApproved",
      "msg": "Operation already approved by this signer"
    },
    {
      "code": 6017,
      "name": "OperationNotFound",
      "msg": "Operation not found or already executed/cancelled"
    },
    {
      "code": 6018,
      "name": "TimelockActive",
      "msg": "Timelock has not expired yet"
    },
    {
      "code": 6019,
      "name": "ThresholdNotMet",
      "msg": "Threshold not met - more approvals required"
    },
    {
      "code": 6020,
      "name": "DuplicateSigner",
      "msg": "Duplicate signer in list"
    },
    {
      "code": 6021,
      "name": "VotingEnded",
      "msg": "Voting period has ended"
    },
    {
      "code": 6022,
      "name": "VotingActive",
      "msg": "Voting period is still active"
    },
    {
      "code": 6023,
      "name": "AlreadyVoted",
      "msg": "User already voted on this proposal"
    },
    {
      "code": 6024,
      "name": "QuorumNotReached",
      "msg": "Quorum not reached"
    },
    {
      "code": 6025,
      "name": "AlreadyExecuted",
      "msg": "Proposal already executed"
    },
    {
      "code": 6026,
      "name": "ProposalRejected",
      "msg": "Proposal was rejected"
    },
    {
      "code": 6027,
      "name": "InvalidChangeType",
      "msg": "Invalid strategy change type"
    },
    {
      "code": 6028,
      "name": "NoSharesToVote",
      "msg": "User has no shares to vote with"
    },
    {
      "code": 6029,
      "name": "NavBoundsExceeded",
      "msg": "New NAV exceeds 2× previous value in a single sync — possible key compromise"
    }
  ],
  "types": [
    {
      "name": "DepositEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "shares_minted",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "EmergencyDrainEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "amount_drained",
            "type": "u64"
          },
          {
            "name": "destination",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "MultisigConfig",
      "docs": [
        "Multisig configuration for a vault",
        "Replaces single authority with 2-of-3 signer model"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "docs": [
              "The vault this multisig belongs to"
            ],
            "type": "pubkey"
          },
          {
            "name": "signers",
            "docs": [
              "List of authorized signers (up to MAX_MULTISIG_SIGNERS)"
            ],
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "threshold",
            "docs": [
              "Number of approvals required to execute (e.g., 2 for 2-of-3)"
            ],
            "type": "u8"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "MultisigInitializedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "signers",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "threshold",
            "type": "u8"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "NavSyncEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "old_total_assets",
            "type": "u64"
          },
          {
            "name": "new_total_assets",
            "type": "u64"
          },
          {
            "name": "pps",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "OperationApprovedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "operation_id",
            "type": "u64"
          },
          {
            "name": "approver",
            "type": "pubkey"
          },
          {
            "name": "approvals_count",
            "type": "u8"
          },
          {
            "name": "threshold",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "OperationCancelledEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "operation_id",
            "type": "u64"
          },
          {
            "name": "cancelled_by",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "OperationExecutedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "operation_id",
            "type": "u64"
          },
          {
            "name": "operation_type",
            "type": "u8"
          },
          {
            "name": "executed_at",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "OperationProposedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "operation_id",
            "type": "u64"
          },
          {
            "name": "operation_type",
            "type": "u8"
          },
          {
            "name": "proposed_at",
            "type": "i64"
          },
          {
            "name": "executable_at",
            "type": "i64"
          },
          {
            "name": "proposer",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "OperationType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "SyncNav"
          },
          {
            "name": "Pause"
          },
          {
            "name": "Unpause"
          },
          {
            "name": "CollectFee"
          },
          {
            "name": "EmergencyWithdraw"
          }
        ]
      }
    },
    {
      "name": "PendingOperation",
      "docs": [
        "Represents an operation waiting for multisig approval and timelock"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "docs": [
              "The vault this operation belongs to"
            ],
            "type": "pubkey"
          },
          {
            "name": "operation_id",
            "docs": [
              "Unique operation ID within the vault"
            ],
            "type": "u64"
          },
          {
            "name": "operation_type",
            "docs": [
              "Type of operation being performed"
            ],
            "type": {
              "defined": {
                "name": "OperationType"
              }
            }
          },
          {
            "name": "proposed_at",
            "docs": [
              "When this operation was proposed"
            ],
            "type": "i64"
          },
          {
            "name": "executable_at",
            "docs": [
              "When this operation can be executed (after timelock)"
            ],
            "type": "i64"
          },
          {
            "name": "is_executed",
            "docs": [
              "Whether operation has been executed"
            ],
            "type": "bool"
          },
          {
            "name": "is_cancelled",
            "docs": [
              "Whether operation has been cancelled"
            ],
            "type": "bool"
          },
          {
            "name": "approvals",
            "docs": [
              "List of signers who have approved"
            ],
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "StrategyChangeType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "ProbabilityRange"
          },
          {
            "name": "MaxPositionSize"
          },
          {
            "name": "LendingAllocation"
          },
          {
            "name": "Categories"
          }
        ]
      }
    },
    {
      "name": "StrategyConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "docs": [
              "The vault this strategy belongs to"
            ],
            "type": "pubkey"
          },
          {
            "name": "min_probability",
            "docs": [
              "Minimum event probability to consider (basis points, 8500 = 85%)"
            ],
            "type": "u16"
          },
          {
            "name": "max_probability",
            "docs": [
              "Maximum event probability to consider (basis points, 10000 = 100%)"
            ],
            "type": "u16"
          },
          {
            "name": "max_position_pct",
            "docs": [
              "Max percentage of vault in a single position (basis points, 1000 = 10%)"
            ],
            "type": "u16"
          },
          {
            "name": "lend_allocation_pct",
            "docs": [
              "Percentage of idle USDC routed to Jupiter Lend (basis points, 7000 = 70%)"
            ],
            "type": "u16"
          },
          {
            "name": "categories",
            "docs": [
              "Allowed market categories (e.g. \"crypto\", \"politics\", \"sports\")"
            ],
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "is_active",
            "docs": [
              "Whether this strategy is actively trading"
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "StrategyProposal",
      "docs": [
        "Strategy change proposal with on-chain governance voting"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "docs": [
              "The vault this proposal is for"
            ],
            "type": "pubkey"
          },
          {
            "name": "proposal_id",
            "docs": [
              "Unique proposal ID"
            ],
            "type": "u64"
          },
          {
            "name": "change_type",
            "docs": [
              "What parameter is being changed"
            ],
            "type": {
              "defined": {
                "name": "StrategyChangeType"
              }
            }
          },
          {
            "name": "new_value",
            "docs": [
              "New value (interpreted based on change_type)"
            ],
            "type": "u64"
          },
          {
            "name": "voting_ends_at",
            "docs": [
              "When voting ends"
            ],
            "type": "i64"
          },
          {
            "name": "votes_for",
            "docs": [
              "Total votes in favor (in share units)"
            ],
            "type": "u64"
          },
          {
            "name": "votes_against",
            "docs": [
              "Total votes against (in share units)"
            ],
            "type": "u64"
          },
          {
            "name": "is_executed",
            "docs": [
              "Whether proposal passed and was executed"
            ],
            "type": "bool"
          },
          {
            "name": "is_rejected",
            "docs": [
              "Whether proposal was rejected"
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "StrategyProposalCreatedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "proposal_id",
            "type": "u64"
          },
          {
            "name": "change_type",
            "type": "u8"
          },
          {
            "name": "new_value",
            "type": "u64"
          },
          {
            "name": "voting_ends_at",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "StrategyProposalExecutedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "proposal_id",
            "type": "u64"
          },
          {
            "name": "change_type",
            "type": "u8"
          },
          {
            "name": "new_value",
            "type": "u64"
          },
          {
            "name": "votes_for",
            "type": "u64"
          },
          {
            "name": "votes_against",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "StrategyUpdateEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "strategy_type",
            "type": "u8"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "UserVote",
      "docs": [
        "Tracks a user's vote on a specific proposal"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "docs": [
              "The proposal this vote is for"
            ],
            "type": "pubkey"
          },
          {
            "name": "voter",
            "docs": [
              "The voter"
            ],
            "type": "pubkey"
          },
          {
            "name": "voted_for",
            "docs": [
              "Whether they voted for (true) or against (false)"
            ],
            "type": "bool"
          },
          {
            "name": "vote_weight",
            "docs": [
              "How many shares they voted with"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "VaultState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Wallet authorized to execute trades and manage the vault (strategy engine)"
            ],
            "type": "pubkey"
          },
          {
            "name": "asset_mint",
            "docs": [
              "SPL mint of the deposit asset (USDC)"
            ],
            "type": "pubkey"
          },
          {
            "name": "shares_mint",
            "docs": [
              "Token-2022 mint for vault share tokens"
            ],
            "type": "pubkey"
          },
          {
            "name": "asset_vault",
            "docs": [
              "PDA token account holding the vault's USDC reserves"
            ],
            "type": "pubkey"
          },
          {
            "name": "total_assets",
            "docs": [
              "Total assets under management (synced from off-chain NAV, in asset base units)"
            ],
            "type": "u64"
          },
          {
            "name": "total_shares",
            "docs": [
              "Total outstanding share tokens (in share base units)"
            ],
            "type": "u64"
          },
          {
            "name": "vault_id",
            "docs": [
              "Unique identifier for this vault"
            ],
            "type": "u64"
          },
          {
            "name": "strategy_type",
            "docs": [
              "0 = Safe Consensus, 1 = Macro Contrarian, 2 = Yield Maximizer"
            ],
            "type": "u8"
          },
          {
            "name": "high_water_mark",
            "docs": [
              "Highest recorded PPS (6 decimal fixed-point, 1_000_000 = 1.0 USDC/share)"
            ],
            "type": "u64"
          },
          {
            "name": "performance_fee_bps",
            "docs": [
              "Performance fee in basis points (e.g. 1000 = 10%)"
            ],
            "type": "u16"
          },
          {
            "name": "is_paused",
            "docs": [
              "When true, deposits and withdrawals are blocked"
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "VoteCastEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "proposal_id",
            "type": "u64"
          },
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "voted_for",
            "type": "bool"
          },
          {
            "name": "vote_weight",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "WithdrawEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "shares_burned",
            "type": "u64"
          },
          {
            "name": "amount_returned",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    }
  ]
} as unknown as Idl;

export type SpectraVault = Idl;
