/**
 * Anchor IDL for the spectra_vault program (Anchor 0.31.1 format).
 *
 * Hand-transcribed from programs/spectra-vault/src/. After running
 * `anchor build`, replace with the generated target/types/spectra_vault.ts.
 */
export type SpectraVault = {
  address: "JBagp4qXz26XMHce1tXMpEwgVKPBpRGj7ejvsJXaoQhH";
  metadata: {
    name: "spectra_vault";
    version: "0.1.0";
    spec: "0.1.0";
  };
  instructions: [
    {
      name: "collect_performance_fee";
      discriminator: [229, 161, 124, 196, 71, 241, 11, 48];
      accounts: [
        { name: "authority"; writable: true; signer: true; relations: ["vault"] },
        {
          name: "vault";
          writable: true;
          pda: {
            seeds: [
              { kind: "const"; value: [118, 97, 117, 108, 116] },
              { kind: "account"; path: "vault.vault_id"; account: "VaultState" },
            ];
          };
        },
        { name: "shares_mint"; writable: true },
        { name: "authority_shares_account"; writable: true },
        { name: "token_2022_program"; address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" },
        { name: "associated_token_program"; address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" },
        { name: "system_program"; address: "11111111111111111111111111111111" },
      ];
      args: [];
    },
    {
      name: "deposit";
      discriminator: [242, 35, 198, 137, 82, 225, 242, 182];
      accounts: [
        { name: "user"; writable: true; signer: true },
        {
          name: "vault";
          writable: true;
          pda: {
            seeds: [
              { kind: "const"; value: [118, 97, 117, 108, 116] },
              { kind: "account"; path: "vault.vault_id"; account: "VaultState" },
            ];
          };
        },
        { name: "asset_mint" },
        { name: "shares_mint"; writable: true },
        { name: "asset_vault"; writable: true },
        { name: "user_asset_account"; writable: true },
        { name: "user_shares_account"; writable: true },
        { name: "token_program"; address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { name: "token_2022_program"; address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" },
        { name: "associated_token_program"; address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" },
        { name: "system_program"; address: "11111111111111111111111111111111" },
      ];
      args: [{ name: "amount"; type: "u64" }];
    },
    {
      name: "initialize_vault";
      discriminator: [48, 191, 163, 44, 71, 129, 63, 164];
      accounts: [
        { name: "admin"; writable: true; signer: true },
        {
          name: "vault";
          writable: true;
          pda: {
            seeds: [
              { kind: "const"; value: [118, 97, 117, 108, 116] },
              { kind: "arg"; path: "vaultId" },
            ];
          };
        },
        { name: "asset_mint" },
        {
          name: "shares_mint";
          writable: true;
          pda: {
            seeds: [
              { kind: "const"; value: [115, 104, 97, 114, 101, 115, 95, 109, 105, 110, 116] },
              { kind: "account"; path: "vault" },
            ];
          };
        },
        {
          name: "asset_vault";
          writable: true;
          pda: {
            seeds: [
              { kind: "const"; value: [97, 115, 115, 101, 116, 95, 118, 97, 117, 108, 116] },
              { kind: "account"; path: "vault" },
            ];
          };
        },
        {
          name: "strategy_config";
          writable: true;
          pda: {
            seeds: [
              { kind: "const"; value: [115, 116, 114, 97, 116, 101, 103, 121] },
              { kind: "account"; path: "vault" },
            ];
          };
        },
        { name: "token_program"; address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { name: "token_2022_program"; address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" },
        { name: "system_program"; address: "11111111111111111111111111111111" },
      ];
      args: [
        { name: "vaultId"; type: "u64" },
        { name: "strategyType"; type: "u8" },
        { name: "performanceFeeBps"; type: "u16" },
        { name: "minProbability"; type: "u16" },
        { name: "maxProbability"; type: "u16" },
        { name: "maxPositionPct"; type: "u16" },
        { name: "lendAllocationPct"; type: "u16" },
        { name: "categories"; type: { vec: "string" } },
      ];
    },
    {
      name: "pause";
      discriminator: [211, 22, 221, 251, 74, 121, 193, 47];
      accounts: [
        { name: "authority"; signer: true; relations: ["vault"] },
        {
          name: "vault";
          writable: true;
          pda: {
            seeds: [
              { kind: "const"; value: [118, 97, 117, 108, 116] },
              { kind: "account"; path: "vault.vault_id"; account: "VaultState" },
            ];
          };
        },
      ];
      args: [];
    },
    {
      name: "sync_nav";
      discriminator: [120, 176, 60, 90, 47, 88, 150, 125];
      accounts: [
        { name: "authority"; signer: true; relations: ["vault"] },
        {
          name: "vault";
          writable: true;
          pda: {
            seeds: [
              { kind: "const"; value: [118, 97, 117, 108, 116] },
              { kind: "account"; path: "vault.vault_id"; account: "VaultState" },
            ];
          };
        },
      ];
      args: [{ name: "newTotalAssets"; type: "u64" }];
    },
    {
      name: "unpause";
      discriminator: [169, 144, 4, 38, 10, 141, 188, 255];
      accounts: [
        { name: "authority"; signer: true; relations: ["vault"] },
        {
          name: "vault";
          writable: true;
          pda: {
            seeds: [
              { kind: "const"; value: [118, 97, 117, 108, 116] },
              { kind: "account"; path: "vault.vault_id"; account: "VaultState" },
            ];
          };
        },
      ];
      args: [];
    },
    {
      name: "withdraw";
      discriminator: [183, 18, 70, 156, 148, 109, 161, 34];
      accounts: [
        { name: "user"; writable: true; signer: true },
        {
          name: "vault";
          writable: true;
          pda: {
            seeds: [
              { kind: "const"; value: [118, 97, 117, 108, 116] },
              { kind: "account"; path: "vault.vault_id"; account: "VaultState" },
            ];
          };
        },
        { name: "asset_mint" },
        { name: "shares_mint"; writable: true },
        { name: "asset_vault"; writable: true },
        { name: "user_asset_account"; writable: true },
        { name: "user_shares_account"; writable: true },
        { name: "token_program"; address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { name: "token_2022_program"; address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" },
      ];
      args: [{ name: "shares"; type: "u64" }];
    },
  ];
  accounts: [
    { name: "VaultState"; discriminator: [228, 196, 82, 165, 98, 210, 235, 152] },
    { name: "StrategyConfig"; discriminator: [103, 12, 123, 61, 47, 87, 129, 57] },
  ];
  events: [
    { name: "DepositEvent"; discriminator: [120, 248, 61, 83, 31, 142, 107, 144] },
    { name: "WithdrawEvent"; discriminator: [22, 9, 133, 26, 160, 44, 71, 192] },
    { name: "NavSyncEvent"; discriminator: [49, 198, 186, 73, 11, 174, 152, 149] },
    { name: "StrategyUpdateEvent"; discriminator: [203, 89, 37, 78, 232, 158, 222, 60] },
  ];
  errors: [
    { code: 6000; name: "Unauthorized"; msg: "Signer is not the vault authority" },
    { code: 6001; name: "VaultPaused"; msg: "Vault is currently paused" },
    { code: 6002; name: "VaultNotPaused"; msg: "Vault is not paused" },
    { code: 6003; name: "InvalidAmount"; msg: "Deposit amount must be greater than zero" },
    { code: 6004; name: "InsufficientShares"; msg: "Insufficient shares balance for withdrawal" },
    { code: 6005; name: "MathOverflow"; msg: "Arithmetic overflow" },
    { code: 6006; name: "InvalidStrategyType"; msg: "Invalid strategy type (must be 0, 1, or 2)" },
    { code: 6007; name: "NoFeeToCollect"; msg: "No performance fee to collect — PPS is at or below high-water mark" },
    { code: 6008; name: "InvalidProbabilityRange"; msg: "min_probability must be less than or equal to max_probability" },
    { code: 6009; name: "InsufficientVaultBalance"; msg: "Vault reserves insufficient to cover withdrawal" },
    { code: 6010; name: "TooManyCategories"; msg: "Too many categories (max 8)" },
    { code: 6011; name: "CategoryTooLong"; msg: "Category string too long (max 32 bytes)" },
    { code: 6012; name: "InvalidFeeBps"; msg: "Performance fee basis points out of range (max 5000)" },
  ];
  types: [
    {
      name: "VaultState";
      type: {
        kind: "struct";
        fields: [
          { name: "authority"; type: "pubkey" },
          { name: "assetMint"; type: "pubkey" },
          { name: "sharesMint"; type: "pubkey" },
          { name: "assetVault"; type: "pubkey" },
          { name: "totalAssets"; type: "u64" },
          { name: "totalShares"; type: "u64" },
          { name: "vaultId"; type: "u64" },
          { name: "strategyType"; type: "u8" },
          { name: "highWaterMark"; type: "u64" },
          { name: "performanceFeeBps"; type: "u16" },
          { name: "isPaused"; type: "bool" },
          { name: "bump"; type: "u8" },
        ];
      };
    },
    {
      name: "StrategyConfig";
      type: {
        kind: "struct";
        fields: [
          { name: "vault"; type: "pubkey" },
          { name: "minProbability"; type: "u16" },
          { name: "maxProbability"; type: "u16" },
          { name: "maxPositionPct"; type: "u16" },
          { name: "lendAllocationPct"; type: "u16" },
          { name: "categories"; type: { vec: "string" } },
          { name: "isActive"; type: "bool" },
          { name: "bump"; type: "u8" },
        ];
      };
    },
    {
      name: "DepositEvent";
      type: {
        kind: "struct";
        fields: [
          { name: "vault"; type: "pubkey" },
          { name: "user"; type: "pubkey" },
          { name: "amount"; type: "u64" },
          { name: "sharesMinted"; type: "u64" },
          { name: "timestamp"; type: "i64" },
        ];
      };
    },
    {
      name: "WithdrawEvent";
      type: {
        kind: "struct";
        fields: [
          { name: "vault"; type: "pubkey" },
          { name: "user"; type: "pubkey" },
          { name: "sharesBurned"; type: "u64" },
          { name: "amountReturned"; type: "u64" },
          { name: "timestamp"; type: "i64" },
        ];
      };
    },
    {
      name: "NavSyncEvent";
      type: {
        kind: "struct";
        fields: [
          { name: "vault"; type: "pubkey" },
          { name: "oldTotalAssets"; type: "u64" },
          { name: "newTotalAssets"; type: "u64" },
          { name: "pps"; type: "u64" },
          { name: "timestamp"; type: "i64" },
        ];
      };
    },
    {
      name: "StrategyUpdateEvent";
      type: {
        kind: "struct";
        fields: [
          { name: "vault"; type: "pubkey" },
          { name: "strategyType"; type: "u8" },
          { name: "timestamp"; type: "i64" },
        ];
      };
    },
  ];
};

export const IDL: SpectraVault = {
  address: "JBagp4qXz26XMHce1tXMpEwgVKPBpRGj7ejvsJXaoQhH",
  metadata: {
    name: "spectra_vault",
    version: "0.1.0",
    spec: "0.1.0",
  },
  instructions: [
    {
      name: "collect_performance_fee",
      discriminator: [229, 161, 124, 196, 71, 241, 11, 48],
      accounts: [
        { name: "authority", writable: true, signer: true, relations: ["vault"] },
        {
          name: "vault",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [118, 97, 117, 108, 116] },
              { kind: "account", path: "vault.vault_id", account: "VaultState" },
            ],
          },
        },
        { name: "shares_mint", writable: true },
        { name: "authority_shares_account", writable: true },
        { name: "token_2022_program", address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" },
        { name: "associated_token_program", address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" },
        { name: "system_program", address: "11111111111111111111111111111111" },
      ],
      args: [],
    },
    {
      name: "deposit",
      discriminator: [242, 35, 198, 137, 82, 225, 242, 182],
      accounts: [
        { name: "user", writable: true, signer: true },
        {
          name: "vault",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [118, 97, 117, 108, 116] },
              { kind: "account", path: "vault.vault_id", account: "VaultState" },
            ],
          },
        },
        { name: "asset_mint" },
        { name: "shares_mint", writable: true },
        { name: "asset_vault", writable: true },
        { name: "user_asset_account", writable: true },
        { name: "user_shares_account", writable: true },
        { name: "token_program", address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { name: "token_2022_program", address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" },
        { name: "associated_token_program", address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" },
        { name: "system_program", address: "11111111111111111111111111111111" },
      ],
      args: [{ name: "amount", type: "u64" }],
    },
    {
      name: "initialize_vault",
      discriminator: [48, 191, 163, 44, 71, 129, 63, 164],
      accounts: [
        { name: "admin", writable: true, signer: true },
        {
          name: "vault",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [118, 97, 117, 108, 116] },
              { kind: "arg", path: "vaultId" },
            ],
          },
        },
        { name: "asset_mint" },
        {
          name: "shares_mint",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [115, 104, 97, 114, 101, 115, 95, 109, 105, 110, 116] },
              { kind: "account", path: "vault" },
            ],
          },
        },
        {
          name: "asset_vault",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [97, 115, 115, 101, 116, 95, 118, 97, 117, 108, 116] },
              { kind: "account", path: "vault" },
            ],
          },
        },
        {
          name: "strategy_config",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [115, 116, 114, 97, 116, 101, 103, 121] },
              { kind: "account", path: "vault" },
            ],
          },
        },
        { name: "token_program", address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { name: "token_2022_program", address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" },
        { name: "system_program", address: "11111111111111111111111111111111" },
      ],
      args: [
        { name: "vaultId", type: "u64" },
        { name: "strategyType", type: "u8" },
        { name: "performanceFeeBps", type: "u16" },
        { name: "minProbability", type: "u16" },
        { name: "maxProbability", type: "u16" },
        { name: "maxPositionPct", type: "u16" },
        { name: "lendAllocationPct", type: "u16" },
        { name: "categories", type: { vec: "string" } },
      ],
    },
    {
      name: "pause",
      discriminator: [211, 22, 221, 251, 74, 121, 193, 47],
      accounts: [
        { name: "authority", signer: true, relations: ["vault"] },
        {
          name: "vault",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [118, 97, 117, 108, 116] },
              { kind: "account", path: "vault.vault_id", account: "VaultState" },
            ],
          },
        },
      ],
      args: [],
    },
    {
      name: "sync_nav",
      discriminator: [120, 176, 60, 90, 47, 88, 150, 125],
      accounts: [
        { name: "authority", signer: true, relations: ["vault"] },
        {
          name: "vault",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [118, 97, 117, 108, 116] },
              { kind: "account", path: "vault.vault_id", account: "VaultState" },
            ],
          },
        },
      ],
      args: [{ name: "newTotalAssets", type: "u64" }],
    },
    {
      name: "unpause",
      discriminator: [169, 144, 4, 38, 10, 141, 188, 255],
      accounts: [
        { name: "authority", signer: true, relations: ["vault"] },
        {
          name: "vault",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [118, 97, 117, 108, 116] },
              { kind: "account", path: "vault.vault_id", account: "VaultState" },
            ],
          },
        },
      ],
      args: [],
    },
    {
      name: "withdraw",
      discriminator: [183, 18, 70, 156, 148, 109, 161, 34],
      accounts: [
        { name: "user", writable: true, signer: true },
        {
          name: "vault",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [118, 97, 117, 108, 116] },
              { kind: "account", path: "vault.vault_id", account: "VaultState" },
            ],
          },
        },
        { name: "asset_mint" },
        { name: "shares_mint", writable: true },
        { name: "asset_vault", writable: true },
        { name: "user_asset_account", writable: true },
        { name: "user_shares_account", writable: true },
        { name: "token_program", address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { name: "token_2022_program", address: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" },
      ],
      args: [{ name: "shares", type: "u64" }],
    },
  ],
  accounts: [
    { name: "VaultState", discriminator: [228, 196, 82, 165, 98, 210, 235, 152] },
    { name: "StrategyConfig", discriminator: [103, 12, 123, 61, 47, 87, 129, 57] },
  ],
  events: [
    { name: "DepositEvent", discriminator: [120, 248, 61, 83, 31, 142, 107, 144] },
    { name: "WithdrawEvent", discriminator: [22, 9, 133, 26, 160, 44, 71, 192] },
    { name: "NavSyncEvent", discriminator: [49, 198, 186, 73, 11, 174, 152, 149] },
    { name: "StrategyUpdateEvent", discriminator: [203, 89, 37, 78, 232, 158, 222, 60] },
  ],
  errors: [
    { code: 6000, name: "Unauthorized", msg: "Signer is not the vault authority" },
    { code: 6001, name: "VaultPaused", msg: "Vault is currently paused" },
    { code: 6002, name: "VaultNotPaused", msg: "Vault is not paused" },
    { code: 6003, name: "InvalidAmount", msg: "Deposit amount must be greater than zero" },
    { code: 6004, name: "InsufficientShares", msg: "Insufficient shares balance for withdrawal" },
    { code: 6005, name: "MathOverflow", msg: "Arithmetic overflow" },
    { code: 6006, name: "InvalidStrategyType", msg: "Invalid strategy type (must be 0, 1, or 2)" },
    { code: 6007, name: "NoFeeToCollect", msg: "No performance fee to collect — PPS is at or below high-water mark" },
    { code: 6008, name: "InvalidProbabilityRange", msg: "min_probability must be less than or equal to max_probability" },
    { code: 6009, name: "InsufficientVaultBalance", msg: "Vault reserves insufficient to cover withdrawal" },
    { code: 6010, name: "TooManyCategories", msg: "Too many categories (max 8)" },
    { code: 6011, name: "CategoryTooLong", msg: "Category string too long (max 32 bytes)" },
    { code: 6012, name: "InvalidFeeBps", msg: "Performance fee basis points out of range (max 5000)" },
  ],
  types: [
    {
      name: "VaultState",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "pubkey" },
          { name: "assetMint", type: "pubkey" },
          { name: "sharesMint", type: "pubkey" },
          { name: "assetVault", type: "pubkey" },
          { name: "totalAssets", type: "u64" },
          { name: "totalShares", type: "u64" },
          { name: "vaultId", type: "u64" },
          { name: "strategyType", type: "u8" },
          { name: "highWaterMark", type: "u64" },
          { name: "performanceFeeBps", type: "u16" },
          { name: "isPaused", type: "bool" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "StrategyConfig",
      type: {
        kind: "struct",
        fields: [
          { name: "vault", type: "pubkey" },
          { name: "minProbability", type: "u16" },
          { name: "maxProbability", type: "u16" },
          { name: "maxPositionPct", type: "u16" },
          { name: "lendAllocationPct", type: "u16" },
          { name: "categories", type: { vec: "string" } },
          { name: "isActive", type: "bool" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "DepositEvent",
      type: {
        kind: "struct",
        fields: [
          { name: "vault", type: "pubkey" },
          { name: "user", type: "pubkey" },
          { name: "amount", type: "u64" },
          { name: "sharesMinted", type: "u64" },
          { name: "timestamp", type: "i64" },
        ],
      },
    },
    {
      name: "WithdrawEvent",
      type: {
        kind: "struct",
        fields: [
          { name: "vault", type: "pubkey" },
          { name: "user", type: "pubkey" },
          { name: "sharesBurned", type: "u64" },
          { name: "amountReturned", type: "u64" },
          { name: "timestamp", type: "i64" },
        ],
      },
    },
    {
      name: "NavSyncEvent",
      type: {
        kind: "struct",
        fields: [
          { name: "vault", type: "pubkey" },
          { name: "oldTotalAssets", type: "u64" },
          { name: "newTotalAssets", type: "u64" },
          { name: "pps", type: "u64" },
          { name: "timestamp", type: "i64" },
        ],
      },
    },
    {
      name: "StrategyUpdateEvent",
      type: {
        kind: "struct",
        fields: [
          { name: "vault", type: "pubkey" },
          { name: "strategyType", type: "u8" },
          { name: "timestamp", type: "i64" },
        ],
      },
    },
  ],
};
