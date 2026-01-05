import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const TenantContext = createContext(null);

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
        setTenant(tenantData);
        setOriginalTenant(tenantData);
        
        localStorage.setItem('agentProfile', JSON.stringify(profile));
        localStorage.setItem('tenant', JSON.stringify(tenantData));
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
      const storedTenant = localStorage.getItem('tenant');
      const storedOriginalTenant = localStorage.getItem('originalTenant');
      
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        setAgentProfile(profile);
        
        if (profile.is_super_admin) {
          const selectedTenantId = localStorage.getItem('selectedTenantId');
          if (selectedTenantId && storedTenant) {
            const parsedTenant = JSON.parse(storedTenant);
            if (parsedTenant.id === selectedTenantId) {
              setTenant(parsedTenant);
            }
          } else if (storedTenant) {
            setTenant(JSON.parse(storedTenant));
          }
        } else if (storedTenant) {
          setTenant(JSON.parse(storedTenant));
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

  const value = {
    tenant,
    originalTenant,
    agentProfile,
    loading,
    loadTenantData,
    switchTenant,
    clearTenantData,
    isSuperAdmin: agentProfile?.is_super_admin || false,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};
