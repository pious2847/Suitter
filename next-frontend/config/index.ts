const CONFIG = {
  VITE_PACKAGE_ID: import.meta.env.VITE_PACKAGE_ID || "0x8cda000f065e2808ecb0491413004f9babf96b06043deaeadddd62ed8118e6aa",
  VITE_API_URL: import.meta.env.VITE_API_URL || "https://api.example.com",
  VITE_WALRUS_URL: import.meta.env.VITE_WALRUS_URL || "https://walrus-testnet-publisher.nodes.guru",
  SUIT_REGISTRY: import.meta.env.VITE_SUIT_REGISTRY || "0x225e1bb4b365a6c0a1e49137a8e55287ff04b8dc893c7f92cdf6889fefc5a6a9",
  INTERACTION_REGISTRY: import.meta.env.VITE_INTERACTION_REGISTRY || "0xdd418ff850b05488984e11d8f2c2aa35b613159d4aea76770b03373ef2c4b96c",
  USERNAME_REGISTRY: import.meta.env.VITE_USERNAME_REGISTRY || "0x74d2effd53358a297d5d080f0983af7bcda28b742f7626bee2e9b45ffc210a69",
  TIP_BALANCE_REGISTRY: import.meta.env.VITE_TIP_BALANCE_REGISTRY || "0xd85d01f8615cebbaec64d12494fded229ad75c83f29dcb22b24e9e26c7f2f7fa",
  CHAT_REGISTRY: import.meta.env.VITE_CHAT_REGISTRY || "0x0ff9400e9bcf372f667d9861c05678c00c082f28a8d372df5919445317afac38",
};

export default CONFIG;
