import { useState, useEffect } from 'react'
import { TrendingUp, Flame, Users, DollarSign } from 'lucide-react'
import { useSuiClient } from '@mysten/dapp-kit'
import CONFIG from '../config'

interface TopPost {
  id: string
  content: string
  tipTotal: number
  creator: string
}

export function TrendingSidebar() {
  const suiClient = useSuiClient()
  const [topTippedPosts, setTopTippedPosts] = useState<TopPost[]>([])
  const [totalPosts, setTotalPosts] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTrendingData()
  }, [])

  const fetchTrendingData = async () => {
    try {
      setIsLoading(true)
      
      // Get the SuitRegistry to fetch suit IDs
      const registry = await suiClient.getObject({
        id: CONFIG.SUIT_REGISTRY,
        options: { showContent: true },
      })

      const registryContent = registry.data?.content as any
      const suitIds = registryContent?.fields?.suit_ids || []
      setTotalPosts(suitIds.length)

      // Get recent suits (last 50 for analysis)
      const recentSuitIds = suitIds.slice(-50).reverse()

      // Fetch all suit objects
      const suits = await Promise.all(
        recentSuitIds.map(async (id: string) => {
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

      // Filter and sort by tip total
      const validSuits = suits
        .filter(Boolean)
        .map((suit: any) => {
          const fields = suit?.content?.fields
          return {
            id: suit.objectId,
            content: fields?.content || '',
            tipTotal: Number(fields?.tip_total || 0) / 1_000_000_000, // Convert MIST to SUI
            creator: fields?.creator || '',
          }
        })
        .filter((suit) => suit.tipTotal > 0)
        .sort((a, b) => b.tipTotal - a.tipTotal)
        .slice(0, 5)

      setTopTippedPosts(validSuits)
    } catch (error) {
      console.error('Failed to fetch trending data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const truncateContent = (content: string, maxLength: number = 60) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + '...'
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
  return (
    <aside className="hidden lg:block w-80 border-l border-border bg-background md:flex flex-col h-screen">
      {/* Search Bar */}
      <div className="p-4 sticky top-0 bg-background/80 backdrop-blur border-b border-border z-10">
        <div className="flex items-center gap-3 bg-muted/50 px-4 py-2 rounded-full">
          <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search"
            className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder-muted-foreground"
          />
        </div>
      </div>

      {/* Stats Section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={18} className="text-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Platform Stats</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users size={14} />
              <span className="text-xs font-medium">Total Posts</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              {isLoading ? '...' : totalPosts.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Flame size={14} />
              <span className="text-xs font-medium">Hot Posts</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              {isLoading ? '...' : topTippedPosts.length}
            </div>
          </div>
        </div>
      </div>

      {/* Top Tipped Posts Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={18} className="text-green-500" />
            <h2 className="text-lg font-semibold text-foreground">Top Tipped Posts</h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/30 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : topTippedPosts.length > 0 ? (
            <div className="space-y-3">
              {topTippedPosts.map((post, index) => (
                <div
                  key={post.id}
                  className="p-3 rounded-lg hover:bg-muted/50 transition-colors border border-border/50"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-xs font-bold shrink-0">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-2 mb-1">
                        {truncateContent(post.content)}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          by {truncateAddress(post.creator)}
                        </span>
                        <span className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                          <DollarSign size={12} />
                          {post.tipTotal.toFixed(2)} SUI
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Flame size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tipped posts yet</p>
              <p className="text-xs mt-1">Be the first to tip a post!</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 text-xs text-muted-foreground space-y-2 border-t border-border">
        <p>Terms of Service · Privacy Policy · Cookie Policy</p>
        <p>© 2025 Suiter. Powered by Sui Blockchain</p>
      </div>
    </aside>
  )
}
