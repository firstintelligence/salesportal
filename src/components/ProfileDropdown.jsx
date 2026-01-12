import React, { useEffect, useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { User, Building2, Edit2, LogOut, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
const ProfileDropdown = () => {
  const navigate = useNavigate();
  const { tenant, agentProfile, switchTenant, loading: contextLoading } = useTenant();
  const [tenants, setTenants] = useState([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [nicknameDialogOpen, setNicknameDialogOpen] = useState(false);
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [tenantExpanded, setTenantExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (agentProfile?.first_name) {
      setNickname(agentProfile.first_name);
    }
  }, [agentProfile?.first_name]);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (contextLoading || !agentProfile?.agent_id) {
        return;
      }

      const { data, error } = await supabase
        .from('agent_profiles')
        .select('is_super_admin')
        .eq('agent_id', agentProfile.agent_id)
        .single();

      if (!error && data?.is_super_admin) {
        setIsSuperAdmin(true);
      } else {
        setIsSuperAdmin(false);
        setTenantsLoading(false);
      }
    };

    checkSuperAdmin();
  }, [contextLoading, agentProfile?.agent_id]);

  useEffect(() => {
    const fetchTenants = async () => {
      if (!isSuperAdmin) {
        return;
      }

      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('name');

      if (!error && data) {
        setTenants(data);
      }
      setTenantsLoading(false);
    };

    fetchTenants();
  }, [isSuperAdmin]);

  const handleSaveNickname = async () => {
    if (!agentProfile?.agent_id || !nickname.trim()) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('agent_profiles')
        .update({ first_name: nickname.trim() })
        .eq('agent_id', agentProfile.agent_id);

      if (error) throw error;
      
      toast.success('Nickname updated!');
      setNicknameDialogOpen(false);
      // Reload page to refresh context
      window.location.reload();
    } catch (error) {
      console.error('Error updating nickname:', error);
      toast.error('Failed to update nickname');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authenticated');
    localStorage.removeItem('agentId');
    navigate('/');
  };

  if (contextLoading) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm font-medium hidden sm:inline max-w-[80px] truncate">
              {agentProfile?.first_name || 'Profile'}
            </span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{agentProfile?.first_name || 'Agent'}</p>
              <p className="text-xs text-muted-foreground">{agentProfile?.agent_id}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setNicknameDialogOpen(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Nickname
          </DropdownMenuItem>
          
          {/* Tenant Switcher for Super Admins */}
          {isSuperAdmin && !tenantsLoading && tenants.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {/* Mobile: Use collapsible inline menu */}
              {isMobile ? (
                <Collapsible open={tenantExpanded} onOpenChange={setTenantExpanded}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between w-full px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm">
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 mr-2" />
                        <span className="truncate">{tenant?.name || 'Switch Company'}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${tenantExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="max-h-48 overflow-y-auto pl-4 border-l-2 border-muted ml-4 mt-1 mb-1">
                      {tenants.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            switchTenant(t);
                            setTenantExpanded(false);
                          }}
                          className={`flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm ${tenant?.id === t.id ? 'bg-accent' : ''}`}
                        >
                          {tenant?.id === t.id && <Check className="w-3 h-3 mr-2" />}
                          <span className={tenant?.id === t.id ? '' : 'ml-5'}>{t.name}</span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                /* Desktop: Use standard submenu */
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Building2 className="w-4 h-4 mr-2" />
                    <span className="truncate">{tenant?.name || 'Switch Company'}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-64 max-h-80 overflow-y-auto">
                    {tenants.map((t) => (
                      <DropdownMenuItem
                        key={t.id}
                        onClick={() => switchTenant(t)}
                        className={tenant?.id === t.id ? 'bg-accent' : ''}
                      >
                        {t.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
            </>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Nickname Dialog */}
      <Dialog open={nicknameDialogOpen} onOpenChange={setNicknameDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Your Nickname</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="nickname" className="text-sm font-medium">
              Display Name
            </Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              This is how your name will appear throughout the app.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNicknameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNickname} disabled={saving || !nickname.trim()}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileDropdown;
