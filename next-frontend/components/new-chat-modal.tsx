import { useState, useEffect } from "react";
import { X, Search, User, Loader2 } from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useSearch } from "../hooks/useSearch";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (receiverAddress: string) => void;
  isLoading?: boolean;
}

export function NewChatModal({
  isOpen,
  onClose,
  onStartChat,
  isLoading,
}: NewChatModalProps) {
  const currentAccount = useCurrentAccount();
  const { search, isSearching } = useSearch();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [searchMode, setSearchMode] = useState<'username' | 'address'>('username');

  // Search for users by username
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      const results = await search(searchQuery, { users: true, posts: false });
      const userResults = results.filter((r) => r.type === 'user');
      setSearchResults(userResults);
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, search]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    let targetAddress = address;

    // If user selected from search, use their address
    if (selectedUser) {
      targetAddress = selectedUser.address;
    }

    // Basic Sui address validation
    if (!targetAddress.startsWith("0x")) {
      setError("Address must start with 0x");
      return;
    }

    if (targetAddress.length < 64) {
      setError("Invalid Sui address format");
      return;
    }

    // Check if trying to message self
    if (currentAccount && targetAddress.toLowerCase() === currentAccount.address.toLowerCase()) {
      setError("You cannot start a chat with yourself");
      return;
    }

    onStartChat(targetAddress);
    handleClose();
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setSearchQuery(user.username || user.address);
    setSearchResults([]);
  };

  const handleClose = () => {
    setAddress("");
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUser(null);
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative bg-background rounded-2xl w-full max-w-md border border-border shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Start New Chat</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Search Mode Toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => setSearchMode('username')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                searchMode === 'username'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Search by Username
            </button>
            <button
              type="button"
              onClick={() => setSearchMode('address')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                searchMode === 'address'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Use Address
            </button>
          </div>

          {searchMode === 'username' ? (
            <>
              {/* Username Search */}
              <div>
                <label
                  htmlFor="username-search"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Search for User
                </label>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="username-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedUser(null);
                    }}
                    placeholder="Search by username..."
                    className="w-full bg-muted text-foreground placeholder-muted-foreground rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={isLoading}
                  />
                  {isSearching && (
                    <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-60 overflow-y-auto border border-border rounded-lg bg-background">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        className="w-full p-3 hover:bg-muted transition-colors flex items-center gap-3 text-left border-b border-border last:border-b-0"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                          {user.pfpUrl ? (
                            <img src={user.pfpUrl} alt={user.username} className="w-full h-full object-cover" />
                          ) : (
                            <User size={20} className="text-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">{user.username}</p>
                          {user.bio && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{user.bio}</p>
                          )}
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            {user.address.slice(0, 8)}...{user.address.slice(-6)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected User Display */}
                {selectedUser && (
                  <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                      {selectedUser.pfpUrl ? (
                        <img src={selectedUser.pfpUrl} alt={selectedUser.username} className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} className="text-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{selectedUser.username}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {selectedUser.address.slice(0, 8)}...{selectedUser.address.slice(-6)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Address Input */}
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Recipient Sui Address
                </label>
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-muted text-foreground placeholder-muted-foreground rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-border rounded-full font-semibold hover:bg-muted transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-foreground text-background rounded-full font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              disabled={isLoading || (searchMode === 'username' ? !selectedUser : !address)}
            >
              {isLoading ? "Starting..." : "Start Chat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
