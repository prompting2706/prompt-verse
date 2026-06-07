

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type Prompt, type Project, OutputType, type User, PermissionLevel } from '../types';
import { ArrowLeftIcon, ShareIcon, CopyIcon, EditIcon, TrashIcon, ArchiveIcon, CodeIcon, ImageIcon, VideoIcon, AudioIcon, UnarchiveIcon, FileIcon, CheckIcon } from './icons/Icons';
import SocialShareModal from './SocialShareModal';
import { toast } from '../utils/toast';

interface PromptDetailProps {
  prompt: Prompt;
  projects: Project[];
  user: User;
  onBack: () => void;
  onEdit: (prompt: Prompt) => void;
  onDelete: (promptId: string) => void;
  onDuplicate: (prompt: Prompt) => void;
  onArchive: (promptId: string) => void;
  onUnarchive: (promptId: string) => void;
  isArchived: boolean;
  backButtonText?: string;
  onShareViaMessage?: (prompt: Prompt) => void;
  onShareAsPost?: (prompt: Prompt) => void;
}

const PromptDetail: React.FC<PromptDetailProps> = ({ prompt, projects, user, onBack, onEdit, onDelete, onDuplicate, onArchive, onUnarchive, isArchived, backButtonText: customBackButtonText, onShareViaMessage, onShareAsPost }) => {
  const { t } = useTranslation();
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [showShareModal, setShowShareModal] = useState(false);

  // BUG: was hardcoded Turkish — now uses i18n keys
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(t('toast.copied', 'Panoya kopyalandı!'));
    }).catch(() => {
      toast.error(t('toast.copyFailed', 'Kopyalama başarısız oldu.'));
    });
  };

  const isOwner = user.id === prompt.ownerId;
  const canEdit = isOwner || prompt.collaborators.some(c => c.userId === user.id && c.permission === PermissionLevel.EDITOR);

  const promptVariables: string[] = useMemo(() => {
    const matches = [...prompt.promptText.matchAll(/\{\{([^}]+)\}\}/g)];
    return [...new Set(matches.map(m => m[1].trim()))];
  }, [prompt.promptText]);

  const filledPromptText = useMemo(() => {
    return promptVariables.reduce((text, v) => {
      const re = new RegExp(`\\{\\{\\s*${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}\\}`, 'g');
      return text.replace(re, variableValues[v]?.trim() || `{{${v}}}`);
    }, prompt.promptText);
  }, [prompt.promptText, promptVariables, variableValues]);

  const filledCount = promptVariables.filter(v => !!variableValues[v]?.trim()).length;

  const renderHighlightedPrompt = () => {
    if (promptVariables.length === 0) return <span>{prompt.promptText}</span>;
    const parts = prompt.promptText.split(/(\{\{[^}]+\}\})/g);
    return (
      <>
        {parts.map((part, i) => {
          const m = part.match(/^\{\{(.+?)\}\}$/);
          if (m) {
            const value = variableValues[m[1].trim()]?.trim();
            return value
              ? <mark key={i} className="bg-green-100 text-green-800 not-italic font-semibold rounded px-1 border border-green-200">{value}</mark>
              : <mark key={i} className="bg-orange-100 text-orange-700 not-italic font-mono rounded px-1 border border-dashed border-orange-300">{part}</mark>;
          }
          return <span key={i}>{part}</span>;
        })}
      </>
    );
  };

  const renderOutput = (output: { type: OutputType; content: string; fileName?: string }, index: number) => {
    switch(output.type) {
      case OutputType.IMAGE:
        return <img key={index} src={output.content} alt={output.fileName || `Output ${index+1}`} className="rounded-lg w-full object-cover" />;
      case OutputType.VIDEO:
        return (
          <div key={index} className="rounded-lg w-full bg-black aspect-video flex items-center justify-center text-white">
            <video src={output.content} controls className="w-full h-full rounded-lg">
              Your browser does not support the video tag.
            </video>
          </div>
        );
      case OutputType.AUDIO:
         return (
          <div key={index} className="rounded-lg w-full bg-gray-800 p-4 flex items-center gap-4 text-white">
            <AudioIcon className="w-8 h-8 flex-shrink-0"/>
            <audio src={output.content} controls className="w-full">
              Your browser does not support the audio element.
            </audio>
          </div>
        );
      case OutputType.CODE:
        return (
          <div key={index} className="bg-gray-900 text-white p-4 rounded-lg font-mono text-sm relative">
            <button onClick={() => copyToClipboard(output.content)} className="absolute top-2 right-2 p-2 bg-gray-700 rounded-md hover:bg-gray-600">
                <CopyIcon className="w-4 h-4"/>
            </button>
            <pre><code>{output.content}</code></pre>
          </div>
        );
      case OutputType.FILE:
        return (
          <a
            key={index}
            href={output.content}
            download={output.fileName || 'download'}
            className="col-span-1 rounded-lg bg-gray-100 p-4 flex items-center gap-4 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <FileIcon className="w-8 h-8 flex-shrink-0 text-gray-500" />
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold truncate">{output.fileName || 'Attached File'}</span>
              <span className="text-xs text-gray-500">Click to download</span>
            </div>
          </a>
        );
      default:
        return null;
    }
  };

  const projectName = projects.find(p => p.id === prompt.projectId)?.name || 'Unassigned';
  const displayBackButtonText = customBackButtonText || (isArchived ? "Back to Archived" : "Back to My Prompts");

  return (
    <>
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-brand-dark-gray">
          <ArrowLeftIcon />
          {displayBackButtonText}
        </button>
        <div className="flex items-center gap-2">
          <ActionButton icon={<ShareIcon />} label="Paylaş" onClick={() => setShowShareModal(true)} />
          {onShareAsPost && (
            <ActionButton icon={<ShareIcon />} label="Keşfette Paylaş" onClick={() => onShareAsPost(prompt)} />
          )}
          {onShareViaMessage && (
            <ActionButton icon={<CopyIcon />} label="Mesajla Gönder" onClick={() => onShareViaMessage(prompt)} />
          )}
          <ActionButton icon={<CopyIcon />} label="Duplicate" onClick={() => onDuplicate(prompt)}/>
          <ActionButton icon={<EditIcon />} label="Edit" onClick={() => onEdit(prompt)} primary disabled={!canEdit} />
          <ActionButton icon={<TrashIcon />} label="Delete" onClick={() => onDelete(prompt.id)} danger disabled={!isOwner} />
          {isArchived ? (
             <ActionButton icon={<UnarchiveIcon />} label="Unarchive" onClick={() => onUnarchive(prompt.id)} disabled={!canEdit} />
          ) : (
             <ActionButton icon={<ArchiveIcon />} label="Archive" onClick={() => onArchive(prompt.id)} disabled={!canEdit} />
          )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
        <h1 className="text-3xl font-bold mb-2">{prompt.title}</h1>
        <p className="text-gray-500 mb-4">{prompt.description}</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {prompt.tags.map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{tag}</span>
          ))}
        </div>

        {/* Prompt Text Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Prompt</h3>
            {promptVariables.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{filledCount}/{promptVariables.length} dolduruldu</span>
                <span className="text-xs bg-brand-orange text-white px-2.5 py-0.5 rounded-full font-semibold">
                  🧩 {promptVariables.length} Değişken
                </span>
              </div>
            )}
          </div>

          {/* Variable fill panel */}
          {promptVariables.length > 0 && (
            <div className="mb-4 rounded-xl border border-orange-100 overflow-hidden">
              {/* Progress bar */}
              <div className="h-1.5 bg-orange-50 w-full">
                <div
                  className="h-full bg-brand-orange transition-all duration-500 ease-out"
                  style={{ width: `${promptVariables.length > 0 ? (filledCount / promptVariables.length) * 100 : 0}%` }}
                />
              </div>

              <div className="p-4 bg-orange-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-orange-800">Değişkenleri Doldur</span>
                  {filledCount > 0 && (
                    <button
                      onClick={() => setVariableValues({})}
                      className="text-xs text-orange-400 hover:text-orange-600 transition-colors"
                    >
                      Temizle
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {promptVariables.map(v => {
                    const isFilled = !!variableValues[v]?.trim();
                    return (
                      <div
                        key={v}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 bg-white ${
                          isFilled ? 'border-green-200' : 'border-orange-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-gray-600 uppercase tracking-wide font-mono">
                            {v}
                          </label>
                          {isFilled
                            ? <CheckIcon className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            : <span className="w-3 h-3 rounded-full border-2 border-orange-300 flex-shrink-0" />
                          }
                        </div>
                        <input
                          type="text"
                          className={`w-full px-2.5 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                            isFilled
                              ? 'border-green-200 focus:ring-green-300'
                              : 'border-gray-200 focus:ring-orange-300'
                          }`}
                          placeholder={`{{${v}}} değerini gir…`}
                          value={variableValues[v] || ''}
                          onChange={(e) => setVariableValues(prev => ({ ...prev, [v]: e.target.value }))}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Prompt preview */}
          <div className="bg-brand-light-gray rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100">
              <span className="text-xs text-gray-400 font-medium">
                {promptVariables.length > 0 ? 'Önizleme' : 'Prompt Metni'}
              </span>
              <button
                onClick={() => copyToClipboard(filledPromptText)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-2.5 py-1 rounded-lg transition-colors shadow-sm"
              >
                <CopyIcon className="w-3.5 h-3.5" />
                Kopyala
              </button>
            </div>
            <div className="p-4">
              <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {renderHighlightedPrompt()}
              </p>
            </div>
          </div>
        </div>
        
        {/* Outputs Section */}
        {prompt.outputs.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Outputs</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prompt.outputs.map(renderOutput)}
            </div>
          </div>
        )}

        {/* Details Section */}
         <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm mb-8">
                <div><span className="font-semibold">Project:</span> {projectName}</div>
                <div><span className="font-semibold">Last Edited:</span> {new Date(prompt.lastEdited).toLocaleDateString()}</div>
                <div><span className="font-semibold">Times Used:</span> {prompt.usageCount}</div>
            </div>

            {/* Audit Log / Version History */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Version History & Audit Log</h3>
              <div className="space-y-3">
                {(prompt.versions ?? []).length > 0 ? (
                  (prompt.versions ?? []).map((version, index) => (
                    <div key={version.id} className="text-sm bg-gray-50 p-3 rounded-md border border-gray-100 flex items-start gap-3">
                        <div className="bg-orange-100 text-orange-600 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                            v{(prompt.versions ?? []).length - index}
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-900 font-medium font-mono text-xs mb-1 line-clamp-2" title={version.promptText}>
                                {version.promptText}
                            </p>
                            <div className="text-gray-500 text-xs flex justify-between">
                                <span>Edited by <span className="font-semibold text-gray-700">{version.updatedByName || 'Unknown'}</span></span>
                                <span>{new Date(version.createdAt).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No previous versions or edits found.</p>
                )}
              </div>
            </div>
        </div>

      </div>
    </div>

    {showShareModal && (
      <SocialShareModal prompt={prompt} onClose={() => setShowShareModal(false)} />
    )}
    </>
  );
};

interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
    primary?: boolean;
    danger?: boolean;
    onClick: () => void;
    disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, primary, danger, onClick, disabled = false }) => {
    const baseClasses = "flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-sm transition-colors border";
    const disabledClasses = "disabled:opacity-50 disabled:cursor-not-allowed";
    
    let specificClasses = "bg-white border-gray-300 text-gray-700 hover:bg-gray-50";
    if (primary) {
        specificClasses = "bg-brand-green border-brand-green text-white hover:bg-green-600";
    } else if (danger) {
        specificClasses = "bg-red-50 border-red-200 text-red-600 hover:bg-red-100";
    }
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onClick();
    };

    return (
        <button onClick={handleClick} className={`${baseClasses} ${specificClasses} ${disabledClasses}`} disabled={disabled}>
            {icon}
            <span className="hidden md:inline">{label}</span>
        </button>
    )
}

export default PromptDetail;