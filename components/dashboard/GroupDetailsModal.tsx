"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Users, 
  MessageSquare, 
  Calendar, 
  MapPin, 
  Clock,
  CheckCircle,
  Lock,
  UserPlus,
  Settings,
  Shield,
  Tag,
  Eye,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthProvider";

interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface GroupDetailsProps {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  messagesCount?: number;
  isPrivate: boolean;
  lastActivity: string;
  tags: string[];
  isMember: boolean;
  isVerified?: boolean;
  location?: string;
  created_at?: string;
  created_by?: string;
}

interface GroupDetailsModalProps {
  group: GroupDetailsProps | null;
  isOpen: boolean;
  onClose: () => void;
  onJoinGroup: (groupId: string) => void;
}

export default function GroupDetailsModal({ 
  group, 
  isOpen, 
  onClose, 
  onJoinGroup 
}: GroupDetailsModalProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Cargar miembros del grupo cuando se abre el modal
  useEffect(() => {
    if (isOpen && group && group.isMember) {
      loadGroupMembers();
    }
  }, [isOpen, group]);

  const loadGroupMembers = async () => {
    if (!group) return;
    
    setIsLoadingMembers(true);
    try {
      const response = await fetch(`/api/groups/${group.id}/members`);
      if (response.ok) {
        const membersData = await response.json();
        setMembers(membersData);
      }
    } catch (error) {
      console.error('Error loading group members:', error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const getCoverGradient = (category: string, groupName?: string) => {
    const categoryGradients = {
      'Industria': 'from-emerald-500 to-teal-600',
      'Tecnología': 'from-purple-500 to-indigo-600', 
      'Stage': 'from-orange-500 to-red-600',
      'Inversión': 'from-green-500 to-emerald-600',
      'Ubicación': 'from-blue-500 to-cyan-600',
      'Comunidad': 'from-pink-500 to-rose-600'
    };

    if (categoryGradients[category as keyof typeof categoryGradients]) {
      return categoryGradients[category as keyof typeof categoryGradients];
    }

    if (groupName) {
      const hash = groupName.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      const gradients = [
        'from-slate-500 to-gray-600',
        'from-blue-500 to-indigo-600',
        'from-purple-500 to-pink-600',
        'from-green-500 to-teal-600',
        'from-yellow-500 to-orange-600',
        'from-red-500 to-pink-600'
      ];
      
      return gradients[Math.abs(hash) % gradients.length];
    }

    return 'from-slate-500 to-gray-600';
  };

  if (!group) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Header con Cover */}
              <div className={`h-32 bg-gradient-to-br ${getCoverGradient(group.category, group.name)} relative`}>
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
                
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                  {group.isVerified && (
                    <Badge className="bg-white/20 text-white border-white/30">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verificado
                    </Badge>
                  )}
                  {group.isPrivate && (
                    <div className="p-1 bg-white/20 rounded-full">
                      <Lock className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                <div className="absolute bottom-4 left-4">
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center text-xl font-bold text-slate-700 border-4 border-white">
                    {group.name.substring(0, 2).toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[calc(90vh-8rem)] overflow-y-auto">
                {/* Group Info */}
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-2xl font-bold text-slate-900">{group.name}</h2>
                    <Badge variant="outline" className="border-slate-300">
                      {group.category}
                    </Badge>
                  </div>
                  
                  <p className="text-slate-600 leading-relaxed mb-4">
                    {group.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <Users className="h-5 w-5 text-slate-600" />
                      </div>
                      <div className="text-lg font-semibold text-slate-900">{group.memberCount}</div>
                      <div className="text-xs text-slate-500">Miembros</div>
                    </div>
                    
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <MessageSquare className="h-5 w-5 text-slate-600" />
                      </div>
                      <div className="text-lg font-semibold text-slate-900">
                        {group.messagesCount || 0}
                      </div>
                      <div className="text-xs text-slate-500">Mensajes</div>
                    </div>
                    
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <Clock className="h-5 w-5 text-slate-600" />
                      </div>
                      <div className="text-lg font-semibold text-slate-900">{group.lastActivity}</div>
                      <div className="text-xs text-slate-500">Última actividad</div>
                    </div>
                    
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        {group.isPrivate ? <Lock className="h-5 w-5 text-slate-600" /> : <Globe className="h-5 w-5 text-slate-600" />}
                      </div>
                      <div className="text-lg font-semibold text-slate-900">
                        {group.isPrivate ? 'Privado' : 'Público'}
                      </div>
                      <div className="text-xs text-slate-500">Tipo</div>
                    </div>
                  </div>

                  {/* Tags */}
                  {group.tags && group.tags.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center">
                        <Tag className="h-4 w-4 mr-2" />
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {group.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="border-slate-300 text-slate-600">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Members Preview */}
                  {group.isMember && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Miembros ({group.memberCount})
                      </h4>
                      
                      {isLoadingMembers ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map((n) => (
                            <div key={n} className="flex items-center space-x-3 p-2">
                              <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse"></div>
                              <div className="flex-1">
                                <div className="h-4 bg-slate-200 rounded animate-pulse mb-1"></div>
                                <div className="h-3 bg-slate-200 rounded animate-pulse w-2/3"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {members.slice(0, 5).map((member) => (
                            <div key={member.id} className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-lg">
                              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                                {member.profile?.full_name ? member.profile.full_name.substring(0, 2).toUpperCase() : 'U'}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium text-slate-900">
                                  {member.profile?.full_name || 'Usuario'}
                                </div>
                                <div className="text-xs text-slate-500 capitalize">{member.role}</div>
                              </div>
                              {member.role === 'admin' && (
                                <Badge variant="outline" className="text-xs border-blue-300 text-blue-600">
                                  Admin
                                </Badge>
                              )}
                            </div>
                          ))}
                          {members.length > 5 && (
                            <div className="text-center text-sm text-slate-500 py-2">
                              +{members.length - 5} miembros más
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3 pt-4 border-t border-slate-200">
                  {group.isMember ? (
                    <>
                      <Button className="flex-1 bg-slate-900 hover:bg-slate-800">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Abrir Chat
                      </Button>
                      <Button variant="outline" className="border-slate-300">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        className="flex-1 bg-slate-900 hover:bg-slate-800"
                        onClick={() => {
                          onJoinGroup(group.id);
                          onClose();
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Unirse al Grupo
                      </Button>
                      <Button variant="outline" className="border-slate-300">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
