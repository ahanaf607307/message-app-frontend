'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe, Users, Lock, MoreHorizontal, Edit3, Trash2, Check, Heart, MessageSquare } from 'lucide-react';
import { Post, User } from '@/types';

interface PostCardProps {
  post: Post;
  currentUser: User | null;
  onOpenUserProfile: (userId: string) => void;
  onEdit: (post: Post) => void;
  onChangeAudience: (postId: string, audience: 'PUBLIC' | 'CONNECTIONS' | 'ONLY_ME') => void;
  onDelete: (postId: string) => void;
  onToggleLike: (postId: string) => void;
  activePostCommentsId: string | null;
  onToggleComments: (postId: string) => void;
  commentInput: string;
  setCommentInput: (val: string) => void;
  onAddComment: (postId: string) => void;
}

export default function PostCard({
  post,
  currentUser,
  onOpenUserProfile,
  onEdit,
  onChangeAudience,
  onDelete,
  onToggleLike,
  activePostCommentsId,
  onToggleComments,
  commentInput,
  setCommentInput,
  onAddComment
}: PostCardProps) {
  const isAuthor = post.author.id === currentUser?.id;

  return (
    <Card className="shadow-2xs border border-[#ecd8bf]/60 dark:border-border bg-[#faf6f0] dark:bg-card rounded-2xl text-[#0b4d3a] dark:text-card-foreground overflow-hidden animate-fade-in">
      <CardContent className="p-5 space-y-4">
        
        {/* Post Header */}
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => onOpenUserProfile(post.author.id)}
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

          {/* Post Options Menu */}
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
                    onClick={() => onEdit(post)}
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
                    onClick={() => onChangeAudience(post.id, 'PUBLIC')}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${post.audience === 'PUBLIC' ? 'text-orange-600 font-black' : ''}`}
                  >
                    <div className="flex items-center space-x-2">
                      <Globe className="h-3.5 w-3.5" />
                      <span>Public</span>
                    </div>
                    {post.audience === 'PUBLIC' && <Check className="h-3.5 w-3.5" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onChangeAudience(post.id, 'CONNECTIONS')}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${post.audience === 'CONNECTIONS' ? 'text-orange-600 font-black' : ''}`}
                  >
                    <div className="flex items-center space-x-2">
                      <Users className="h-3.5 w-3.5" />
                      <span>Connections</span>
                    </div>
                    {post.audience === 'CONNECTIONS' && <Check className="h-3.5 w-3.5" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onChangeAudience(post.id, 'ONLY_ME')}
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
                    onClick={() => onDelete(post.id)}
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
            onClick={() => onToggleLike(post.id)}
            className={`flex-1 flex items-center justify-center space-x-2 hover:bg-[#ebdccb]/60 dark:hover:bg-muted py-2 rounded-xl cursor-pointer transition-all font-black ${post.userLiked ? 'text-orange-500 animate-pulse' : 'text-[#0b4d3a] dark:text-foreground'}`}
          >
            <Heart className={`h-4 w-4 ${post.userLiked ? 'fill-orange-500 text-orange-500' : ''}`} /> 
            <span>Like</span>
          </button>
          <button 
            onClick={() => onToggleComments(post.id)}
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
                  if (e.key === 'Enter') onAddComment(post.id);
                }}
              />
              <Button 
                size="sm" 
                className="h-8.5 rounded-full px-4 text-[10px] bg-orange-600 hover:bg-orange-700 dark:bg-primary dark:hover:bg-primary/85 cursor-pointer font-bold text-white"
                onClick={() => onAddComment(post.id)}
              >
                Post
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
