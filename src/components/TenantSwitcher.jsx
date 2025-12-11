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

const TenantSwitcher = () => {
  const { tenant, agentProfile, switchTenant, loading: contextLoading } = useTenant();
  const [tenants, setTenants] = useState([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Check super admin status from database
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

  // Fetch tenants only if super admin
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

  // Only show for super admins after loading
  if (contextLoading || !isSuperAdmin || tenantsLoading) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Select
        value={tenant?.id || ''}
        onValueChange={(tenantId) => {
          const selectedTenant = tenants.find(t => t.id === tenantId);
          if (selectedTenant) {
            switchTenant(selectedTenant);
          }
        }}
      >
        <SelectTrigger className="w-[200px] bg-background border-border shadow-lg">
          <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Select company" />
        </SelectTrigger>
        <SelectContent className="bg-background border-border z-[100]">
          {tenants.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TenantSwitcher;
