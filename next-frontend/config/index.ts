const CONFIG = {
  VITE_PACKAGE_ID: import.meta.env.VITE_PACKAGE_ID || "0x...",
  VITE_API_URL: import.meta.env.VITE_API_URL || "https://api.example.com",
  VITE_WALRUS_URL:
    import.meta.env.VITE_WALRUS_URL || "https://walrus.example.com",
};

export default CONFIG;
