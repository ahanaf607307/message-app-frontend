'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, updateProfile, activeFont, changeFont } = useAuth();
  const { theme: themeMode, setTheme: handleThemeChange } = useTheme();

  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileAvatar, setProfileAvatar] = useState<File | null>(null);
  const [profileAvatarPreview, setProfileAvatarPreview] = useState<string>('');
  const [profileNickname, setProfileNickname] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileLivesIn, setProfileLivesIn] = useState('');
  const [profileFromCity, setProfileFromCity] = useState('');
  const [profileGender, setProfileGender] = useState('');
  const [profileWorkplace, setProfileWorkplace] = useState('');
  const [profileWorkTitle, setProfileWorkTitle] = useState('');
  const [profileEducationDept, setProfileEducationDept] = useState('');
  const [profileEducationSchool, setProfileEducationSchool] = useState('');
  const [profileCover, setProfileCover] = useState<File | null>(null);
  const [profileCoverPreview, setProfileCoverPreview] = useState<string>('');
  const [profileIsLocked, setProfileIsLocked] = useState(false);
  
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setProfileAvatarPreview(user.avatarUrl || '');
      setProfileAvatar(null);
      setProfileNickname(user.nickname || '');
      setProfileBio(user.bio || '');
      setProfileLivesIn(user.livesIn || '');
      setProfileFromCity(user.fromCity || '');
      setProfileGender(user.gender || '');
      setProfileWorkplace(user.workplace || '');
      setProfileWorkTitle(user.workTitle || '');
      setProfileEducationDept(user.educationDept || '');
      setProfileEducationSchool(user.educationSchool || '');
      setProfileCoverPreview(user.coverUrl || '');
      setProfileCover(null);
      setProfileIsLocked(user.isLocked || false);
      setFormError(null);
    }
  }, [isOpen, user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    try {
      await updateProfile({
        name: profileName,
        email: profileEmail,
        nickname: profileNickname,
        bio: profileBio,
        livesIn: profileLivesIn,
        fromCity: profileFromCity,
        gender: profileGender,
        workplace: profileWorkplace,
        workTitle: profileWorkTitle,
        educationDept: profileEducationDept,
        educationSchool: profileEducationSchool,
        isLocked: profileIsLocked,
        avatarFile: profileAvatar,
        coverFile: profileCover
      });
      onClose();
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto no-scrollbar rounded-2xl border border-border/80 bg-background shadow-2xl p-0">
        
        {/* Header Banner */}
        <div className="bg-linear-to-r from-emerald-600 to-teal-800 dark:from-indigo-950 dark:to-teal-950 p-6 text-white relative">
          <h2 className="text-xl font-extrabold tracking-tight">Profile Settings</h2>
          <p className="text-xs text-emerald-100 dark:text-muted-foreground mt-1">Customize your social identity card, workplace details, and preferences.</p>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6 p-6">
          
          {/* 1. Visual Media Section */}
          <div className="bg-muted/15 dark:bg-card/30 border border-border/50 rounded-2xl p-4.5 space-y-4">
            <div className="flex items-center space-x-2 text-[#0b4d3a] dark:text-foreground">
              <span className="text-lg">🖼️</span>
              <h3 className="text-xs font-black uppercase tracking-wider">Profile & Cover Media</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Avatar upload */}
              <div className="flex flex-col items-center justify-center p-4 bg-background dark:bg-card border border-dashed border-border rounded-xl space-y-3 relative group">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#ecd8bf] dark:border-border bg-muted flex items-center justify-center shadow-sm">
                  {profileAvatarPreview ? (
                    <img src={profileAvatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-muted-foreground">{profileName?.charAt(0)}</span>
                  )}
                </div>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setProfileAvatar(file);
                      setProfileAvatarPreview(URL.createObjectURL(file));
                    }
                  }}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="h-8 text-xs font-bold border-border hover:bg-muted cursor-pointer shadow-3xs"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  Change Avatar
                </Button>
              </div>

              {/* Cover upload */}
              <div className="flex flex-col items-center justify-center p-4 bg-background dark:bg-card border border-dashed border-border rounded-xl space-y-3 relative group">
                <div className="relative w-full h-20 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center shadow-xs">
                  {profileCoverPreview ? (
                    <img src={profileCoverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted-foreground italic font-semibold">No cover photo set</span>
                  )}
                </div>
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setProfileCover(file);
                      setProfileCoverPreview(URL.createObjectURL(file));
                    }
                  }}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="h-8 text-xs font-bold border-border hover:bg-muted cursor-pointer shadow-3xs"
                  onClick={() => document.getElementById('cover-upload')?.click()}
                >
                  Change Cover
                </Button>
              </div>
            </div>
          </div>

          {/* 2. Profile Identity Section */}
          <div className="bg-muted/15 dark:bg-card/30 border border-border/50 rounded-2xl p-4.5 space-y-4">
            <div className="flex items-center space-x-2 text-[#0b4d3a] dark:text-foreground">
              <span className="text-lg">👤</span>
              <h3 className="text-xs font-black uppercase tracking-wider">Identity & Bio</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-bold">Full Name</label>
                <Input
                  id="name"
                  placeholder="e.g. John Doe"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="h-9.5 rounded-lg border-border bg-background"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="nickname" className="text-xs font-bold">Nickname (optional)</label>
                <Input
                  id="nickname"
                  placeholder="e.g. Johnny"
                  value={profileNickname}
                  onChange={(e) => setProfileNickname(e.target.value)}
                  className="h-9.5 rounded-lg border-border bg-background"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="bio" className="text-xs font-bold">Bio Status Quote</label>
              <textarea
                id="bio"
                rows={2}
                placeholder="Tell people about yourself..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
              />
            </div>
          </div>

          {/* 3. Location & Details Section */}
          <div className="bg-muted/15 dark:bg-card/30 border border-border/50 rounded-2xl p-4.5 space-y-4">
            <div className="flex items-center space-x-2 text-[#0b4d3a] dark:text-foreground">
              <span className="text-lg">📍</span>
              <h3 className="text-xs font-black uppercase tracking-wider">Personal details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="livesIn" className="text-xs font-bold">Current City</label>
                <Input
                  id="livesIn"
                  placeholder="e.g. New York, USA"
                  value={profileLivesIn}
                  onChange={(e) => setProfileLivesIn(e.target.value)}
                  className="h-9.5 rounded-lg border-border bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="fromCity" className="text-xs font-bold">Hometown</label>
                <Input
                  id="fromCity"
                  placeholder="e.g. London"
                  value={profileFromCity}
                  onChange={(e) => setProfileFromCity(e.target.value)}
                  className="h-9.5 rounded-lg border-border bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="gender" className="text-xs font-bold">Gender</label>
                <Input
                  id="gender"
                  placeholder="e.g. Prefer not to say"
                  value={profileGender}
                  onChange={(e) => setProfileGender(e.target.value)}
                  className="h-9.5 rounded-lg border-border bg-background"
                />
              </div>
            </div>
          </div>

          {/* 4. Work & Education Section */}
          <div className="bg-muted/15 dark:bg-card/30 border border-border/50 rounded-2xl p-4.5 space-y-4">
            <div className="flex items-center space-x-2 text-[#0b4d3a] dark:text-foreground">
              <span className="text-lg">💼</span>
              <h3 className="text-xs font-black uppercase tracking-wider">Work & Education</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="workplace" className="text-xs font-bold">Workplace Company</label>
                <Input
                  id="workplace"
                  placeholder="e.g. Tech Corp Inc."
                  value={profileWorkplace}
                  onChange={(e) => setProfileWorkplace(e.target.value)}
                  className="h-9.5 rounded-lg border-border bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="workTitle" className="text-xs font-bold">Job Title / Specialty</label>
                <Input
                  id="workTitle"
                  placeholder="e.g. Software Engineer"
                  value={profileWorkTitle}
                  onChange={(e) => setProfileWorkTitle(e.target.value)}
                  className="h-9.5 rounded-lg border-border bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="educationSchool" className="text-xs font-bold">School / University</label>
                <Input
                  id="educationSchool"
                  placeholder="e.g. State University"
                  value={profileEducationSchool}
                  onChange={(e) => setProfileEducationSchool(e.target.value)}
                  className="h-9.5 rounded-lg border-border bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="educationDept" className="text-xs font-bold">Department / Major</label>
                <Input
                  id="educationDept"
                  placeholder="e.g. Computer Science"
                  value={profileEducationDept}
                  onChange={(e) => setProfileEducationDept(e.target.value)}
                  className="h-9.5 rounded-lg border-border bg-background"
                />
              </div>
            </div>
          </div>

          {/* 5. Account Settings (System preference & Profile Lock) */}
          <div className="bg-muted/15 dark:bg-card/30 border border-border/50 rounded-2xl p-4.5 space-y-4">
            <div className="flex items-center space-x-2 text-[#0b4d3a] dark:text-foreground">
              <span className="text-lg">🔒</span>
              <h3 className="text-xs font-black uppercase tracking-wider">Privacy & Profile Lock</h3>
            </div>

            <div className="p-3.5 bg-background dark:bg-card rounded-xl border border-border flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-[#0b4d3a] dark:text-foreground">Lock Profile</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  When locked, non-connections can only see your avatar and cover photo. Your posts, photos, and personal details are hidden.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProfileIsLocked(!profileIsLocked)}
                className={`h-7 px-3.5 rounded-full text-xs font-bold transition-all cursor-pointer ${profileIsLocked ? 'bg-orange-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                {profileIsLocked ? '🔒 Locked' : '🔓 Unlocked'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="font-select" className="text-xs font-bold">System Font</label>
                <select
                  id="font-select"
                  value={activeFont}
                  onChange={(e) => changeFont(e.target.value as any)}
                  className="w-full h-9.5 rounded-lg border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer font-semibold"
                >
                  <option value="sans">Geist (Default Sans)</option>
                  <option value="serif">Lora (Classical Serif)</option>
                  <option value="display">Space Grotesk (Modern Display)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="theme-select" className="text-xs font-bold">Theme Mode</label>
                <select
                  id="theme-select"
                  value={themeMode}
                  onChange={(e) => handleThemeChange(e.target.value as any)}
                  className="w-full h-9.5 rounded-lg border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer font-semibold"
                >
                  <option value="light">☀️ Light Mode</option>
                  <option value="dark">🌙 Dark Mode</option>
                </select>
              </div>
            </div>
          </div>

          {formError && <div className="p-3 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">{formError}</div>}
          
          <DialogFooter className="pt-4 border-t border-border flex items-center justify-between gap-3 bg-muted/5 p-4 -mx-6 -mb-6">
            <Button type="button" variant="outline" className="cursor-pointer font-bold border-border shadow-3xs" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={formSubmitting} className="cursor-pointer font-bold bg-[#0b4d3a] hover:bg-[#08362b] text-white shadow-3xs px-6">
              {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save All Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
