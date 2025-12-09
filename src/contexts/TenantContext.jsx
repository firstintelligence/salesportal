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
  const [agentProfile, setAgentProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadTenantData = async (agentId) => {
    try {
      // Fetch agent profile with tenant data
      const { data: profile, error: profileError } = await supabase
        .from('agent_profiles')
        .select(`
          *,
          tenants (*)
        `)
        .eq('agent_id', agentId)
        .single();

      if (profileError) {
        console.error('Error fetching agent profile:', profileError);
        return null;
      }

      if (profile) {
        setAgentProfile(profile);
        setTenant(profile.tenants);
        
        // Store in localStorage for persistence
        localStorage.setItem('agentProfile', JSON.stringify(profile));
        localStorage.setItem('tenant', JSON.stringify(profile.tenants));
        
        return profile;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading tenant data:', error);
      return null;
    }
  };

  const initializeFromStorage = () => {
    try {
      const storedProfile = localStorage.getItem('agentProfile');
      const storedTenant = localStorage.getItem('tenant');
      
      if (storedProfile) {
        setAgentProfile(JSON.parse(storedProfile));
      }
      if (storedTenant) {
        setTenant(JSON.parse(storedTenant));
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
    setAgentProfile(null);
    localStorage.removeItem('agentProfile');
    localStorage.removeItem('tenant');
  };

  const value = {
    tenant,
    agentProfile,
    loading,
    loadTenantData,
    clearTenantData,
    isSuperAdmin: agentProfile?.is_super_admin || false,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};
