import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ChevronDown, ChevronRight, Users, Crown, Shield, User, GripVertical, BarChart3, FolderOpen } from "lucide-react";
import { toast } from "sonner";

const POSITION_OPTIONS = ["CEO", "Director", "Manager", "Team Lead", "Agent"];

const POSITION_ICONS = {
  CEO: Crown,
  Director: Shield,
  Manager: Shield,
  "Team Lead": Users,
  Agent: User,
};

const POSITION_COLORS = {
  CEO: "bg-amber-100 text-amber-800 border-amber-300",
  Director: "bg-purple-100 text-purple-800 border-purple-300",
  Manager: "bg-blue-100 text-blue-800 border-blue-300",
  "Team Lead": "bg-green-100 text-green-800 border-green-300",
  Agent: "bg-slate-100 text-slate-700 border-slate-300",
};

const UsersPage = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, agentProfile } = useTenant();
  const [agents, setAgents] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [editingAgent, setEditingAgent] = useState(null);
  const currentAgentId = localStorage.getItem("agentId");

  useEffect(() => {
    if (!localStorage.getItem("authenticated") || !isSuperAdmin) {
      navigate("/landing");
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [agentsRes, hierarchyRes, tenantsRes] = await Promise.all([
        supabase.from("agent_profiles").select("*").eq("is_contractor", false).order("first_name"),
        supabase.from("agent_hierarchy").select("*"),
        supabase.from("tenants").select("id, name, slug"),
      ]);

      if (agentsRes.data) setAgents(agentsRes.data);
      if (hierarchyRes.data) setHierarchy(hierarchyRes.data);
      if (tenantsRes.data) setTenants(tenantsRes.data);

      // Auto-expand all nodes
      if (hierarchyRes.data) {
        const ids = new Set(hierarchyRes.data.map((h) => h.agent_id));
        setExpandedNodes(ids);
      }
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getHierarchyRecord = (agentId) => hierarchy.find((h) => h.agent_id === agentId);
  const getTenantName = (tenantId) => tenants.find((t) => t.id === tenantId)?.name || "—";
  const getAgentName = (agent) => `${agent.first_name}${agent.last_name ? " " + agent.last_name : ""}`;

  // Build tree structure
  const buildTree = useCallback(() => {
    const hierarchyMap = {};
    hierarchy.forEach((h) => {
      hierarchyMap[h.agent_id] = h;
    });

    // Find root agents (no parent or parent not in hierarchy)
    const roots = [];
    const children = {};

    agents.forEach((agent) => {
      const h = hierarchyMap[agent.agent_id];
      const parentId = h?.parent_agent_id;

      if (!parentId) {
        roots.push(agent);
      } else {
        if (!children[parentId]) children[parentId] = [];
        children[parentId].push(agent);
      }
    });

    // Sort roots and children by sort_order then name
    const sortFn = (a, b) => {
      const ha = hierarchyMap[a.agent_id];
      const hb = hierarchyMap[b.agent_id];
      const orderA = ha?.sort_order ?? 999;
      const orderB = hb?.sort_order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return getAgentName(a).localeCompare(getAgentName(b));
    };

    roots.sort(sortFn);
    Object.values(children).forEach((arr) => arr.sort(sortFn));

    return { roots, children, hierarchyMap };
  }, [agents, hierarchy]);

  const toggleExpand = (agentId) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) next.delete(agentId);
      else next.add(agentId);
      return next;
    });
  };

  const handleSetParent = async (agentId, parentAgentId) => {
    const existing = getHierarchyRecord(agentId);
    const parentValue = parentAgentId === "none" ? null : parentAgentId;

    if (existing) {
      const { error } = await supabase
        .from("agent_hierarchy")
        .update({ parent_agent_id: parentValue })
        .eq("agent_id", agentId);
      if (error) {
        toast.error("Failed to update parent");
        return;
      }
    } else {
      const { error } = await supabase
        .from("agent_hierarchy")
        .insert({ agent_id: agentId, parent_agent_id: parentValue });
      if (error) {
        toast.error("Failed to set parent");
        return;
      }
    }
    toast.success("Hierarchy updated");
    loadData();
  };

  const handleSetPosition = async (agentId, positionTitle) => {
    const existing = getHierarchyRecord(agentId);

    if (existing) {
      const { error } = await supabase
        .from("agent_hierarchy")
        .update({ position_title: positionTitle })
        .eq("agent_id", agentId);
      if (error) {
        toast.error("Failed to update position");
        return;
      }
    } else {
      const { error } = await supabase
        .from("agent_hierarchy")
        .insert({ agent_id: agentId, position_title: positionTitle });
      if (error) {
        toast.error("Failed to set position");
        return;
      }
    }
    toast.success("Position updated");
    loadData();
  };

  // Determine visible agents based on hierarchy
  const getVisibleAgentIds = useCallback(() => {
    if (isSuperAdmin) return agents.map((a) => a.agent_id);

    // Current user can see themselves + subordinates
    const visible = new Set([currentAgentId]);
    const { children, hierarchyMap } = buildTree();

    const addChildren = (parentId) => {
      const kids = children[parentId] || [];
      kids.forEach((kid) => {
        visible.add(kid.agent_id);
        addChildren(kid.agent_id);
      });
    };
    addChildren(currentAgentId);

    // Also add peers at same level
    const myRecord = hierarchyMap[currentAgentId];
    if (myRecord?.parent_agent_id) {
      const peers = children[myRecord.parent_agent_id] || [];
      peers.forEach((p) => visible.add(p.agent_id));
    }

    return Array.from(visible);
  }, [agents, currentAgentId, isSuperAdmin, buildTree]);

  const renderAgentNode = (agent, depth, childrenMap, hierarchyMap) => {
    const h = hierarchyMap[agent.agent_id];
    const kids = childrenMap[agent.agent_id] || [];
    const hasChildren = kids.length > 0;
    const isExpanded = expandedNodes.has(agent.agent_id);
    const positionTitle = h?.position_title || "Agent";
    const PositionIcon = POSITION_ICONS[positionTitle] || User;
    const positionColor = POSITION_COLORS[positionTitle] || POSITION_COLORS.Agent;
    const isEditing = editingAgent === agent.agent_id;
    const isCurrentUser = agent.agent_id === currentAgentId;

    return (
      <div key={agent.agent_id}>
        <div
          className={`flex items-center gap-2 sm:gap-3 py-2.5 px-3 sm:px-4 rounded-lg transition-all duration-200 ${
            isCurrentUser ? "bg-primary/5 border border-primary/20" : "hover:bg-slate-50"
          }`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          {/* Expand/Collapse */}
          <button
            onClick={() => hasChildren && toggleExpand(agent.agent_id)}
            className={`w-5 h-5 flex items-center justify-center ${hasChildren ? "text-slate-400 hover:text-slate-600" : "text-transparent"}`}
          >
            {hasChildren && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
          </button>

          {/* Icon */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${positionColor} border`}>
            <PositionIcon className="w-4 h-4" />
          </div>

          {/* Name & Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-slate-800 truncate">{getAgentName(agent)}</span>
              <span className="text-xs text-slate-400">{agent.agent_id}</span>
              {agent.is_super_admin && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-700">Super Admin</Badge>}
              {isCurrentUser && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary text-primary">You</Badge>}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${positionColor} border`}>
                {positionTitle}
              </Badge>
              <span className="text-[11px] text-slate-400">{getTenantName(agent.tenant_id)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600"
              onClick={() => navigate(`/stats?agent=${agent.agent_id}`)}
              title="View Stats"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-slate-400 hover:text-green-600"
              onClick={() => navigate(`/customers?agent=${agent.agent_id}`)}
              title="View Deals"
            >
              <FolderOpen className="w-3.5 h-3.5" />
            </Button>
            {isSuperAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-slate-400 hover:text-slate-700"
                onClick={() => setEditingAgent(isEditing ? null : agent.agent_id)}
              >
                {isEditing ? "Done" : "Edit"}
              </Button>
            )}
          </div>
        </div>

        {/* Edit panel */}
        {isEditing && isSuperAdmin && (
          <div className="ml-12 mr-4 mb-2 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Position</label>
                <Select value={positionTitle} onValueChange={(val) => handleSetPosition(agent.agent_id, val)}>
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg z-50">
                    {POSITION_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Reports To</label>
                <Select
                  value={h?.parent_agent_id || "none"}
                  onValueChange={(val) => handleSetParent(agent.agent_id, val)}
                >
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg z-50">
                    <SelectItem value="none">— No Manager (Top Level) —</SelectItem>
                    {agents
                      .filter((a) => a.agent_id !== agent.agent_id)
                      .map((a) => (
                        <SelectItem key={a.agent_id} value={a.agent_id}>
                          {getAgentName(a)} ({a.agent_id})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Children */}
        {hasChildren && isExpanded && kids.map((child) => renderAgentNode(child, depth + 1, childrenMap, hierarchyMap))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const { roots, children: childrenMap, hierarchyMap } = buildTree();
  const visibleIds = new Set(getVisibleAgentIds());
  const visibleRoots = isSuperAdmin ? roots : roots.filter((r) => visibleIds.has(r.agent_id));

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 bg-white shadow-sm border-b border-slate-200 px-3 py-2.5 sm:px-6 sm:py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5" /> Team Hierarchy
            </h1>
            <p className="text-xs text-slate-500">{agents.length} agents</p>
          </div>
        </div>
      </header>

      <div className="px-3 py-4 sm:px-6 sm:py-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white p-2 sm:p-4">
            {visibleRoots.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">No hierarchy set up yet</p>
                {isSuperAdmin && <p className="text-sm mt-1">Click "Edit" on any agent to assign their position and manager.</p>}
              </div>
            ) : (
              <div className="space-y-0.5">
                {visibleRoots.map((agent) => renderAgentNode(agent, 0, childrenMap, hierarchyMap))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
