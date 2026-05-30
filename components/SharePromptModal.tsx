
import React, { useState } from 'react';
import { type Prompt, type User, type Collaborator, PermissionLevel, MembershipType } from '../types';
import { XIcon, UsersIcon, TrashIcon } from './icons/Icons';
import { PLAN_LIMITS } from '../constants';

interface SharePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: Prompt;
  currentUser: User;
  onFindUserByEmail: (email: string) => Promise<{ id: string; email: string; avatarUrl: string } | null>;
  onUpdateCollaborators: (promptId: string, collaborators: Collaborator[]) => void;
}

const SharePromptModal: React.FC<SharePromptModalProps> = ({ isOpen, onClose, prompt, currentUser, onFindUserByEmail, onUpdateCollaborators }) => {
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [newPermission, setNewPermission] = useState<PermissionLevel>(PermissionLevel.VIEWER);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const maxCollabs = PLAN_LIMITS[currentUser.membership].maxCollaboratorsPerPrompt;
  const currentCount = (prompt.collaborators || []).length;
  const atLimit = isFinite(maxCollabs) && currentCount >= maxCollabs;

  const handleAddCollaborator = async () => {
    setError('');
    const emailToAdd = newCollaboratorEmail.trim().toLowerCase();
    if (!emailToAdd) return;

    if (maxCollabs === 0) {
      setError('Your plan does not support collaborators. Upgrade to Creator or higher.');
      return;
    }

    if (atLimit) {
      setError(`You've reached the ${maxCollabs} collaborator limit for your plan.`);
      return;
    }

    if (emailToAdd === currentUser.email.toLowerCase()) {
      setError('You cannot add yourself as a collaborator.');
      return;
    }

    if ((prompt.collaborators || []).some(c => c.email.toLowerCase() === emailToAdd)) {
      setError('This user is already a collaborator.');
      return;
    }

    setLoading(true);
    try {
      const userToAdd = await onFindUserByEmail(emailToAdd);
      if (!userToAdd) {
        setError('User with this email not found.');
        return;
      }

      const newCollaborator: Collaborator = {
        userId: userToAdd.id,
        email: userToAdd.email,
        avatarUrl: userToAdd.avatarUrl,
        permission: newPermission,
      };

      onUpdateCollaborators(prompt.id, [...(prompt.collaborators || []), newCollaborator]);
      setNewCollaboratorEmail('');
    } catch {
      setError('Failed to find user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollaborator = (userIdToRemove: string) => {
    const updated = (prompt.collaborators || []).filter(c => c.userId !== userIdToRemove);
    onUpdateCollaborators(prompt.id, updated);
  };

  const handleChangePermission = (userId: string, permission: PermissionLevel) => {
    const updated = (prompt.collaborators || []).map(c =>
      c.userId === userId ? { ...c, permission } : c
    );
    onUpdateCollaborators(prompt.id, updated);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <UsersIcon />
            <h2 className="text-xl font-bold">Share "{prompt.title}"</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><XIcon /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Invite others to view or edit this prompt.</p>
            {isFinite(maxCollabs) && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${atLimit ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                {currentCount}/{maxCollabs} collaborators
              </span>
            )}
          </div>

          {maxCollabs === 0 ? (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              Collaborator invites require Creator plan or higher.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newCollaboratorEmail}
                  onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void handleAddCollaborator(); }}
                  placeholder="Enter user email..."
                  disabled={atLimit}
                  className="flex-grow w-full text-sm border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange disabled:opacity-50"
                />
                <select
                  value={newPermission}
                  onChange={e => setNewPermission(e.target.value as PermissionLevel)}
                  disabled={atLimit}
                  className="text-sm border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange disabled:opacity-50"
                >
                  <option value={PermissionLevel.VIEWER}>Can view</option>
                  <option value={PermissionLevel.EDITOR}>Can edit</option>
                </select>
                <button
                  onClick={() => void handleAddCollaborator()}
                  disabled={loading || atLimit}
                  className="px-4 py-2 bg-brand-green text-white rounded-md text-sm font-semibold hover:bg-green-600 disabled:opacity-60"
                >
                  {loading ? '...' : 'Add'}
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="space-y-3 mt-4 max-h-60 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Shared with</h3>

            <div className="flex items-center justify-between p-2 rounded-md">
              <div className="flex items-center gap-3">
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-8 h-8 rounded-full" />
                <div>
                  <p className="font-semibold text-sm">{currentUser.name} (You)</p>
                  <p className="text-xs text-gray-500">{currentUser.email}</p>
                </div>
              </div>
              <span className="text-sm text-gray-500 font-medium">Owner</span>
            </div>

            {(prompt.collaborators || []).map(collaborator => (
              <div key={collaborator.userId} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <img src={collaborator.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${collaborator.userId}`} alt={collaborator.email} className="w-8 h-8 rounded-full" />
                  <div>
                    <p className="font-semibold text-sm">{collaborator.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={collaborator.permission}
                    onChange={e => handleChangePermission(collaborator.userId, e.target.value as PermissionLevel)}
                    className="text-xs border-gray-200 rounded-md py-1 focus:ring-brand-orange focus:border-brand-orange"
                  >
                    <option value={PermissionLevel.VIEWER}>Can view</option>
                    <option value={PermissionLevel.EDITOR}>Can edit</option>
                  </select>
                  <button
                    onClick={() => handleRemoveCollaborator(collaborator.userId)}
                    className="text-gray-400 hover:text-red-500 p-1"
                    title="Remove access"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {(prompt.collaborators || []).length === 0 && (
              <p className="text-sm text-gray-400 italic text-center py-4">No collaborators yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharePromptModal;
