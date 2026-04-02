import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the list of agent IDs visible to the current agent based on hierarchy.
 * Super admins see everyone. Others see themselves + all subordinates.
 * Returns null while loading, or an array of agent IDs.
 */
export const useHierarchyVisibility = (currentAgentId, isSuperAdmin) => {
  const [visibleAgentIds, setVisibleAgentIds] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentAgentId) return;

    if (isSuperAdmin) {
      setVisibleAgentIds(null); // null = no filtering needed
      setLoading(false);
      return;
    }

    const fetchSubordinates = async () => {
      try {
        const { data, error } = await supabase.rpc("get_subordinates", {
          root_agent_id: currentAgentId,
        });

        if (error) {
          console.error("Error fetching subordinates:", error);
          setVisibleAgentIds([currentAgentId]);
        } else {
          const ids = [currentAgentId, ...(data || []).map((r) => r.agent_id)];
          setVisibleAgentIds(ids);
        }
      } catch (err) {
        console.error("Error in hierarchy visibility:", err);
        setVisibleAgentIds([currentAgentId]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubordinates();
  }, [currentAgentId, isSuperAdmin]);

  return { visibleAgentIds, loading };
};
