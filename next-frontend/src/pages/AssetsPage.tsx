import { useState, useEffect } from 'react'
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, Copy, ExternalLink, RefreshCw, Image, Package, Coins, Eye, EyeOff, DollarSign, Download, Heart, MessageCircle, X } from 'lucide-react'
import { MinimalHeader } from '../../components/minimal-header'
import { AppSidebar } from '../../components/app-sidebar'
import { ComposeModal } from '../../components/compose-modal'
import { TrendingSidebar } from '../../components/trending-sidebar'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { useTipping } from '../../hooks/useTipping'
import { toast } from '../../hooks/use-toast'
import CONFIG from '../../config'

// Bid interface - for future implementation
// interface Bid {
//   id: string
//   suitName: string
//   image: string
//   currentBid: number
//   myBid: number
//   highestBidder: string
//   endsIn: string
//   status: 'winning' | 'outbid'
// }

function AssetsContent() {
  const currentAccount = useCurrentAccount()
  const suiClient = useSuiClient()
  const address = currentAccount?.address
  const isConnected = !!currentAccount
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'videos' | 'images'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isBalanceHidden, setIsBalanceHidden] = useState(false)
  const [suiBalance, setSuiBalance] = useState<number>(0)
  const [isLoadingBalance, setIsLoadingBalance] = useState(true)
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [tipBalance, setTipBalance] = useState<any>(null)
  const [isLoadingTips, setIsLoadingTips] = useState(true)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  
  const { getTipBalanceInfo, withdrawFunds } = useTipping()

  // Fetch real SUI balance
  const fetchBalance = async () => {
    if (!address) return
    
    setIsLoadingBalance(true)
    try {
      const balance = await suiClient.getBalance({
        owner: address,
      })
      
      // Convert MIST to SUI (1 SUI = 10^9 MIST)
      const suiAmount = Number(balance.totalBalance) / 1_000_000_000
      setSuiBalance(suiAmount)
    } catch (error) {
      console.error('Error fetching balance:', error)
    } finally {
      setIsLoadingBalance(false)
    }
  }

  // Fetch user's posted content (suits)
  const fetchUserPosts = async () => {
    if (!address) return
    
    setIsLoadingPosts(true)
    try {
      // Get the SuitRegistry to fetch suit IDs
      const registry = await suiClient.getObject({
        id: CONFIG.SUIT_REGISTRY,
        options: { showContent: true },
      })

      const registryContent = registry.data?.content as any
      const suitIds = registryContent?.fields?.suit_ids || []

      // Fetch all suits
      const allSuits = await Promise.all(
        suitIds.map(async (id: string) => {
          try {
            const suit = await suiClient.getObject({
              id,
              options: { showContent: true },
            })
            return suit.data
          } catch (e) {
            return null
          }
        })
      )

      // Filter suits created by this user
      const posts: any[] = []
      
      allSuits.forEach((suit) => {
        if (!suit) return
        
        const fields = (suit.content as any)?.fields
        if (!fields || fields.creator !== address) return

        // Determine media type
        let mediaType: 'text' | 'image' | 'video' = 'text'
        let mediaUrl: string | undefined = undefined

        if (fields?.media_urls?.length > 0) {
          mediaUrl = fields.media_urls[0]
          const contentType = fields.content_type || 'text'
          
          if (contentType === 'video') {
            mediaType = 'video'
          } else if (contentType === 'image') {
            mediaType = 'image'
          } else if (mediaUrl) {
            // Fallback: detect from URL
            const url = mediaUrl.toLowerCase()
            if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || url.includes('video')) {
              mediaType = 'video'
            } else if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif') || url.includes('.webp') || url.includes('image')) {
              mediaType = 'image'
            }
          }
        }

        posts.push({
          id: suit.objectId || '',
          objectId: suit.objectId || '',
          content: fields?.content || '',
          mediaType,
          mediaUrl,
          likes: parseInt(fields?.like_count) || 0,
          comments: parseInt(fields?.comment_count) || 0,
          reposts: parseInt(fields?.retweet_count) || 0,
          tipTotal: Number(fields?.tip_total || 0) / 1_000_000_000, // Convert MIST to SUI
          createdAt: parseInt(fields?.created_at) || Date.now(),
        })
      })

      // Sort by creation date (newest first)
      posts.sort((a, b) => b.createdAt - a.createdAt)

      setUserPosts(posts)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setIsLoadingPosts(false)
    }
  }

  // Fetch tip balance
  const fetchTipBalance = async () => {
    if (!address) return
    
    setIsLoadingTips(true)
    try {
      const balance = await getTipBalanceInfo(address)
      setTipBalance(balance)
    } catch (error) {
      console.error('Error fetching tip balance:', error)
    } finally {
      setIsLoadingTips(false)
    }
  }

  // Handle withdrawal
  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to withdraw",
        variant: "destructive",
      })
      return
    }

    const amount = parseFloat(withdrawAmount)
    if (amount > tipBalance.balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance to withdraw this amount",
        variant: "destructive",
      })
      return
    }

    setIsWithdrawing(true)
    try {
      const result = await withdrawFunds(amount)
      if (result) {
        toast({
          title: "Withdrawal Successful!",
          description: `${amount} SUI has been transferred to your wallet`,
          variant: "success",
        })
        setShowWithdrawModal(false)
        setWithdrawAmount('')
        // Refresh balances
        await Promise.all([fetchBalance(), fetchTipBalance()])
      }
    } catch (error: any) {
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Failed to withdraw funds",
        variant: "destructive",
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  // Fetch balance, posts, and tips on mount and when address changes
  useEffect(() => {
    fetchBalance()
    fetchUserPosts()
    fetchTipBalance()
  }, [address])

  const walletData = {
    suiBalance: suiBalance,
    suiPrice: 1.85, // You can fetch this from a price API
    totalValue: suiBalance * 1.85,
    change24h: 5.67, // You can fetch this from a price API
  }

  // Bids will be empty for now - can be implemented later
  // const bids: Bid[] = []

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      // TODO: Show toast notification
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchBalance(), fetchUserPosts(), fetchTipBalance()])
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  // Filter posts based on active tab
  const filteredPosts = userPosts.filter(post => {
    if (activeTab === 'all') return true
    if (activeTab === 'videos') return post.mediaType === 'video'
    if (activeTab === 'images') return post.mediaType === 'image'
    return true
  })

  const toggleBalanceVisibility = () => {
    setIsBalanceHidden(!isBalanceHidden)
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <MinimalHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)}
            onCompose={() => setIsComposeOpen(true)}
          />

          <main className="flex-1 overflow-y-auto border-r border-border max-w-4xl">
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                <Wallet size={48} className="text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Connect your Sui wallet to view your assets, tokens, NFTs, and more.
              </p>
            </div>
          </main>

          <TrendingSidebar />
        </div>

        <ComposeModal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <MinimalHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)}
          onCompose={() => setIsComposeOpen(true)}
        />

        <main className="flex-1 overflow-y-auto border-r border-border w-full">
          <div className="h-full flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-background/80 backdrop-blur border-b border-border px-4 py-3 z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-muted rounded-full transition-colors lg:hidden" aria-label="Back">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h2 className="font-bold text-lg text-foreground">Assets</h2>
                  <p className="text-xs text-muted-foreground">Your Sui Wallet</p>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-muted rounded-full transition-colors"
                aria-label="Refresh"
                disabled={isRefreshing}
              >
                <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Wallet Overview Card */}
            <div className="p-4 border-b border-border">
              <div className="bg-linear-to-br from-primary/5 to-accent/10 border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Wallet size={20} className="text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">Total Balance</p>
                        <button
                          onClick={toggleBalanceVisibility}
                          className="p-1 hover:bg-muted rounded transition-colors"
                          aria-label={isBalanceHidden ? "Show balance" : "Hide balance"}
                        >
                          {isBalanceHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      {isLoadingBalance ? (
                        <div className="h-9 w-32 bg-muted animate-pulse rounded" />
                      ) : (
                        <h3 className="text-3xl font-bold">
                          {isBalanceHidden ? '••••••' : `$${walletData.totalValue.toFixed(2)}`}
                        </h3>
                      )}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                    walletData.change24h >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {walletData.change24h >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    <span className="text-sm font-semibold">
                      {isBalanceHidden ? '••••' : `${walletData.change24h >= 0 ? '+' : ''}${walletData.change24h.toFixed(2)}%`}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between bg-background/50 rounded-lg p-3 backdrop-blur mb-3">
                  <span className="text-sm font-mono text-muted-foreground">
                    {address?.slice(0, 8)}...{address?.slice(-6)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyAddress}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      aria-label="Copy address"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      aria-label="View on explorer"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>

                {/* SUI Balance Display */}
                <div className="bg-background/50 rounded-lg p-3 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                        <Coins size={16} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">SUI Balance</p>
                        {isLoadingBalance ? (
                          <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                        ) : (
                          <p className="font-semibold">
                            {isBalanceHidden ? '••••••' : `${walletData.suiBalance.toFixed(4)} SUI`}
                          </p>
                        )}
                      </div>
                    </div>
                    {!isLoadingBalance && !isBalanceHidden && (
                      <p className="text-xs text-muted-foreground">
                        ≈ ${(walletData.suiBalance * walletData.suiPrice).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tip Earnings Card */}
            <div className="p-4 border-b border-border">
              <div className="bg-gradient-to-br from-green-500/5 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                      <DollarSign size={24} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tip Earnings</p>
                      {isLoadingTips ? (
                        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                      ) : (
                        <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {tipBalance?.balance?.toFixed(4) || '0.0000'} SUI
                        </h3>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    disabled={isLoadingTips || !tipBalance?.balance || tipBalance.balance === 0}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Download size={16} />
                    Withdraw
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-background/50 rounded-lg p-3 backdrop-blur">
                    <p className="text-xs text-muted-foreground mb-1">Total Received</p>
                    {isLoadingTips ? (
                      <div className="h-5 w-20 bg-muted animate-pulse rounded" />
                    ) : (
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        {tipBalance?.totalReceived?.toFixed(4) || '0.0000'} SUI
                      </p>
                    )}
                  </div>
                  <div className="bg-background/50 rounded-lg p-3 backdrop-blur">
                    <p className="text-xs text-muted-foreground mb-1">Total Withdrawn</p>
                    {isLoadingTips ? (
                      <div className="h-5 w-20 bg-muted animate-pulse rounded" />
                    ) : (
                      <p className="font-semibold">
                        {tipBalance?.totalWithdrawn?.toFixed(4) || '0.0000'} SUI
                      </p>
                    )}
                  </div>
                </div>

                {!isLoadingTips && tipBalance?.balance === 0 && (
                  <div className="mt-3 p-3 bg-background/50 rounded-lg backdrop-blur text-center">
                    <p className="text-xs text-muted-foreground">
                      💡 Create engaging content to start earning tips from your followers!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 px-4 py-4 font-semibold text-sm transition-colors relative hover:bg-muted/50 ${
                    activeTab === 'all'
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Package size={18} />
                    All Posts
                  </div>
                  {activeTab === 'all' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('videos')}
                  className={`flex-1 px-4 py-4 font-semibold text-sm transition-colors relative hover:bg-muted/50 ${
                    activeTab === 'videos'
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Package size={18} />
                    Videos
                  </div>
                  {activeTab === 'videos' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('images')}
                  className={`flex-1 px-4 py-4 font-semibold text-sm transition-colors relative hover:bg-muted/50 ${
                    activeTab === 'images'
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Image size={18} />
                    Images
                  </div>
                  {activeTab === 'images' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t" />
                  )}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4">
              {isLoadingPosts ? (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw size={32} className="text-muted-foreground animate-spin" />
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                    {activeTab === 'videos' && <Package size={40} className="text-muted-foreground" />}
                    {activeTab === 'images' && <Image size={40} className="text-muted-foreground" />}
                    {activeTab === 'all' && <Package size={40} className="text-muted-foreground" />}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    No {activeTab === 'all' ? 'posts' : activeTab} found
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {activeTab === 'videos' && 'You haven\'t posted any videos yet.'}
                    {activeTab === 'images' && 'You haven\'t posted any images yet.'}
                    {activeTab === 'all' && 'You haven\'t posted anything yet. Start creating!'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className="group relative aspect-square bg-muted rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all cursor-pointer"
                    >
                      {/* Media Display */}
                      {post.mediaType === 'video' && post.mediaUrl ? (
                        <div className="relative w-full h-full">
                          <video
                            src={post.mediaUrl}
                            className="w-full h-full object-cover"
                            muted
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                              <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-black border-b-8 border-b-transparent ml-1" />
                            </div>
                          </div>
                        </div>
                      ) : post.mediaType === 'image' && post.mediaUrl ? (
                        <img
                          src={post.mediaUrl}
                          alt="Post"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-4 bg-linear-to-br from-primary/10 to-accent/10">
                          <p className="text-sm text-center line-clamp-6 text-foreground">
                            {post.content}
                          </p>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <div className="flex items-center gap-3 text-white text-xs flex-wrap">
                          <div className="flex items-center gap-1">
                            <Heart size={14} />
                            <span>{post.likes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle size={14} />
                            <span>{post.comments}</span>
                          </div>
                          {post.tipTotal > 0 && (
                            <div className="flex items-center gap-1 text-green-400">
                              <DollarSign size={14} />
                              <span>{post.tipTotal.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                        {post.content && (
                          <p className="text-white text-xs mt-2 line-clamp-2">
                            {post.content}
                          </p>
                        )}
                      </div>

                      {/* Media Type Badge */}
                      {post.mediaType !== 'text' && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur rounded-full text-white text-xs font-semibold">
                          {post.mediaType === 'video' ? '🎥' : '📷'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* <TrendingSidebar /> */}
      </div>

      <ComposeModal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} />

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold">Withdraw Earnings</h2>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
                disabled={isWithdrawing}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {tipBalance?.balance?.toFixed(4) || '0.0000'} SUI
                </p>
              </div>

              <div>
                <label htmlFor="withdraw-amount" className="block text-sm font-medium mb-2">
                  Withdrawal Amount
                </label>
                <div className="relative">
                  <input
                    id="withdraw-amount"
                    type="number"
                    step="0.0001"
                    min="0"
                    max={tipBalance?.balance || 0}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.0000"
                    disabled={isWithdrawing}
                    className="w-full bg-muted text-foreground rounded-lg px-4 py-3 pr-16 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                    SUI
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setWithdrawAmount((tipBalance?.balance * 0.25).toFixed(4))}
                    className="flex-1 px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
                    disabled={isWithdrawing}
                  >
                    25%
                  </button>
                  <button
                    onClick={() => setWithdrawAmount((tipBalance?.balance * 0.5).toFixed(4))}
                    className="flex-1 px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
                    disabled={isWithdrawing}
                  >
                    50%
                  </button>
                  <button
                    onClick={() => setWithdrawAmount((tipBalance?.balance * 0.75).toFixed(4))}
                    className="flex-1 px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
                    disabled={isWithdrawing}
                  >
                    75%
                  </button>
                  <button
                    onClick={() => setWithdrawAmount(tipBalance?.balance.toFixed(4))}
                    className="flex-1 px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
                    disabled={isWithdrawing}
                  >
                    Max
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  💡 Funds will be transferred to your connected wallet address
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-border">
              <button
                onClick={() => setShowWithdrawModal(false)}
                disabled={isWithdrawing}
                className="flex-1 px-4 py-2 border border-border rounded-full font-semibold hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isWithdrawing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Withdrawing...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Withdraw
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AssetsPage() {
  return <AssetsContent />
}
