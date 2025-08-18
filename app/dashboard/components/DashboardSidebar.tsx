/**
 * Minimalist Dashboard Sidebar Component
 * Clean, simple, and modern sidebar design
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, Heart, Search, MessageSquare, Users, Rocket, User, Settings, 
  HelpCircle
} from 'lucide-react';
import { DashboardSidebarProps } from '../types/dashboard.types';

// Simple navigation items
const navigationItems = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: Home, 
    href: '/dashboard'
  },
  { 
    id: 'matches', 
    label: 'Matches', 
    icon: Heart, 
    href: '/matches',
    badge: 3
  },
  { 
    id: 'explore', 
    label: 'Explore', 
    icon: Search, 
    href: '/explore'
  },
  { 
    id: 'messages', 
    label: 'Messages', 
    icon: MessageSquare, 
    href: '/messages',
    badge: 2
  },
  { 
    id: 'grupos', 
    label: 'Groups', 
    icon: Users, 
    href: '/grupos',
    badge: 5
  },
  { 
    id: 'projects', 
    label: 'Projects', 
    icon: Rocket, 
    href: '/projects'
  },
  { 
    id: 'profile', 
    label: 'Profile', 
    icon: User, 
    href: '/profile'
  },
  { 
    id: 'settings', 
    label: 'Settings', 
    icon: Settings, 
    href: '/settings'
  }
];

export function DashboardSidebar({
  collapsed,
  activeSection,
  onSetActiveSection,
  isDarkMode,
  items
}: DashboardSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const renderNavItem = (item: any, index: number) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    return (
      <Link key={item.id} href={item.href}>
        <div
          className={`group relative flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
            collapsed ? 'justify-center' : 'justify-start'
          } ${
            isActive
              ? isDarkMode
                ? 'bg-blue-600 text-white'
                : 'bg-blue-600 text-white'
              : isDarkMode
                ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          {/* Icon */}
          <Icon className={`w-5 h-5 flex-shrink-0 ${!collapsed ? 'mr-3' : ''}`} />
          
          {/* Label */}
          {!collapsed && (
            <span className="font-medium text-sm">{item.label}</span>
          )}
          
          {/* Badge */}
          {item.badge && (
            <div className={`${
              collapsed 
                ? 'absolute -top-1 -right-1 w-5 h-5' 
                : 'ml-auto px-2 py-0.5 min-w-[20px] h-5'
            } bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium`}>
              {collapsed && item.badge > 9 ? '9+' : item.badge}
            </div>
          )}

          {/* Tooltip for collapsed state */}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {item.label}
            </div>
          )}
        </div>
      </Link>
    );
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={`border-r h-[calc(100vh-73px)] sticky top-[73px] transition-colors duration-200 ${
        isDarkMode 
          ? 'bg-slate-900 border-slate-800' 
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="p-3">
        <nav className="space-y-1">
          {navigationItems.map((item, index) => renderNavItem(item, index))}
        </nav>
      </div>
    </motion.aside>
  );
}
