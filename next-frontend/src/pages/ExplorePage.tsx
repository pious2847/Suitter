import { useState, useEffect } from 'react'
import { Search, User, FileText, Loader2, TrendingUp, Sparkles, Users } from 'lucide-react'
import { MinimalHeader } from '../../components/minimal-header'
import { AppSidebar } from '../../components/app-sidebar'
import { SuiProvider } from '../../components/sui-context'
import { ComposeModal } from '../../components/compose-modal'
import { TrendingSidebar } from '../../components/trending-sidebar'
import { SuitCard } from '../../components/suit-card'
import { useSearch, SearchResult } from '../../hooks/useSearch'
import { truncateAddress } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

interface Category {
  name: string
  description: string
  postCount: number
}

const CATEGORIES: Category[] = [
  { name: 'Technology', description: 'Latest tech innovations and development', postCount: 1200000 },
  { name: 'Business', description: 'Entrepreneurship and market insights', postCount: 892000 },
  { name: 'Science', description: 'Scientific research and discoveries', postCount: 456000 },
  { name: 'Web3', description: 'Blockchain and decentralized systems', postCount: 678000 },
  { name: 'Development', description: 'Software development best practices', postCount: 1100000 },
  { name: 'Design', description: 'UI/UX and creative design', postCount: 923000 },
]

function ExploreContent() {
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchFilter, setSearchFilter] = useState<'all' | 'users' | 'posts'>('all')
  const [isSearchActive, setIsSearchActive] = useState(false)
  const { search, isSearching } = useSearch()

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setIsSearchActive(true)
        const filters = {
          users: searchFilter === 'all' || searchFilter === 'users',
          posts: searchFilter === 'all' || searchFilter === 'posts',
        }
        const results = await search(searchQuery, filters)
        setSearchResults(results)
      } else {
        setIsSearchActive(false)
        setSearchResults([])
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchFilter, search])

  const handleLike = (id: string) => {
    console.log('Like post:', id)
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

        <main className="flex-1 overflow-hidden max-w-2xl w-full mx-auto border-r border-border">
          <div className="h-full flex flex-col overflow-y-auto">
            {/* Search Header */}
            <div className="sticky top-0 bg-background/80 backdrop-blur border-b border-border p-4 z-10">
              <div className="flex items-center gap-3 bg-muted rounded-full px-4 py-2">
                <Search size={20} className="text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search for users, posts, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent flex-1 text-foreground placeholder-muted-foreground focus:outline-none"
                />
                {isSearching && (
                  <Loader2 size={20} className="text-muted-foreground animate-spin" />
                )}
              </div>

              {/* Search Filters */}
              {searchQuery.trim().length > 0 && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setSearchFilter('all')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      searchFilter === 'all'
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSearchFilter('users')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                      searchFilter === 'users'
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    <User size={16} />
                    Users
                  </button>
                  <button
                    onClick={() => setSearchFilter('posts')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                      searchFilter === 'posts'
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    <FileText size={16} />
                    Posts
                  </button>
                </div>
              )}
            </div>

            {/* Search Results or Categories */}
            {isSearchActive ? (
              <div className="p-4">
                {isSearching ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={32} className="text-muted-foreground animate-spin" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground">
                      Search Results ({searchResults.length})
                    </h2>
                    <div className="space-y-3">
                      {searchResults.map((result) => {
                        if (result.type === 'user') {
                          return (
                            <div
                              key={result.id}
                              onClick={() => navigate(`/profile?address=${result.address}`)}
                              className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer group"
                            >
                              <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center text-lg font-bold shrink-0 overflow-hidden">
                                  {result.pfpUrl ? (
                                    <img
                                      src={result.pfpUrl}
                                      alt={result.username || 'User'}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-foreground">
                                      {result.username?.charAt(0).toUpperCase() || result.address?.slice(2, 4).toUpperCase() || '?'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                                      {result.username || truncateAddress(result.address || '')}
                                    </span>
                                    <div className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-semibold flex items-center gap-1">
                                      <User size={12} />
                                      User
                                    </div>
                                  </div>
                                  {result.bio && (
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                      {result.bio}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-2 font-mono">
                                    {truncateAddress(result.address || '')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        } else {
                          // Post result
                          return (
                            <div
                              key={result.id}
                              className="border-b border-border"
                            >
                              <SuitCard
                                id={result.id}
                                author={truncateAddress(result.creator || '')}
                                handle={truncateAddress(result.creator || '', 4, 4)}
                                avatar={result.creator?.slice(-2).toUpperCase() || '??'}
                                content={result.content || ''}
                                timestamp={result.createdAt || Date.now()}
                                likes={result.likeCount || 0}
                                replies={result.commentCount || 0}
                                reposts={result.retweetCount || 0}
                                liked={false}
                                reposted={false}
                                isNFT={true}
                                nftValue={0}
                                currentBid={0}
                                isEncrypted={false}
                                media={
                                  result.mediaUrls && result.mediaUrls.length > 0
                                    ? {
                                        type: (result.contentType === 'video' || 
                                               result.mediaUrls[0].toLowerCase().includes('.mp4') ||
                                               result.mediaUrls[0].toLowerCase().includes('.webm') ||
                                               result.mediaUrls[0].toLowerCase().includes('video')
                                              ) ? 'video' as const : 'image' as const,
                                        url: result.mediaUrls[0],
                                      }
                                    : undefined
                                }
                                onLike={handleLike}
                              />
                            </div>
                          )
                        }
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-semibold text-foreground">No results found</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Try searching for something else
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 space-y-6">
                {/* Hero Section */}
                <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 rounded-2xl p-8 border border-primary/20">
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles size={28} className="text-primary" />
                    <h2 className="text-3xl font-bold text-foreground">Discover</h2>
                  </div>
                  <p className="text-muted-foreground text-lg">
                    Explore trending topics, find interesting people, and discover amazing content on the blockchain
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/50 rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Users size={16} />
                      <span className="text-xs font-medium">Active Users</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">2.4K+</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <FileText size={16} />
                      <span className="text-xs font-medium">Total Posts</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">15K+</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <TrendingUp size={16} />
                      <span className="text-xs font-medium">Trending</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">Web3</p>
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h3 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
                    <TrendingUp size={20} />
                    Popular Topics
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {CATEGORIES.map((category, index) => (
                      <button
                        key={category.name}
                        className="w-full p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-left group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full -mr-16 -mt-16" />
                        <div className="relative flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                                #{index + 1}
                              </div>
                              <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                                {category.name}
                              </h3>
                            </div>
                            <p className="text-sm text-muted-foreground ml-13">
                              {category.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2 ml-13">
                              <div className="px-2 py-1 bg-muted rounded-full text-xs font-semibold text-muted-foreground">
                                {(category.postCount / 1000).toFixed(0)}K posts
                              </div>
                              <div className="px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs font-semibold">
                                Trending
                              </div>
                            </div>
                          </div>
                          <div className="text-4xl font-bold text-muted/20 ml-4">
                            {category.name.charAt(0)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Prompt */}
                <div className="bg-muted/30 rounded-xl p-6 border border-border text-center">
                  <Search size={32} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    💡 Use the search bar above to find specific users, posts, or topics
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        <TrendingSidebar />
      </div>

      <ComposeModal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} />
    </div>
  )
}

export default function ExplorePage() {
  return (
    <SuiProvider>
      <ExploreContent />
    </SuiProvider>
  )
}

