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
        setOriginalTenant(profile.tenants);
        
        localStorage.setItem('agentProfile', JSON.stringify(profile));
        localStorage.setItem('tenant', JSON.stringify(profile.tenants));
        localStorage.setItem('originalTenant', JSON.stringify(profile.tenants));
        
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
