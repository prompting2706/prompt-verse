
import React, { useState } from 'react';
import { type Project, type User, type Collaborator, PermissionLevel } from '../types';
import { XIcon, UsersIcon, TrashIcon } from './icons/Icons';

interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  currentUser: User;
  onFindUserByEmail: (email: string) => Promise<{ id: string; email: string; avatarUrl: string } | null>;
  onUpdateCollaborators: (projectId: string, collaborators: Collaborator[]) => void;
}

const ShareProjectModal: React.FC<ShareProjectModalProps> = ({ isOpen, onClose, project, currentUser, onFindUserByEmail, onUpdateCollaborators }) => {
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAddCollaborator = async () => {
    setError('');
    const emailToAdd = newCollaboratorEmail.trim().toLowerCase();
    if (!emailToAdd) return;

    if (emailToAdd === currentUser.email.toLowerCase()) {
      setError('You cannot add yourself as a collaborator.');
      return;
    }

    if (project.collaborators.some(c => c.email.toLowerCase() === emailToAdd)) {
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
        permission: PermissionLevel.EDITOR,
      };

      onUpdateCollaborators(project.id, [...project.collaborators, newCollaborator]);
      setNewCollaboratorEmail('');
    } catch {
      setError('Failed to find user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollaborator = (userIdToRemove: string) => {
    const updatedCollaborators = project.collaborators.filter(c => c.userId !== userIdToRemove);
    onUpdateCollaborators(project.id, updatedCollaborators);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6 border-b flex justify-between items-center">
            <div className="flex items-center gap-3">
              <UsersIcon />
              <h2 className="text-xl font-bold">Share "{project.name}"</h2>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><XIcon /></button>
        </div>

        <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">Invite others to view and edit this project and its prompts.</p>
            <div className="flex gap-2">
                <input
                    type="email"
                    value={newCollaboratorEmail}
                    onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void handleAddCollaborator(); }}
                    placeholder="Enter user email..."
                    className="flex-grow w-full text-sm border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange"
                />
                <button
                    onClick={() => void handleAddCollaborator()}
                    disabled={loading}
                    className="px-4 py-2 bg-brand-green text-white rounded-md text-sm font-semibold hover:bg-green-600 disabled:opacity-60"
                >
                    {loading ? '...' : 'Add'}
                </button>
            </div>
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

                {project.collaborators.map(collaborator => (
                    <div key={collaborator.userId} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                             <img src={collaborator.avatarUrl} alt={collaborator.email} className="w-8 h-8 rounded-full" />
                             <div>
                                <p className="font-semibold text-sm">{collaborator.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600 capitalize">{collaborator.permission}</span>
                          <button
                            onClick={() => handleRemoveCollaborator(collaborator.userId)}
                            className="text-gray-400 hover:text-red-500"
                            title="Remove access"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ShareProjectModal;
