/**
 * Activity Item Component
 * Individual activity display component with icons and timestamps
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Heart, 
  UserPlus, 
  FolderOpen, 
  Bell,
  TrendingUp,
  Calendar,
  Award
} from 'lucide-react';
import { ActivityItemProps } from '../types/dashboard.types';

// Icon mapping for different activity types
const activityIcons = {
  message: MessageSquare,
  like: Heart,
  connection: UserPlus,
  project: FolderOpen,
  notification: Bell,
  trend: TrendingUp,
  event: Calendar,
  achievement: Award,
  match: UserPlus,
  profile: UserPlus,
};

export function ActivityItem({ activity, isDarkMode, index }: ActivityItemProps) {
  const IconComponent = activityIcons[activity.type as keyof typeof activityIcons] || Bell;
  
  // Get color scheme based on activity type
  const getActivityColors = (type: string) => {
    const colors = {
      message: 'blue',
      like: 'red',
      connection: 'green',
      project: 'purple',
      notification: 'yellow',
      trend: 'orange',
      event: 'indigo',
      achievement: 'pink',
      match: 'emerald',
      profile: 'cyan',
    };
    return colors[type as keyof typeof colors] || 'blue';
  };

  const colorScheme = getActivityColors(activity.type);

  return (
    <motion.div
      className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-300 cursor-pointer group ${
        isDarkMode 
          ? 'hover:bg-gray-700 border border-gray-700 hover:border-gray-600' 
          : 'hover:bg-slate-50 border border-slate-100 hover:border-slate-200'
      }`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Activity Icon */}
      <div className={`flex-shrink-0 p-2 rounded-lg bg-${colorScheme}-100 group-hover:bg-${colorScheme}-200 transition-colors duration-300`}>
        <IconComponent className={`h-4 w-4 text-${colorScheme}-600`} />
      </div>

      {/* Activity Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium mb-1 transition-colors duration-300 ${
          isDarkMode ? 'text-white group-hover:text-gray-100' : 'text-gray-900 group-hover:text-gray-800'
        }`}>
          {activity.title}
        </p>
        <p className={`text-xs transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-gray-600'
        }`}>
          {activity.description}
        </p>
      </div>

      {/* Timestamp */}
      <div className={`flex-shrink-0 text-xs transition-colors duration-300 ${
        isDarkMode ? 'text-gray-500 group-hover:text-gray-400' : 'text-gray-400 group-hover:text-gray-500'
      }`}>
        {activity.timestamp}
      </div>

      {/* Activity Badge (optional) */}
      {activity.badge && (
        <div className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium bg-${colorScheme}-100 text-${colorScheme}-800 transition-all duration-300 group-hover:bg-${colorScheme}-200`}>
          {activity.badge}
        </div>
      )}
    </motion.div>
  );
}
