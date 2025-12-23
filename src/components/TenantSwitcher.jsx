import React, { useEffect, useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';

// Inline version for use within page headers
export const TenantSwitcherInline = ({ className = '' }) => {
  const { tenant, agentProfile, switchTenant, loading: contextLoading } = useTenant();
  const [tenants, setTenants] = useState([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

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

  if (contextLoading || !isSuperAdmin || tenantsLoading) {
    return null;
  }

  return (
    <Select
      value={tenant?.id || ''}
      onValueChange={(tenantId) => {
        const selectedTenant = tenants.find(t => t.id === tenantId);
        if (selectedTenant) {
          switchTenant(selectedTenant);
        }
      }}
    >
      <SelectTrigger className={`w-[160px] sm:w-[180px] bg-background/80 backdrop-blur border-border/50 shadow-sm text-sm ${className}`}>
        <Building2 className="w-3.5 h-3.5 mr-1.5 text-muted-foreground flex-shrink-0" />
        <SelectValue placeholder="Select company" className="truncate" />
      </SelectTrigger>
      <SelectContent className="bg-background border-border z-[100]">
        {tenants.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Legacy fixed position version - now deprecated, use TenantSwitcherInline instead
const TenantSwitcher = () => {
  // Return null - the inline version should be used in page headers instead
  return null;
};

export default TenantSwitcher;
