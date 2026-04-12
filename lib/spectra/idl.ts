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
