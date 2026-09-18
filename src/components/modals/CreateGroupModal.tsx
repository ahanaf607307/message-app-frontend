'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { User, Conversation } from '@/types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conv: Conversation) => void;
}

export default function CreateGroupModal({ isOpen, onClose, onConversationCreated }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormError(null);
      setGroupName('');
      setSelectedFriendIds([]);
      fetchFriends();
    }
  }, [isOpen]);

  const fetchFriends = async () => {
    try {
      setIsLoadingFriends(true);
      const response = await api.get('/connections/connected-users');
      setFriends(response.data.data.users || []);
    } catch (err: any) {
      console.error('Failed to fetch friends:', err);
      toast.error('Failed to load friends list. Please try again.');
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFriendIds.length === 0) {
      setFormError('Please select at least one participant');
      return;
    }
    const isGroup = selectedFriendIds.length > 1 || groupName.trim().length > 0;
    if (isGroup && !groupName.trim()) {
      setFormError('Group name is required for group chats');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        participantIds: selectedFriendIds,
        isGroupChat: isGroup,
        name: isGroup ? groupName.trim() : undefined,
      };
      const res = await api.post('/conversations/create', payload);
      onConversationCreated(res.data.data);
      onClose();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create conversation');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start Chat / Create Group</DialogTitle>
          <DialogDescription>
            Select friends to start a conversation. Add multiple friends to automatically create a Group Chat.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateGroup} className="space-y-4">
          {selectedFriendIds.length > 1 && (
            <div className="space-y-1">
              <label htmlFor="group-name" className="text-xs font-semibold">Group Name</label>
              <Input
                id="group-name"
                placeholder="Marketing Team, Weekend Plan, etc."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required={selectedFriendIds.length > 1}
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs font-semibold">Select Participants ({selectedFriendIds.length})</label>
            <div className="max-h-60 overflow-y-auto border border-border rounded-lg p-2 space-y-1 bg-muted/10">
              {isLoadingFriends ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : friends.length > 0 ? (
                friends.map((friend) => (
                  <label 
                    key={friend.id}
                    className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFriendIds.includes(friend.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFriendIds(prev => [...prev, friend.id]);
                        } else {
                          setSelectedFriendIds(prev => prev.filter(id => id !== friend.id));
                        }
                      }}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs font-bold">
                      {friend.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover" />
                      ) : (
                        friend.name.charAt(0)
                      )}
                    </div>
                    <span className="text-sm font-medium">{friend.name}</span>
                  </label>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No friends connected yet. Connect with users to start chats.
                </div>
              )}
            </div>
          </div>
          {formError && <div className="p-3 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">{formError}</div>}
          <DialogFooter>
            <Button type="submit" disabled={formSubmitting || friends.length === 0 || selectedFriendIds.length === 0}>
              {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedFriendIds.length > 1 ? 'Create Group' : 'Start Chat'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
