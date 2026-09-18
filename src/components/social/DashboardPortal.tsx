'use client';

import React, { useState, useEffect } from 'react';
import { User, Conversation, Post } from '@/types';
import api from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  MessageSquare, Heart, Share2, Image as ImageIcon, Smile, 
  Gift, Users, UserCheck, UserPlus, Globe, Search, Bell, ChevronDown, Clock,
  Camera, Lock, Unlock, MoreHorizontal, Edit3, Trash2, Loader2, ShieldAlert,
  Sparkles, Check, X, ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User as UserIcon, Settings, LogOut } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DashboardPortalProps {
  currentUser: User | null;
  onRefreshConversations: () => void;
  onSelectConversation: (conversation: Conversation) => void;
  onSwitchToChats?: () => void;
  onOpenProfile?: () => void;
  unreadConversationCount?: number;
}

export default function DashboardPortal({ 
  currentUser, 
  onRefreshConversations, 
  onSelectConversation,
  onSwitchToChats,
  onOpenProfile,
  unreadConversationCount = 0
}: DashboardPortalProps) {
  const { updateProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  
  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'connections' | 'profile'>('feed');
  const [connectionsTab, setConnectionsTab] = useState<'connected' | 'requests'>('connected');
  const [profileTab, setProfileTab] = useState<'about' | 'photos' | 'connections'>('about');
  
  // Viewing another user profile state (null = viewing current user)
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [viewingUserData, setViewingUserData] = useState<any | null>(null);
  const [isViewingUserLocked, setIsViewingUserLocked] = useState(false);
  const [isViewingUserFriend, setIsViewingUserFriend] = useState(false);
  const [loadingViewingUser, setLoadingViewingUser] = useState(false);

  // Social feed & data
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [storiesList, setStoriesList] = useState<any[]>([]);
  
  // Create Post state
  const [postContent, setPostContent] = useState('');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [postAudience, setPostAudience] = useState<'PUBLIC' | 'CONNECTIONS' | 'ONLY_ME'>('PUBLIC');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  // Edit Post state
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editAudience, setEditAudience] = useState<'PUBLIC' | 'CONNECTIONS' | 'ONLY_ME'>('PUBLIC');
  const [isEditPostOpen, setIsEditPostOpen] = useState(false);

  // Comments state
  const [activePostCommentsId, setActivePostCommentsId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');

  // Upload loading overlay state
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingText, setUploadingText] = useState('Uploading image...');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const fetchAllUsers = async () => {
    try {
      const res = await api.get('/user/all');
      setAllUsers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch all users:', err);
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

  // Fetch viewing user profile when viewingUserId changes
  useEffect(() => {
    if (viewingUserId && viewingUserId !== currentUser?.id) {
      fetchTargetUserProfile(viewingUserId);
    } else {
      setViewingUserData(null);
      setIsViewingUserLocked(false);
    }
  }, [viewingUserId]);

  const fetchTargetUserProfile = async (targetId: string) => {
    setLoadingViewingUser(true);
    try {
      const res = await api.get(`/posts/user/${targetId}`);
      if (res.data.success) {
        setViewingUserData(res.data.data.user);
        setIsViewingUserLocked(res.data.data.isLockedForViewer);
        setIsViewingUserFriend(res.data.data.isFriend);
      }
    } catch (err) {
      console.error('Failed to fetch target user profile:', err);
    } finally {
      setLoadingViewingUser(false);
    }
  };

  const handleOpenUserProfile = (userId: string) => {
    setViewingUserId(userId);
    setActiveSubTab('profile');
    setProfileTab('about');
  };

  const handleSendRequest = async (receiverId: string) => {
    try {
      await api.post('/connections/request', { receiverId });
      toast.success('Connection request sent successfully!');
      fetchConnections();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  const handleRespondRequest = async (connectionId: string, status: 'accepted' | 'rejected') => {
    try {
      await api.put(`/connections/respond/${connectionId}`, { status });
      fetchConnections();
      onRefreshConversations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to respond');
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this connection?')) return;
    try {
      await api.delete(`/connections/${connectionId}`);
      fetchConnections();
      onRefreshConversations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to disconnect');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() && !postMediaUrl.trim()) return;
    try {
      setIsUploading(true);
      setUploadingText('Publishing post...');
      await api.post('/posts', {
        content: postContent,
        mediaUrl: postMediaUrl.trim() || null,
        audience: postAudience
      });
      setPostContent('');
      setPostMediaUrl('');
      setPostAudience('PUBLIC');
      setIsCreatePostOpen(false);
      await fetchPosts();
    } catch (err: any) {
      toast.error('Failed to publish post');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdatePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    try {
      setIsUploading(true);
      setUploadingText('Updating post...');
      await api.put(`/posts/${editingPost.id}`, {
        content: editContent,
        audience: editAudience
      });
      setIsEditPostOpen(false);
      setEditingPost(null);
      await fetchPosts();
      if (viewingUserId) {
        fetchTargetUserProfile(viewingUserId);
      }
    } catch (err: any) {
      toast.error('Failed to update post');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      fetchPosts();
      if (viewingUserId) {
        fetchTargetUserProfile(viewingUserId);
      }
    } catch (err: any) {
      toast.error('Failed to delete post');
    }
  };

  const handleChangeAudience = async (postId: string, audience: 'PUBLIC' | 'CONNECTIONS' | 'ONLY_ME') => {
    try {
      await api.put(`/posts/${postId}`, { audience });
      fetchPosts();
      if (viewingUserId) {
        fetchTargetUserProfile(viewingUserId);
      }
    } catch (err) {
      console.error('Failed to change audience:', err);
    }
  };

  const handleCreateStory = async () => {
    const mediaUrl = prompt('Enter image URL to create a story:');
    if (!mediaUrl || !mediaUrl.trim()) return;
    try {
      await api.post('/stories', { mediaUrl: mediaUrl.trim() });
      fetchStories();
    } catch (err: any) {
      toast.error('Failed to share story');
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
      toast.error('Failed to add comment');
    }
  };

  const handleMediaUpload = async (file: File, type: 'avatar' | 'cover') => {
    if (!currentUser) return;
    try {
      setIsUploading(true);
      setUploadingText(`Uploading ${type === 'avatar' ? 'profile picture' : 'cover photo'}...`);
      await updateProfile({
        name: currentUser.name,
        email: currentUser.email,
        avatarFile: type === 'avatar' ? file : null,
        coverFile: type === 'cover' ? file : null
      });
      await fetchPosts();
      toast.success(`${type === 'avatar' ? 'Profile picture' : 'Cover photo'} updated successfully!`);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to upload image';
      toast.error(`Upload Error: ${errMsg}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleProfileLock = async () => {
    if (!currentUser) return;
    const nextLocked = !currentUser.isLocked;
    try {
      setIsUploading(true);
      setUploadingText(nextLocked ? 'Locking your profile...' : 'Unlocking your profile...');
      await updateProfile({
        name: currentUser.name,
        email: currentUser.email,
        isLocked: nextLocked
      });
      toast.success(nextLocked 
        ? '🔒 Profile locked successfully! Non-connections can only see your avatar and cover photo.' 
        : '🔓 Profile unlocked successfully! Everyone can view your public profile.');
    } catch (err) {
      toast.error('Failed to update profile lock status');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredFriends = friends.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Determine active profile user data
  const isViewingSelf = !viewingUserId || viewingUserId === currentUser?.id;
  const activeProfileUser = isViewingSelf ? currentUser : viewingUserData;

  // Render Post Card Helper
  const renderPostCard = (post: Post) => {
    const isAuthor = post.author.id === currentUser?.id;
    return (
      <Card key={post.id} className="shadow-2xs border border-[#ecd8bf]/60 dark:border-border bg-[#faf6f0] dark:bg-card rounded-2xl text-[#0b4d3a] dark:text-card-foreground overflow-hidden animate-fade-in">
        <CardContent className="p-5 space-y-4">
          
          {/* Post Header */}
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => handleOpenUserProfile(post.author.id)}
            >
              <Avatar className="h-10 w-10 border border-[#ecd8bf] dark:border-border shadow-xs group-hover:scale-105 transition-transform">
                <AvatarImage src={post.author.avatarUrl || undefined} />
                <AvatarFallback className="font-bold bg-[#0b4d3a]/10 dark:bg-muted text-[#0b4d3a] dark:text-foreground">
                  {post.author.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-black text-[#0b4d3a] dark:text-foreground group-hover:underline">
                    {post.author.name}
                  </h4>
                  {post.postType === 'PROFILE_PICTURE' && (
                    <span className="text-[10px] text-muted-foreground font-semibold">updated profile picture</span>
                  )}
                  {post.postType === 'COVER_PHOTO' && (
                    <span className="text-[10px] text-muted-foreground font-semibold">updated cover photo</span>
                  )}
                </div>
                <p className="text-[9px] text-[#8f7d6a] dark:text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span> • 
                  {post.audience === 'ONLY_ME' ? (
                    <span className="flex items-center gap-0.5 text-muted-foreground"><Lock className="h-2.5 w-2.5" /> Only me</span>
                  ) : post.audience === 'CONNECTIONS' ? (
                    <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold"><Users className="h-2.5 w-2.5" /> Connections</span>
                  ) : (
                    <span className="flex items-center gap-0.5"><Globe className="h-2.5 w-2.5" /> Public</span>
                  )}
                </p>
              </div>
            </div>

            {/* Post Options Menu (Right side button) */}
            {isAuthor && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-[#ebdccb] dark:hover:bg-muted text-[#8f7d6a] dark:text-muted-foreground cursor-pointer" />
                  }
                >
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl border border-border bg-card shadow-lg p-1.5 text-foreground z-50">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Post Options</DropdownMenuLabel>
                    
                    <DropdownMenuItem 
                      onClick={() => {
                        setEditingPost(post);
                        setEditContent(post.content);
                        setEditAudience(post.audience || 'PUBLIC');
                        setIsEditPostOpen(true);
                      }}
                      className="flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold hover:bg-muted cursor-pointer transition-colors"
                    >
                      <Edit3 className="h-4 w-4 text-muted-foreground" />
                      <span>Edit Post</span>
                    </DropdownMenuItem>

                    {/* Audience Submenu */}
                    <div className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground border-t border-border/40 mt-1 pt-1">
                      Audience
                    </div>
                    <DropdownMenuItem 
                      onClick={() => handleChangeAudience(post.id, 'PUBLIC')}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${post.audience === 'PUBLIC' ? 'text-orange-600 font-black' : ''}`}
                    >
                      <div className="flex items-center space-x-2">
                        <Globe className="h-3.5 w-3.5" />
                        <span>Public</span>
                      </div>
                      {post.audience === 'PUBLIC' && <Check className="h-3.5 w-3.5" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleChangeAudience(post.id, 'CONNECTIONS')}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${post.audience === 'CONNECTIONS' ? 'text-orange-600 font-black' : ''}`}
                    >
                      <div className="flex items-center space-x-2">
                        <Users className="h-3.5 w-3.5" />
                        <span>Connections</span>
                      </div>
                      {post.audience === 'CONNECTIONS' && <Check className="h-3.5 w-3.5" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleChangeAudience(post.id, 'ONLY_ME')}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${post.audience === 'ONLY_ME' ? 'text-orange-600 font-black' : ''}`}
                    >
                      <div className="flex items-center space-x-2">
                        <Lock className="h-3.5 w-3.5" />
                        <span>Only Me</span>
                      </div>
                      {post.audience === 'ONLY_ME' && <Check className="h-3.5 w-3.5" />}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-border/60 my-1" />
                    
                    <DropdownMenuItem 
                      onClick={() => handleDeletePost(post.id)}
                      className="flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Post</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Post Content */}
          {post.content && (
            <p className="text-xs text-[#0b4d3a] dark:text-foreground leading-relaxed font-semibold">{post.content}</p>
          )}

          {/* Post Attachment */}
          {post.mediaUrl && (
            <div className="relative rounded-xl overflow-hidden bg-[#f3eae0]/30 dark:bg-[#121212] border border-[#ecd8bf]/60 dark:border-border group">
              <img src={post.mediaUrl} alt="Attachment" className="w-full h-auto object-cover max-h-[360px]" />
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

          {/* Comments Tray */}
          {activePostCommentsId === post.id && (
            <div className="border-t border-[#ecd8bf]/60 dark:border-border pt-4 mt-2 space-y-4">
              {post.comments && post.comments.length > 0 && (
                <div className="space-y-2.5 max-h-56 overflow-y-auto no-scrollbar">
                  {post.comments.map((c) => (
                    <div key={c.id} className="flex items-start space-x-2.5 bg-[#f3eae0]/40 dark:bg-[#151515] p-2.5 rounded-xl border border-[#ecd8bf]/40 dark:border-border/40">
                      <Avatar className="h-6 w-6 border border-border">
                        <AvatarImage src={c.user.avatarUrl} />
                        <AvatarFallback className="text-[9px] font-bold">{c.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-black block text-[#0b4d3a] dark:text-foreground">{c.user.name}</span>
                        <p className="text-xs text-[#0b4d3a] dark:text-foreground/90 font-medium">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

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
    );
  };

  const renderProfileTabContent = () => {
    // If viewing a locked profile and user is not a friend & not self
    if (!isViewingSelf && isViewingUserLocked) {
      return (
        <div className="bg-[#faf6f0] dark:bg-card border border-[#ecd8bf] dark:border-border rounded-2xl p-8 text-center space-y-4 shadow-3xs animate-fade-in">
          <div className="h-16 w-16 bg-orange-600/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 rounded-full flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-black text-[#0b4d3a] dark:text-foreground">
              {activeProfileUser?.name}&apos;s Profile is Locked
            </h3>
            <p className="text-xs text-[#8f7d6a] dark:text-muted-foreground leading-relaxed">
              Only connections/friends can see full posts, photos, and personal details. Send a connection request to connect with this user.
            </p>
          </div>
          <div className="pt-2">
            <Button
              onClick={() => handleSendRequest(activeProfileUser?.id)}
              className="h-9 px-6 bg-[#0b4d3a] hover:bg-[#08362b] dark:bg-primary dark:hover:bg-primary/80 text-white font-bold text-xs rounded-xl shadow-3xs cursor-pointer"
            >
              <UserPlus className="h-4 w-4 mr-2" /> Connect
            </Button>
          </div>
        </div>
      );
    }

    if (profileTab === 'about') {
      const userPosts = posts.filter(p => p.author.id === activeProfileUser?.id);
      return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in text-[#0b4d3a] dark:text-foreground">
          {/* Left Column (Intro) */}
          <div className="md:col-span-5 space-y-6">
            <Card className="shadow-3xs border border-[#ecd8bf]/60 dark:border-border/60 bg-[#faf6f0] dark:bg-card rounded-2xl overflow-hidden">
              <CardContent className="p-5 space-y-3.5">
                <h3 className="text-sm font-black uppercase tracking-wider text-[#8f7d6a] dark:text-muted-foreground">Intro</h3>
                {activeProfileUser?.bio ? (
                  <p className="text-xs font-bold leading-relaxed text-center py-2 italic border-b border-[#ecd8bf]/40 dark:border-border/40 text-[#0b4d3a] dark:text-foreground">
                    &ldquo;{activeProfileUser.bio}&rdquo;
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground/60 text-center py-2 border-b border-[#ecd8bf]/40 dark:border-border/40 italic">
                    No bio status set
                  </p>
                )}
                <div className="space-y-3 text-xs font-semibold">
                  {activeProfileUser?.workplace && (
                    <div className="flex items-start space-x-2.5">
                      <span className="text-[#8f7d6a] dark:text-muted-foreground flex-shrink-0">🏢</span>
                      <span>{activeProfileUser.workTitle || 'Works'} at <span className="font-extrabold">{activeProfileUser.workplace}</span></span>
                    </div>
                  )}
                  {activeProfileUser?.educationSchool && (
                    <div className="flex items-start space-x-2.5">
                      <span className="text-[#8f7d6a] dark:text-muted-foreground flex-shrink-0">🎓</span>
                      <span>Studied <span className="font-extrabold">{activeProfileUser.educationDept || 'Courses'}</span> at <span className="font-extrabold">{activeProfileUser.educationSchool}</span></span>
                    </div>
                  )}
                  {activeProfileUser?.livesIn && (
                    <div className="flex items-start space-x-2.5">
                      <span className="text-[#8f7d6a] dark:text-muted-foreground flex-shrink-0">📍</span>
                      <span>Lives in <span className="font-extrabold">{activeProfileUser.livesIn}</span></span>
                    </div>
                  )}
                  {activeProfileUser?.fromCity && (
                    <div className="flex items-start space-x-2.5">
                      <span className="text-[#8f7d6a] dark:text-muted-foreground flex-shrink-0">🏠</span>
                      <span>From <span className="font-extrabold">{activeProfileUser.fromCity}</span></span>
                    </div>
                  )}
                  {activeProfileUser?.gender && (
                    <div className="flex items-start space-x-2.5">
                      <span className="text-[#8f7d6a] dark:text-muted-foreground flex-shrink-0">👤</span>
                      <span>Gender: <span className="font-extrabold">{activeProfileUser.gender}</span></span>
                    </div>
                  )}
                </div>
                {isViewingSelf && (
                  <Button 
                    onClick={onOpenProfile} 
                    variant="outline" 
                    className="w-full text-xs font-bold border-[#ecd8bf] dark:border-border bg-[#f3eae0] hover:bg-[#ebdccb] dark:bg-muted dark:hover:bg-muted/80 text-[#0b4d3a] dark:text-foreground cursor-pointer shadow-3xs"
                  >
                    Edit Details
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column (User Posts Feed) */}
          <div className="md:col-span-7 space-y-6">
            {isViewingSelf && (
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
            )}

            {/* Filtered User Posts list */}
            <div className="space-y-5">
              {userPosts.length > 0 ? (
                userPosts.map(renderPostCard)
              ) : (
                <div className="text-center py-12 bg-[#faf6f0] dark:bg-card border border-[#ecd8bf] dark:border-border rounded-2xl shadow-3xs">
                  <p className="text-xs text-[#8f7d6a] dark:text-muted-foreground font-bold">No posts published yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (profileTab === 'photos') {
      const userPhotos = posts
        .filter(p => p.author.id === activeProfileUser?.id && p.mediaUrl)
        .map(p => p.mediaUrl as string);

      if (activeProfileUser?.avatarUrl) userPhotos.unshift(activeProfileUser.avatarUrl);
      if (activeProfileUser?.coverUrl) userPhotos.unshift(activeProfileUser.coverUrl);

      const uniquePhotos = Array.from(new Set(userPhotos));

      return (
        <div className="bg-[#faf6f0] dark:bg-card border border-[#ecd8bf]/60 dark:border-border rounded-2xl p-6 shadow-3xs animate-fade-in text-[#0b4d3a] dark:text-foreground">
          <h3 className="text-sm font-black uppercase tracking-wider text-[#8f7d6a] dark:text-muted-foreground mb-4">Photos</h3>
          {uniquePhotos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {uniquePhotos.map((url, idx) => (
                <div 
                  key={idx} 
                  className="aspect-square rounded-xl overflow-hidden border border-[#ecd8bf]/40 dark:border-border/40 bg-[#f3eae0] dark:bg-muted cursor-pointer hover:opacity-90 transition-opacity" 
                  onClick={() => window.open(url, '_blank')}
                >
                  <img src={url} alt="User Upload" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[#8f7d6a] dark:text-muted-foreground italic text-xs font-semibold">
              No photos uploaded yet.
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-[#faf6f0] dark:bg-card border border-[#ecd8bf]/60 dark:border-border rounded-2xl p-6 shadow-3xs animate-fade-in text-[#0b4d3a] dark:text-foreground">
        <h3 className="text-sm font-black uppercase tracking-wider text-[#8f7d6a] dark:text-muted-foreground mb-4">Connections</h3>
        {friends.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {friends.map((friend) => (
              <Card key={friend.id} className="shadow-3xs border border-[#ecd8bf]/40 dark:border-border bg-[#faf6f0]/60 dark:bg-card/45 rounded-2xl p-4 flex items-center justify-between hover:border-[#0b4d3a]/30 dark:hover:border-primary/30 transition-all group">
                <div 
                  className="flex items-center space-x-3.5 min-w-0 cursor-pointer"
                  onClick={() => handleOpenUserProfile(friend.id)}
                >
                  <div className="h-12 w-12 rounded-xl overflow-hidden bg-[#f3eae0] dark:bg-muted relative flex-shrink-0 border border-[#ecd8bf]/30 dark:border-border/40">
                    {friend.avatarUrl ? (
                      <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-extrabold text-sm bg-[#0b4d3a]/5 dark:bg-background text-[#0b4d3a] dark:text-foreground">
                        {friend.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="font-extrabold text-xs text-[#0b4d3a] dark:text-foreground truncate block hover:underline">{friend.name}</span>
                    <span className="text-[9px] text-[#8f7d6a] dark:text-muted-foreground block truncate">Connected</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await api.post('/conversations/create', {
                        participantIds: [friend.id],
                        isGroupChat: false
                      });
                      onSelectConversation(res.data.data);
                    } catch (e) {
                      toast.error('Failed to launch chat window');
                    }
                  }}
                  className="h-8 text-[11px] bg-[#0b4d3a] hover:bg-[#08362b] text-white font-bold rounded-xl cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <span className="text-xs text-[#8f7d6a] dark:text-muted-foreground font-semibold">No connections found</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f7f0e6] dark:bg-background text-foreground transition-all">
      
      {/* 🌟 Elegant Uploading / Processing Overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center animate-fade-in">
          <div className="bg-background dark:bg-card border border-border/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center space-y-4 max-w-xs text-center">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
              <Sparkles className="h-5 w-5 text-orange-500 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-foreground">{uploadingText}</h4>
              <p className="text-[11px] text-muted-foreground font-medium">Please wait a moment while we process your request.</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Navbar */}
      <header className="h-16 border-b border-[#ecd8bf]/60 dark:border-border px-6 flex items-center justify-between bg-[#faf6f0] dark:bg-card flex-shrink-0 shadow-3xs">
        {/* Left: Logo & Search */}
        <div className="flex items-center space-x-4">
          <div 
            onClick={() => {
              setViewingUserId(null);
              setActiveSubTab('feed');
            }} 
            className="flex items-center space-x-2.5 cursor-pointer select-none"
          >
            <div className="h-10 w-10 rounded-xl bg-orange-600 dark:bg-primary flex items-center justify-center text-white font-black text-lg shadow-sm">
              💬
            </div>
            <span className="font-extrabold text-base tracking-tight text-[#0b4d3a] dark:text-foreground hidden sm:inline-block">
              YourChat Social
            </span>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-md mx-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8f7d6a] dark:text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search people, connections..." 
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
            className="h-10 w-10 rounded-full bg-[#f3eae0] dark:bg-muted hover:bg-[#ebdccb] dark:hover:bg-muted/80 text-[#0b4d3a] dark:text-foreground cursor-pointer relative"
            onClick={onSwitchToChats}
            title="Messages"
          >
            <MessageSquare className="h-4 w-4" />
            {unreadConversationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-orange-600 text-white text-[9px] font-black flex items-center justify-center shadow-sm">
                {unreadConversationCount > 99 ? '99+' : unreadConversationCount}
              </span>
            )}
          </Button>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-full bg-[#f3eae0] dark:bg-muted hover:bg-[#ebdccb] dark:hover:bg-muted/80 text-[#0b4d3a] dark:text-foreground cursor-pointer relative outline-none"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {pendingIncoming.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-orange-600 text-white text-[9px] font-black flex items-center justify-center shadow-sm">
                    {pendingIncoming.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl border border-border bg-card shadow-lg p-2 text-foreground z-50">
              <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-border/60">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Notifications</span>
              </div>
              <div className="py-6 text-center">
                <Bell className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground font-bold">No new notifications</p>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-[#f3eae0] dark:bg-muted hover:bg-[#ebdccb] dark:hover:bg-muted/80 text-[#0b4d3a] dark:text-foreground cursor-pointer"
            onClick={() => {
              setActiveSubTab('connections');
              setConnectionsTab('requests');
            }}
            title="Connection Requests"
          >
            <UserPlus className="h-4 w-4" />
          </Button>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              render={
                <button 
                  className="flex items-center space-x-1.5 bg-[#f3eae0] dark:bg-muted hover:bg-[#ebdccb] dark:hover:bg-muted/85 py-1 pl-1 pr-2 rounded-full cursor-pointer transition-all border border-[#ecd8bf]/40 dark:border-border outline-none"
                />
              }
            >
              <Avatar className="h-8 w-8 border border-[#ecd8bf] dark:border-border">
                <AvatarImage src={currentUser?.avatarUrl} />
                <AvatarFallback className="bg-[#0b4d3a]/15 text-[#0b4d3a] dark:bg-background dark:text-foreground font-bold text-xs">
                  {currentUser?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3.5 w-3.5 text-[#8f7d6a] dark:text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl border border-border bg-card shadow-lg p-1.5 text-foreground z-50">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2.5 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Account Actions</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/60 my-1" />
                
                <DropdownMenuItem 
                  onClick={() => {
                    setViewingUserId(null);
                    setActiveSubTab('profile');
                  }}
                  className="flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold hover:bg-muted cursor-pointer transition-colors"
                >
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span>View Profile</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={onOpenProfile}
                  className="flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold hover:bg-muted cursor-pointer transition-colors"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Settings</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-border/60 my-1" />
                
                <DropdownMenuItem 
                  onClick={logout}
                  className="flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar Column */}
        <aside className="w-64 border-r border-[#ecd8bf]/60 dark:border-border p-4 flex flex-col justify-between flex-shrink-0 bg-[#faf6f0] dark:bg-card">
          <div className="space-y-2.5 flex-1">
            <button 
              onClick={() => {
                setViewingUserId(null);
                setActiveSubTab('feed');
              }}
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
              onClick={() => {
                setViewingUserId(null);
                setActiveSubTab('profile');
              }}
              className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all duration-150 text-left font-bold text-sm cursor-pointer ${
                activeSubTab === 'profile' && isViewingSelf
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
          <div className={`${activeSubTab === 'profile' ? 'max-w-[860px]' : 'max-w-[640px]'} mx-auto space-y-6 pb-12`}>
            
            {/* Search Results */}
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
                          <div 
                            className="flex items-center space-x-3.5 min-w-0 cursor-pointer"
                            onClick={() => {
                              handleOpenUserProfile(u.id);
                              setSearchQuery('');
                            }}
                          >
                            <Avatar className="h-11 w-11 border border-[#ecd8bf] dark:border-border">
                              <AvatarImage src={u.avatarUrl || undefined} />
                              <AvatarFallback className="bg-[#0b4d3a]/10 dark:bg-background text-[#0b4d3a] dark:text-foreground text-sm font-bold">{u.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-extrabold text-sm text-[#0b4d3a] dark:text-foreground block truncate hover:underline">{u.name}</span>
                                {u.isLocked && (
                                  <Lock className="h-3 w-3 text-orange-600 dark:text-orange-400" title="Profile is locked" />
                                )}
                              </div>
                              {u.nickname && <span className="text-[10px] text-[#8f7d6a] dark:text-muted-foreground block truncate">({u.nickname})</span>}
                              {u.bio && <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[280px]">{u.bio}</p>}
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
                                    toast.error('Failed to open chat');
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
                    <div className="text-center py-12 bg-[#faf6f0] dark:bg-card border border-[#ecd8bf] dark:border-border rounded-2xl shadow-3xs">
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
                    posts.map(renderPostCard)
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
                          <Card key={friend.id} className="group overflow-hidden border border-[#ecd8bf]/60 dark:border-border bg-gradient-to-b from-white to-[#faf6f0]/30 dark:from-card dark:to-[#181818]/25 rounded-2xl transition-all duration-300 hover:shadow-md hover:border-[#0b4d3a]/30 dark:hover:border-primary/30 flex flex-col p-4">
                            <div 
                              className="flex items-center space-x-3.5 pb-3 border-b border-dashed border-[#ecd8bf]/60 dark:border-border/60 cursor-pointer"
                              onClick={() => handleOpenUserProfile(friend.id)}
                            >
                              <div className="relative">
                                <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white dark:border-muted shadow-sm flex-shrink-0">
                                  {friend.avatarUrl ? (
                                    <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center font-extrabold text-sm bg-primary/10 text-primary dark:bg-muted dark:text-foreground">
                                      {friend.name.charAt(0)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-black text-sm text-[#0b4d3a] dark:text-foreground truncate block hover:underline">{friend.name}</span>
                                  {friend.isLocked && (
                                    <Lock className="h-3 w-3 text-orange-600 dark:text-orange-400" title="Locked profile" />
                                  )}
                                </div>
                                <span className="text-[10px] text-muted-foreground mt-0.5 block flex items-center gap-1 font-semibold">
                                  ✓ Connected
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-3 gap-2 mt-auto">
                              <Button 
                                size="sm" 
                                className="flex-1 h-8 text-[11px] bg-[#0b4d3a] hover:bg-[#08362b] dark:bg-primary dark:hover:bg-primary/80 text-white font-extrabold rounded-xl cursor-pointer flex items-center justify-center gap-1 shadow-3xs"
                                onClick={async () => {
                                  try {
                                    const res = await api.post('/conversations/create', {
                                      participantIds: [friend.id],
                                      isGroupChat: false
                                    });
                                    onSelectConversation(res.data.data);
                                  } catch (e) {
                                    toast.error('Failed to launch chat window');
                                  }
                                }}
                              >
                                <MessageSquare className="h-3 w-3" />
                                Message
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0 border-[#ecd8bf]/60 dark:border-border text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl cursor-pointer flex items-center justify-center shadow-3xs"
                                onClick={() => handleRemoveConnection(friend.connectionId)}
                                title="Remove Connection"
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
                          <Card key={req.id} className="group overflow-hidden border border-[#ecd8bf]/60 dark:border-border bg-gradient-to-b from-white to-[#faf6f0]/30 dark:from-card dark:to-[#181818]/25 rounded-2xl transition-all duration-300 hover:shadow-md hover:border-[#0b4d3a]/30 dark:hover:border-primary/30 flex flex-col p-4">
                            <div 
                              className="flex items-center space-x-3.5 pb-3 border-b border-dashed border-[#ecd8bf]/60 dark:border-border/60 cursor-pointer"
                              onClick={() => handleOpenUserProfile(req.sender.id)}
                            >
                              <div className="relative">
                                <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white dark:border-muted shadow-sm flex-shrink-0">
                                  {req.sender.avatarUrl ? (
                                    <img src={req.sender.avatarUrl} alt={req.sender.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center font-extrabold text-sm bg-primary/10 text-primary dark:bg-muted dark:text-foreground">
                                      {req.sender.name.charAt(0)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-black text-sm text-[#0b4d3a] dark:text-foreground truncate block hover:underline">{req.sender.name}</span>
                                <span className="text-[10px] text-[#8f7d6a] dark:text-muted-foreground mt-0.5 block">Sent you a request</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-3 gap-2 mt-auto">
                              <Button 
                                size="sm" 
                                className="flex-1 h-8 text-[11px] bg-emerald-600 hover:bg-emerald-700 dark:bg-primary dark:hover:bg-primary/80 text-white font-extrabold rounded-xl cursor-pointer flex items-center justify-center gap-1 shadow-3xs"
                                onClick={() => handleRespondRequest(req.id, 'accepted')}
                              >
                                Confirm
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 h-8 text-[11px] border-[#ecd8bf]/60 dark:border-border bg-[#f3eae0] hover:bg-[#ebdccb] dark:bg-muted dark:hover:bg-muted/80 text-[#0b4d3a] dark:text-foreground font-extrabold rounded-xl cursor-pointer flex items-center justify-center shadow-3xs"
                                onClick={() => handleRespondRequest(req.id, 'rejected')}
                              >
                                Delete
                              </Button>
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
              /* 🌟 Profile View (Self or Other User) */
              <div className="space-y-6 animate-fade-in text-[#0b4d3a] dark:text-foreground">
                
                {/* Back button if viewing another user's profile */}
                {!isViewingSelf && (
                  <button 
                    onClick={() => {
                      setViewingUserId(null);
                      setActiveSubTab('feed');
                    }}
                    className="flex items-center space-x-2 text-xs font-bold text-[#8f7d6a] dark:text-muted-foreground hover:text-[#0b4d3a] dark:hover:text-foreground transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to News Feed</span>
                  </button>
                )}

                {/* 1. Profile Header Box (Cover & Avatar + Perfectly Aligned Name Row) */}
                <div className="bg-[#faf6f0] dark:bg-card border border-[#ecd8bf] dark:border-border rounded-2xl overflow-hidden shadow-3xs relative">
                  
                  {/* Cover Photo */}
                  <div className="relative h-56 bg-linear-to-r from-teal-800 to-[#0b4d3a] dark:from-indigo-950 dark:to-teal-950 group">
                    {activeProfileUser?.coverUrl ? (
                      <img 
                        src={activeProfileUser.coverUrl} 
                        alt="Cover" 
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setSelectedImage(activeProfileUser.coverUrl || null)}
                      />
                    ) : (
                      <div className="w-full h-full opacity-40 bg-radial-to-br from-emerald-500/20 via-transparent to-transparent" />
                    )}
                    
                    {/* Cover edit for owner */}
                    {isViewingSelf && (
                      <label className="absolute bottom-3 right-3 h-8 px-3.5 bg-black/60 hover:bg-black/80 text-white rounded-lg flex items-center justify-center space-x-1.5 cursor-pointer text-xs font-bold border border-white/20 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-3xs shadow-sm">
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
                    )}
                  </div>

                  {/* 🎯 Perfectly Aligned Profile Identity Row (Avatar + Name beside each other!) */}
                  <div className="px-6 pb-6 pt-3 relative">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                      
                      {/* Avatar and Name Group */}
                      <div className="flex flex-col md:flex-row items-center md:items-end gap-5 -mt-16 md:-mt-14">
                        
                        {/* Avatar */}
                        <div className="relative group">
                          <Avatar 
                            className={`h-32 w-32 border-4 border-[#faf6f0] dark:border-card shadow-lg ring-1 ring-black/5 ${activeProfileUser?.avatarUrl ? 'cursor-pointer' : ''}`}
                            onClick={() => activeProfileUser?.avatarUrl && setSelectedImage(activeProfileUser.avatarUrl)}
                          >
                            <AvatarImage src={activeProfileUser?.avatarUrl} />
                            <AvatarFallback className="bg-[#0b4d3a]/10 text-[#0b4d3a] dark:bg-muted dark:text-foreground text-4xl font-black">
                              {activeProfileUser?.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          
                          {/* Avatar edit camera button for owner */}
                          {isViewingSelf && (
                            <label className="absolute bottom-1 right-1 h-9 w-9 bg-orange-600 hover:bg-orange-700 dark:bg-primary dark:hover:bg-primary/90 text-white border-2 border-[#faf6f0] dark:border-card rounded-full flex items-center justify-center cursor-pointer shadow-md transition-all hover:scale-105">
                              <Camera className="h-4 w-4" />
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
                          )}
                        </div>

                        {/* 🌟 Name, Nickname, Lock Badge & Connection Counter (Right next to Avatar) */}
                        <div className="text-center md:text-left space-y-1 mb-1">
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                            <h2 className="text-2xl font-black tracking-tight text-[#0b4d3a] dark:text-foreground">
                              {activeProfileUser?.name}
                            </h2>
                            {activeProfileUser?.nickname && (
                              <span className="text-sm font-bold text-[#8f7d6a] dark:text-muted-foreground">
                                ({activeProfileUser.nickname})
                              </span>
                            )}
                            {activeProfileUser?.isLocked && (
                              <Badge className="bg-orange-600/15 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border border-orange-600/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Lock className="h-3 w-3" /> Profile Locked
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-[#8f7d6a] dark:text-muted-foreground font-bold">
                            {isViewingSelf ? `${friends.length} connections` : isViewingUserFriend ? '✓ Connected with you' : 'User'}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons on the Right Header */}
                      <div className="flex items-center justify-center md:justify-end gap-2.5 mt-2 md:mt-0 flex-shrink-0">
                        {isViewingSelf ? (
                          <>
                            <Button 
                              onClick={onOpenProfile} 
                              variant="outline" 
                              className="h-9 px-4 text-xs font-bold border-[#ecd8bf] dark:border-border bg-[#f3eae0] hover:bg-[#ebdccb] dark:bg-muted dark:hover:bg-muted/80 text-[#0b4d3a] dark:text-foreground cursor-pointer shadow-3xs"
                            >
                              <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Edit Profile
                            </Button>
                            <Button 
                              onClick={handleToggleProfileLock}
                              className={`h-9 px-4 text-xs font-black rounded-xl cursor-pointer shadow-3xs transition-all ${currentUser?.isLocked ? 'bg-zinc-800 text-white hover:bg-zinc-900' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
                            >
                              {currentUser?.isLocked ? (
                                <span className="flex items-center gap-1.5"><Unlock className="h-3.5 w-3.5" /> Unlock Profile</span>
                              ) : (
                                <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Lock Profile</span>
                              )}
                            </Button>
                          </>
                        ) : (
                          <>
                            {isViewingUserFriend ? (
                              <Button 
                                size="sm" 
                                className="h-9 px-4 text-xs bg-[#0b4d3a] hover:bg-[#08362b] dark:bg-primary text-white font-bold rounded-xl cursor-pointer shadow-3xs"
                                onClick={async () => {
                                  try {
                                    const res = await api.post('/conversations/create', {
                                      participantIds: [activeProfileUser.id],
                                      isGroupChat: false
                                    });
                                    onSelectConversation(res.data.data);
                                  } catch (e) {
                                    toast.error('Failed to launch chat window');
                                  }
                                }}
                              >
                                <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Message
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                className="h-9 px-5 text-xs bg-[#0b4d3a] hover:bg-[#08362b] dark:bg-primary text-white font-bold rounded-xl cursor-pointer shadow-3xs"
                                onClick={() => handleSendRequest(activeProfileUser.id)}
                              >
                                <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Connect
                              </Button>
                            )}
                          </>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Profile Nav tabs */}
                  <div className="flex items-center space-x-2 px-6 py-2.5 overflow-x-auto no-scrollbar bg-[#fcf9f5]/50 dark:bg-background/25 border-t border-[#ecd8bf]/30 dark:border-border/20">
                    {[
                      { id: 'about', label: 'About' },
                      { id: 'photos', label: 'Photos' },
                      { id: 'connections', label: 'Connections' }
                    ].map((tab) => (
                      <button 
                        key={tab.id}
                        onClick={() => setProfileTab(tab.id as any)}
                        className={`px-4.5 py-2 rounded-xl text-xs font-black cursor-pointer transition-all duration-150 ${profileTab === tab.id ? 'bg-[#0b4d3a] text-white dark:bg-primary dark:text-foreground shadow-3xs' : 'text-[#8f7d6a] dark:text-muted-foreground hover:bg-[#ebdccb]/45 dark:hover:bg-muted/40'}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                </div>

                {/* 2. Conditionally Render Profile Nav tab Content */}
                {renderProfileTabContent()}
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar Column */}
        <aside className="hidden lg:block w-72 border-l border-[#ecd8bf]/60 dark:border-border p-4 space-y-6 overflow-y-auto bg-[#faf6f0] dark:bg-card select-none flex-shrink-0">
          
          {/* Contacts/Connected People List */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-[#8f7d6a] dark:text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
              <span>Connections ({friends.length})</span>
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
                        toast.error('Failed to open chat window');
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
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-bold truncate block text-[#0b4d3a] dark:text-foreground">{friend.name}</span>
                        {friend.isLocked && <Lock className="h-2.5 w-2.5 text-orange-600" />}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <span className="text-[10px] text-[#8f7d6a] dark:text-muted-foreground">No connections found</span>
                </div>
              )}
            </div>
          </div>
        </aside>

      </div>

      {/* 🌟 Create Post Modal with Audience Selection */}
      <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl border border-border bg-background shadow-2xl p-0 overflow-hidden">
          {/* Header */}
          <div className="border-b border-border p-4 flex items-center justify-between bg-muted/20">
            <h3 className="font-extrabold text-sm text-[#0b4d3a] dark:text-foreground mx-auto">Create Post</h3>
          </div>

          <form onSubmit={handleCreatePost} className="p-5 space-y-4">
            
            {/* User Info & Audience Selector */}
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 border border-border shadow-sm">
                <AvatarImage src={currentUser?.avatarUrl} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">{currentUser?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <span className="font-extrabold text-xs text-[#0b4d3a] dark:text-foreground block">{currentUser?.name}</span>
                
                {/* Audience Selector Button */}
                <select
                  value={postAudience}
                  onChange={(e) => setPostAudience(e.target.value as any)}
                  className="h-6 text-[10px] font-bold bg-muted hover:bg-muted/80 text-foreground px-2.5 py-0.5 rounded-full border border-border/80 cursor-pointer focus:outline-hidden"
                >
                  <option value="PUBLIC">🌍 Public</option>
                  <option value="CONNECTIONS">👥 Connections</option>
                  <option value="ONLY_ME">🔒 Only Me</option>
                </select>
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

            {/* Add photo tray */}
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
                        setIsUploading(true);
                        setUploadingText('Uploading image to Cloudinary...');
                        const formData = new FormData();
                        formData.append('file', file);
                        const res = await api.post('/upload', formData, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        if (res.data.success) {
                          setPostMediaUrl(res.data.url);
                        }
                      } catch (err) {
                        toast.error('Failed to upload image. Please verify your Cloudinary configurations.');
                      } finally {
                        setIsUploading(false);
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

      {/* 🌟 Edit Post Modal */}
      <Dialog open={isEditPostOpen} onOpenChange={setIsEditPostOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl border border-border bg-background shadow-2xl p-0 overflow-hidden">
          <div className="border-b border-border p-4 flex items-center justify-between bg-muted/20">
            <h3 className="font-extrabold text-sm text-[#0b4d3a] dark:text-foreground mx-auto">Edit Post</h3>
          </div>

          <form onSubmit={handleUpdatePostSubmit} className="p-5 space-y-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 border border-border shadow-sm">
                <AvatarImage src={currentUser?.avatarUrl} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">{currentUser?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <span className="font-extrabold text-xs text-[#0b4d3a] dark:text-foreground block">{currentUser?.name}</span>
                <select
                  value={editAudience}
                  onChange={(e) => setEditAudience(e.target.value as any)}
                  className="h-6 text-[10px] font-bold bg-muted hover:bg-muted/80 text-foreground px-2.5 py-0.5 rounded-full border border-border/80 cursor-pointer focus:outline-hidden"
                >
                  <option value="PUBLIC">🌍 Public</option>
                  <option value="CONNECTIONS">👥 Connections</option>
                  <option value="ONLY_ME">🔒 Only Me</option>
                </select>
              </div>
            </div>

            <textarea
              placeholder="What's on your mind?"
              className="w-full text-base bg-transparent border-none placeholder:text-muted-foreground focus:outline-hidden resize-none min-h-[120px] text-[#0b4d3a] dark:text-foreground font-semibold"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              autoFocus
            />

            {editingPost?.mediaUrl && (
              <div className="relative rounded-xl overflow-hidden bg-muted/20 border border-border max-h-[200px]">
                <img src={editingPost.mediaUrl} alt="Post preview" className="w-full h-full object-cover max-h-[200px]" />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-10 bg-orange-600 hover:bg-orange-700 dark:bg-primary dark:hover:bg-primary/95 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* 🌟 Fullscreen Image Viewer Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none overflow-hidden flex items-center justify-center">
          {selectedImage && (
            <img src={selectedImage} alt="Fullscreen View" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
