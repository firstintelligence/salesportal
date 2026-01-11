import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const TenantContext = createContext(null);

// Special Super Admin tenant that represents "all tenants combined"
export const SUPER_ADMIN_TENANT = {
  id: 'super-admin-all',
  name: 'Super Admin',
  slug: 'super-admin',
  logo_url: null,
  address: null,
  phone: null,
  email: null,
  isAllTenants: true, // Flag to identify this special tenant
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState(null);
  const [originalTenant, setOriginalTenant] = useState(null);
  const [agentProfile, setAgentProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadTenantData = async (agentId) => {
    try {
      // First get the agent profile
      const { data: profile, error: profileError } = await supabase
        .from('agent_profiles')
        .select('*')
        .eq('agent_id', agentId)
        .single();

      if (profileError) {
        console.error('Error fetching agent profile:', profileError);
        return null;
      }

      if (profile) {
        // Then get the tenant separately if tenant_id exists
        let tenantData = null;
        if (profile.tenant_id) {
          const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', profile.tenant_id)
            .single();
          
          if (tenantError) {
            console.error('Error fetching tenant:', tenantError);
          } else {
            tenantData = tenant;
          }
        }

        setAgentProfile(profile);
        
        // If super admin, default to the Super Admin tenant (all tenants view)
        if (profile.is_super_admin) {
          const selectedTenantId = localStorage.getItem('selectedTenantId');
          if (selectedTenantId === SUPER_ADMIN_TENANT.id) {
            setTenant(SUPER_ADMIN_TENANT);
          } else if (selectedTenantId) {
            // Load the specific tenant they had selected
            const { data: selectedTenant } = await supabase
              .from('tenants')
              .select('*')
              .eq('id', selectedTenantId)
              .single();
            setTenant(selectedTenant || SUPER_ADMIN_TENANT);
          } else {
            // Default to Super Admin tenant for super admins
            setTenant(SUPER_ADMIN_TENANT);
          }
        } else {
          setTenant(tenantData);
        }
        
        setOriginalTenant(tenantData);
        
        localStorage.setItem('agentProfile', JSON.stringify(profile));
        localStorage.setItem('originalTenant', JSON.stringify(tenantData));
        
        return profile;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading tenant data:', error);
      return null;
    }
  };

  const switchTenant = (newTenant) => {
    if (!agentProfile?.is_super_admin) {
      return;
    }
    
    setTenant(newTenant);
    localStorage.setItem('tenant', JSON.stringify(newTenant));
    localStorage.setItem('selectedTenantId', newTenant.id);
  };

  const initializeFromStorage = () => {
    try {
      const storedProfile = localStorage.getItem('agentProfile');
      const storedOriginalTenant = localStorage.getItem('originalTenant');
      
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        setAgentProfile(profile);
        
        if (profile.is_super_admin) {
          const selectedTenantId = localStorage.getItem('selectedTenantId');
          if (selectedTenantId === SUPER_ADMIN_TENANT.id) {
            setTenant(SUPER_ADMIN_TENANT);
          } else if (selectedTenantId) {
            const storedTenant = localStorage.getItem('tenant');
            if (storedTenant) {
              const parsedTenant = JSON.parse(storedTenant);
              if (parsedTenant.id === selectedTenantId) {
                setTenant(parsedTenant);
              } else {
                setTenant(SUPER_ADMIN_TENANT);
              }
            } else {
              setTenant(SUPER_ADMIN_TENANT);
            }
          } else {
            // Default to Super Admin tenant
            setTenant(SUPER_ADMIN_TENANT);
          }
        } else {
          const storedTenant = localStorage.getItem('tenant');
          if (storedTenant) {
            setTenant(JSON.parse(storedTenant));
          }
        }
      }
      
      if (storedOriginalTenant) {
        setOriginalTenant(JSON.parse(storedOriginalTenant));
      }
    } catch (error) {
      console.error('Error initializing from storage:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    initializeFromStorage();
  }, []);

  const clearTenantData = () => {
    setTenant(null);
    setOriginalTenant(null);
    setAgentProfile(null);
    localStorage.removeItem('agentProfile');
    localStorage.removeItem('tenant');
    localStorage.removeItem('originalTenant');
    localStorage.removeItem('selectedTenantId');
  };

  // Helper to check if currently viewing all tenants
  const isViewingAllTenants = tenant?.isAllTenants === true;

  const value = {
    tenant,
    originalTenant,
    agentProfile,
    loading,
    loadTenantData,
    switchTenant,
    clearTenantData,
    isSuperAdmin: agentProfile?.is_super_admin || false,
    isViewingAllTenants,
    SUPER_ADMIN_TENANT,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};
