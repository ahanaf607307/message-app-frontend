'use client';

import React, { useState, useEffect } from 'react';
import { User, Conversation } from '@/types';
import api from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  MessageSquare, Heart, Share2, Image as ImageIcon, Smile, 
  Gift, Users, UserCheck, UserPlus, Globe, Search, Bell, ChevronDown, Clock,
  Camera
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

interface DashboardPortalProps {
  currentUser: User | null;
  onRefreshConversations: () => void;
  onSelectConversation: (conversation: Conversation) => void;
  onSwitchToChats?: () => void; // Callback to switch back to Chats tab in Sidebar
  onOpenProfile?: () => void; // Callback to open user profile
}

export default function DashboardPortal({ 
  currentUser, 
  onRefreshConversations, 
  onSelectConversation,
  onSwitchToChats,
  onOpenProfile
}: DashboardPortalProps) {
  const { updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'connections' | 'profile'>('feed');
  const [connectionsTab, setConnectionsTab] = useState<'connected' | 'requests'>('connected');
  
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Social feed state
  const [posts, setPosts] = useState<any[]>([]);
  const [storiesList, setStoriesList] = useState<any[]>([]);
  const [postContent, setPostContent] = useState('');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [activePostCommentsId, setActivePostCommentsId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');

  // Local search query for connections
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const fetchAllUsers = async () => {
    try {
      const res = await api.get('/user/all');
      setAllUsers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch all users:', err);
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    try {
      await api.post('/connections/request', { receiverId });
      alert('Connection request sent successfully!');
      fetchConnections();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send request');
    }
  };

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const [friendsRes, incomingRes] = await Promise.all([
        api.get('/connections/connected-users'),
        api.get('/connections/requests/pending')
      ]);
      setFriends(friendsRes.data.data.users || []);
      setPendingIncoming(incomingRes.data.data.requests || []);
    } catch (err) {
      console.error('Failed to load portal connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts');
      setPosts(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    }
  };

  const fetchStories = async () => {
    try {
      const res = await api.get('/stories');
      setStoriesList(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch stories:', err);
    }
  };

  useEffect(() => {
    fetchConnections();
    fetchPosts();
    fetchStories();
    fetchAllUsers();
  }, []);

  const handleRespondRequest = async (connectionId: string, status: 'accepted' | 'rejected') => {
    try {
      await api.put(`/connections/respond/${connectionId}`, { status });
      fetchConnections();
      onRefreshConversations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to respond');
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this connection?')) return;
    try {
      await api.delete(`/connections/${connectionId}`);
      fetchConnections();
      onRefreshConversations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to disconnect');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() && !postMediaUrl.trim()) return;
    try {
      await api.post('/posts', {
        content: postContent,
        mediaUrl: postMediaUrl.trim() || null
      });
      setPostContent('');
      setPostMediaUrl('');
      setShowMediaInput(false);
      fetchPosts();
    } catch (err: any) {
      alert('Failed to publish post');
    }
  };

  const handleCreateStory = async () => {
    const mediaUrl = prompt('Enter image URL to create a story:');
    if (!mediaUrl || !mediaUrl.trim()) return;
    try {
      await api.post('/stories', { mediaUrl: mediaUrl.trim() });
      fetchStories();
    } catch (err: any) {
      alert('Failed to share story');
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      await api.post(`/posts/${postId}/like`);
      fetchPosts();
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!commentInput.trim()) return;
    try {
      await api.post(`/posts/${postId}/comments`, {
        content: commentInput
      });
      setCommentInput('');
      fetchPosts();
    } catch (err: any) {
      alert('Failed to add comment');
    }
  };

  const handleMediaUpload = async (file: File, type: 'avatar' | 'cover') => {
    if (!currentUser) return;
    try {
      await updateProfile({
        name: currentUser.name,
        email: currentUser.email,
        avatarFile: type === 'avatar' ? file : null,
        coverFile: type === 'cover' ? file : null
      });
      alert(`${type === 'avatar' ? 'Profile picture' : 'Cover photo'} updated successfully!`);
    } catch (err) {
      console.error(err);
      alert('Failed to upload image');
    }
  };

  // Filter connections locally if searching
  const filteredFriends = friends.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#faf6f0] text-[#0b4d3a] dark:bg-background dark:text-foreground font-sans-active select-none overflow-hidden">
      
      {/* Cursive Google Font stylesheet injection */}
      <link href="https://fonts.googleapis.com/css2?family=Pacifico&family=Outfit:wght@300;400;600;700;900&display=swap" rel="stylesheet" />

      {/* Top Header Bar */}
      <header className="h-16 border-b border-[#ecd8bf] dark:border-border bg-[#faf6f0] dark:bg-card px-6 flex items-center justify-between flex-shrink-0 shadow-3xs z-10">
        
        {/* Left: App Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveSubTab('feed')}>
          <span className="text-2xl font-normal text-[#0b4d3a] dark:text-foreground font-['Pacifico',cursive] tracking-wide select-none">
            Your Chat
          </span>
        </div>

        {/* Center: Search Box */}
        <div className="flex-1 max-w-md mx-8 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8f7d6a] dark:text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full h-10 bg-[#f3eae0] dark:bg-muted border border-transparent rounded-full pl-10 pr-4 text-xs text-[#0b4d3a] dark:text-foreground placeholder-[#8f7d6a] dark:placeholder-muted-foreground focus:outline-hidden focus:border-[#0b4d3a]/30 transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Right: Quick actions buttons */}
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-[#f3eae0] dark:bg-muted hover:bg-[#ebdccb] dark:hover:bg-muted/80 text-[#0b4d3a] dark:text-foreground cursor-pointer"
            onClick={onSwitchToChats}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-[#f3eae0] dark:bg-muted hover:bg-[#ebdccb] dark:hover:bg-muted/80 text-[#0b4d3a] dark:text-foreground cursor-pointer relative"
          >
            <Bell className="h-4 w-4" />
            {pendingIncoming.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-orange-600 text-white text-[9px] font-black flex items-center justify-center">
                {pendingIncoming.length}
              </span>
            )}
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-[#f3eae0] dark:bg-muted hover:bg-[#ebdccb] dark:hover:bg-muted/80 text-[#0b4d3a] dark:text-foreground cursor-pointer"
            onClick={() => {
              setActiveSubTab('connections');
              setConnectionsTab('requests');
            }}
          >
            <UserPlus className="h-4 w-4" />
          </Button>

          <div 
            className="flex items-center space-x-1.5 bg-[#f3eae0] dark:bg-muted hover:bg-[#ebdccb] dark:hover:bg-muted/85 py-1 pl-1 pr-2 rounded-full cursor-pointer transition-all border border-[#ecd8bf]/40 dark:border-border"
            onClick={() => setActiveSubTab('profile')}
          >
            <Avatar className="h-8 w-8 border border-[#ecd8bf] dark:border-border">
              <AvatarImage src={currentUser?.avatarUrl} />
              <AvatarFallback className="bg-[#0b4d3a]/15 text-[#0b4d3a] dark:bg-background dark:text-foreground font-bold text-xs">
                {currentUser?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="h-3.5 w-3.5 text-[#8f7d6a] dark:text-muted-foreground" />
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar Menu Column */}
        <aside className="w-64 border-r border-[#ecd8bf]/60 dark:border-border p-4 flex flex-col justify-between flex-shrink-0 bg-[#faf6f0] dark:bg-card">
          <div className="space-y-2.5 flex-1">
            <button 
              onClick={() => setActiveSubTab('feed')}
              className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all duration-150 text-left font-bold text-sm cursor-pointer ${
                activeSubTab === 'feed' 
                  ? 'bg-[#ebdccb] dark:bg-muted text-[#0b4d3a] dark:text-foreground shadow-3xs' 
                  : 'text-[#8f7d6a] dark:text-muted-foreground hover:bg-[#f3eae0] dark:hover:bg-muted hover:text-[#0b4d3a] dark:hover:text-foreground'
              }`}
            >
              <ImageIcon className="h-5 w-5 flex-shrink-0" />
              <span>News Feed</span>
            </button>

            <button 
              onClick={() => setActiveSubTab('connections')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-150 text-left font-bold text-sm cursor-pointer ${
                activeSubTab === 'connections' 
                  ? 'bg-[#ebdccb] dark:bg-muted text-[#0b4d3a] dark:text-foreground shadow-3xs' 
                  : 'text-[#8f7d6a] dark:text-muted-foreground hover:bg-[#f3eae0] dark:hover:bg-muted hover:text-[#0b4d3a] dark:hover:text-foreground'
              }`}
            >
              <div className="flex items-center space-x-3.5">
                <Users className="h-5 w-5 flex-shrink-0" />
                <span>Connections</span>
              </div>
              {pendingIncoming.length > 0 && (
                <Badge className="bg-orange-600 hover:bg-orange-600 text-white text-[9px] font-black px-1.5 h-4.5 rounded-full flex items-center justify-center">
                  {pendingIncoming.length}
                </Badge>
              )}
            </button>

            <button 
              onClick={() => setActiveSubTab('profile')}
              className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all duration-150 text-left font-bold text-sm cursor-pointer ${
                activeSubTab === 'profile' 
                  ? 'bg-[#ebdccb] dark:bg-muted text-[#0b4d3a] dark:text-foreground shadow-3xs' 
                  : 'text-[#8f7d6a] dark:text-muted-foreground hover:bg-[#f3eae0] dark:hover:bg-muted hover:text-[#0b4d3a] dark:hover:text-foreground'
              }`}
            >
              <Avatar className="h-5 w-5 flex-shrink-0 border border-[#ecd8bf] dark:border-border">
                <AvatarImage src={currentUser?.avatarUrl} />
                <AvatarFallback className="text-[8px] bg-[#0b4d3a]/15 text-[#0b4d3a] dark:bg-background dark:text-foreground">
                  {currentUser?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span>My Profile</span>
            </button>
          </div>

          {/* Bottom Theme Toggle Section */}
          <div className="pt-4 border-t border-[#ecd8bf]/60 dark:border-border/60">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl border border-[#ecd8bf] dark:border-border bg-[#f3eae0] dark:bg-muted hover:bg-[#ebdccb] dark:hover:bg-muted/80 text-xs font-bold transition-all cursor-pointer text-[#0b4d3a] dark:text-foreground shadow-3xs"
            >
              {theme === 'dark' ? (
                <span>🌙 Dark Mode</span>
              ) : (
                <span>☀️ Light Mode</span>
              )}
            </button>
          </div>
        </aside>

        {/* Center Panel (Feeds / Request Lists / Profile) */}
        <main className="flex-1 overflow-y-auto no-scrollbar p-6 bg-[#f7f0e6] dark:bg-background/95 transition-all">
          <div className={`${activeSubTab === 'profile' ? 'max-w-[850px]' : 'max-w-[640px]'} mx-auto space-y-6 pb-12`}>
            
            {searchQuery.trim().length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#ecd8bf] dark:border-border pb-4">
                  <div>
                    <h2 className="text-lg font-black text-[#0b4d3a] dark:text-foreground">Search Results</h2>
                    <p className="text-[11px] text-[#8f7d6a] dark:text-muted-foreground">Showing results for &ldquo;{searchQuery}&rdquo;</p>
                  </div>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="h-8 px-4 text-[10px] bg-[#ebdccb] dark:bg-muted text-[#0b4d3a] dark:text-foreground rounded-full font-bold hover:bg-[#ebdccb]/85 transition-colors cursor-pointer"
                  >
                    Clear Search
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {allUsers.filter(u => 
                    u.id !== currentUser?.id && 
                    (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                     (u.nickname && u.nickname.toLowerCase().includes(searchQuery.toLowerCase())))
                  ).length > 0 ? (
                    allUsers.filter(u => 
                      u.id !== currentUser?.id && 
                      (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       (u.nickname && u.nickname.toLowerCase().includes(searchQuery.toLowerCase())))
                    ).map((u) => {
                      const isFriend = friends.some(f => f.id === u.id);
                      const isPendingRequest = pendingIncoming.some(r => r.sender.id === u.id);

                      return (
                        <Card key={u.id} className="shadow-3xs border border-[#ecd8bf] dark:border-border bg-[#faf6f0] dark:bg-card rounded-2xl overflow-hidden p-4 flex items-center justify-between hover:border-[#0b4d3a]/30 dark:hover:border-primary/30 transition-all">
                          <div className="flex items-center space-x-3.5 min-w-0">
                            <Avatar className="h-11 w-11 border border-[#ecd8bf] dark:border-border">
                              <AvatarImage src={u.avatarUrl || undefined} />
                              <AvatarFallback className="bg-[#0b4d3a]/10 dark:bg-background text-[#0b4d3a] dark:text-foreground text-sm font-bold">{u.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <span className="font-extrabold text-sm text-[#0b4d3a] dark:text-foreground block truncate">{u.name}</span>
                              {u.nickname && <span className="text-[10px] text-[#8f7d6a] dark:text-muted-foreground block truncate">({u.nickname})</span>}
                              {u.bio && <p className="text-[10px] text-muted-foreground mt-1 truncate max-w-[280px]">{u.bio}</p>}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {isFriend ? (
                              <Button 
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const res = await api.post('/conversations/create', {
                                      participantIds: [u.id],
                                      isGroupChat: false
                                    });
                                    onSelectConversation(res.data.data);
                                  } catch (e) {
                                    alert('Failed to open chat');
                                  }
                                }}
                                className="h-8.5 text-[11px] bg-[#0b4d3a] hover:bg-[#08362b] dark:bg-primary dark:hover:bg-primary/80 text-white font-bold rounded-xl cursor-pointer shadow-3xs"
                              >
                                Message
                              </Button>
                            ) : isPendingRequest ? (
                              <Button 
                                size="sm"
                                onClick={() => {
                                  const req = pendingIncoming.find(r => r.sender.id === u.id);
                                  if (req) handleRespondRequest(req.id, 'accepted');
                                }}
                                className="h-8.5 text-[11px] bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl cursor-pointer shadow-3xs"
                              >
                                Accept Request
                              </Button>
                            ) : (
                              <Button 
                                size="sm"
                                onClick={() => handleSendRequest(u.id)}
                                className="h-8.5 text-[11px] bg-[#0b4d3a] hover:bg-[#08362b] dark:bg-primary dark:hover:bg-primary/85 text-white font-bold rounded-xl cursor-pointer shadow-3xs"
                              >
                                Connect
                              </Button>
                            )}
                          </div>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 bg-[#faf6f0] dark:bg-card border border-[#ecd8bf] dark:border-border rounded-2xl shadow-3xs animate-fade-in">
                      <p className="text-xs text-[#8f7d6a] dark:text-muted-foreground font-black">User not found</p>
                    </div>
                  )}
                </div>
              </div>
            ) : activeSubTab === 'feed' ? (
              <>
                {/* Stories Carousel */}
                {storiesList.length > 0 && (
                  <div className="flex space-x-3 overflow-x-auto pb-1.5 no-scrollbar">
                    {/* Create Story Card */}
                    <div 
                      onClick={handleCreateStory}
                      className="w-[105px] h-[165px] bg-[#faf6f0] dark:bg-card border border-[#ecd8bf] dark:border-border rounded-xl overflow-hidden shadow-3xs relative flex flex-col flex-shrink-0 cursor-pointer group hover:border-[#0b4d3a]/30 dark:hover:border-primary/30 transition-all"
                    >
                      <div className="h-[110px] bg-[#f3eae0] dark:bg-muted relative overflow-hidden">
                        {currentUser?.avatarUrl ? (
                          <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl font-bold bg-[#0b4d3a]/5 dark:bg-background text-[#0b4d3a] dark:text-foreground">
                            {currentUser?.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-end p-1.5 relative bg-[#faf6f0] dark:bg-card">
                        <div className="absolute top-[-14px] h-7 w-7 rounded-full bg-[#0b4d3a] dark:bg-primary border-3 border-[#faf6f0] dark:border-card flex items-center justify-center text-white shadow-sm">
                          <span className="font-bold text-xs">+</span>
                        </div>
                        <span className="text-[9px] font-black mt-1">Create story</span>
                      </div>
                    </div>

                    {/* Stories Loop */}
                    {storiesList.map(story => (
                      <div key={story.id} className="w-[105px] h-[165px] rounded-xl overflow-hidden shadow-3xs relative flex-shrink-0 cursor-pointer group border border-[#ecd8bf]/40 dark:border-border/40">
                        <img src={story.bg} alt={story.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                        <div className="absolute inset-0 bg-linear-to-b from-black/10 via-transparent to-black/70"></div>
                        <Avatar className="absolute top-2 left-2 h-7 w-7 border border-[#0b4d3a] dark:border-border shadow-sm">
                          <AvatarImage src={story.avatar || undefined} />
                          <AvatarFallback className="text-[9px] bg-[#faf6f0] dark:bg-card">{story.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-2 left-2 right-2 text-[9px] font-black text-white truncate">{story.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Create Post Box */}
                <Card className="shadow-3xs border border-[#ecd8bf] dark:border-border bg-[#faf6f0] dark:bg-card rounded-2xl text-[#0b4d3a] dark:text-card-foreground overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center space-x-3.5">
                      <Avatar className="h-10 w-10 border border-[#ecd8bf] dark:border-border shadow-xs">
                        <AvatarImage src={currentUser?.avatarUrl} />
                        <AvatarFallback className="bg-[#0b4d3a]/10 dark:bg-muted text-[#0b4d3a] dark:text-foreground font-bold">{currentUser?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      <div 
                        onClick={() => setIsCreatePostOpen(true)}
                        className="flex-1 h-10 bg-[#f3eae0] dark:bg-[#121212] hover:bg-[#ebdccb]/60 dark:hover:bg-[#1a1a1a] rounded-full px-5 text-xs text-[#8f7d6a] dark:text-muted-foreground flex items-center cursor-pointer transition-all font-semibold select-none"
                      >
                        What&apos;s on your mind, {currentUser?.name || 'User'}?
                      </div>
                    </div>

                    <div className="border-t border-[#ecd8bf]/60 dark:border-border pt-3 flex items-center justify-between text-xs text-[#8f7d6a] dark:text-muted-foreground select-none">
                      <div className="flex items-center space-x-4">
                        <button 
                          type="button"
                          onClick={() => setIsCreatePostOpen(true)}
                          className="flex items-center space-x-2 py-1.5 px-3 rounded-xl hover:bg-[#f3eae0] dark:hover:bg-muted cursor-pointer transition-colors font-bold text-[#0b4d3a] dark:text-foreground"
                        >
                          <ImageIcon className="h-4.5 w-4.5 text-orange-500" />
                          <span className="text-[11.5px]">Photos</span>
                        </button>
                      </div>

                      <button 
                        type="button"
                        onClick={() => setIsCreatePostOpen(true)}
                        className="h-8.5 px-5 text-xs bg-orange-600 hover:bg-orange-700 dark:bg-primary dark:hover:bg-primary/80 text-white font-black rounded-full cursor-pointer shadow-sm transition-all"
                      >
                        Publish
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Posts Feed */}
                <div className="space-y-5">
                  {posts.length > 0 ? (
                    posts.map((post) => (
                      <Card key={post.id} className="shadow-2xs border border-[#ecd8bf]/60 dark:border-border bg-[#faf6f0] dark:bg-card rounded-2xl text-[#0b4d3a] dark:text-card-foreground overflow-hidden animate-fade-in">
                        <CardContent className="p-5 space-y-4">
                          
                          {/* Post Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10 border border-[#ecd8bf] dark:border-border shadow-xs">
                                <AvatarImage src={post.author.avatarUrl || undefined} />
                                <AvatarFallback className="font-bold bg-[#0b4d3a]/10 dark:bg-muted text-[#0b4d3a] dark:text-foreground">{post.author.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="text-xs font-black text-[#0b4d3a] dark:text-foreground">{post.author.name}</h4>
                                <p className="text-[9px] text-[#8f7d6a] dark:text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                  <span>{new Date(post.createdAt).toLocaleDateString()}</span> • <Globe className="h-3 w-3" />
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Post Content */}
                          {post.content && (
                            <p className="text-xs text-[#0b4d3a] dark:text-foreground leading-relaxed font-semibold">{post.content}</p>
                          )}

                          {/* Post Attachment */}
                          {post.mediaUrl && (
                            <div className="relative rounded-xl overflow-hidden bg-[#f3eae0]/30 dark:bg-[#121212] border border-[#ecd8bf]/60 dark:border-border group">
                              <img src={post.mediaUrl} alt="Attachment" className="w-full h-auto object-cover max-h-[340px]" />
                            </div>
                          )}

                          {/* Post Stats */}
                          <div className="flex items-center justify-between text-[10px] text-[#8f7d6a] dark:text-muted-foreground pt-1 border-b border-[#ecd8bf]/60 dark:border-border/40 pb-3 px-0.5">
                            <div className="flex items-center space-x-1">
                              <Heart className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
                              <span className="font-bold text-[#0b4d3a] dark:text-foreground">{post.likesCount} Likes</span>
                            </div>
                            <div className="flex space-x-2">
                              <span>{post.commentsCount} Comments</span>
                            </div>
                          </div>

                          {/* Post Actions */}
                          <div className="flex items-center justify-between text-xs pt-1 border-[#ecd8bf]/60 dark:border-border">
                            <button 
                              onClick={() => handleToggleLike(post.id)}
                              className={`flex-1 flex items-center justify-center space-x-2 hover:bg-[#ebdccb]/60 dark:hover:bg-muted py-2 rounded-xl cursor-pointer transition-all font-black ${post.userLiked ? 'text-orange-500 animate-pulse' : 'text-[#0b4d3a] dark:text-foreground'}`}
                            >
                              <Heart className={`h-4 w-4 ${post.userLiked ? 'fill-orange-500 text-orange-500' : ''}`} /> 
                              <span>Like</span>
                            </button>
                            
                            <button 
                              onClick={() => setActivePostCommentsId(activePostCommentsId === post.id ? null : post.id)}
                              className={`flex-1 flex items-center justify-center space-x-2 hover:bg-[#ebdccb]/60 dark:hover:bg-muted py-2 rounded-xl cursor-pointer transition-all font-black ${activePostCommentsId === post.id ? 'text-orange-500' : 'text-[#0b4d3a] dark:text-foreground'}`}
                            >
                              <MessageSquare className="h-4 w-4" /> <span>Comment</span>
                            </button>
                          </div>

                          {/* Comments box */}
                          {activePostCommentsId === post.id && (
                            <div className="border-t border-[#ecd8bf]/60 dark:border-border pt-4 mt-2 space-y-4">
                              
                              {/* Comments List */}
                              {post.comments && post.comments.map((comment: any) => (
                                <div key={comment.id} className="flex items-start space-x-3 text-xs">
                                  <Avatar className="h-8 w-8 border border-[#ecd8bf] dark:border-border shadow-sm">
                                    <AvatarImage src={comment.user?.avatarUrl || undefined} />
                                    <AvatarFallback className="font-bold bg-[#0b4d3a]/10 dark:bg-muted text-[#0b4d3a] dark:text-foreground">{comment.user?.name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="bg-[#f3eae0]/30 dark:bg-muted p-3 rounded-2xl flex-1 border border-[#ecd8bf]/60 dark:border-border/60">
                                    <span className="font-black text-[#0b4d3a] dark:text-foreground block mb-0.5">{comment.user?.name}</span>
                                    {typeof comment.content === 'string' && (comment.content.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) !== null || comment.content.includes('res.cloudinary.com')) ? (
                                      <div className="rounded-lg overflow-hidden max-w-[200px] mt-1.5 bg-muted/20">
                                        <img src={comment.content} alt="Comment Photo" className="w-full h-auto object-cover max-h-[140px] cursor-pointer" onClick={() => window.open(comment.content, '_blank')} />
                                      </div>
                                    ) : (
                                      <p className="text-xs text-[#0b4d3a] dark:text-foreground/90 leading-relaxed font-semibold">{comment.content}</p>
                                    )}
                                  </div>
                                </div>
                              ))}

                              {/* Comments Input */}
                              <div className="flex items-center space-x-2.5">
                                <label className="h-9 w-9 flex items-center justify-center rounded-full bg-[#f3eae0]/50 dark:bg-[#121212] hover:bg-[#ebdccb]/80 dark:hover:bg-muted border border-[#ecd8bf]/60 dark:border-border cursor-pointer flex-shrink-0 transition-colors shadow-3xs">
                                  <Camera className="h-4.5 w-4.5 text-[#8f7d6a] dark:text-muted-foreground" />
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      try {
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        const res = await api.post('/upload', formData, {
                                          headers: { 'Content-Type': 'multipart/form-data' }
                                        });
                                        if (res.data.success) {
                                          await api.post(`/posts/${post.id}/comments`, {
                                            content: res.data.url
                                          });
                                          fetchPosts();
                                        }
                                      } catch (err) {
                                        alert('Failed to upload image. Please verify your Cloudinary configurations.');
                                      }
                                    }}
                                  />
                                </label>

                                <input 
                                  type="text" 
                                  placeholder="Write a comment..." 
                                  className="flex-1 h-9 bg-[#f3eae0]/50 dark:bg-[#121212] border border-[#ecd8bf]/60 dark:border-border rounded-full px-4 text-xs text-[#0b4d3a] dark:text-foreground placeholder-[#8f7d6a] dark:placeholder-muted-foreground focus:outline-hidden focus:bg-[#ebdccb]/30 dark:focus:bg-[#1a1a1a]"
                                  value={commentInput}
                                  onChange={(e) => setCommentInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddComment(post.id);
                                  }}
                                />
                                <Button 
                                  size="sm" 
                                  className="h-8.5 rounded-full px-4 text-[10px] bg-orange-600 hover:bg-orange-700 dark:bg-primary dark:hover:bg-primary/85 cursor-pointer font-bold text-white"
                                  onClick={() => handleAddComment(post.id)}
                                >
                                  Post
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-[#faf6f0] dark:bg-card border border-[#ecd8bf] dark:border-border rounded-2xl shadow-3xs">
                      <p className="text-xs text-[#8f7d6a] dark:text-muted-foreground font-bold">No social posts published yet.</p>
                    </div>
                  )}
                </div>
              </>
            ) : activeSubTab === 'connections' ? (
              <div className="space-y-6">
                
                {/* Connections Tab Switcher */}
                <div className="flex border-b border-[#ecd8bf] dark:border-border bg-[#faf6f0] dark:bg-card rounded-xl p-1 shadow-3xs">
                  <button 
                    onClick={() => setConnectionsTab('connected')}
                    className={`flex-1 h-9 rounded-lg text-xs font-black cursor-pointer ${connectionsTab === 'connected' ? 'bg-[#ebdccb] dark:bg-muted text-[#0b4d3a] dark:text-foreground' : 'text-[#8f7d6a] dark:text-muted-foreground hover:bg-[#f3eae0] dark:hover:bg-muted/40'}`}
                  >
                    Connected ({friends.length})
                  </button>
                  <button 
                    onClick={() => setConnectionsTab('requests')}
                    className={`flex-1 h-9 rounded-lg text-xs font-black cursor-pointer relative ${connectionsTab === 'requests' ? 'bg-[#ebdccb] dark:bg-muted text-[#0b4d3a] dark:text-foreground' : 'text-[#8f7d6a] dark:text-muted-foreground hover:bg-[#f3eae0] dark:hover:bg-muted/40'}`}
                  >
                    Requests Received
                    {pendingIncoming.length > 0 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 bg-orange-600 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                        {pendingIncoming.length}
                      </span>
                    )}
                  </button>
                </div>

                {connectionsTab === 'connected' ? (
                  <div className="space-y-4">
                    {filteredFriends.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredFriends.map((friend) => (
                          <Card key={friend.id} className="shadow-3xs border border-[#ecd8bf] dark:border-border bg-[#faf6f0] dark:bg-card rounded-2xl p-4.5 flex items-center justify-between hover:border-[#0b4d3a]/30 dark:hover:border-primary/30 transition-all group">
                            <div className="flex items-center space-x-3.5 min-w-0">
                              <div className="h-14 w-14 rounded-xl overflow-hidden bg-[#f3eae0] dark:bg-muted relative flex-shrink-0 border border-[#ecd8bf]/40 dark:border-border">
                                {friend.avatarUrl ? (
                                  <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center font-extrabold text-lg bg-[#0b4d3a]/5 dark:bg-background text-[#0b4d3a] dark:text-foreground">
                                    {friend.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="font-extrabold text-sm text-[#0b4d3a] dark:text-foreground truncate block">{friend.name}</span>
                                <span className="text-[10px] text-[#8f7d6a] dark:text-muted-foreground mt-0.5 block">1 mutual connection</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col space-y-2 flex-shrink-0">
                              <Button 
                                size="sm" 
                                className="h-8 text-[10px] bg-[#0b4d3a] hover:bg-[#08362b] dark:bg-primary dark:hover:bg-primary/80 text-white font-bold rounded-lg cursor-pointer px-4 shadow-3xs"
                                onClick={async () => {
                                  try {
                                    const res = await api.post('/conversations/create', {
                                      participantIds: [friend.id],
                                      isGroupChat: false
                                    });
                                    onSelectConversation(res.data.data);
                                  } catch (e) {
                                    alert('Failed to launch chat window');
                                  }
                                }}
                              >
                                Message
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0 border-[#ecd8bf] dark:border-border text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer flex items-center justify-center shadow-3xs"
                                onClick={() => handleRemoveConnection(friend.connectionId)}
                              >
                                ✕
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-[#faf6f0] dark:bg-card border border-[#ecd8bf] dark:border-border rounded-2xl shadow-3xs">
                        <p className="text-sm text-[#8f7d6a] dark:text-muted-foreground font-bold">No connected people found</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingIncoming.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {pendingIncoming.map((req) => (
                          <Card key={req.id} className="shadow-3xs border border-[#ecd8bf] dark:border-border bg-[#faf6f0] dark:bg-card rounded-2xl overflow-hidden flex flex-col hover:border-[#0b4d3a]/30 dark:hover:border-primary/30 transition-all group">
                            <div className="aspect-square bg-[#f3eae0] dark:bg-muted relative overflow-hidden flex-shrink-0">
                              {req.sender.avatarUrl ? (
                                <img src={req.sender.avatarUrl} alt={req.sender.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-2xl bg-[#0b4d3a]/5 dark:bg-background text-[#0b4d3a] dark:text-foreground">
                                  {req.sender.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="p-4 flex flex-col justify-between flex-1 min-h-[110px] bg-[#faf6f0] dark:bg-card">
                              <div>
                                <span className="font-extrabold text-sm text-[#0b4d3a] dark:text-foreground truncate block">{req.sender.name}</span>
                                <span className="text-[10px] text-[#8f7d6a] dark:text-muted-foreground mt-0.5 block">1 mutual connection</span>
                              </div>
                              <div className="space-y-2 mt-4">
                                <Button 
                                  size="sm" 
                                  className="w-full h-8 text-[11px] bg-orange-600 hover:bg-orange-700 dark:bg-primary dark:hover:bg-primary/80 text-white font-bold rounded-lg cursor-pointer animate-pulse"
                                  onClick={() => handleRespondRequest(req.id, 'accepted')}
                                >
                                  Confirm
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full h-8 text-[11px] border-transparent bg-[#f3eae0] hover:bg-[#ebdccb] dark:bg-muted dark:hover:bg-muted/80 text-[#0b4d3a] dark:text-foreground font-bold rounded-lg cursor-pointer"
                                  onClick={() => handleRespondRequest(req.id, 'rejected')}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-[#faf6f0] dark:bg-card border border-[#ecd8bf] dark:border-border rounded-2xl shadow-3xs">
                        <p className="text-sm text-[#8f7d6a] dark:text-muted-foreground font-bold">No pending connection requests</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Premium Facebook-style Profile Sub-tab View */
              <div className="space-y-6 animate-fade-in text-[#0b4d3a] dark:text-foreground">
                
                {/* 1. Profile Header Box (Cover & Avatar) */}
                <div className="bg-[#faf6f0] dark:bg-card border border-[#ecd8bf] dark:border-border rounded-2xl overflow-hidden shadow-3xs relative">
                  
                  {/* Cover Photo */}
                  <div className="relative h-48 bg-linear-to-r from-teal-800 to-[#0b4d3a] dark:from-indigo-950 dark:to-teal-950 group">
                    {currentUser?.coverUrl ? (
                      <img src={currentUser.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full opacity-40 bg-radial-to-br from-emerald-500/20 via-transparent to-transparent" />
                    )}
                    <label className="absolute bottom-3 right-3 h-8 px-3.5 bg-black/50 hover:bg-black/70 text-white rounded-lg flex items-center justify-center space-x-1.5 cursor-pointer text-xs font-bold border border-white/20 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-3xs shadow-sm">
                      <Camera className="h-3.5 w-3.5" />
                      <span>Edit Cover Photo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleMediaUpload(file, 'cover');
                        }}
                      />
                    </label>
                  </div>

                  {/* Profile Detail Row */}
                  <div className="px-6 pb-6 pt-16 relative flex flex-col md:flex-row items-center md:items-end justify-between border-b border-[#ecd8bf]/40 dark:border-border/40">
                    
                    {/* Avatar Overlap */}
                    <div className="absolute top-[-50px] left-1/2 md:left-6 -translate-x-1/2 md:translate-x-0 group">
                      <Avatar className="h-28 w-28 border-4 border-[#faf6f0] dark:border-card shadow-md">
                        <AvatarImage src={currentUser?.avatarUrl} />
                        <AvatarFallback className="bg-[#0b4d3a]/10 text-[#0b4d3a] dark:bg-muted dark:text-foreground text-3xl font-black">
                          {currentUser?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <label className="absolute bottom-0 right-0 h-8 w-8 bg-[#0b4d3a] hover:bg-[#08362b] dark:bg-primary dark:hover:bg-primary/80 text-white border-2 border-[#faf6f0] dark:border-card rounded-full flex items-center justify-center cursor-pointer shadow-sm transition-all">
                        <Camera className="h-3.5 w-3.5" />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleMediaUpload(file, 'avatar');
                          }}
                        />
                      </label>
                    </div>

                    {/* Name, Nickname & Friends count */}
                    <div className="text-center md:text-left mt-2 md:mt-0 md:ml-32">
                      <div className="flex flex-col md:flex-row md:items-baseline md:space-x-2">
                        <h2 className="text-2xl font-black tracking-tight">{currentUser?.name}</h2>
                        {currentUser?.nickname && (
                          <span className="text-sm font-bold text-[#8f7d6a] dark:text-muted-foreground">({currentUser.nickname})</span>
                        )}
                      </div>
                      <p className="text-xs text-[#8f7d6a] dark:text-muted-foreground mt-1 font-bold">
                        {friends.length} connections
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 md:mt-0">
                      <Button 
                        onClick={onOpenProfile} 
                        variant="outline" 
                        className="h-9 px-4 text-xs font-bold border-[#ecd8bf] dark:border-border bg-[#f3eae0] hover:bg-[#ebdccb] dark:bg-muted dark:hover:bg-muted/80 text-[#0b4d3a] dark:text-foreground cursor-pointer shadow-3xs"
                      >
                        Edit Profile
                      </Button>
                    </div>

                  </div>

                  {/* Profile Nav tabs */}
                  <div className="flex items-center space-x-2 px-6 py-2.5 overflow-x-auto no-scrollbar bg-[#fcf9f5]/50 dark:bg-background/25">
                    {['All', 'About', 'Friends', 'Photos', 'Reels'].map((tab, idx) => (
                      <button 
                        key={tab} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-150 ${idx === 0 ? 'bg-[#ebdccb] text-[#0b4d3a] dark:bg-muted dark:text-foreground' : 'text-[#8f7d6a] dark:text-muted-foreground hover:bg-[#ebdccb]/30 dark:hover:bg-muted/30'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                </div>

                {/* 2. Split Intro Column & Posts Column */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left Column (Intro) */}
                  <div className="md:col-span-5 space-y-6">
                    
                    {/* Bio Box */}
                    <Card className="shadow-3xs border border-[#ecd8bf]/60 dark:border-border/60 bg-[#faf6f0] dark:bg-card rounded-2xl overflow-hidden">
                      <CardContent className="p-5 space-y-3.5">
                        <h3 className="text-sm font-black uppercase tracking-wider text-[#8f7d6a] dark:text-muted-foreground">Intro</h3>
                        
                        {currentUser?.bio ? (
                          <p className="text-xs font-bold leading-relaxed text-center py-2 italic border-b border-[#ecd8bf]/40 dark:border-border/40 text-[#0b4d3a] dark:text-foreground">
                            &ldquo;{currentUser.bio}&rdquo;
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground/60 text-center py-2 border-b border-[#ecd8bf]/40 dark:border-border/40 italic">
                            No bio status set
                          </p>
                        )}

                        <div className="space-y-3 text-xs font-semibold">
                          {currentUser?.workplace && (
                            <div className="flex items-start space-x-2.5">
                              <span className="text-[#8f7d6a] dark:text-muted-foreground flex-shrink-0">🏢</span>
                              <span>{currentUser.workTitle || 'Works'} at <span className="font-extrabold">{currentUser.workplace}</span></span>
                            </div>
                          )}
                          {currentUser?.educationSchool && (
                            <div className="flex items-start space-x-2.5">
                              <span className="text-[#8f7d6a] dark:text-muted-foreground flex-shrink-0">🎓</span>
                              <span>Studied <span className="font-extrabold">{currentUser.educationDept || 'Courses'}</span> at <span className="font-extrabold">{currentUser.educationSchool}</span></span>
                            </div>
                          )}
                          {currentUser?.livesIn && (
                            <div className="flex items-start space-x-2.5">
                              <span className="text-[#8f7d6a] dark:text-muted-foreground flex-shrink-0">📍</span>
                              <span>Lives in <span className="font-extrabold">{currentUser.livesIn}</span></span>
                            </div>
                          )}
                          {currentUser?.fromCity && (
                            <div className="flex items-start space-x-2.5">
                              <span className="text-[#8f7d6a] dark:text-muted-foreground flex-shrink-0">🏠</span>
                              <span>From <span className="font-extrabold">{currentUser.fromCity}</span></span>
                            </div>
                          )}
                          {currentUser?.gender && (
                            <div className="flex items-start space-x-2.5">
                              <span className="text-[#8f7d6a] dark:text-muted-foreground flex-shrink-0">👤</span>
                              <span>Gender: <span className="font-extrabold">{currentUser.gender}</span></span>
                            </div>
                          )}
                        </div>

                        <Button 
                          onClick={onOpenProfile} 
                          variant="outline" 
                          className="w-full text-xs font-bold border-[#ecd8bf] dark:border-border bg-[#f3eae0] hover:bg-[#ebdccb] dark:bg-muted dark:hover:bg-muted/80 text-[#0b4d3a] dark:text-foreground cursor-pointer shadow-3xs"
                        >
                          Edit Details
                        </Button>
                      </CardContent>
                    </Card>

                  </div>

                  {/* Right Column (User Posts Feed) */}
                  <div className="md:col-span-7 space-y-6">
                    
                    {/* Create Post Component (Reused) */}
                    {/* Create Post Component (Reused) */}
                    <Card className="shadow-3xs border border-[#ecd8bf] dark:border-border bg-[#faf6f0] dark:bg-card rounded-2xl text-[#0b4d3a] dark:text-card-foreground overflow-hidden">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center space-x-3.5">
                          <Avatar className="h-10 w-10 border border-[#ecd8bf] dark:border-border shadow-xs">
                            <AvatarImage src={currentUser?.avatarUrl} />
                            <AvatarFallback className="bg-[#0b4d3a]/10 dark:bg-muted text-[#0b4d3a] dark:text-foreground font-bold">{currentUser?.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          
                          <div 
                            onClick={() => setIsCreatePostOpen(true)}
                            className="flex-1 h-10 bg-[#f3eae0] dark:bg-[#121212] hover:bg-[#ebdccb]/60 dark:hover:bg-[#1a1a1a] rounded-full px-5 text-xs text-[#8f7d6a] dark:text-muted-foreground flex items-center cursor-pointer transition-all font-semibold select-none"
                          >
                            What&apos;s on your mind, {currentUser?.name || 'User'}?
                          </div>
                        </div>

                        <div className="border-t border-[#ecd8bf]/60 dark:border-border pt-3 flex items-center justify-between text-xs text-[#8f7d6a] dark:text-muted-foreground select-none">
                          <div className="flex items-center space-x-4">
                            <button 
                              type="button"
                              onClick={() => setIsCreatePostOpen(true)}
                              className="flex items-center space-x-2 py-1.5 px-3 rounded-xl hover:bg-[#f3eae0] dark:hover:bg-muted cursor-pointer transition-colors font-bold text-[#0b4d3a] dark:text-foreground"
                            >
                              <ImageIcon className="h-4.5 w-4.5 text-orange-500" />
                              <span className="text-[11.5px]">Photos</span>
                            </button>
                          </div>

                          <button 
                            type="button"
                            onClick={() => setIsCreatePostOpen(true)}
                            className="h-8.5 px-5 text-xs bg-orange-600 hover:bg-orange-700 dark:bg-primary dark:hover:bg-primary/80 text-white font-black rounded-full cursor-pointer shadow-sm transition-all"
                          >
                            Publish
                          </button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Filtered User Posts list */}
                    <div className="space-y-5">
                      {posts.filter(p => p.author.id === currentUser?.id).length > 0 ? (
                        posts.filter(p => p.author.id === currentUser?.id).map((post) => (
                          <Card key={post.id} className="shadow-2xs border border-[#ecd8bf]/60 dark:border-border bg-[#faf6f0] dark:bg-card rounded-2xl text-[#0b4d3a] dark:text-card-foreground overflow-hidden animate-fade-in">
                            <CardContent className="p-5 space-y-4">
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-10 w-10 border border-[#ecd8bf] dark:border-border shadow-xs">
                                    <AvatarImage src={post.author.avatarUrl || undefined} />
                                    <AvatarFallback className="font-bold bg-[#0b4d3a]/10 dark:bg-muted text-[#0b4d3a] dark:text-foreground">{post.author.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h4 className="text-xs font-black text-[#0b4d3a] dark:text-foreground">{post.author.name}</h4>
                                    <p className="text-[9px] text-[#8f7d6a] dark:text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                      <span>{new Date(post.createdAt).toLocaleDateString()}</span> • <Globe className="h-3 w-3" />
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {post.content && (
                                <p className="text-xs text-[#0b4d3a] dark:text-foreground leading-relaxed font-semibold">{post.content}</p>
                              )}

                              {post.mediaUrl && (
                                <div className="relative rounded-xl overflow-hidden bg-[#f3eae0]/30 dark:bg-[#121212] border border-[#ecd8bf]/60 dark:border-border group">
                                  <img src={post.mediaUrl} alt="Attachment" className="w-full h-auto object-cover max-h-[340px]" />
                                </div>
                              )}

                              <div className="flex items-center justify-between text-[10px] text-[#8f7d6a] dark:text-muted-foreground pt-1 border-b border-[#ecd8bf]/60 dark:border-border/40 pb-3 px-0.5">
                                <div className="flex items-center space-x-1">
                                  <Heart className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
                                  <span className="font-bold text-[#0b4d3a] dark:text-foreground">{post.likesCount} Likes</span>
                                </div>
                                <div className="flex space-x-2">
                                  <span>{post.commentsCount} Comments</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs pt-1 border-[#ecd8bf]/60 dark:border-border">
                                <button 
                                  onClick={() => handleToggleLike(post.id)}
                                  className={`flex-1 flex items-center justify-center space-x-2 hover:bg-[#ebdccb]/60 dark:hover:bg-muted py-2 rounded-xl cursor-pointer transition-all font-black ${post.userLiked ? 'text-orange-500 animate-pulse' : 'text-[#0b4d3a] dark:text-foreground'}`}
                                >
                                  <Heart className={`h-4 w-4 ${post.userLiked ? 'fill-orange-500 text-orange-500' : ''}`} /> 
                                  <span>Like</span>
                                </button>
                                
                                <button 
                                  onClick={() => setActivePostCommentsId(activePostCommentsId === post.id ? null : post.id)}
                                  className={`flex-1 flex items-center justify-center space-x-2 hover:bg-[#ebdccb]/60 dark:hover:bg-muted py-2 rounded-xl cursor-pointer transition-all font-black ${activePostCommentsId === post.id ? 'text-orange-500' : 'text-[#0b4d3a] dark:text-foreground'}`}
                                >
                                  <MessageSquare className="h-4 w-4" /> <span>Comment</span>
                                </button>
                              </div>

                              {activePostCommentsId === post.id && (
                                <div className="border-t border-[#ecd8bf]/60 dark:border-border pt-4 mt-2 space-y-4">
                                  <div className="flex items-center space-x-2.5">
                                    <input 
                                      type="text" 
                                      placeholder="Write a comment..." 
                                      className="flex-1 h-9 bg-[#f3eae0]/50 dark:bg-[#121212] border border-[#ecd8bf]/60 dark:border-border rounded-full px-4 text-xs text-[#0b4d3a] dark:text-foreground placeholder-[#8f7d6a] dark:placeholder-muted-foreground focus:outline-hidden focus:bg-[#ebdccb]/30 dark:focus:bg-[#1a1a1a]"
                                      value={commentInput}
                                      onChange={(e) => setCommentInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddComment(post.id);
                                      }}
                                    />
                                    <Button 
                                      size="sm" 
                                      className="h-8.5 rounded-full px-4 text-[10px] bg-orange-600 hover:bg-orange-700 dark:bg-primary dark:hover:bg-primary/85 cursor-pointer font-bold text-white"
                                      onClick={() => handleAddComment(post.id)}
                                    >
                                      Post
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-[#faf6f0] dark:bg-card border border-[#ecd8bf] dark:border-border rounded-2xl shadow-3xs">
                          <p className="text-xs text-[#8f7d6a] dark:text-muted-foreground font-bold">You haven&apos;t published any posts yet.</p>
                        </div>
                      )}
                    </div>

                  </div>

                </div>

              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar Column (Birthdays, Active Panel Contacts) */}
        <aside className="hidden lg:block w-72 border-l border-[#ecd8bf]/60 dark:border-border p-4 space-y-6 overflow-y-auto bg-[#faf6f0] dark:bg-card select-none flex-shrink-0">
          
          {/* Birthdays */}
          <div className="space-y-3">
            <h5 className="text-[10px] font-bold text-[#8f7d6a] dark:text-muted-foreground uppercase tracking-wider">Birthdays</h5>
            <div className="flex items-start space-x-3 text-xs leading-normal">
              <Gift className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5 animate-bounce" />
              <p className="text-[11px] text-[#0b4d3a] dark:text-foreground font-semibold">
                <strong>Anna Sharma&apos;s</strong> birthday today!
              </p>
            </div>
          </div>

          <div className="h-[1px] bg-[#ecd8bf]/60 dark:bg-border"></div>

          {/* Contacts/Connected People List */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-[#8f7d6a] dark:text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
              <span>Contacts</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
            
            <div className="space-y-1">
              {friends.length > 0 ? (
                friends.map(friend => (
                  <div 
                    key={friend.id} 
                    className="flex items-center space-x-3 p-1.5 hover:bg-[#f3eae0] dark:hover:bg-muted rounded-xl cursor-pointer transition-all animate-fade-in"
                    onClick={async () => {
                      try {
                        const res = await api.post('/conversations/create', {
                          participantIds: [friend.id],
                          isGroupChat: false
                        });
                        onSelectConversation(res.data.data);
                      } catch (e) {
                        alert('Failed to open chat window');
                      }
                    }}
                  >
                    <div className="relative">
                      <Avatar className="h-9 w-9 border border-[#ecd8bf] dark:border-border">
                        <AvatarImage src={friend.avatarUrl || undefined} />
                        <AvatarFallback className="bg-[#0b4d3a]/10 dark:bg-background text-[#0b4d3a] dark:text-foreground text-xs font-bold">{friend.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold truncate block text-[#0b4d3a] dark:text-foreground">{friend.name}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <span className="text-[10px] text-[#8f7d6a] dark:text-muted-foreground">No contacts found</span>
                </div>
              )}
            </div>
          </div>
        </aside>

      {/* Facebook style Create Post Modal */}
      <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl border border-border bg-background shadow-2xl p-0 overflow-hidden">
          {/* Header */}
          <div className="border-b border-border p-4 flex items-center justify-between bg-muted/20">
            <h3 className="font-extrabold text-sm text-[#0b4d3a] dark:text-foreground mx-auto">Create Post</h3>
          </div>

          <form onSubmit={(e) => {
            handleCreatePost(e);
            setIsCreatePostOpen(false);
          }} className="p-5 space-y-4">
            
            {/* User Info */}
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 border border-border shadow-sm">
                <AvatarImage src={currentUser?.avatarUrl} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">{currentUser?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <span className="font-extrabold text-xs text-[#0b4d3a] dark:text-foreground block">{currentUser?.name}</span>
                <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold mt-0.5 inline-block">👥 Friends</span>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              placeholder={`What's on your mind, ${currentUser?.name || 'User'}?`}
              className="w-full text-base bg-transparent border-none placeholder:text-muted-foreground focus:outline-hidden resize-none min-h-[120px] text-[#0b4d3a] dark:text-foreground font-semibold"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              autoFocus
            />

            {/* Uploaded Preview */}
            {postMediaUrl && (
              <div className="relative rounded-xl overflow-hidden bg-muted/20 border border-border max-h-[200px]">
                <img src={postMediaUrl} alt="Post preview" className="w-full h-full object-cover max-h-[200px]" />
                <button 
                  type="button" 
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors cursor-pointer"
                  onClick={() => setPostMediaUrl('')}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Add to your post tray */}
            <div className="border border-border rounded-xl p-3 flex items-center justify-between bg-card/30">
              <span className="text-[11px] font-black text-[#8f7d6a] dark:text-muted-foreground">Add to your post</span>
              <div className="flex items-center space-x-2">
                <label className="flex items-center justify-center p-2 rounded-full hover:bg-muted cursor-pointer transition-colors text-orange-500">
                  <ImageIcon className="h-5 w-5" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        const res = await api.post('/upload', formData, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        if (res.data.success) {
                          setPostMediaUrl(res.data.url);
                        }
                      } catch (err) {
                        alert('Failed to upload image. Please verify your Cloudinary configurations.');
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Publish Button */}
            <Button 
              type="submit" 
              className="w-full h-10 bg-orange-600 hover:bg-orange-700 dark:bg-primary dark:hover:bg-primary/95 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Post
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}
