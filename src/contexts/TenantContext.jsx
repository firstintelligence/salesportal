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
  const [accessibleTenants, setAccessibleTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  // Impersonation state - only for super admin
  const [realAgentProfile, setRealAgentProfile] = useState(null);
  const [isImpersonating, setIsImpersonating] = useState(false);

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
        // Get all tenants the agent has access to from the junction table
        const { data: tenantAccess, error: accessError } = await supabase
          .from('agent_tenant_access')
          .select('tenant_id, tenants(*)')
          .eq('agent_id', agentId);

        let accessibleTenantsList = [];
        if (!accessError && tenantAccess) {
          accessibleTenantsList = tenantAccess
            .map(ta => ta.tenants)
            .filter(Boolean);
        }

        // Fallback to the agent_profiles.tenant_id if no junction table entries
        let tenantData = null;
        if (accessibleTenantsList.length > 0) {
          tenantData = accessibleTenantsList[0];
        } else if (profile.tenant_id) {
          const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', profile.tenant_id)
            .single();
          
          if (!tenantError && tenant) {
            tenantData = tenant;
            accessibleTenantsList = [tenant];
          }
        }

        setAgentProfile(profile);
        setAccessibleTenants(accessibleTenantsList);
        
        // Clear any previously selected tenant that's no longer accessible
        const previousSelectedTenantId = localStorage.getItem('selectedTenantId');
        if (previousSelectedTenantId && 
            previousSelectedTenantId !== SUPER_ADMIN_TENANT.id &&
            !accessibleTenantsList.some(t => t.id === previousSelectedTenantId)) {
          // User no longer has access to previously selected tenant - clear it
          localStorage.removeItem('selectedTenantId');
          localStorage.removeItem('tenant');
        }
        
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
          // For non-super-admins with multiple tenants, check for saved selection
          const selectedTenantId = localStorage.getItem('selectedTenantId');
          if (selectedTenantId && accessibleTenantsList.some(t => t.id === selectedTenantId)) {
            const selectedTenant = accessibleTenantsList.find(t => t.id === selectedTenantId);
            setTenant(selectedTenant);
          } else {
            setTenant(tenantData);
          }
        }
        
        setOriginalTenant(tenantData);
        
        localStorage.setItem('agentProfile', JSON.stringify(profile));
        localStorage.setItem('originalTenant', JSON.stringify(tenantData));
        localStorage.setItem('accessibleTenants', JSON.stringify(accessibleTenantsList));
        
        return profile;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading tenant data:', error);
      return null;
    }
  };

  const switchTenant = (newTenant) => {
    // Allow switching for super admins or agents with multiple tenant access
    if (!agentProfile?.is_super_admin && accessibleTenants.length <= 1) {
      return;
    }
    
    // For non-super-admins, only allow switching to accessible tenants
    if (!agentProfile?.is_super_admin && !accessibleTenants.some(t => t.id === newTenant.id)) {
      return;
    }
    
    setTenant(newTenant);
    localStorage.setItem('tenant', JSON.stringify(newTenant));
    localStorage.setItem('selectedTenantId', newTenant.id);
  };

  // Login as another agent (super admin only)
  const loginAsAgent = async (targetAgentId) => {
    // Only allow if current real user is super admin
    const currentReal = realAgentProfile || agentProfile;
    if (!currentReal?.is_super_admin) return false;

    try {
      const { data: targetProfile, error } = await supabase
        .from('agent_profiles')
        .select('*')
        .eq('agent_id', targetAgentId)
        .single();

      if (error || !targetProfile) return false;

      // Store the real admin profile if not already impersonating
      if (!isImpersonating) {
        setRealAgentProfile(agentProfile);
        localStorage.setItem('realAgentProfile', JSON.stringify(agentProfile));
        localStorage.setItem('realAgentId', agentProfile.agent_id);
      }

      // Load target agent's tenant data
      const { data: tenantAccess } = await supabase
        .from('agent_tenant_access')
        .select('tenant_id, tenants(*)')
        .eq('agent_id', targetAgentId);

      let targetTenantsList = [];
      if (tenantAccess) {
        targetTenantsList = tenantAccess.map(ta => ta.tenants).filter(Boolean);
      }

      let targetTenant = null;
      if (targetTenantsList.length > 0) {
        targetTenant = targetTenantsList[0];
      } else if (targetProfile.tenant_id) {
        const { data: t } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', targetProfile.tenant_id)
          .single();
        if (t) {
          targetTenant = t;
          targetTenantsList = [t];
        }
      }

      setAgentProfile(targetProfile);
      setAccessibleTenants(targetTenantsList);
      setTenant(targetTenant);
      setOriginalTenant(targetTenant);
      setIsImpersonating(true);

      localStorage.setItem('agentProfile', JSON.stringify(targetProfile));
      localStorage.setItem('agentId', targetProfile.agent_id);
      localStorage.setItem('isImpersonating', 'true');
      localStorage.setItem('tenant', JSON.stringify(targetTenant));
      localStorage.setItem('selectedTenantId', targetTenant?.id || '');
      localStorage.setItem('accessibleTenants', JSON.stringify(targetTenantsList));
      if (targetProfile.phone) {
        localStorage.setItem('agentPhone', targetProfile.phone);
      }

      return true;
    } catch (error) {
      console.error('Error impersonating agent:', error);
      return false;
    }
  };

  // Stop impersonating and return to super admin
  const stopImpersonating = async () => {
    const adminProfile = realAgentProfile || JSON.parse(localStorage.getItem('realAgentProfile') || 'null');
    if (!adminProfile) return;

    // Restore admin profile
    setAgentProfile(adminProfile);
    setRealAgentProfile(null);
    setIsImpersonating(false);

    localStorage.setItem('agentProfile', JSON.stringify(adminProfile));
    localStorage.setItem('agentId', adminProfile.agent_id);
    localStorage.removeItem('realAgentProfile');
    localStorage.removeItem('realAgentId');
    localStorage.removeItem('isImpersonating');
    if (adminProfile.phone) {
      localStorage.setItem('agentPhone', adminProfile.phone);
    }

    // Reload admin's tenant data
    await loadTenantData(adminProfile.agent_id);
  };

  const initializeFromStorage = () => {
    try {
      const storedProfile = localStorage.getItem('agentProfile');
      const storedOriginalTenant = localStorage.getItem('originalTenant');
      const storedAccessibleTenants = localStorage.getItem('accessibleTenants');
      const storedRealProfile = localStorage.getItem('realAgentProfile');
      const storedIsImpersonating = localStorage.getItem('isImpersonating') === 'true';
      
      if (storedAccessibleTenants) {
        setAccessibleTenants(JSON.parse(storedAccessibleTenants));
      }

      if (storedRealProfile) {
        setRealAgentProfile(JSON.parse(storedRealProfile));
        setIsImpersonating(storedIsImpersonating);
      }
      
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        setAgentProfile(profile);
        
        // When impersonating, use the impersonated agent's tenant
        // When not impersonating and super admin, use super admin logic
        if (!storedIsImpersonating && profile.is_super_admin) {
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
    setAccessibleTenants([]);
    setRealAgentProfile(null);
    setIsImpersonating(false);
    localStorage.removeItem('agentProfile');
    localStorage.removeItem('tenant');
    localStorage.removeItem('originalTenant');
    localStorage.removeItem('selectedTenantId');
    localStorage.removeItem('accessibleTenants');
    localStorage.removeItem('realAgentProfile');
    localStorage.removeItem('realAgentId');
    localStorage.removeItem('isImpersonating');
  };

  // Helper to check if currently viewing all tenants
  const isViewingAllTenants = tenant?.isAllTenants === true;
  
  // Helper to check if agent has multi-tenant access
  const hasMultiTenantAccess = accessibleTenants.length > 1;

  // The real super admin status - check the real profile if impersonating
  const isTrulySuperAdmin = isImpersonating 
    ? (realAgentProfile?.is_super_admin || false) 
    : (agentProfile?.is_super_admin || false);

  const value = {
    tenant,
    originalTenant,
    agentProfile,
    accessibleTenants,
    loading,
    loadTenantData,
    switchTenant,
    clearTenantData,
    isSuperAdmin: isTrulySuperAdmin,
    isViewingAllTenants,
    hasMultiTenantAccess,
    SUPER_ADMIN_TENANT,
    // Impersonation
    isImpersonating,
    realAgentProfile,
    loginAsAgent,
    stopImpersonating,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};
