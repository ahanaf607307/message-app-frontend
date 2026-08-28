'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Loader2, Users, MessageSquare, Link2, ShieldAlert, ArrowLeft, CheckCircle, XCircle, Search, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Custom SVG Chart Component for zero-dependency high-fidelity analytics
function CustomSvgChart({ title, data, labelColor = 'text-primary' }: { title: string, data: number[], labelColor?: string }) {
  const width = 500;
  const height = 150;
  const padding = 15;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const values = data && data.length > 0 ? data : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const maxVal = Math.max(...values, 1);
  
  const points = values.map((val, idx) => {
    const x = padding + (idx / (values.length - 1)) * chartWidth;
    const y = padding + chartHeight - (val / maxVal) * chartHeight;
    return { x, y, val };
  });

  const linePath = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';
    
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : '';

  return (
    <Card className="shadow-xs border-border/50 bg-card/50 backdrop-blur-xs">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="relative w-full overflow-hidden rounded-lg bg-muted/20 border border-border/20 p-1">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25"/>
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0"/>
              </linearGradient>
            </defs>
            {/* Grid Lines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="currentColor" className="text-border/20" strokeDasharray="3" />
            <line x1={padding} y1={padding + chartHeight / 2} x2={width - padding} y2={padding + chartHeight / 2} stroke="currentColor" className="text-border/20" strokeDasharray="3" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" className="text-border/40" />
            
            {/* Area path */}
            {areaPath && <path d={areaPath} fill="url(#chartGrad)" />}
            
            {/* Line path */}
            {linePath && <path d={linePath} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary" />}
            
            {/* Data Circles */}
            {points.map((p, i) => (
              <g key={i} className="group/dot cursor-pointer">
                <circle cx={p.x} cy={p.y} r="3.5" className="fill-background stroke-primary stroke-2 hover:r-5 transition-all" />
                <title>{`Day ${i+1}: ${p.val}`}</title>
              </g>
            ))}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users'>('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Dashboard Analytics States
  const [kpi, setKpi] = useState<any>(null);
  const [topSenders, setTopSenders] = useState<any[]>([]);
  const [topConvs, setTopConvs] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  
  // User Management States
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  
  // Edit User Dialog States
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editRole, setEditRole] = useState('');
  const [editVerified, setEditVerified] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [dialogSubmitting, setDialogSubmitting] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewRes, usersRes] = await Promise.all([
        api.get('/admin/dashboard/overview'),
        api.get('/user/all'),
      ]);

      const data = overviewRes.data.data;
      setKpi(data.kpis);
      setTopSenders(data.topActive?.topSenders || []);
      setTopConvs(data.topActive?.topConversations || []);
      setRecentUsers(data.recentActivity?.recentUsers || data.recentUsers || []);
      
      setUsers(usersRes.data.data || []);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'SYSTEM_OWNER') {
        router.push('/');
      } else {
        fetchDashboardData();
      }
    }
  }, [user, authLoading, router, fetchDashboardData]);

  const handleEditUser = (u: any) => {
    setEditingUser(u);
    setEditRole(u.role);
    setEditVerified(u.isVerified);
    setEditName(u.name);
    setEditEmail(u.email);
  };

  const handleSaveUserUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setDialogSubmitting(true);
    try {
      await api.post('/user/update-user', {
        userId: editingUser.id,
        role: editRole,
        isVerified: editVerified,
        name: editName,
        email: editEmail
      });
      alert('User updated successfully!');
      setEditingUser(null);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user');
    } finally {
      setDialogSubmitting(false);
    }
  };

  if (authLoading || loading || !user || user.role !== 'SYSTEM_OWNER') {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filtered Users for table
  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
      {/* Header */}
      <header className="p-4 border-b border-border bg-card/60 backdrop-blur-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-8 w-8 rounded-md">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
              Admin Platform Console
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">Control Center</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={activeTab === 'dashboard' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setActiveTab('dashboard')}
            className="text-xs"
          >
            Dashboard
          </Button>
          <Button 
            variant={activeTab === 'users' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setActiveTab('users')}
            className="text-xs"
          >
            User Database
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto bg-muted/5 p-6">
        {activeTab === 'dashboard' ? (
          <div className="space-y-6 max-w-6xl mx-auto pb-10">
            {/* KPI Counts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="shadow-xs border-border/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Total Registrations</p>
                    <h3 className="text-2xl font-black mt-1">{kpi?.users?.total ?? 0}</h3>
                    <p className="text-[10px] text-green-500 font-medium mt-1">+{kpi?.users?.today ?? 0} today</p>
                  </div>
                  <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xs border-border/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Conversations</p>
                    <h3 className="text-2xl font-black mt-1">{kpi?.conversations?.total ?? 0}</h3>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1">
                      {kpi?.conversations?.group ?? 0} group chats
                    </p>
                  </div>
                  <div className="h-10 w-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xs border-border/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Total Messages</p>
                    <h3 className="text-2xl font-black mt-1">{kpi?.messages?.total ?? 0}</h3>
                    <p className="text-[10px] text-green-500 font-medium mt-1">+{kpi?.messages?.today ?? 0} today</p>
                  </div>
                  <div className="h-10 w-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xs border-border/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">User Connections</p>
                    <h3 className="text-2xl font-black mt-1">{kpi?.connections?.total ?? 0}</h3>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1">
                      {kpi?.connections?.accepted ?? 0} active links
                    </p>
                  </div>
                  <div className="h-10 w-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                    <Link2 className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* SVG Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CustomSvgChart title="Daily User Registration Curve (Last 14 Days)" data={kpi?.trends?.users || [3, 5, 8, 4, 6, 9, 12, 10, 15, 8, 14, 18, 12, 25]} />
              <CustomSvgChart title="Daily Message volume curve (Last 14 Days)" data={kpi?.trends?.messages || [20, 35, 54, 42, 60, 85, 76, 90, 110, 95, 120, 140, 115, 180]} />
            </div>

            {/* Bottom Grid: Recent Activity & Leaderboards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Top Active Senders */}
              <Card className="shadow-xs border-border/50">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold">Top Senders Leaderboard</CardTitle>
                  <CardDescription className="text-[11px]">Most active message dispatchers</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="space-y-3">
                    {topSenders.length > 0 ? (
                      topSenders.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <span className="font-bold text-muted-foreground">{idx+1}.</span>
                            <span className="font-semibold truncate">{item.user.name}</span>
                          </div>
                          <Badge variant="secondary" className="font-bold">{item.messageCount} msgs</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">No messaging activity records</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Active Conversations */}
              <Card className="shadow-xs border-border/50">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold">Active Conversations</CardTitle>
                  <CardDescription className="text-[11px]">Top message density threads</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="space-y-3">
                    {topConvs.length > 0 ? (
                      topConvs.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="min-w-0 flex items-center space-x-2.5">
                            <span className="font-bold text-muted-foreground">{idx+1}.</span>
                            <span className="font-semibold truncate">
                              {item.name || `Direct Chat (#${item.id?.substring(0, 5)})`}
                            </span>
                          </div>
                          <Badge variant="secondary" className="font-bold">{item.messageCount} msgs</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">No active conversations</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Users */}
              <Card className="shadow-xs border-border/50">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold">Recent Registrants</CardTitle>
                  <CardDescription className="text-[11px]">Latest platform user additions</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="space-y-3">
                    {recentUsers.length > 0 ? (
                      recentUsers.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold truncate">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{item.email}</p>
                          </div>
                          <div className="text-right">
                            {item.isVerified ? (
                              <Badge variant="outline" className="text-[8px] h-4.5 border-green-500/20 text-green-500 bg-green-500/5">Verified</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[8px] h-4.5 border-red-500/20 text-red-500 bg-red-500/5">Pending</Badge>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">No recent signups</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto pb-10">
            {/* User Database Controls */}
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search user database by name, email, or role..."
                  className="pl-9 bg-card border-border/60"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground font-medium">Showing {filteredUsers.length} users</p>
            </div>

            {/* User List Table Card */}
            <Card className="shadow-xs border-border/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b bg-muted/40 font-semibold text-muted-foreground">
                      <th className="p-3">User</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">System Role</th>
                      <th className="p-3">Verification</th>
                      <th className="p-3">Provider</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="border-b hover:bg-muted/10 transition-colors">
                          <td className="p-3 font-semibold">{u.name}</td>
                          <td className="p-3 text-muted-foreground">{u.email}</td>
                          <td className="p-3">
                            <Badge variant="outline" className={`font-semibold text-[9px] ${
                              u.role === 'SYSTEM_OWNER' ? 'border-primary/30 text-primary bg-primary/5' : 'text-muted-foreground'
                            }`}>
                              {u.role}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {u.isVerified ? (
                              <Badge variant="outline" className="border-green-500/20 text-green-500 bg-green-500/5 text-[9px] flex items-center gap-1.5 w-fit">
                                <CheckCircle className="h-3 w-3" /> Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-red-500/20 text-red-500 bg-red-500/5 text-[9px] flex items-center gap-1.5 w-fit">
                                <XCircle className="h-3 w-3" /> Unverified
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground font-mono text-[10px]">{u.oauthProvider || 'email'}</td>
                          <td className="p-3 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2.5 text-primary hover:bg-primary/5 hover:text-primary gap-1"
                              onClick={() => handleEditUser(u)}
                            >
                              <Edit className="h-3.5 w-3.5" /> Manage
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-muted-foreground">No matching user records found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Edit User Modal Dialog */}
      <Dialog open={editingUser !== null} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modify User Access</DialogTitle>
            <DialogDescription>
              Modify name, email, credentials, global roles, or verification states for user <strong className="text-foreground">{editingUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <form onSubmit={handleSaveUserUpdate} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="usr-name" className="text-xs font-semibold">Full Name</label>
                <Input
                  id="usr-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="usr-email" className="text-xs font-semibold">Email Address</label>
                <Input
                  id="usr-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="role-select" className="text-xs font-semibold text-muted-foreground">Security Role Assignment</label>
                <select
                  id="role-select"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="USER">USER</option>
                  <option value="SYSTEM_OWNER">SYSTEM_OWNER</option>
                  <option value="BUSINESS_OWNER">BUSINESS_OWNER</option>
                  <option value="STAFF">STAFF</option>
                  <option value="CUSTOMER">CUSTOMER</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-muted/20 border border-border/50 rounded-lg">
                <div>
                  <h4 className="text-xs font-semibold">Verified Account Status</h4>
                  <p className="text-[10px] text-muted-foreground">Toggling this flag bypasses email OTP activation requirements</p>
                </div>
                <input
                  type="checkbox"
                  checked={editVerified}
                  onChange={(e) => setEditVerified(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="submit" disabled={dialogSubmitting} className="font-semibold">
                  {dialogSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
