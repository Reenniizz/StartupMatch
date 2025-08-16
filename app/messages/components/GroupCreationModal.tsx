'use client';

import React, { useState } from 'react';
import { GroupCreationModalProps } from '../types/messages.types';
import { cn } from '@/lib/utils';

/**
 * Modal avanzado para crear grupos con múltiples participantes
 * Incluye búsqueda de usuarios, configuración de grupo y permisos
 */
export function GroupCreationModal({
  isOpen,
  onClose,
  onCreateGroup,
  availableUsers,
  isLoading = false,
  className
}: GroupCreationModalProps) {
  const [step, setStep] = useState<'info' | 'members' | 'settings'>('info');
  const [groupData, setGroupData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    allowInvites: true,
    category: 'general'
  });
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter users based on search query
  const filteredUsers = React.useMemo(() => {
    if (!searchQuery.trim()) return availableUsers;
    
    const query = searchQuery.toLowerCase();
    return availableUsers.filter(user => 
      user.name.toLowerCase().includes(query)
    );
  }, [availableUsers, searchQuery]);

  const handleCreateGroup = async () => {
    try {
      await onCreateGroup({
        ...groupData,
        selectedMembers
      });
      handleReset();
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleReset = () => {
    setStep('info');
    setGroupData({
      name: '',
      description: '',
      isPrivate: false,
      allowInvites: true,
      category: 'general'
    });
    setSelectedMembers([]);
    setSearchQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={cn("fixed inset-0 z-50 overflow-y-auto", className)}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          
          {/* Header */}
          <ModalHeader 
            step={step}
            onClose={onClose}
            onBack={step !== 'info' ? () => setStep(step === 'settings' ? 'members' : 'info') : undefined}
          />

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {step === 'info' && (
              <GroupInfoStep
                groupData={groupData}
                onDataChange={setGroupData}
                onNext={() => setStep('members')}
                isValid={groupData.name.trim().length >= 2}
              />
            )}

            {step === 'members' && (
              <MembersSelectionStep
                availableUsers={filteredUsers}
                selectedMembers={selectedMembers}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onMemberToggle={(userId) => {
                  setSelectedMembers(prev => 
                    prev.includes(userId) 
                      ? prev.filter(id => id !== userId)
                      : [...prev, userId]
                  );
                }}
                onNext={() => setStep('settings')}
                onBack={() => setStep('info')}
              />
            )}

            {step === 'settings' && (
              <GroupSettingsStep
                groupData={groupData}
                selectedMembers={selectedMembers}
                availableUsers={availableUsers}
                onDataChange={setGroupData}
                onCreateGroup={handleCreateGroup}
                onBack={() => setStep('members')}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Header del modal con navegación entre pasos
 */
function ModalHeader({
  step,
  onClose,
  onBack
}: {
  step: string;
  onClose: () => void;
  onBack?: () => void;
}) {
  const steps = [
    { key: 'info', label: 'Información', icon: '📝' },
    { key: 'members', label: 'Miembros', icon: '👥' },
    { key: 'settings', label: 'Configuración', icon: '⚙️' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Crear Grupo
          </h2>
        </div>
        
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center space-x-4">
        {steps.map((stepItem, index) => (
          <div key={stepItem.key} className="flex items-center">
            <div className={cn(
              "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              index <= currentStepIndex
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "text-gray-500 dark:text-gray-400"
            )}>
              <span>{stepItem.icon}</span>
              <span>{stepItem.label}</span>
            </div>
            
            {index < steps.length - 1 && (
              <div className={cn(
                "w-8 h-px mx-2 transition-colors",
                index < currentStepIndex
                  ? "bg-blue-300 dark:bg-blue-700"
                  : "bg-gray-200 dark:bg-gray-700"
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Paso 1: Información básica del grupo
 */
function GroupInfoStep({
  groupData,
  onDataChange,
  onNext,
  isValid
}: {
  groupData: any;
  onDataChange: (data: any) => void;
  onNext: () => void;
  isValid: boolean;
}) {
  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Group Avatar */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Group Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre del grupo *
          </label>
          <input
            type="text"
            value={groupData.name}
            onChange={(e) => onDataChange({ ...groupData, name: e.target.value })}
            placeholder="Ej: Equipo de Marketing"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            maxLength={50}
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {groupData.name.length}/50 caracteres
          </p>
        </div>

        {/* Group Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descripción
          </label>
          <textarea
            value={groupData.description}
            onChange={(e) => onDataChange({ ...groupData, description: e.target.value })}
            placeholder="Describe el propósito del grupo..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            maxLength={200}
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {groupData.description.length}/200 caracteres
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end pt-4">
          <button
            onClick={onNext}
            disabled={!isValid}
            className={cn(
              "px-6 py-3 rounded-lg font-medium transition-colors",
              isValid
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
            )}
          >
            Siguiente: Seleccionar Miembros
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Paso 2: Selección de miembros
 */
function MembersSelectionStep({
  availableUsers,
  selectedMembers,
  searchQuery,
  onSearchChange,
  onMemberToggle,
  onNext,
  onBack
}: {
  availableUsers: any[];
  selectedMembers: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onMemberToggle: (userId: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar usuarios por nombre..."
            className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Selected Members Summary */}
        {selectedMembers.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
              Miembros seleccionados ({selectedMembers.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedMembers.map(memberId => {
                const member = availableUsers.find(u => u.id === memberId);
                return member && (
                  <span
                    key={memberId}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                  >
                    {member.name}
                    <button
                      onClick={() => onMemberToggle(memberId)}
                      className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          {availableUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No hay usuarios disponibles
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {availableUsers.map(user => (
                <UserSelectionItem
                  key={user.id}
                  user={user}
                  isSelected={selectedMembers.includes(user.id)}
                  onToggle={() => onMemberToggle(user.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <button
            onClick={onBack}
            className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Atrás
          </button>
          
          <button
            onClick={onNext}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Siguiente: Configuración
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Item individual de selección de usuario
 */
function UserSelectionItem({
  user,
  isSelected,
  onToggle
}: {
  user: any;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors",
        isSelected && "bg-blue-50 dark:bg-blue-900/20"
      )}
      onClick={onToggle}
    >
      <div className="flex-1 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {user.name}
          </p>
          {user.role && (
            <span className="inline-block mt-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 rounded">
              {user.role}
            </span>
          )}
        </div>
      </div>

      <div className={cn(
        "w-5 h-5 border-2 rounded flex items-center justify-center transition-colors",
        isSelected
          ? "bg-blue-600 border-blue-600"
          : "border-gray-300 dark:border-gray-600"
      )}>
        {isSelected && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
  );
}

/**
 * Paso 3: Configuración del grupo
 */
function GroupSettingsStep({
  groupData,
  selectedMembers,
  availableUsers,
  onDataChange,
  onCreateGroup,
  onBack,
  isLoading
}: {
  groupData: any;
  selectedMembers: string[];
  availableUsers: any[];
  onDataChange: (data: any) => void;
  onCreateGroup: () => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  const selectedUsers = availableUsers.filter(u => selectedMembers.includes(u.id));

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Group Summary */}
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            Resumen del grupo
          </h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p><span className="font-medium">Nombre:</span> {groupData.name}</p>
            {groupData.description && (
              <p><span className="font-medium">Descripción:</span> {groupData.description}</p>
            )}
            <p><span className="font-medium">Miembros:</span> {selectedMembers.length} personas</p>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            Configuración de privacidad
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={groupData.isPrivate}
                onChange={(e) => onDataChange({ ...groupData, isPrivate: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Grupo privado
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Solo los miembros pueden ver el grupo y sus mensajes
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={groupData.allowInvites}
                onChange={(e) => onDataChange({ ...groupData, allowInvites: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Permitir invitaciones
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Los miembros pueden invitar a otras personas al grupo
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Selected Members Preview */}
        {selectedUsers.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              Miembros del grupo
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedUsers.map(user => (
                <div key={user.id} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.name}
                    </p>
                    {user.role && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.role}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <button
            onClick={onBack}
            disabled={isLoading}
            className="px-6 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Atrás
          </button>
          
          <button
            onClick={onCreateGroup}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creando...</span>
              </>
            ) : (
              <span>Crear Grupo</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
