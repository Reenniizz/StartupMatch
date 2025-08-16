/**
 * Dashboard TypeScript Types
 * Centralized type definitions for dashboard components
 */

// === CORE DASHBOARD TYPES ===

export interface DashboardStats {
  connections: {
    total: number;
    weeklyChange: number;
    weeklyChangeText: string;
  };
  matches: {
    total: number;
    dailyNew: number;
    dailyNewText: string;
  };
  conversations: {
    total: number;
    unread: number;
    unreadText: string;
  };
  successRate: {
    percentage: number;
    change: number;
    changeText: string;
  };
}

export interface PopularGroup {
  id: string;
  name: string;
  memberCount: number;
  status: 'Miembro' | 'Activo' | 'Invitado';
  initials: string;
  gradient: string;
  recentMessages: number;
}

export interface ActivityItem {
  id: string;
  type: 'match' | 'message' | 'profile' | 'event';
  title: string;
  description: string;
  timestamp: string;
  timeAgo: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

// === SIDEBAR TYPES ===

export interface SidebarItem {
  id: string;
  label: string;
  icon: any; // Lucide React icon component
  href: string;
  badge?: string;
}

export interface SidebarState {
  collapsed: boolean;
  activeSection: string;
}

// === THEME TYPES ===

export type ThemeMode = 'light' | 'dark';

export interface ThemeState {
  mode: ThemeMode;
  isDarkMode: boolean;
}

// === DASHBOARD STATE ===

export interface DashboardState {
  sidebar: SidebarState;
  theme: ThemeState;
  userMenu: {
    isOpen: boolean;
  };
  loading: {
    stats: boolean;
    groups: boolean;
    activity: boolean;
  };
  error: {
    stats?: string;
    groups?: string;
    activity?: string;
  };
}

// === USER MENU TYPES ===

export interface UserMenuItem {
  id: string;
  label: string;
  icon: any;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'danger';
}

// === QUICK ACTION TYPES ===

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  href: string;
  color: 'purple' | 'blue' | 'green';
}

// === STATS CARD TYPES ===

export interface StatsCardData {
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
  color: 'blue' | 'purple' | 'green' | 'orange';
  gradient: string;
  loading?: boolean;
}

// === HOOK RETURN TYPES ===

export interface UseDashboardStateReturn {
  state: DashboardState;
  actions: {
    setSidebarCollapsed: (collapsed: boolean) => void;
    setActiveSection: (section: string) => void;
    toggleTheme: () => void;
    setThemeMode: (mode: ThemeMode) => void;
    toggleUserMenu: () => void;
    setUserMenuOpen: (open: boolean) => void;
    setLoading: (key: keyof DashboardState['loading'], loading: boolean) => void;
    setError: (key: keyof DashboardState['error'], error?: string) => void;
  };
}

export interface UseThemeReturn {
  isDarkMode: boolean;
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

export interface UseSidebarReturn {
  collapsed: boolean;
  activeSection: string;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setActiveSection: (section: string) => void;
}

// === COMPONENT PROPS ===

export interface DashboardHeaderProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  user: any; // Auth user type
}

export interface DashboardSidebarProps {
  collapsed: boolean;
  activeSection: string;
  onSetActiveSection: (section: string) => void;
  isDarkMode: boolean;
  items: SidebarItem[];
}

export interface StatsCardsProps {
  stats: DashboardStats | null;
  loading: boolean;
  error?: string;
  isDarkMode: boolean;
}

export interface StatsCardProps {
  data: StatsCardData;
  isDarkMode: boolean;
  index: number; // For animation delay
}

export interface QuickActionsProps {
  isDarkMode: boolean;
  actions: QuickAction[];
}

export interface QuickActionCardProps {
  action: QuickAction;
  isDarkMode: boolean;
}

export interface WelcomeSectionProps {
  user: any;
  isDarkMode: boolean;
  profileCompleteness?: number;
}

export interface PopularGroupsProps {
  groups: PopularGroup[];
  loading: boolean;
  isDarkMode: boolean;
}

export interface GroupItemProps {
  group: PopularGroup;
  isDarkMode: boolean;
  index: number;
}

export interface RecentActivityProps {
  activities: ActivityItem[];
  loading?: boolean;
  isDarkMode: boolean;
}

export interface ActivityItemProps {
  activity: ActivityItem;
  isDarkMode: boolean;
  index: number;
}

export interface UserMenuProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => Promise<void>;
  isDarkMode: boolean;
}
