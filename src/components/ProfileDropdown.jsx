import React, { useEffect, useState } from 'react';
import { useTenant, SUPER_ADMIN_TENANT } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { Building2, LogOut, ChevronDown, Check, Trophy, UserCircle2, UserCog, ArrowLeftRight, Search, HelpCircle, Users } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';

const ProfileDropdown = () => {
  const navigate = useNavigate();
  const { 
    tenant, agentProfile, accessibleTenants, switchTenant, 
    loading: contextLoading, hasMultiTenantAccess,
    isImpersonating, realAgentProfile, loginAsAgent, stopImpersonating, isSuperAdmin 
  } = useTenant();
  const [tenants, setTenants] = useState([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [tenantExpanded, setTenantExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loginAsOpen, setLoginAsOpen] = useState(false);
  const [agents, setAgents] = useState([]);
  const [agentSearch, setAgentSearch] = useState('');
  const [agentsLoading, setAgentsLoading] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchTenants = async () => {
      if (isSuperAdmin && !isImpersonating) {
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .order('name');

        if (!error && data) {
          setTenants([SUPER_ADMIN_TENANT, ...data]);
        }
      } else if (hasMultiTenantAccess && accessibleTenants.length > 0) {
        setTenants(accessibleTenants);
      }
      setTenantsLoading(false);
    };

    if ((isSuperAdmin && !isImpersonating) || hasMultiTenantAccess) {
      fetchTenants();
    } else {
      setTenantsLoading(false);
    }
  }, [isSuperAdmin, isImpersonating, hasMultiTenantAccess, accessibleTenants]);

  // Fetch all agents when Login As dialog opens
  useEffect(() => {
    if (!loginAsOpen) return;
    const fetchAgents = async () => {
      setAgentsLoading(true);
      const { data, error } = await supabase
        .from('agent_profiles')
        .select('agent_id, first_name, last_name, tenant_id, tenants(name)')
        .order('first_name');
      if (!error && data) {
        setAgents(data);
      }
      setAgentsLoading(false);
    };
    fetchAgents();
  }, [loginAsOpen]);

  const showTenantSwitcher = ((isSuperAdmin && !isImpersonating) || hasMultiTenantAccess) && !tenantsLoading && tenants.length > 1;

  const handleLogout = () => {
    localStorage.removeItem('authenticated');
    localStorage.removeItem('agentId');
    localStorage.removeItem('realAgentProfile');
    localStorage.removeItem('realAgentId');
    localStorage.removeItem('isImpersonating');
    navigate('/');
  };

  const handleLoginAs = async (targetAgentId) => {
    const success = await loginAsAgent(targetAgentId);
    if (success) {
      setLoginAsOpen(false);
      setAgentSearch('');
      toast.success(`Now viewing as ${targetAgentId}`);
      navigate('/landing');
    } else {
      toast.error('Failed to switch profile');
    }
  };

  const handleStopImpersonating = async () => {
    await stopImpersonating();
    toast.success('Returned to Super Admin profile');
    navigate('/landing');
  };

  if (contextLoading) {
    return null;
  }

  const filteredAgents = agents.filter(a => {
    if (!agentSearch) return true;
    const search = agentSearch.toLowerCase();
    return (
      a.agent_id.toLowerCase().includes(search) ||
      (a.first_name || '').toLowerCase().includes(search) ||
      (a.last_name || '').toLowerCase().includes(search)
    );
  }).filter(a => a.agent_id !== agentProfile?.agent_id);

  return (
    <>
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-3 py-1.5 flex items-center justify-between text-xs sm:text-sm font-medium shadow-md">
          <div className="flex items-center gap-2">
            <UserCog className="w-4 h-4" />
            <span>Viewing as <strong>{agentProfile?.first_name} {agentProfile?.last_name || ''}</strong> ({agentProfile?.agent_id})</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLoginAsOpen(true)}
              className="text-white hover:bg-amber-600 h-7 px-2 text-xs"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 mr-1" />
              Switch
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStopImpersonating}
              className="text-white hover:bg-amber-600 h-7 px-2 text-xs font-semibold"
            >
              Back to Admin
            </Button>
          </div>
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg transition-all duration-200 ${
              isImpersonating 
                ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' 
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCircle2 className="w-5 h-5" />
            <ChevronDown className="w-3 h-3 hidden sm:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 bg-white border border-slate-200 shadow-lg z-50">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium text-slate-900">{agentProfile?.first_name || 'Agent'}</p>
              <p className="text-xs text-slate-500">ID: {agentProfile?.agent_id}</p>
              {isImpersonating && (
                <p className="text-xs text-amber-600 font-medium">Viewing as this agent (Super Admin)</p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Tenant Switcher - hide when impersonating */}
          {showTenantSwitcher && !isImpersonating && (
            <>
              {isMobile ? (
                <Collapsible open={tenantExpanded} onOpenChange={setTenantExpanded}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between w-full px-2 py-1.5 text-sm cursor-pointer hover:bg-slate-100 rounded-sm">
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 mr-2 text-slate-500" />
                        <span className="truncate text-slate-700">{tenant?.name || 'Switch Company'}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${tenantExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="max-h-48 overflow-y-auto pl-4 border-l-2 border-slate-200 ml-4 mt-1 mb-1">
                      {tenants.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => { switchTenant(t); setTenantExpanded(false); }}
                          className={`flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-slate-100 rounded-sm ${tenant?.id === t.id ? 'bg-slate-100' : ''} ${t.isAllTenants ? 'font-semibold text-amber-600' : 'text-slate-700'}`}
                        >
                          {tenant?.id === t.id && <Check className="w-3 h-3 mr-2 text-primary" />}
                          <span className={tenant?.id === t.id ? '' : 'ml-5'}>{t.name}</span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-slate-700">
                    <Building2 className="w-4 h-4 mr-2 text-slate-500" />
                    <span className="truncate">{tenant?.name || 'Switch Company'}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-64 max-h-80 overflow-y-auto bg-white border border-slate-200 shadow-lg">
                    {tenants.map((t) => (
                      <DropdownMenuItem
                        key={t.id}
                        onClick={() => switchTenant(t)}
                        className={`${tenant?.id === t.id ? 'bg-slate-100' : ''} ${t.isAllTenants ? 'font-semibold text-amber-600' : 'text-slate-700'}`}
                      >
                        {t.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              <DropdownMenuSeparator />
            </>
          )}

          {/* Login As - only for super admin */}
          {isSuperAdmin && (
            <>
              <DropdownMenuItem 
                onClick={() => setLoginAsOpen(true)} 
                className="text-slate-700 cursor-pointer"
              >
                <UserCog className="w-4 h-4 mr-2 text-indigo-500" />
                Login As...
              </DropdownMenuItem>
              {isImpersonating && (
                <DropdownMenuItem 
                  onClick={handleStopImpersonating} 
                  className="text-amber-600 cursor-pointer font-medium"
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Back to Super Admin
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* Stats Link */}
          <DropdownMenuItem onClick={() => navigate('/stats')} className="text-slate-700 cursor-pointer">
            <Trophy className="w-4 h-4 mr-2 text-amber-500" />
            View Stats
          </DropdownMenuItem>

          {/* Help Link */}
          <DropdownMenuItem onClick={() => navigate('/help')} className="text-slate-700 cursor-pointer">
            <HelpCircle className="w-4 h-4 mr-2 text-blue-500" />
            How to Use
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Login As Dialog */}
      <Dialog open={loginAsOpen} onOpenChange={setLoginAsOpen}>
        <DialogContent className="max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-indigo-500" />
              Login As Agent
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name or ID..."
              value={agentSearch}
              onChange={(e) => setAgentSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="max-h-[50vh] overflow-y-auto space-y-1">
            {agentsLoading ? (
              <p className="text-center text-sm text-slate-500 py-4">Loading agents...</p>
            ) : filteredAgents.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-4">No agents found</p>
            ) : (
              filteredAgents.map((agent) => (
                <div
                  key={agent.agent_id}
                  onClick={() => handleLoginAs(agent.agent_id)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {agent.first_name} {agent.last_name || ''}
                    </p>
                    <p className="text-xs text-slate-500">{agent.agent_id}</p>
                  </div>
                  <span className="text-xs text-slate-400">{agent.tenants?.name || ''}</span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileDropdown;
