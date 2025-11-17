const CONFIG = {
  VITE_PACKAGE_ID: import.meta.env.VITE_PACKAGE_ID || "0x85adced0fe590c6d94a07ba8d8034868227d3de4e7d540c1cded78fd6cb38183",
  VITE_API_URL: import.meta.env.VITE_API_URL || "https://api.example.com",
  VITE_WALRUS_URL: import.meta.env.VITE_WALRUS_URL || "https://walrus-testnet-publisher.nodes.guru",
  SUIT_REGISTRY: import.meta.env.VITE_SUIT_REGISTRY || "0xdf6309497d5dcb7e5a4aefb8e90392d10675e4efc4bcf85470978c181e18c63e",
  INTERACTION_REGISTRY: import.meta.env.VITE_INTERACTION_REGISTRY || "0xb602fa6e7d602d95ae48b1c5735d02b7448ad91fea33bae2be0c0c42666f1bc5",
  USERNAME_REGISTRY: import.meta.env.VITE_USERNAME_REGISTRY || "0x4fb3b92339aee9f4c8282b5eaee221eb5ffba8796d90a48a6b7a26b1fc94260a",
  TIP_BALANCE_REGISTRY: import.meta.env.VITE_TIP_BALANCE_REGISTRY || "0xeba4d8d3f39db0c4cc650d4c22e846f7b4a96c6c08de15f1081aadd0c71cea00",
  CHAT_REGISTRY: import.meta.env.VITE_CHAT_REGISTRY || "0x352e601455695225ee3d6b1231da6ab8cd6e497ce7f5183c0dae6dbced2fd9dc",
};

export default CONFIG;
