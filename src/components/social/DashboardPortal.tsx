'use client';

import React, { useState, useEffect } from 'react';
import { User, Conversation } from '@/types';
import api from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, Heart, Share2, Video, Image as ImageIcon, Smile, 
  Gift, Users, UserCheck, UserPlus, Play, Globe, Search, Bell, ChevronDown, Clock
} from 'lucide-react';

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
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'connections'>('feed');
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

  // Filter connections locally if searching
  const filteredFriends = friends.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#faf6f0] text-[#0b4d3a] font-sans-active select-none overflow-hidden">
      
      {/* Cursive Google Font stylesheet injection */}
      <link href="https://fonts.googleapis.com/css2?family=Pacifico&family=Outfit:wght@300;400;600;700;900&display=swap" rel="stylesheet" />

      {/* Top Header Bar */}
      <header className="h-16 border-b border-[#ecd8bf] bg-[#faf6f0] px-6 flex items-center justify-between flex-shrink-0 shadow-3xs z-10">
        
        {/* Left: App Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveSubTab('feed')}>
          <span className="text-2xl font-normal text-[#0b4d3a] font-['Pacifico',cursive] tracking-wide select-none">
            Your Chat
          </span>
        </div>

        {/* Center: Search Box */}
        <div className="flex-1 max-w-md mx-8 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8f7d6a]" />
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full h-10 bg-[#f3eae0] border border-transparent rounded-full pl-10 pr-4 text-xs text-[#0b4d3a] placeholder-[#8f7d6a] focus:outline-hidden focus:border-[#0b4d3a]/30 transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Right: Quick actions buttons */}
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-[#f3eae0] hover:bg-[#ebdccb] text-[#0b4d3a] cursor-pointer"
            onClick={onSwitchToChats}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-[#f3eae0] hover:bg-[#ebdccb] text-[#0b4d3a] cursor-pointer relative"
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
            className="h-10 w-10 rounded-full bg-[#f3eae0] hover:bg-[#ebdccb] text-[#0b4d3a] cursor-pointer"
            onClick={() => {
              setActiveSubTab('connections');
              setConnectionsTab('requests');
            }}
          >
            <UserPlus className="h-4 w-4" />
          </Button>

          <div 
            className="flex items-center space-x-1.5 bg-[#f3eae0] hover:bg-[#ebdccb] py-1 pl-1 pr-2 rounded-full cursor-pointer transition-all border border-[#ecd8bf]/40"
            onClick={onOpenProfile}
          >
            <Avatar className="h-8 w-8 border border-[#ecd8bf]">
              <AvatarImage src={currentUser?.avatarUrl} />
              <AvatarFallback className="bg-[#0b4d3a]/15 text-[#0b4d3a] font-bold text-xs">
                {currentUser?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="h-3.5 w-3.5 text-[#8f7d6a]" />
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar Menu Column */}
        <aside className="w-64 border-r border-[#ecd8bf]/60 p-4 space-y-2.5 flex-shrink-0 bg-[#faf6f0]">
          <button 
            onClick={() => setActiveSubTab('feed')}
            className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all duration-150 text-left font-bold text-sm cursor-pointer ${
              activeSubTab === 'feed' 
                ? 'bg-[#ebdccb] text-[#0b4d3a] shadow-3xs' 
                : 'text-[#8f7d6a] hover:bg-[#f3eae0] hover:text-[#0b4d3a]'
            }`}
          >
            <ImageIcon className="h-5 w-5 flex-shrink-0" />
            <span>News Feed</span>
          </button>

          <button 
            onClick={() => setActiveSubTab('connections')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-150 text-left font-bold text-sm cursor-pointer ${
              activeSubTab === 'connections' 
                ? 'bg-[#ebdccb] text-[#0b4d3a] shadow-3xs' 
                : 'text-[#8f7d6a] hover:bg-[#f3eae0] hover:text-[#0b4d3a]'
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
        </aside>

        {/* Center Panel (Feeds / Request Lists) */}
        <main className="flex-1 overflow-y-auto no-scrollbar p-6 bg-[#f7f0e6]">
          <div className="max-w-[640px] mx-auto space-y-6 pb-12">
            
            {activeSubTab === 'feed' ? (
              <>
                {/* Stories Carousel */}
                {storiesList.length > 0 && (
                  <div className="flex space-x-3 overflow-x-auto pb-1.5 no-scrollbar">
                    {/* Create Story Card */}
                    <div 
                      onClick={handleCreateStory}
                      className="w-[105px] h-[165px] bg-[#faf6f0] border border-[#ecd8bf] rounded-xl overflow-hidden shadow-3xs relative flex flex-col flex-shrink-0 cursor-pointer group hover:border-[#0b4d3a]/30 transition-all"
                    >
                      <div className="h-[110px] bg-[#f3eae0] relative overflow-hidden">
                        {currentUser?.avatarUrl ? (
                          <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl font-bold bg-[#0b4d3a]/5 text-[#0b4d3a]">
                            {currentUser?.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-end p-1.5 relative bg-[#faf6f0]">
                        <div className="absolute top-[-14px] h-7 w-7 rounded-full bg-[#0b4d3a] border-3 border-[#faf6f0] flex items-center justify-center text-white shadow-sm">
                          <span className="font-bold text-xs">+</span>
                        </div>
                        <span className="text-[9px] font-black mt-1">Create story</span>
                      </div>
                    </div>

                    {/* Stories Loop */}
                    {storiesList.map(story => (
                      <div key={story.id} className="w-[105px] h-[165px] rounded-xl overflow-hidden shadow-3xs relative flex-shrink-0 cursor-pointer group border border-[#ecd8bf]/40">
                        <img src={story.bg} alt={story.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                        <div className="absolute inset-0 bg-linear-to-b from-black/10 via-transparent to-black/70"></div>
                        <Avatar className="absolute top-2 left-2 h-7 w-7 border border-[#0b4d3a] shadow-sm">
                          <AvatarImage src={story.avatar || undefined} />
                          <AvatarFallback className="text-[9px] bg-[#faf6f0]">{story.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-2 left-2 right-2 text-[9px] font-black text-white truncate">{story.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Create Post Box (Green mock look matching the image) */}
                <Card className="shadow-3xs border-none bg-[#0a4c3e] rounded-2xl text-[#fdfbf7] overflow-hidden">
                  <CardContent className="p-5 space-y-4">
                    <form onSubmit={handleCreatePost} className="space-y-4">
                      <div className="flex items-center space-x-3.5">
                        <Avatar className="h-10 w-10 border border-[#08362b]">
                          <AvatarImage src={currentUser?.avatarUrl} />
                          <AvatarFallback className="bg-[#052b22] text-[#fdfbf7] font-bold">{currentUser?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        
                        <input 
                          type="text" 
                          placeholder={`What's on your mind, ${currentUser?.name || 'User'}?`}
                          className="flex-1 h-10 bg-[#043329] border border-transparent rounded-full px-5 text-xs text-[#fdfbf7] placeholder-[#81a19a] focus:outline-hidden focus:bg-[#032a22] transition-all font-semibold"
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                        />
                      </div>

                      {showMediaInput && (
                        <input 
                          type="text" 
                          placeholder="Paste image or photo attachment URL here..."
                          className="w-full h-8 bg-[#043329] border border-transparent rounded-lg px-4 text-[10px] text-[#fdfbf7] placeholder-[#81a19a] focus:outline-hidden focus:bg-[#032a22] transition-all"
                          value={postMediaUrl}
                          onChange={(e) => setPostMediaUrl(e.target.value)}
                        />
                      )}

                      <div className="border-t border-[#093e32] pt-4 flex items-center justify-between text-xs px-1 text-[#81a19a]">
                        <div className="flex items-center space-x-4">
                          <button 
                            type="button"
                            onClick={() => setShowMediaInput(!showMediaInput)}
                            className="flex items-center space-x-2 py-1.5 rounded-lg cursor-pointer transition-colors font-bold text-[#fdfbf7] hover:text-[#fdfbf7]/80"
                          >
                            <ImageIcon className="h-4.5 w-4.5 text-orange-400" />
                            <span className="text-[11px]">Photos/Videos</span>
                          </button>
                          
                          <button 
                            type="button" 
                            className="flex items-center space-x-2 py-1.5 rounded-lg cursor-pointer transition-colors font-bold text-[#fdfbf7]/70 hover:text-[#fdfbf7]"
                          >
                            <Smile className="h-4.5 w-4.5 text-amber-300" />
                            <span className="text-[11px]">Feel/Activity</span>
                          </button>
                        </div>

                        <button 
                          type="submit"
                          className="h-8.5 px-5 text-xs bg-orange-600 hover:bg-orange-700 text-white font-black rounded-full cursor-pointer shadow-sm transition-all"
                        >
                          Publish
                        </button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Posts Feed */}
                <div className="space-y-5">
                  {posts.length > 0 ? (
                    posts.map((post) => (
                      <Card key={post.id} className="shadow-2xs border-none bg-[#0a4c3e] rounded-2xl text-[#fdfbf7] overflow-hidden animate-fade-in">
                        <CardContent className="p-5 space-y-4">
                          
                          {/* Post Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10 border border-[#08362b] shadow-sm">
                                <AvatarImage src={post.author.avatarUrl || undefined} />
                                <AvatarFallback className="font-bold bg-[#052b22] text-[#fdfbf7]">{post.author.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="text-xs font-black text-[#fdfbf7]">{post.author.name}</h4>
                                <p className="text-[9px] text-[#81a19a] flex items-center gap-1.5 mt-0.5">
                                  <span>{new Date(post.createdAt).toLocaleDateString()}</span> • <Globe className="h-3 w-3" />
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Post Content */}
                          {post.content && (
                            <p className="text-xs text-[#fdfbf7] leading-relaxed font-semibold">{post.content}</p>
                          )}

                          {/* Post Attachment */}
                          {post.mediaUrl && (
                            <div className="relative rounded-xl overflow-hidden bg-[#043329] border border-[#093e32] group">
                              <img src={post.mediaUrl} alt="Attachment" className="w-full h-auto object-cover max-h-[340px]" />
                            </div>
                          )}

                          {/* Post Stats */}
                          <div className="flex items-center justify-between text-[10px] text-[#81a19a] pt-1 border-b border-[#093e32] pb-3 px-0.5">
                            <div className="flex items-center space-x-1">
                              <Heart className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
                              <span className="font-bold text-[#fdfbf7]">{post.likesCount} Likes</span>
                            </div>
                            <div className="flex space-x-2">
                              <span>{post.commentsCount} Comments</span>
                            </div>
                          </div>

                          {/* Post Actions */}
                          <div className="flex items-center justify-between text-xs pt-1 border-[#093e32]">
                            <button 
                              onClick={() => handleToggleLike(post.id)}
                              className={`flex-1 flex items-center justify-center space-x-2 hover:bg-[#073d32] py-2 rounded-xl cursor-pointer transition-all font-black ${post.userLiked ? 'text-orange-400' : 'text-[#fdfbf7]'}`}
                            >
                              <Heart className={`h-4 w-4 ${post.userLiked ? 'fill-orange-400 text-orange-400' : ''}`} /> 
                              <span>Like</span>
                            </button>
                            
                            <button 
                              onClick={() => setActivePostCommentsId(activePostCommentsId === post.id ? null : post.id)}
                              className={`flex-1 flex items-center justify-center space-x-2 hover:bg-[#073d32] py-2 rounded-xl cursor-pointer transition-all font-black ${activePostCommentsId === post.id ? 'text-orange-400' : 'text-[#fdfbf7]'}`}
                            >
                              <MessageSquare className="h-4 w-4" /> <span>Comment</span>
                            </button>
                          </div>

                          {/* Comments Expansion Drawer */}
                          {activePostCommentsId === post.id && (
                            <div className="border-t border-[#093e32] pt-4 space-y-4 animate-fade-in">
                              
                              {/* Comments List */}
                              {post.comments && post.comments.map((comment: any) => (
                                <div key={comment.id} className="flex items-start space-x-3 text-xs">
                                  <Avatar className="h-8 w-8 border border-[#08362b]">
                                    <AvatarImage src={comment.user.avatarUrl || undefined} />
                                    <AvatarFallback className="font-bold bg-[#052b22] text-[#fdfbf7]">{comment.user.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="bg-[#043329] p-3 rounded-2xl flex-1 border border-[#093e32]/40">
                                    <span className="font-black text-[#fdfbf7] block mb-0.5">{comment.user.name}</span>
                                    <p className="text-[#81a19a] leading-relaxed font-semibold">{comment.content}</p>
                                  </div>
                                </div>
                              ))}

                              {/* Comment Input */}
                              <div className="flex items-center space-x-2 pt-2">
                                <input 
                                  type="text" 
                                  placeholder="Write a comment..."
                                  className="flex-1 h-9 bg-[#043329] border border-transparent rounded-full px-4 text-xs text-[#fdfbf7] placeholder-[#81a19a] focus:outline-hidden focus:bg-[#032a22] transition-all font-semibold"
                                  value={commentInput}
                                  onChange={(e) => setCommentInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddComment(post.id);
                                  }}
                                />
                                <Button 
                                  size="sm" 
                                  className="h-9 px-4 text-xs bg-orange-600 hover:bg-orange-700 text-white font-black rounded-full cursor-pointer"
                                  onClick={() => handleAddComment(post.id)}
                                >
                                  Send
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-[#faf6f0] border border-[#ecd8bf] rounded-2xl shadow-3xs">
                      <p className="text-sm text-[#8f7d6a] font-bold">No posts found. Publish a thought to get started!</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Connections Sub Panel layout
              <div className="space-y-6">
                
                {/* Horizontal tabs */}
                <div className="flex border-b border-[#ecd8bf] bg-[#faf6f0] rounded-xl p-1 shadow-3xs">
                  <Button
                    variant="ghost"
                    className={`flex-1 h-9 rounded-lg text-xs font-black cursor-pointer ${connectionsTab === 'connected' ? 'bg-[#ebdccb] text-[#0b4d3a]' : 'text-[#8f7d6a] hover:bg-[#f3eae0]'}`}
                    onClick={() => setConnectionsTab('connected')}
                  >
                    Connected People ({friends.length})
                  </Button>
                  <Button
                    variant="ghost"
                    className={`flex-1 h-9 rounded-lg text-xs font-black cursor-pointer relative ${connectionsTab === 'requests' ? 'bg-[#ebdccb] text-[#0b4d3a]' : 'text-[#8f7d6a] hover:bg-[#f3eae0]'}`}
                    onClick={() => setConnectionsTab('requests')}
                  >
                    Pending Requests ({pendingIncoming.length})
                    {pendingIncoming.length > 0 && (
                      <Badge className="absolute top-1 right-2 bg-orange-600 text-white text-[8px] px-1 h-3.5 min-w-[14px] flex items-center justify-center rounded-full font-bold">
                        {pendingIncoming.length}
                      </Badge>
                    )}
                  </Button>
                </div>

                {connectionsTab === 'connected' ? (
                  <div className="space-y-4">
                    {filteredFriends.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredFriends.map((friend) => (
                          <Card key={friend.id} className="shadow-3xs border border-[#ecd8bf] bg-[#faf6f0] rounded-2xl overflow-hidden flex flex-col hover:border-[#0b4d3a]/30 transition-all group">
                            <div className="aspect-square bg-[#f3eae0] relative overflow-hidden flex-shrink-0">
                              {friend.avatarUrl ? (
                                <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-2xl bg-[#0b4d3a]/5 text-[#0b4d3a]">
                                  {friend.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="p-4 flex flex-col justify-between flex-1 min-h-[90px] bg-[#faf6f0]">
                              <div>
                                <span className="font-extrabold text-sm text-[#0b4d3a] truncate block">{friend.name}</span>
                                <span className="text-[10px] text-green-600 font-bold mt-1 flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 bg-green-500 rounded-full"></span> Connected
                                </span>
                              </div>
                              <div className="mt-4 flex space-x-2">
                                <Button 
                                  size="sm" 
                                  className="flex-grow h-8 text-[11px] bg-[#0b4d3a] hover:bg-[#08362b] text-white font-bold rounded-lg cursor-pointer"
                                  onClick={async () => {
                                    try {
                                      const res = await api.post('/conversations/create', {
                                        participantIds: [friend.id],
                                        isGroupChat: false
                                      });
                                      onSelectConversation(res.data.data);
                                    } catch (e: any) {
                                      alert('Failed to start chat session');
                                    }
                                  }}
                                >
                                  Open Chat
                                </Button>
                                {friend.connectionId && (
                                  <Button 
                                    variant="outline"
                                    size="sm" 
                                    className="h-8 px-3.5 text-[11px] border-red-500/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold rounded-lg cursor-pointer"
                                    onClick={() => handleRemoveConnection(friend.connectionId!)}
                                  >
                                    Disconnect
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-[#faf6f0] border border-[#ecd8bf] rounded-2xl shadow-3xs">
                        <p className="text-sm text-[#8f7d6a]">No connected people found</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingIncoming.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {pendingIncoming.map((req) => (
                          <Card key={req.id} className="shadow-3xs border border-[#ecd8bf] bg-[#faf6f0] rounded-2xl overflow-hidden flex flex-col hover:border-[#0b4d3a]/30 transition-all group">
                            <div className="aspect-square bg-[#f3eae0] relative overflow-hidden flex-shrink-0">
                              {req.sender.avatarUrl ? (
                                <img src={req.sender.avatarUrl} alt={req.sender.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-2xl bg-[#0b4d3a]/5 text-[#0b4d3a]">
                                  {req.sender.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="p-4 flex flex-col justify-between flex-1 min-h-[110px] bg-[#faf6f0]">
                              <div>
                                <span className="font-extrabold text-sm text-[#0b4d3a] truncate block">{req.sender.name}</span>
                                <span className="text-[10px] text-[#8f7d6a] mt-0.5 block">1 mutual connection</span>
                              </div>
                              <div className="space-y-2 mt-4">
                                <Button 
                                  size="sm" 
                                  className="w-full h-8 text-[11px] bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg cursor-pointer"
                                  onClick={() => handleRespondRequest(req.id, 'accepted')}
                                >
                                  Confirm
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full h-8 text-[11px] border-transparent bg-[#f3eae0] hover:bg-[#ebdccb] text-[#0b4d3a] font-bold rounded-lg cursor-pointer"
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
                      <div className="text-center py-10 bg-[#faf6f0] border border-[#ecd8bf] rounded-2xl shadow-3xs">
                        <p className="text-sm text-[#8f7d6a]">No pending connection requests</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar Column (Sponsored, Birthdays, Active Panel Contacts) */}
        <aside className="hidden lg:block w-72 border-l border-[#ecd8bf]/60 p-4 space-y-6 overflow-y-auto bg-[#faf6f0] select-none flex-shrink-0">
          
          {/* Sponsored/Ads */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-[#8f7d6a] text-[10px] font-bold uppercase tracking-wider">
              <span>Sponsored</span>
              <span className="hover:underline cursor-pointer">Ad all</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3.5 cursor-pointer hover:bg-[#f3eae0] p-1.5 rounded-xl transition-all">
                <div className="h-14 w-20 rounded-lg bg-muted overflow-hidden flex-shrink-0 border border-[#ecd8bf]">
                  <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=100&auto=format&fit=crop&q=60" alt="Ad" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h6 className="text-[11px] font-bold truncate">Sampe Ads</h6>
                  <span className="text-[9px] text-[#8f7d6a] mt-0.5 block leading-normal">Shnare your prond to now mads.</span>
                  <span className="text-[9px] text-orange-600 font-bold mt-0.5 block hover:underline">Shop now</span>
                </div>
              </div>

              <div className="flex items-center space-x-3.5 cursor-pointer hover:bg-[#f3eae0] p-1.5 rounded-xl transition-all">
                <div className="h-14 w-20 rounded-lg bg-muted overflow-hidden flex-shrink-0 border border-[#ecd8bf]">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60" alt="Ad" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h6 className="text-[11px] font-bold truncate">Amazon choidget</h6>
                  <span className="text-[9px] text-[#8f7d6a] mt-0.5 block leading-normal">Mark up debt logical vants.</span>
                  <span className="text-[9px] text-orange-600 font-bold mt-0.5 block hover:underline">Shop now</span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-[#ecd8bf]/60"></div>

          {/* Birthdays */}
          <div className="space-y-3">
            <h5 className="text-[10px] font-bold text-[#8f7d6a] uppercase tracking-wider">Birthdays</h5>
            <div className="flex items-start space-x-3 text-xs leading-normal">
              <Gift className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5 animate-bounce" />
              <p className="text-[11px] text-[#0b4d3a] font-semibold">
                <strong>Anna Sharma's</strong> birthday today!
              </p>
            </div>
          </div>

          <div className="h-[1px] bg-[#ecd8bf]/60"></div>

          {/* Contacts/Connected People List */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-[#8f7d6a] text-[10px] font-bold uppercase tracking-wider">
              <span>Contacts</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
            
            <div className="space-y-1">
              {friends.length > 0 ? (
                friends.map(friend => (
                  <div 
                    key={friend.id} 
                    className="flex items-center space-x-3 p-1.5 hover:bg-[#f3eae0] rounded-xl cursor-pointer transition-all"
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
                      <Avatar className="h-9 w-9 border border-[#ecd8bf]">
                        <AvatarImage src={friend.avatarUrl || undefined} />
                        <AvatarFallback className="bg-[#0b4d3a]/10 text-[#0b4d3a] text-xs font-bold">{friend.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#faf6f0] rounded-full"></div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold truncate block">{friend.name}</span>
                      <span className="text-[8px] text-green-600 font-bold block">Online</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <span className="text-[10px] text-[#8f7d6a]">No contacts online</span>
                </div>
              )}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
