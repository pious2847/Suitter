import { Search, Send, ArrowLeft, Plus } from "lucide-react";
import { NavHeader } from "../../components/nav-header";
import { NewChatModal } from "../../components/new-chat-modal";
import { useState, useEffect } from "react";
import { useMessaging } from "../../hooks/useMessaging";
import { useCurrentAccount } from "@mysten/dapp-kit";

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isSender: boolean;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function MessagesPage() {
  const currentAccount = useCurrentAccount();
  const {
    chats,
    chatsLoading,
    startChat,
    sendMessage,
    useMessages,
    isStartingChat,
    isSendingMessage,
  } = useMessaging();

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);

  // Get messages for selected chat
  const { data: chatMessages = [] } = useMessages(selectedChat);

  // Convert blockchain messages to UI format
  const messages: Message[] = chatMessages.map((msg: any, index: number) => ({
    id: index.toString(),
    sender: msg.sender,
    text: msg.text || "",
    timestamp: parseInt(msg.sentTimestamp) || Date.now(),
    isSender: msg.sender === currentAccount?.address,
  }));

  const handleStartChat = (receiverAddress: string) => {
    startChat(receiverAddress, {
      onSuccess: () => {
        setIsNewChatOpen(false);
      },
    });
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || !selectedChat) return;

    sendMessage(
      { chatId: selectedChat, message: inputValue },
      {
        onSuccess: () => {
          setInputValue("");
        },
      }
    );
  };

  // Auto-select first chat if available
  useEffect(() => {
    if (!selectedChat && chats && chats.length > 0) {
      setSelectedChat(chats[0].id);
    }
  }, [chats, selectedChat]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <NavHeader />

      <main className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Chat List */}
          <div
            className={`w-full sm:w-80 flex flex-col border-r border-border ${
              !showMobileList ? "hidden sm:flex" : ""
            }`}
          >
            {/* Header */}
            <div className="border-b border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Messages</h2>
                <button
                  onClick={() => setIsNewChatOpen(true)}
                  className="p-2 bg-foreground text-background rounded-full hover:opacity-90 transition-opacity"
                  aria-label="Start new chat"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2">
                <Search size={18} className="text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search messages"
                  className="bg-transparent flex-1 text-foreground placeholder-muted-foreground focus:outline-none text-sm"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {!currentAccount ? (
                <div className="p-4 text-center text-muted-foreground">
                  Connect your wallet to view messages
                </div>
              ) : chatsLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading chats...
                </div>
              ) : !chats || chats.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No chats yet. Start a new conversation!
                </div>
              ) : (
                chats.map((chat) => {
                  const otherParty =
                    chat.sender === currentAccount?.address
                      ? chat.receiver
                      : chat.sender;
                  const shortAddress = `${otherParty.slice(
                    0,
                    6
                  )}...${otherParty.slice(-4)}`;

                  return (
                    <button
                      key={chat.id}
                      onClick={() => {
                        setSelectedChat(chat.id);
                        setShowMobileList(false);
                      }}
                      className={`w-full p-4 border-b border-border hover:bg-muted/30 transition-colors text-left ${
                        selectedChat === chat.id ? "bg-muted/50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                          {otherParty.charAt(2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground">
                            {shortAddress}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {chat.messages && chat.messages.length > 0
                              ? "Recent message"
                              : "No messages yet"}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div
            className={`flex-1 flex flex-col ${
              showMobileList ? "hidden sm:flex" : ""
            }`}
          >
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="border-b border-border p-4 flex items-center gap-3">
                  <button
                    onClick={() => setShowMobileList(true)}
                    className="sm:hidden p-2 hover:bg-muted rounded-full transition-colors"
                    aria-label="Back to messages"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  {chats &&
                    chats.find((c) => c.id === selectedChat) &&
                    (() => {
                      const chat = chats.find((c) => c.id === selectedChat)!;
                      const otherParty =
                        chat.sender === currentAccount?.address
                          ? chat.receiver
                          : chat.sender;
                      const shortAddress = `${otherParty.slice(
                        0,
                        6
                      )}...${otherParty.slice(-4)}`;

                      return (
                        <>
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                            {otherParty.charAt(2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">
                              {shortAddress}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              On Sui Network
                            </div>
                          </div>
                        </>
                      );
                    })()}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.isSender ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-2xl ${
                            msg.isSender
                              ? "bg-foreground text-background"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <p className="text-sm">{msg.text}</p>
                          <div
                            className={`text-xs mt-1 ${
                              msg.isSender
                                ? "text-background/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {formatTime(msg.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="border-t border-border p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      className="flex-1 bg-muted text-foreground placeholder-muted-foreground rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-foreground/20 text-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="bg-foreground text-background p-2 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
                      aria-label="Send message"
                      disabled={isSendingMessage || !inputValue.trim()}
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p>Select a chat to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onStartChat={handleStartChat}
        isLoading={isStartingChat}
      />
    </div>
  );
}

export default MessagesPage;
