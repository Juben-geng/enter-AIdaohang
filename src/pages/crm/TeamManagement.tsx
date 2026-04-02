import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Crown, UserPlus, Settings } from 'lucide-react';
import CreateAgencyDialog from '@/components/crm/CreateAgencyDialog';
import InviteMemberDialog from '@/components/crm/InviteMemberDialog';

interface Agency {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  plan: string;
  owner_id: string;
  created_at: string;
}

interface AgencyMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles?: {
    username: string | null;
    email: string | null;
  };
}

export default function TeamManagement() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();

  const [myAgency, setMyAgency] = useState<Agency | null>(null);
  const [members, setMembers] = useState<AgencyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const canAccessTeam = profile && ['vip', 'city_agent', 'national_agent'].includes(profile.membership_type);

  const fetchMyAgency = useCallback(async () => {
    if (!profile?.id) return;

    // 查找我创建的团队
    const { data: ownedAgency, error: ownedError } = await supabase
      .from('agencies')
      .select('*')
      .eq('owner_id', profile.id)
      .single();

    if (!ownedError && ownedAgency) {
      setMyAgency(ownedAgency);
      fetchMembers(ownedAgency.id);
      return;
    }

    // 查找我加入的团队
    const { data: membershipData, error: membershipError } = await supabase
      .from('agency_members')
      .select('agency_id')
      .eq('user_id', profile.id)
      .single();

    if (!membershipError && membershipData) {
      const { data: agency, error: agencyError } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', membershipData.agency_id)
        .single();

      if (!agencyError && agency) {
        setMyAgency(agency);
        fetchMembers(agency.id);
      }
    }

    setLoading(false);
  }, [profile?.id]);

  const fetchMembers = async (agencyId: string) => {
    const { data, error } = await supabase
      .from('agency_members')
      .select(`
        *,
        profiles (
          username,
          email
        )
      `)
      .eq('agency_id', agencyId)
      .order('created_at');

    if (!error && data) {
      setMembers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!canAccessTeam) {
      toast({
        title: '权限不足',
        description: '请升级到VIP会员或以上等级',
        variant: 'destructive',
      });
      navigate('/member');
      return;
    }

    fetchMyAgency();
  }, [canAccessTeam, fetchMyAgency, navigate, toast]);

  const isOwner = myAgency && profile && myAgency.owner_id === profile.id;

  const roleMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    owner: { label: '所有者', variant: 'default' },
    admin: { label: '管理员', variant: 'secondary' },
    member: { label: '成员', variant: 'outline' },
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">团队协作</h1>
          <p className="text-muted-foreground mt-1">管理团队成员和权限</p>
        </div>
        {!myAgency && (
          <Button onClick={() => setShowCreateDialog(true)} className="bg-gradient-brand">
            <Plus className="w-4 h-4 mr-2" />
            创建团队
          </Button>
        )}
      </div>

      {!myAgency ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">暂无团队</h3>
            <p className="text-muted-foreground mb-4">创建团队后，您可以邀请成员协作管理客户和订单</p>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-gradient-brand">
              <Plus className="w-4 h-4 mr-2" />
              创建团队
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Agency Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-brand rounded-lg flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{myAgency.name}</CardTitle>
                    {myAgency.description && (
                      <p className="text-muted-foreground mt-1">{myAgency.description}</p>
                    )}
                  </div>
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      设置
                    </Button>
                    <Button size="sm" onClick={() => setShowInviteDialog(true)} className="bg-gradient-brand">
                      <UserPlus className="w-4 h-4 mr-2" />
                      邀请成员
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">团队成员</p>
                    <p className="text-2xl font-bold">{members.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Crown className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">管理员</p>
                    <p className="text-2xl font-bold">
                      {members.filter(m => m.role === 'admin').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">创建时间</p>
                    <p className="text-sm font-semibold">
                      {new Date(myAgency.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle>团队成员</CardTitle>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无成员，点击上方"邀请成员"添加团队成员
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => {
                    const roleInfo = roleMap[member.role] || roleMap.member;
                    
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-brand rounded-full flex items-center justify-center text-white font-semibold">
                            {member.profiles?.username?.[0]?.toUpperCase() || 
                             member.profiles?.email?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="font-semibold">
                              {member.profiles?.username || member.profiles?.email || '未知用户'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              加入时间：{new Date(member.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>
                          {isOwner && member.role !== 'owner' && (
                            <Button variant="ghost" size="sm">
                              管理
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <CreateAgencyDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={fetchMyAgency}
      />

      {myAgency && (
        <InviteMemberDialog
          open={showInviteDialog}
          onClose={() => setShowInviteDialog(false)}
          agencyId={myAgency.id}
          onSuccess={() => fetchMembers(myAgency.id)}
        />
      )}
    </div>
  );
}
