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
  Gift, Users, UserCheck, UserPlus, Play, Globe 
} from 'lucide-react';

interface DashboardPortalProps {
  currentUser: User | null;
  onRefreshConversations: () => void;
  onSelectConversation: (conversation: Conversation) => void;
}

export default function DashboardPortal({ currentUser, onRefreshConversations, onSelectConversation }: DashboardPortalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'requests' | 'friends'>('feed');
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

  const requestsToRender = pendingIncoming.map(r => ({
    id: r.id,
    sender: r.sender,
    mutualCount: Math.floor(Math.random() * 5) + 1,
    isReal: true
  }));

  const friendsToRender = friends.map(f => ({
    id: f.id,
    name: f.name,
    avatarUrl: f.avatarUrl,
    status: 'Connected',
    isReal: true,
    connectionId: f.connectionId
  }));

  return (
    <div className="flex-1 flex overflow-hidden h-full bg-background text-foreground font-sans-active">
      {/* Middle Feed Column */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 bg-muted/10">
        <div className="max-w-[620px] mx-auto space-y-6 pb-12">
          
          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-border bg-card rounded-xl p-1 shadow-2xs">
            <Button
              variant="ghost"
              className={`flex-1 h-9 rounded-lg text-xs font-bold gap-2 cursor-pointer ${activeSubTab === 'feed' ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'text-muted-foreground hover:bg-muted/40'}`}
              onClick={() => setActiveSubTab('feed')}
            >
              <MessageSquare className="h-4 w-4" /> News Feed
            </Button>
            <Button
              variant="ghost"
              className={`flex-1 h-9 rounded-lg text-xs font-bold gap-2 relative cursor-pointer ${activeSubTab === 'requests' ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'text-muted-foreground hover:bg-muted/40'}`}
              onClick={() => setActiveSubTab('requests')}
            >
              <UserPlus className="h-4 w-4" /> Connection Requests
              {pendingIncoming.length > 0 && (
                <Badge className="absolute top-1 right-2 bg-primary text-primary-foreground text-[9px] px-1 h-4 min-w-[16px] flex items-center justify-center rounded-full font-bold">
                  {pendingIncoming.length}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              className={`flex-1 h-9 rounded-lg text-xs font-bold gap-2 cursor-pointer ${activeSubTab === 'friends' ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'text-muted-foreground hover:bg-muted/40'}`}
              onClick={() => setActiveSubTab('friends')}
            >
              <Users className="h-4 w-4" /> Connected People
            </Button>
          </div>

          {activeSubTab === 'feed' ? (
            <>
              {/* Stories Carousel */}
              <div className="flex space-x-2.5 overflow-x-auto pb-1 no-scrollbar select-none">
                {/* Create Story Card */}
                <div 
                  onClick={handleCreateStory}
                  className="w-[110px] h-[175px] bg-card border border-border/60 rounded-xl overflow-hidden shadow-2xs relative flex flex-col flex-shrink-0 cursor-pointer group hover:border-primary/30 transition-all"
                >
                  <div className="h-[120px] bg-muted relative overflow-hidden">
                    {currentUser?.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold bg-primary/5 text-primary">
                        {currentUser?.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-end p-2 relative bg-card">
                    <div className="absolute top-[-16px] h-8 w-8 rounded-full bg-primary border-4 border-card flex items-center justify-center text-white shadow-md">
                      <span className="font-bold text-sm">+</span>
                    </div>
                    <span className="text-[10px] font-bold text-center mt-1.5 truncate w-full">Create story</span>
                  </div>
                </div>

                {/* Render Stories */}
                {storiesList.map(story => (
                  <div key={story.id} className="w-[110px] h-[175px] rounded-xl overflow-hidden shadow-2xs relative flex-shrink-0 cursor-pointer group border border-border/20">
                    <img src={story.bg} alt={story.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                    <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/80"></div>
                    <Avatar className="absolute top-2 left-2 h-7 w-7 border-2 border-primary shadow-md">
                      <AvatarImage src={story.avatar || undefined} />
                      <AvatarFallback className="text-[9px]">{story.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-2 left-2 right-2 text-[10px] font-bold text-white truncate">{story.name}</span>
                  </div>
                ))}
              </div>

              {/* Create Post Box */}
              <Card className="shadow-2xs border-border/50 bg-card overflow-hidden">
                <CardContent className="p-4 space-y-3.5">
                  <form onSubmit={handleCreatePost} className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarImage src={currentUser?.avatarUrl} />
                        <AvatarFallback className="bg-primary/5 text-primary font-bold">{currentUser?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <input 
                        type="text" 
                        placeholder={`What's on your mind, ${currentUser?.name || 'User'}?`}
                        className="flex-1 h-9 bg-muted/40 rounded-full border border-transparent px-4 text-xs focus:outline-hidden focus:border-primary/40 focus:bg-card transition-all"
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                      />
                    </div>

                    {showMediaInput && (
                      <input 
                        type="text" 
                        placeholder="Paste photo or media URL here..."
                        className="w-full h-8 bg-muted/40 rounded-lg border border-transparent px-3 text-[11px] focus:outline-hidden focus:border-primary/40 focus:bg-card transition-all"
                        value={postMediaUrl}
                        onChange={(e) => setPostMediaUrl(e.target.value)}
                      />
                    )}

                    <div className="border-t border-border/60 pt-3 flex items-center justify-between text-muted-foreground text-xs px-1">
                      <button 
                        type="button"
                        onClick={() => setShowMediaInput(!showMediaInput)}
                        className={`flex items-center space-x-2 hover:bg-muted/40 px-2 py-1.5 rounded-lg cursor-pointer transition-colors font-semibold ${showMediaInput ? 'text-primary' : 'text-green-500'}`}
                      >
                        <ImageIcon className="h-4 w-4" /> <span>Photo/video</span>
                      </button>
                      <button 
                        type="submit"
                        className="h-8 px-4 text-[10px] bg-primary hover:bg-primary/95 text-white font-bold rounded-lg cursor-pointer"
                      >
                        Publish Post
                      </button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Posts Feed */}
              <div className="space-y-4">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <Card key={post.id} className="shadow-2xs border-border/50 bg-card overflow-hidden animate-fade-in">
                      <CardContent className="p-4 space-y-3">
                        {/* Post Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            <Avatar className="h-9 w-9 border">
                              <AvatarImage src={post.author.avatarUrl || undefined} />
                              <AvatarFallback className="font-bold bg-muted">{post.author.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="text-xs font-bold text-foreground">{post.author.name}</h4>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                <span>{new Date(post.createdAt).toLocaleDateString()}</span> • <Globe className="h-3 w-3" />
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Post Content */}
                        {post.content && (
                          <p className="text-xs text-foreground leading-relaxed font-medium">{post.content}</p>
                        )}

                        {/* Post Attachment */}
                        {post.mediaUrl && (
                          <div className="relative rounded-lg overflow-hidden bg-muted border border-border/30 group">
                            <img src={post.mediaUrl} alt="Attachment" className="w-full h-auto object-cover max-h-[340px]" />
                          </div>
                        )}

                        {/* Post Stats */}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-b border-border/50 pb-2 px-0.5">
                          <div className="flex items-center space-x-1">
                            <Heart className="h-3.5 w-3.5 text-primary fill-primary" />
                            <span className="font-bold text-foreground">{post.likesCount} Likes</span>
                          </div>
                          <div className="flex space-x-2">
                            <span>{post.commentsCount} Comments</span>
                          </div>
                        </div>

                        {/* Post Actions */}
                        <div className="flex items-center justify-between text-muted-foreground text-xs pt-1">
                          <button 
                            onClick={() => handleToggleLike(post.id)}
                            className={`flex-1 flex items-center justify-center space-x-2 hover:bg-muted/40 py-1.5 rounded-lg cursor-pointer transition-colors font-bold ${post.userLiked ? 'text-primary' : ''}`}
                          >
                            <Heart className={`h-4 w-4 ${post.userLiked ? 'fill-primary text-primary' : ''}`} /> 
                            <span>{post.userLiked ? 'Liked' : 'Like'}</span>
                          </button>
                          <button 
                            onClick={() => setActivePostCommentsId(activePostCommentsId === post.id ? null : post.id)}
                            className={`flex-1 flex items-center justify-center space-x-2 hover:bg-muted/40 py-1.5 rounded-lg cursor-pointer transition-colors font-bold ${activePostCommentsId === post.id ? 'text-primary' : ''}`}
                          >
                            <MessageSquare className="h-4 w-4" /> <span>Comment</span>
                          </button>
                        </div>

                        {/* Comments Drawer Expansion */}
                        {activePostCommentsId === post.id && (
                          <div className="border-t border-border/50 pt-3 space-y-3 animate-fade-in">
                            {post.comments && post.comments.map((comment: any) => (
                              <div key={comment.id} className="flex items-start space-x-2.5 text-xs">
                                <Avatar className="h-7 w-7 border">
                                  <AvatarImage src={comment.user.avatarUrl || undefined} />
                                  <AvatarFallback className="font-bold bg-muted">{comment.user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="bg-muted/40 p-2.5 rounded-2xl flex-1">
                                  <span className="font-bold text-foreground block mb-0.5">{comment.user.name}</span>
                                  <p className="text-muted-foreground leading-relaxed font-medium">{comment.content}</p>
                                </div>
                              </div>
                            ))}

                            {/* Comment Input */}
                            <div className="flex items-center space-x-2 pt-1.5">
                              <input 
                                type="text" 
                                placeholder="Write a comment..."
                                className="flex-1 h-8 bg-muted/40 rounded-full border border-transparent px-3 text-xs focus:outline-hidden focus:border-primary/40 focus:bg-card transition-all"
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddComment(post.id);
                                }}
                              />
                              <Button 
                                size="sm" 
                                className="h-8 text-[10px] bg-primary hover:bg-primary/95 text-white font-bold rounded-lg cursor-pointer"
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
                  <div className="text-center py-10 bg-card border border-border/50 rounded-xl">
                    <p className="text-sm text-muted-foreground font-semibold">No posts found. Share your thoughts to get started!</p>
                  </div>
                )}
              </div>
            </>
          ) : activeSubTab === 'requests' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4 text-primary" /> Connection Requests
                </h3>
                <span className="text-xs text-muted-foreground font-semibold">Confirm requests below</span>
              </div>

              {requestsToRender.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {requestsToRender.map((req) => (
                    <Card key={req.id} className="shadow-xs border-border/50 bg-card rounded-xl overflow-hidden flex flex-col hover:border-border/80 transition-colors group">
                      <div className="aspect-square bg-muted relative overflow-hidden flex-shrink-0 animate-fade-in">
                        {req.sender.avatarUrl ? (
                          <img src={req.sender.avatarUrl} alt={req.sender.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xl bg-primary/5 text-primary">
                            {req.sender.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex flex-col flex-1 justify-between min-h-[110px] bg-muted/5">
                        <div>
                          <span className="font-extrabold text-xs text-foreground truncate block">{req.sender.name}</span>
                          <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 block">{req.mutualCount} mutual connections</span>
                        </div>
                        <div className="space-y-1.5 mt-4">
                          <Button 
                            size="sm" 
                            className="w-full h-8 text-[10px] bg-primary hover:bg-primary/95 text-white font-bold rounded-lg cursor-pointer"
                            onClick={() => {
                              handleRespondRequest(req.id, 'accepted');
                            }}
                          >
                            Confirm
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full h-8 text-[10px] border-transparent bg-secondary/80 hover:bg-secondary text-foreground font-semibold rounded-lg cursor-pointer"
                            onClick={() => {
                              handleRespondRequest(req.id, 'rejected');
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-card border border-border/50 rounded-xl">
                  <p className="text-sm text-muted-foreground">No pending connection requests</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-primary" /> Connected People
                </h3>
                <span className="text-xs text-muted-foreground font-semibold">Connections portal</span>
              </div>

              {friendsToRender.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {friendsToRender.map((friend) => (
                    <Card key={friend.id} className="shadow-xs border-border/50 bg-card rounded-xl overflow-hidden flex flex-col hover:border-border/80 transition-colors group">
                      <div className="aspect-square bg-muted relative overflow-hidden flex-shrink-0">
                        {friend.avatarUrl ? (
                          <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xl bg-primary/5 text-primary">
                            {friend.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex flex-col flex-1 justify-between min-h-[90px] bg-muted/5">
                        <div>
                          <span className="font-extrabold text-xs text-foreground truncate block">{friend.name}</span>
                          <span className="text-[9px] text-green-500 font-bold mt-1 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 bg-green-500 rounded-full"></span> {friend.status}
                          </span>
                        </div>
                        <div className="mt-3 flex space-x-1.5">
                          <Button 
                            size="sm" 
                            className="flex-grow h-7 text-[10px] bg-primary hover:bg-primary/95 text-white font-bold rounded-lg cursor-pointer"
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
                              className="h-7 px-2 text-[10px] border-red-500/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold rounded-lg cursor-pointer"
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
                <div className="text-center py-10 bg-card border border-border/50 rounded-xl">
                  <p className="text-sm text-muted-foreground">No connected people found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Column */}
      <div className="hidden lg:block w-72 border-l border-border p-4 space-y-6 overflow-y-auto bg-background select-none">
        {/* Sponsored */}
        <div className="space-y-3">
          <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Sponsored</h5>
          <div className="flex items-center space-x-3.5 cursor-pointer hover:bg-muted/30 p-1.5 rounded-lg transition-colors">
            <div className="h-14 w-20 rounded bg-muted overflow-hidden flex-shrink-0 border border-border/40">
              <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=100&auto=format&fit=crop&q=60" alt="Ad" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h6 className="text-[11px] font-bold truncate">Build Premium React Applications</h6>
              <span className="text-[9px] text-muted-foreground mt-0.5 block">react-training.org</span>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-border opacity-50"></div>

        {/* Birthdays Announcement */}
        <div className="space-y-2.5">
          <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Birthdays</h5>
          <div className="flex items-start space-x-3 text-xs leading-relaxed text-foreground">
            <Gift className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 animate-bounce" />
            <p className="text-[11px]">
              <strong>HM Humayun Kobir</strong> and <strong>2 others</strong> have birthdays today. Send them warm wishes!
            </p>
          </div>
        </div>

        <div className="h-[1px] bg-border opacity-50"></div>

        {/* Connection Requests Preview */}
        {requestsToRender.slice(0, 1).map(req => (
          <div key={req.id} className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Connection requests</h5>
              <span className="text-[10px] text-primary font-bold hover:underline cursor-pointer" onClick={() => setActiveSubTab('requests')}>See all</span>
            </div>
            <div className="flex items-start space-x-3 bg-muted/20 p-2.5 rounded-xl border border-border/50">
              <Avatar className="h-10 w-10 border shadow-xs">
                <AvatarImage src={req.sender.avatarUrl} />
                <AvatarFallback>{req.sender.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-black truncate">{req.sender.name}</span>
                  <span className="text-[8px] text-muted-foreground font-semibold flex-shrink-0">1d</span>
                </div>
                <span className="text-[9px] text-muted-foreground truncate block">{req.mutualCount} mutual connections</span>
                <div className="flex space-x-1.5 mt-2">
                  <Button 
                    size="sm" 
                    className="h-6.5 text-[9px] font-bold bg-primary hover:bg-primary/95 text-white flex-1 cursor-pointer"
                    onClick={() => {
                      handleRespondRequest(req.id, 'accepted');
                    }}
                  >
                    Confirm
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-6.5 text-[9px] font-semibold border-transparent bg-secondary hover:bg-secondary/95 text-foreground flex-1 cursor-pointer"
                    onClick={() => {
                      handleRespondRequest(req.id, 'rejected');
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
