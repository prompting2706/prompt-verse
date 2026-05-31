

import React, { useState, useEffect, useCallback } from 'react';
import { type Prompt, type Project, OutputType, type PromptOutput } from '../types';
import { suggestTitleForPrompt } from '../services/geminiService';
import { SparklesIcon, XIcon, ImageIcon, VideoIcon, AudioIcon, FileIcon } from './icons/Icons';
import { PLAN_LIMITS } from '../constants';

import { calculateSimilarity } from '../utils/similarity';

interface CreatePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prompt: Prompt) => void;
  projects: Project[];
  promptToEdit?: Prompt;
  currentUser: import('../types').User;
  allPrompts: Prompt[];
}

const CreatePromptModal: React.FC<CreatePromptModalProps> = ({ isOpen, onClose, onSave, projects, promptToEdit, currentUser, allPrompts }) => {
  const canUseAITitle = PLAN_LIMITS[currentUser.membership].canUseAITitle;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [promptText, setPromptText] = useState('');
  const [tags, setTags] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<PromptOutput[]>([]);
  const [isSuggestingTitle, setIsSuggestingTitle] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [plagiarismWarning, setPlagiarismWarning] = useState<string | null>(null);

  useEffect(() => {
    if (promptToEdit) {
      setTitle(promptToEdit.title);
      setDescription(promptToEdit.description);
      setPromptText(promptToEdit.promptText);
      setTags(promptToEdit.tags.join(', '));
      setProjectId(promptToEdit.projectId);
      setOutputs(promptToEdit.outputs);
    } else {
      // Reset form for new prompt
      setTitle('');
      setDescription('');
      setPromptText('');
      setTags('');
      setProjectId(null);
      setOutputs([]);
    }
    setErrorMsg(null);
    setPlagiarismWarning(null);
  }, [promptToEdit, isOpen, projects]);

  useEffect(() => {
    if (promptText.length > 15) {
      let highestSimilarity = 0;
      let mostSimilarTitle = '';

      allPrompts.forEach(p => {
        // Don't compare with itself
        if (promptToEdit && p.id === promptToEdit.id) return;
        
        const sim = calculateSimilarity(promptText, p.promptText);
        if (sim > highestSimilarity) {
          highestSimilarity = sim;
          mostSimilarTitle = p.title;
        }
      });

      if (highestSimilarity > 80) { // 80% similarity threshold
        setPlagiarismWarning(`High similarity (${highestSimilarity.toFixed(0)}%) detected with existing prompt "${mostSimilarTitle}".`);
      } else {
        setPlagiarismWarning(null);
      }
    } else {
        setPlagiarismWarning(null);
    }
  }, [promptText, allPrompts, promptToEdit]);

  const handleSuggestTitle = useCallback(async () => {
    if (!promptText) return;
    setIsSuggestingTitle(true);
    setErrorMsg(null);
    try {
      const suggested = await suggestTitleForPrompt(promptText);
      setTitle(suggested);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Network error occurred.");
    } finally {
      setIsSuggestingTitle(false);
    }
  }, [promptText]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file: File) => {
        let type: OutputType;
        if (file.type.startsWith('image/')) type = OutputType.IMAGE;
        else if (file.type.startsWith('video/')) type = OutputType.VIDEO;
        else if (file.type.startsWith('audio/')) type = OutputType.AUDIO;
        else type = OutputType.FILE;
        const blobUrl = URL.createObjectURL(file);
        setOutputs(prev => [...prev, { type, content: blobUrl, fileName: file.name }]);
      });
    }
  };

  const handleRemoveOutput = (indexToRemove: number) => {
    setOutputs(prev => prev.filter((_, index) => index !== indexToRemove));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!promptToEdit;
    
    const newVersion = {
      id: `v-${Date.now()}`,
      promptText,
      createdAt: new Date().toISOString(),
      updatedBy: currentUser.id,
      updatedByName: currentUser.name
    };

    const updatedVersions = isEdit
       ? [newVersion, ...(promptToEdit.versions || [])]
       : [newVersion];

    const newPrompt: Prompt = {
      id: promptToEdit?.id || `prompt-${Date.now()}`,
      title,
      description,
      promptText,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      projectId,
      outputs: outputs,
      lastEdited: new Date().toISOString(),
      likes: promptToEdit?.likes || [],
      comments: promptToEdit?.comments || [],
      usageCount: promptToEdit?.usageCount || 0,
      versions: updatedVersions,
      ownerId: promptToEdit?.ownerId || currentUser.id, // Use currentUser.id
      collaborators: promptToEdit?.collaborators || [],
    };
    onSave(newPrompt);
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold">{promptToEdit ? 'Edit Prompt' : 'Create New Prompt'}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><XIcon /></button>
        </div>
        
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
            <div className="p-6 space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className={`flex-1 block w-full min-w-0 ${canUseAITitle ? 'rounded-none rounded-l-md' : 'rounded-md'} border-gray-300 focus:ring-brand-orange focus:border-brand-orange sm:text-sm`} required />
                        {canUseAITitle && (
                          <button type="button" onClick={handleSuggestTitle} disabled={isSuggestingTitle || !promptText} className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm disabled:opacity-50">
                            <SparklesIcon animate={isSuggestingTitle} />
                            {isSuggestingTitle ? 'Suggesting...' : 'AI Suggest'}
                          </button>
                        )}
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-0.5">
                        <label htmlFor="promptText" className="block text-sm font-medium text-gray-700">Prompt Text</label>
                        {plagiarismWarning && (
                            <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-md border border-yellow-300 flex items-center gap-1">
                                ⚠️ {plagiarismWarning}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 mb-1.5">
                        Dinamik alan için{' '}
                        <code className="bg-orange-50 text-orange-600 px-1 py-0.5 rounded font-mono border border-orange-100">
                            {'{{değişken_adı}}'}
                        </code>{' '}
                        sözdizimini kullan
                    </p>
                    <textarea id="promptText" value={promptText} onChange={e => setPromptText(e.target.value)} rows={5} className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${plagiarismWarning ? 'border-yellow-400 focus:ring-yellow-500 focus:border-yellow-500 bg-yellow-50' : 'border-gray-300 focus:ring-brand-orange focus:border-brand-orange'}`} required />
                    {/* Live variable detection */}
                    {(() => {
                        const vars = [...new Set([...promptText.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1].trim()))];
                        if (vars.length === 0) return null;
                        return (
                            <div className="mt-2 flex items-center gap-2 flex-wrap p-2.5 bg-orange-50 rounded-lg border border-orange-100">
                                <span className="text-xs font-semibold text-orange-700 flex-shrink-0">
                                    🧩 {vars.length} değişken:
                                </span>
                                {vars.map(v => (
                                    <span key={v} className="inline-flex items-center bg-white text-orange-700 text-xs font-mono px-2 py-0.5 rounded-full border border-orange-200 shadow-sm">
                                        {`{{${v}}}`}
                                    </span>
                                ))}
                            </div>
                        );
                    })()}
                </div>
                
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description / Notes</label>
                    <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-brand-orange focus:border-brand-orange sm:text-sm" />
                </div>

                 <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                    <input type="text" id="tags" value={tags} onChange={e => setTags(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-brand-orange focus:border-brand-orange sm:text-sm" />
                </div>

                <div>
                    <label htmlFor="project" className="block text-sm font-medium text-gray-700">Project <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <select id="project" value={projectId ?? ''} onChange={e => setProjectId(e.target.value || null)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-brand-orange focus:border-brand-orange sm:text-sm">
                        <option value="">— Proje seçme —</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                {/* File Upload Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Outputs</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex text-sm text-gray-600">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-brand-orange hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-orange">
                                    <span>Upload files</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} accept="image/*,video/*,audio/*,.zip,.rar,.7z" />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">Images, Videos, Audio, ZIP, RAR, etc.</p>
                        </div>
                    </div>
                </div>

                {/* Previews Section */}
                {outputs.length > 0 && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Output Previews</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {outputs.map((output, index) => (
                                <div key={index} className="relative group aspect-square border rounded-md overflow-hidden bg-gray-100">
                                    {output.type === OutputType.IMAGE && (
                                        <img src={output.content} alt={output.fileName || `output preview ${index}`} className="w-full h-full object-cover" />
                                    )}
                                    {output.type === OutputType.VIDEO && (
                                        <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center text-white p-2">
                                            <VideoIcon className="w-8 h-8 opacity-75" />
                                            <span className="text-xs text-center break-all mt-2">{output.fileName || 'Video File'}</span>
                                        </div>
                                    )}
                                    {output.type === OutputType.AUDIO && (
                                        <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center text-white p-2">
                                            <AudioIcon className="w-8 h-8 opacity-75" />
                                            <span className="text-xs text-center break-all mt-2">{output.fileName || 'Audio File'}</span>
                                        </div>
                                    )}
                                    {output.type === OutputType.FILE && (
                                        <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center text-gray-600 p-2">
                                            <FileIcon className="w-8 h-8 opacity-75" />
                                            <span className="text-xs text-center break-all mt-2">{output.fileName || 'File'}</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-colors flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveOutput(index)}
                                            className="p-1.5 bg-white text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100"
                                            aria-label="Remove output"
                                        >
                                            <XIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-green border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-600">Save Prompt</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePromptModal;