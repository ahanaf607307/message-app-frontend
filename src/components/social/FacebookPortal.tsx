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

interface FacebookPortalProps {
  currentUser: User | null;
  onRefreshConversations: () => void;
  onSelectConversation: (conversation: Conversation) => void;
}

export default function FacebookPortal({ currentUser, onRefreshConversations, onSelectConversation }: FacebookPortalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'requests' | 'friends'>('feed');
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Likes state for mock posts
  const [likedPosts, setLikedPosts] = useState<Record<number, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({
    1: 76,
    2: 12,
    3: 8
  });

  const handleToggleLike = (postId: number) => {
    setLikedPosts(prev => {
      const isLiked = !prev[postId];
      setLikeCounts(counts => ({
        ...counts,
        [postId]: isLiked ? counts[postId] + 1 : counts[postId] - 1
      }));
      return { ...prev, [postId]: isLiked };
    });
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

  useEffect(() => {
    fetchConnections();
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

  // Mock Stories Data
  const stories = [
    { id: 1, name: 'ZASKA', bg: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=60', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80' },
    { id: 2, name: 'Akla Polash', bg: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=60', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80' },
    { id: 3, name: 'Saodiat Hasan', bg: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=60', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80' },
    { id: 4, name: 'Abdullah Abrar', bg: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=60', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80' }
  ];

  // Dummy News Feed Posts
  const dummyPosts = [
    {
      id: 1,
      author: 'Abdullah bin Abdur Razzak',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80',
      time: 'Just now',
      text: 'সরাসরি সম্প্রচার | শারদীয়া শুভেচ্ছা | পর্ব ০১ | শায়খ আবদুল্লাহ বিন আবদুর রাজ্জাক | Al-Ibtisam TV',
      isLive: true,
      mediaUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&auto=format&fit=crop&q=80',
      comments: 37
    },
    {
      id: 2,
      author: 'Mohammad Islam',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80',
      time: '10 hours ago',
      text: 'Loving the new green & orange theme layout! It feels extremely fluid and looks premium. Let me know what you guys think about the customization updates! 🌳🧡',
      isLive: false,
      mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
      comments: 19
    },
    {
      id: 3,
      author: 'HM Humayun Kobir',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80',
      time: '1 day ago',
      text: 'Connected with friends, searched for users, and updated the control center console details successfully. Testing the chat socket feeds next.',
      isLive: false,
      comments: 5
    }
  ];

  // Dummy Requests fallback if API has no requests
  const dummyRequests = [
    { id: 'mock-1', sender: { name: 'Aesthetic Man', avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80' }, mutualCount: 11 },
    { id: 'mock-2', sender: { name: 'A H Rayhan', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' }, mutualCount: 5 },
    { id: 'mock-3', sender: { name: 'Momena Begum', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80' }, mutualCount: 8 },
    { id: 'mock-4', sender: { name: 'Nijhum Mon', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80' }, mutualCount: 2 }
  ];

  const requestsToRender = pendingIncoming.length > 0 
    ? pendingIncoming.map(r => ({ id: r.id, sender: r.sender, mutualCount: Math.floor(Math.random() * 15), isReal: true }))
    : dummyRequests.map(r => ({ ...r, isReal: false }));

  // Dummy Friends fallback if API has no friends
  const dummyFriends = [
    { id: 'mock-f1', name: 'MH Supto', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80', status: 'Active Now' },
    { id: 'mock-f2', name: 'Mishkat Islam', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', status: 'Away' },
    { id: 'mock-f3', name: 'Shahriar Monir', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80', status: 'Offline' }
  ];

  const friendsToRender = friends.length > 0
    ? friends.map(f => ({ id: f.id, name: f.name, avatarUrl: f.avatarUrl, status: 'Connected', isReal: true }))
    : dummyFriends.map(f => ({ ...f, isReal: false }));

  return (
    <div className="flex-1 flex overflow-hidden h-full bg-background text-foreground font-sans-active">
      {/* Middle Feed Column */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 bg-muted/10">
        <div className="max-w-[620px] mx-auto space-y-6 pb-12">
          
          {/* Sub Navigation Tabs (Feed / Requests / Friends) */}
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
              <UserPlus className="h-4 w-4" /> Friend Requests
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
              <Users className="h-4 w-4" /> Friends List
            </Button>
          </div>

          {activeSubTab === 'feed' ? (
            <>
              {/* Stories Carousel */}
              <div className="flex space-x-2.5 overflow-x-auto pb-1 no-scrollbar select-none">
                {/* Create Story Card */}
                <div className="w-[110px] h-[175px] bg-card border border-border/60 rounded-xl overflow-hidden shadow-2xs relative flex flex-col flex-shrink-0 cursor-pointer group hover:border-primary/30 transition-all">
                  <div className="h-[120px] bg-muted relative overflow-hidden">
                    {currentUser?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
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

                {/* Dummy Stories */}
                {stories.map(story => (
                  <div key={story.id} className="w-[110px] h-[175px] rounded-xl overflow-hidden shadow-2xs relative flex-shrink-0 cursor-pointer group border border-border/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={story.bg} alt={story.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                    <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/80"></div>
                    <Avatar className="absolute top-2 left-2 h-7 w-7 border-2 border-primary shadow-md">
                      <AvatarImage src={story.avatar} />
                      <AvatarFallback className="text-[9px]">{story.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-2 left-2 right-2 text-[10px] font-bold text-white truncate">{story.name}</span>
                  </div>
                ))}
              </div>

              {/* Create Post Box */}
              <Card className="shadow-2xs border-border/50 bg-card overflow-hidden">
                <CardContent className="p-4 space-y-3.5">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarImage src={currentUser?.avatarUrl} />
                      <AvatarFallback className="bg-primary/5 text-primary font-bold">{currentUser?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <input 
                      type="text" 
                      placeholder={`What's on your mind, ${currentUser?.name || 'User'}?`}
                      className="flex-1 h-9 bg-muted/40 rounded-full border border-transparent px-4 text-xs focus:outline-hidden focus:border-primary/40 focus:bg-card transition-all cursor-pointer"
                    />
                  </div>
                  <div className="border-t border-border/60 pt-3 flex items-center justify-between text-muted-foreground text-xs px-1">
                    <button className="flex items-center space-x-2 hover:bg-muted/40 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-red-500 font-semibold">
                      <Video className="h-4 w-4" /> <span>Live video</span>
                    </button>
                    <button className="flex items-center space-x-2 hover:bg-muted/40 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-green-500 font-semibold">
                      <ImageIcon className="h-4 w-4" /> <span>Photo/video</span>
                    </button>
                    <button className="flex items-center space-x-2 hover:bg-muted/40 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-amber-500 font-semibold">
                      <Smile className="h-4 w-4" /> <span>Feeling/activity</span>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Posts Feed */}
              <div className="space-y-4">
                {dummyPosts.map((post) => (
                  <Card key={post.id} className="shadow-2xs border-border/50 bg-card overflow-hidden animate-fade-in">
                    <CardContent className="p-4 space-y-3">
                      {/* Post Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <Avatar className="h-9 w-9 border">
                            <AvatarImage src={post.avatar} />
                            <AvatarFallback className="font-bold bg-muted">{post.author.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <h4 className="text-xs font-bold text-foreground">{post.author}</h4>
                              {post.isLive && (
                                <Badge className="bg-red-500 hover:bg-red-500 text-white text-[8px] font-black h-4 px-1.5 uppercase flex items-center gap-0.5">
                                  <Video className="h-2.5 w-2.5" /> LIVE
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <span>{post.time}</span> • <Globe className="h-3 w-3" />
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Post Content */}
                      <p className="text-xs text-foreground leading-relaxed font-medium">{post.text}</p>

                      {/* Post Attachment */}
                      {post.mediaUrl && (
                        <div className="relative rounded-lg overflow-hidden bg-muted border border-border/30 group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={post.mediaUrl} alt="Attachment" className="w-full h-auto object-cover max-h-[340px]" />
                          {post.isLive && (
                            <div className="absolute inset-0 bg-black/25 flex items-center justify-center cursor-pointer group-hover:bg-black/35 transition-colors">
                              <div className="h-14 w-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 scale-100 group-hover:scale-105 transition-transform">
                                <Play className="h-6 w-6 fill-current ml-1" />
                              </div>
                              <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-ping"></span> 76 viewers
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Post Stats */}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-b border-border/50 pb-2 px-0.5">
                        <div className="flex items-center space-x-1">
                          <Heart className="h-3.5 w-3.5 text-primary fill-primary" />
                          <span className="font-bold text-foreground">{likeCounts[post.id]} Likes</span>
                        </div>
                        <div className="flex space-x-2">
                          <span>{post.comments} Comments</span>
                          <span>•</span>
                          <span>2 Shares</span>
                        </div>
                      </div>

                      {/* Post Actions */}
                      <div className="flex items-center justify-between text-muted-foreground text-xs pt-1">
                        <button 
                          onClick={() => handleToggleLike(post.id)}
                          className={`flex-1 flex items-center justify-center space-x-2 hover:bg-muted/40 py-1.5 rounded-lg cursor-pointer transition-colors font-bold ${likedPosts[post.id] ? 'text-primary' : ''}`}
                        >
                          <Heart className={`h-4 w-4 ${likedPosts[post.id] ? 'fill-primary text-primary' : ''}`} /> 
                          <span>{likedPosts[post.id] ? 'Liked' : 'Like'}</span>
                        </button>
                        <button className="flex-1 flex items-center justify-center space-x-2 hover:bg-muted/40 py-1.5 rounded-lg cursor-pointer transition-colors font-bold">
                          <MessageSquare className="h-4 w-4" /> <span>Comment</span>
                        </button>
                        <button className="flex-1 flex-row flex items-center justify-center space-x-2 hover:bg-muted/40 py-1.5 rounded-lg cursor-pointer transition-colors font-bold">
                          <Share2 className="h-4 w-4" /> <span>Share</span>
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : activeSubTab === 'requests' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4 text-primary" /> Friend Requests
                </h3>
                <span className="text-xs text-muted-foreground font-semibold">Confirm requests below</span>
              </div>

              {requestsToRender.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {requestsToRender.map((req) => (
                    <Card key={req.id} className="shadow-xs border-border/50 bg-card rounded-xl overflow-hidden flex flex-col hover:border-border/80 transition-colors group">
                      <div className="aspect-square bg-muted relative overflow-hidden flex-shrink-0 animate-fade-in">
                        {req.sender.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={req.sender.avatarUrl} alt={req.sender.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xl bg-primary/5 text-primary">
                            {req.sender.name.charAt(0)}
                          </div>
                        )}
                        {!req.isReal && (
                          <Badge variant="outline" className="absolute top-2 right-2 text-[8px] bg-card/90 backdrop-blur-xs border-transparent shadow-xs">Mock</Badge>
                        )}
                      </div>
                      <div className="p-3 flex flex-col flex-1 justify-between min-h-[110px] bg-muted/5">
                        <div>
                          <span className="font-extrabold text-xs text-foreground truncate block">{req.sender.name}</span>
                          <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 block">{req.mutualCount} mutual friends</span>
                        </div>
                        <div className="space-y-1.5 mt-4">
                          <Button 
                            size="sm" 
                            className="w-full h-8 text-[10px] bg-primary hover:bg-primary/95 text-white font-bold rounded-lg cursor-pointer"
                            onClick={() => {
                              if (req.isReal) {
                                handleRespondRequest(req.id, 'accepted');
                              } else {
                                alert('Accepted mock request!');
                              }
                            }}
                          >
                            Confirm
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full h-8 text-[10px] border-transparent bg-secondary/80 hover:bg-secondary text-foreground font-semibold rounded-lg cursor-pointer"
                            onClick={() => {
                              if (req.isReal) {
                                handleRespondRequest(req.id, 'rejected');
                              } else {
                                alert('Deleted mock request');
                              }
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
                  <p className="text-sm text-muted-foreground">No pending friend requests</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-primary" /> Active Friends List
                </h3>
                <span className="text-xs text-muted-foreground font-semibold">Connections portal</span>
              </div>

              {friendsToRender.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {friendsToRender.map((friend) => (
                    <Card key={friend.id} className="shadow-xs border-border/50 bg-card rounded-xl overflow-hidden flex flex-col hover:border-border/80 transition-colors group">
                      <div className="aspect-square bg-muted relative overflow-hidden flex-shrink-0">
                        {friend.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xl bg-primary/5 text-primary">
                            {friend.name.charAt(0)}
                          </div>
                        )}
                        {!friend.isReal && (
                          <Badge variant="outline" className="absolute top-2 right-2 text-[8px] bg-card/90 backdrop-blur-xs border-transparent shadow-xs">Mock</Badge>
                        )}
                      </div>
                      <div className="p-3 flex flex-col flex-1 justify-between min-h-[90px] bg-muted/5">
                        <div>
                          <span className="font-extrabold text-xs text-foreground truncate block">{friend.name}</span>
                          <span className="text-[9px] text-green-500 font-bold mt-1 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 bg-green-500 rounded-full"></span> {friend.status}
                          </span>
                        </div>
                        <div className="mt-3">
                          <Button 
                            size="sm" 
                            className="w-full h-7 text-[10px] bg-primary hover:bg-primary/95 text-white font-bold rounded-lg cursor-pointer"
                            onClick={async () => {
                              if (friend.isReal) {
                                try {
                                  const res = await api.post('/conversations/create', {
                                    participantIds: [friend.id],
                                    isGroupChat: false
                                  });
                                  onSelectConversation(res.data.data);
                                } catch (e: any) {
                                  alert('Failed to start chat session');
                                }
                              } else {
                                alert(`Chatting with mock friend: ${friend.name}`);
                              }
                            }}
                          >
                            Open Chat
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-card border border-border/50 rounded-xl">
                  <p className="text-sm text-muted-foreground">No connected friends found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Column (Sponsored, Birthdays, Active Panel Contacts) - Visible on lg screens */}
      <div className="hidden lg:block w-72 border-l border-border p-4 space-y-6 overflow-y-auto bg-background select-none">
        {/* Sponsored / Ads widget */}
        <div className="space-y-3">
          <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Sponsored</h5>
          <div className="flex items-center space-x-3.5 cursor-pointer hover:bg-muted/30 p-1.5 rounded-lg transition-colors">
            <div className="h-14 w-20 rounded bg-muted overflow-hidden flex-shrink-0 border border-border/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
              <strong>সস্বপ্নের ঘর</strong> and <strong>3 others</strong> have birthdays today. Send them warm wishes!
            </p>
          </div>
        </div>

        <div className="h-[1px] bg-border opacity-50"></div>

        {/* Friend Requests Preview (same style as screenshot 2 right sidebar) */}
        {requestsToRender.slice(0, 1).map(req => (
          <div key={req.id} className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Friend requests</h5>
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
                <span className="text-[9px] text-muted-foreground truncate block">{req.mutualCount} mutual friends</span>
                <div className="flex space-x-1.5 mt-2">
                  <Button 
                    size="sm" 
                    className="h-6.5 text-[9px] font-bold bg-primary hover:bg-primary/95 text-white flex-1 cursor-pointer"
                    onClick={() => {
                      if (req.isReal) {
                        handleRespondRequest(req.id, 'accepted');
                      } else {
                        alert('Confirmed request');
                      }
                    }}
                  >
                    Confirm
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-6.5 text-[9px] font-semibold border-transparent bg-secondary hover:bg-secondary/95 text-foreground flex-1 cursor-pointer"
                    onClick={() => {
                      if (req.isReal) {
                        handleRespondRequest(req.id, 'rejected');
                      } else {
                        alert('Deleted request');
                      }
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
