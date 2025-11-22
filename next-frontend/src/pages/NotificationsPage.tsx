import { useState, useEffect } from 'react'
import { Heart, MessageCircle, Repeat2, Bell, BellOff, Mail, MailOpen } from 'lucide-react'
import { MinimalHeader } from '../../components/minimal-header'
import { AppSidebar } from '../../components/app-sidebar'
import { SuiProvider } from '../../components/sui-context'
import { ComposeModal } from '../../components/compose-modal'
import { TrendingSidebar } from '../../components/trending-sidebar'
import { useMessaging } from '../../hooks/useMessaging'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { useNavigate } from 'react-router-dom'
import { formatTime } from '@/lib/utils'
import CONFIG from '../../config'

interface Notification {
  id: string
  type: 'message' | 'like' | 'repost' | 'comment'
  sender: string
  senderName?: string
  content: string
  timestamp: number
  read: boolean
  chatId?: string
  messageIndex?: number
}

function NotificationsContent() {
  const navigate = useNavigate()
  const currentAccount = useCurrentAccount()
  const suiClient = useSuiClient()
  const { chats, markAsRead } = useMessaging()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch notifications from blockchain events
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentAccount) return

      setIsLoading(true)
      try {
        const allNotifications: Notification[] = []

        // Fetch message notifications from chats
        for (const chat of chats) {
          if (chat.unread > 0) {
            allNotifications.push({
              id: `msg-${chat.id}`,
              type: 'message',
              sender: chat.handle,
              senderName: chat.user,
              content: chat.lastMsg,
              timestamp: chat.timestamp,
              read: false,
              chatId: chat.id,
            })
          }
        }

        // Fetch interaction events (likes, reposts, comments)
        try {
          // Fetch like events
          const likeEvents = await suiClient.queryEvents({
            query: {
              MoveEventType: `${CONFIG.VITE_PACKAGE_ID}::interactions::LikeCreated`,
            },
            limit: 20,
          })

          for (const event of likeEvents.data) {
            const parsedJson = event.parsedJson as any
            if (parsedJson.suit_creator === currentAccount.address) {
              allNotifications.push({
                id: event.id.txDigest + '-like',
                type: 'like',
                sender: parsedJson.liker,
                content: 'liked your post',
                timestamp: parseInt(parsedJson.timestamp) || Date.now(),
                read: true, // Interaction events are considered read by default
              })
            }
          }

          // Fetch retweet events
          const retweetEvents = await suiClient.queryEvents({
            query: {
              MoveEventType: `${CONFIG.VITE_PACKAGE_ID}::interactions::RetweetCreated`,
            },
            limit: 20,
          })

          for (const event of retweetEvents.data) {
            const parsedJson = event.parsedJson as any
            if (parsedJson.original_creator === currentAccount.address) {
              allNotifications.push({
                id: event.id.txDigest + '-retweet',
                type: 'repost',
                sender: parsedJson.retweeter,
                content: 'reposted your post',
                timestamp: parseInt(parsedJson.timestamp) || Date.now(),
                read: true,
              })
            }
          }

          // Fetch comment events
          const commentEvents = await suiClient.queryEvents({
            query: {
              MoveEventType: `${CONFIG.VITE_PACKAGE_ID}::interactions::CommentCreated`,
            },
            limit: 20,
          })

          for (const event of commentEvents.data) {
            const parsedJson = event.parsedJson as any
            // We'd need to check if the suit belongs to the current user
            // For now, we'll add all comments
            allNotifications.push({
              id: event.id.txDigest + '-comment',
              type: 'comment',
              sender: parsedJson.commenter,
              content: parsedJson.content || 'commented on your post',
              timestamp: parseInt(parsedJson.timestamp) || Date.now(),
              read: true,
            })
          }
        } catch (err) {
          console.error('Error fetching interaction events:', err)
        }

        // Sort by timestamp (newest first)
        allNotifications.sort((a, b) => b.timestamp - a.timestamp)

        setNotifications(allNotifications)
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [currentAccount, chats, suiClient])

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.type === 'message' && notification.chatId) {
      // Navigate to messages page with the chat
      navigate(`/messages?chat=${notification.chatId}`)
      
      // Mark messages as read if there's a messageIndex
      if (notification.messageIndex !== undefined) {
        await markAsRead(notification.chatId, notification.messageIndex)
      }
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return <MessageCircle size={20} className="text-blue-500" />
      case 'like':
        return <Heart size={20} className="text-red-500" />
      case 'repost':
        return <Repeat2 size={20} className="text-green-500" />
      case 'comment':
        return <MessageCircle size={20} className="text-purple-500" />
      default:
        return <Bell size={20} className="text-muted-foreground" />
    }
  }

  const filteredNotifications = notifications.filter((n) =>
    activeTab === 'unread' ? !n.read : n.read
  )

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="flex flex-col h-screen bg-background">
      <MinimalHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)}
          onCompose={() => setIsComposeOpen(true)}
        />

        <main className="flex-1 overflow-y-auto border-r border-border max-w-2xl w-full mx-auto">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-background/80 backdrop-blur border-b border-border z-10">
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-xl text-foreground">Notifications</h2>
                    {unreadCount > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 ? (
                      <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold flex items-center gap-1">
                        <Bell size={14} />
                        {unreadCount}
                      </div>
                    ) : (
                      <div className="px-3 py-1 bg-muted rounded-full text-sm font-semibold text-muted-foreground flex items-center gap-1">
                        <BellOff size={14} />
                        All caught up
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('unread')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                      activeTab === 'unread'
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    <Mail size={16} />
                    Unread
                    {unreadCount > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        activeTab === 'unread' ? 'bg-background/20' : 'bg-primary/20 text-primary'
                      }`}>
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('read')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                      activeTab === 'read'
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    <MailOpen size={16} />
                    Read
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  {activeTab === 'unread' ? (
                    <>
                      <BellOff size={48} className="text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No unread notifications
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        You're all caught up! Check back later for new activity.
                      </p>
                    </>
                  ) : (
                    <>
                      <MailOpen size={48} className="text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No read notifications
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Your read notifications will appear here.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground">
                                {notification.senderName || notification.sender.slice(0, 8)}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {notification.type === 'message' ? 'sent you a message' : notification.content}
                              </span>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5"></div>
                            )}
                          </div>
                          {notification.type === 'message' && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {notification.content}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        <TrendingSidebar />
      </div>

      <ComposeModal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} />
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <SuiProvider>
      <NotificationsContent />
    </SuiProvider>
  )
}
