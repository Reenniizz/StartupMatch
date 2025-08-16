/**
 * Dashboard Sidebar Component
 * Collapsible navigation sidebar with smooth animations
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardSidebarProps } from '../types/dashboard.types';

export function DashboardSidebar({
  collapsed,
  activeSection,
  onSetActiveSection,
  isDarkMode,
  items
}: DashboardSidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`border-r shadow-sm h-[calc(100vh-73px)] sticky top-[73px] transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="p-4">
        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <Link 
                key={item.id}
                href={item.href}
                className="block"
              >
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start relative transition-all duration-300 ${
                    collapsed ? "px-2" : "px-3"
                  } ${
                    isDarkMode 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  } ${
                    isActive && isDarkMode ? 'bg-gray-700 text-white' : ''
                  } ${
                    isActive && !isDarkMode ? 'bg-gray-100 text-gray-900' : ''
                  }`}
                  onClick={() => onSetActiveSection(item.id)}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${
                    collapsed ? "" : "mr-3"
                  }`} />
                  
                  {!collapsed && (
                    <motion.div 
                      className="flex items-center justify-between w-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <Badge 
                          variant="secondary" 
                          className={`ml-auto text-xs transition-colors duration-300 ${
                            isDarkMode 
                              ? 'bg-gray-600 text-gray-200' 
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </motion.div>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {collapsed && item.badge && (
                    <div className="absolute -right-1 -top-1">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs w-5 h-5 rounded-full flex items-center justify-center p-0 ${
                          isDarkMode 
                            ? 'bg-red-600 text-white' 
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {item.badge}
                      </Badge>
                    </div>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>
    </motion.aside>
  );
}
