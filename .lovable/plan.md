
## Agent Hierarchy & Visibility System

### 1. Database: `agent_hierarchy` table
- `agent_id` (text) — the agent
- `parent_agent_id` (text, nullable) — their manager (null = top of tree)
- `position_title` (text) — role label (e.g. "Director", "Team Lead", "Agent")
- `sort_order` (int) — ordering among siblings
- RLS: public read (app-level filtering handles visibility)

### 2. Database function: `get_subordinates(agent_id)`
- Recursive CTE that returns all agents below a given agent in the tree
- Used by the app to enforce "can see your level and below" rule

### 3. New page: `/users` — Agent Hierarchy Manager
- Tree view showing all agents organized by hierarchy
- Super admin can drag/rearrange or use dropdowns to set parent
- Each agent card shows: name, ID, tenant, position title
- Click an agent → navigate to their stats or deals view

### 4. Profile Dropdown: Add "Users" link (super admin only)
- Links to `/users`

### 5. Visibility enforcement
- **Stats page**: When viewing stats, agent can see their own stats + all subordinates
- **Dashboard/Deals**: Agent can see deals from themselves + all subordinates
- Uses the `get_subordinates()` function to get the list of visible agent IDs

### 6. Phase summary
- Migration: Create `agent_hierarchy` table + `get_subordinates` function
- New page: `UsersPage.jsx` with tree UI
- Update: ProfileDropdown (add Users link)
- Update: StatsPage + DashboardPage to use hierarchy visibility
