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
  const { tenant, isSuperAdmin, switchTenant, loading: contextLoading } = useTenant();
  const [tenants, setTenants] = useState([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);

  useEffect(() => {
    const fetchTenants = async () => {
      if (contextLoading || !isSuperAdmin) {
        setTenantsLoading(false);
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
  }, [isSuperAdmin, contextLoading]);

  // Only show for super admins after context is loaded
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
