

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Prompt, OutputType, type User, type Project } from '../types';
import { ImageIcon, VideoIcon, CodeIcon, AudioIcon, TextIcon, ZapIcon, UnarchiveIcon, TrashIcon, FileIcon, ArchiveIcon, ShareUserIcon, UsersIcon } from './icons/Icons';

interface PromptCardProps {
  prompt: Prompt;
  user: User;
  projects?: Project[];
  onSelect: () => void;
  isArchived?: boolean;
  onUnarchive?: (promptId: string) => void;
  onDelete?: (promptId: string) => void;
  onArchive?: (promptId: string) => void;
  onOpenShareModal: (prompt: Prompt) => void;
  hideStats?: boolean;
}

const OutputTypeIcon: React.FC<{ type: OutputType }> = ({ type }) => {
  const iconMap = {
    [OutputType.IMAGE]: <ImageIcon className="w-4 h-4" />,
    [OutputType.VIDEO]: <VideoIcon className="w-4 h-4" />,
    [OutputType.CODE]: <CodeIcon className="w-4 h-4" />,
    [OutputType.AUDIO]: <AudioIcon className="w-4 h-4" />,
    [OutputType.TEXT]: <TextIcon className="w-4 h-4" />,
    [OutputType.FILE]: <FileIcon className="w-4 h-4" />,
  };
  return <div className="p-1.5 bg-gray-200 rounded-full">{iconMap[type]}</div>;
};

const PromptCard: React.FC<PromptCardProps> = ({ prompt, user, projects, onSelect, isArchived, onUnarchive, onDelete, onArchive, onOpenShareModal, hideStats }) => {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const firstOutput = prompt.outputs[0];
  const isOwner = prompt.ownerId === user.id;
  const hasVariables = /\{\{[^}]+\}\}/.test(prompt.promptText);
  const variableCount = hasVariables
    ? [...new Set([...prompt.promptText.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1].trim()))].length
    : 0;
  const projectName = prompt.projectId && projects
    ? projects.find(p => p.id === prompt.projectId)?.name
    : null;

  return (
    <div
      onClick={onSelect}
      className="relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 flex flex-col overflow-hidden group"
    >
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {isOwner && (
             <button
                onClick={(e) => { e.stopPropagation(); onOpenShareModal(prompt); }}
                className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md transition-all hover:bg-white hover:scale-110"
                aria-label="Share"
                title="Share"
            >
                <ShareUserIcon className="w-5 h-5 text-brand-dark-gray" />
            </button>
        )}
        {!isArchived && onArchive && (
            <button
                onClick={(e) => { e.stopPropagation(); onArchive(prompt.id); }}
                className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md transition-all hover:bg-white hover:scale-110"
                aria-label="Archive"
                title="Archive"
            >
                <ArchiveIcon className="w-5 h-5 text-brand-medium-gray" />
            </button>
        )}
        {isArchived && onUnarchive && (
            <button
                onClick={(e) => { e.stopPropagation(); onUnarchive(prompt.id); }}
                className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md transition-all hover:bg-white hover:scale-110"
                aria-label="Unarchive"
                title="Unarchive"
            >
                <UnarchiveIcon className="w-5 h-5 text-brand-green" />
            </button>
        )}
        {onDelete && isOwner && (
           <button
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
              className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md transition-all hover:bg-red-100 hover:scale-110"
              aria-label="Delete"
              title="Delete"
           >
              <TrashIcon className="w-5 h-5 text-red-500" />
           </button>
        )}
      </div>

      {firstOutput?.type === 'image' ? (
        <img src={firstOutput.content} alt={prompt.title} className="w-full h-40 object-cover" />
      ) : firstOutput?.type === 'video' ? (
        <video src={firstOutput.content} className="w-full h-40 object-cover" autoPlay loop muted playsInline />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center">
            {firstOutput && <OutputTypeIcon type={firstOutput.type} />}
        </div>
      )}

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-md mb-1 truncate group-hover:text-brand-green">{prompt.title}</h3>
        <p className="text-xs text-gray-500 mb-3 flex-grow">{prompt.description.length > 60 ? prompt.description.substring(0, 60) + '...' : prompt.description}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {hasVariables && (
            <span className="text-xs bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-semibold">
              🧩 {t('promptCard.variables', { count: variableCount })}
            </span>
          )}
          {prompt.tags.slice(0, hasVariables ? 1 : 2).map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{tag}</span>
          ))}
        </div>

        <div className="flex justify-between items-center text-sm text-gray-500 mt-auto pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 min-w-0">
                {projectName && (
                    <span className="text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full font-medium truncate max-w-[100px]" title={projectName}>
                        📁 {projectName}
                    </span>
                )}
                {!hideStats && (
                    <div className="flex items-center gap-1" title="Usage Count">
                        <ZapIcon />
                        <span>{prompt.usageCount}</span>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2">
                {prompt.collaborators.length > 0 && (
                    <div title={`${prompt.collaborators.length} collaborators`} className="flex items-center gap-1 text-gray-400">
                        <UsersIcon className="w-5 h-5" />
                        <span className="text-xs font-semibold">{prompt.collaborators.length}</span>
                    </div>
                )}
                {firstOutput && <OutputTypeIcon type={firstOutput.type} />}
            </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div
          className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 text-center"
          onClick={(e) => e.stopPropagation()}
        >
            <TrashIcon className="w-8 h-8 text-red-500 mb-2" />
            <p className="text-sm font-semibold mb-3 text-gray-800">{t('promptCard.deleteConfirmTitle')}</p>
            <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                    {t('promptCard.deleteCancel')}
                </button>
                <button
                  onClick={() => { onDelete!(prompt.id); setShowDeleteConfirm(false); }}
                  className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors shadow-sm"
                >
                    {t('promptCard.deleteConfirm')}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default PromptCard;
