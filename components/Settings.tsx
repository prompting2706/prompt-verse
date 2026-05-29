
import React, { useState, useRef } from 'react';
import { type User, type Prompt, type Project } from '../types';
import { CameraIcon, ShareIcon } from './icons/Icons';
import JSZip from 'jszip';
import { toast } from '../utils/toast';
import { profileService } from '../lib/profileService';
import { authService } from '../lib/auth';

interface SettingsProps {
  user: User;
  onUpdateUser: (user: User) => void;
  prompts: Prompt[];
  projects: Project[];
  onImportPrompts: (prompts: Prompt[]) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, prompts, projects, onImportPrompts }) => {
  // Profile state
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);

  // Account state
  const [email, setEmail] = useState(user.email);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedAvatarFileRef = useRef<File | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const preview = URL.createObjectURL(file);
      previewUrlRef.current = preview;
      selectedAvatarFileRef.current = file;
      setAvatarUrl(preview);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword || confirmNewPassword) {
      if (newPassword.length < 8) {
        toast.error("Yeni şifre en az 8 karakter olmalıdır.");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        toast.error("Yeni şifreler eşleşmiyor.");
        return;
      }
    }

    setSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;
      if (selectedAvatarFileRef.current) {
        finalAvatarUrl = await profileService.uploadAvatar(user.id, selectedAvatarFileRef.current);
        selectedAvatarFileRef.current = null;
      }

      if (newPassword) {
        await authService.updatePassword(newPassword);
        toast.success('Şifre başarıyla güncellendi.');
        setNewPassword('');
        setConfirmNewPassword('');
      }

      onUpdateUser({ ...user, name, bio, avatarUrl: finalAvatarUrl, email });
      toast.success('Profil güncellendi.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Güncelleme başarısız';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const downloadFile = (content: string, fileName: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleExportJson = () => {
    const data = JSON.stringify(prompts, null, 2);
    downloadFile(data, 'prompt_collection.json', 'application/json');
  };

  const handleExportCsv = () => {
    const header = ['ID', 'Project ID', 'Title', 'Content', 'Model', 'Tags'];
    const rows = prompts.map(p => [
      p.id,
      p.projectId,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.promptText.replace(/"/g, '""')}"`,
      p.ownerId, // Replaced 'model' as it doesn't exist on Prompt
      `"${p.tags.join(',')}"`
    ]);
    const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(csvContent, 'prompt_collection.csv', 'text/csv');
  };

  const handleExportZip = async () => {
    const zip = new JSZip();
    
    projects.forEach(project => {
      const projectFolder = zip.folder(project.name);
      if (!projectFolder) return;
      
      const projectPrompts = prompts.filter(p => p.projectId === project.id);
      projectPrompts.forEach(prompt => {
        const content = `# ${prompt.title}\n\n**Owner ID**: ${prompt.ownerId}\n**Tags**: ${prompt.tags.join(', ')}\n\n## Content\n\n${prompt.promptText}`;
        const fileName = `${prompt.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
        projectFolder.file(fileName, content);
      });
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PromptVerse_Export.zip';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.endsWith('.json')) {
         const text = await file.text();
         const importedPrompts = JSON.parse(text);
         if (Array.isArray(importedPrompts)) {
             onImportPrompts(importedPrompts);
             toast.success('JSON promptlar başarıyla içe aktarıldı.');
         } else {
             toast.error('Geçersiz JSON formatı. Dizi bekleniyor.');
         }
      } else if (file.name.endsWith('.csv')) {
         const text = await file.text();
         const lines = text.split('\n');
         if (lines.length > 1) {
             const newPrompts = lines.slice(1).filter(l => l.trim()).map(line => {
                const parts = line.split(',');
                return {
                    id: `prompt-${Date.now()}-${Math.random()}`,
                    projectId: 'default',
                    title: parts[2]?.replace(/"/g, '') || 'Imported Prompt',
                    description: '',
                    promptText: parts[3]?.replace(/"/g, '') || '',
                    tags: parts[5] ? parts[5].replace(/"/g, '').split(',') : ['imported'],
                    outputs: [],
                    lastEdited: new Date().toISOString(),
                    likes: [],
                    comments: [],
                    usageCount: 0,
                    versions: [],
                    ownerId: user.id,
                    collaborators: []
                };
             });
             onImportPrompts(newPrompts as Prompt[]);
             toast.success(`${newPrompts.length} prompt CSV'den içe aktarıldı.`);
         }
      } else if (file.name.endsWith('.md')) {
         const text = await file.text();
         const newPrompt: Prompt = {
             id: `prompt-${Date.now()}-${Math.random()}`,
             projectId: "default",
             title: file.name.replace('.md', ''),
             description: '',
             promptText: text,
             tags: ['imported'],
             outputs: [],
             lastEdited: new Date().toISOString(),
             likes: [],
             comments: [],
             usageCount: 0,
             versions: [],
             ownerId: user.id,
             collaborators: []
         };
         onImportPrompts([newPrompt]);
         toast.success('Markdown dosyası başarıyla içe aktarıldı.');
      } else if (file.name.endsWith('.zip')) {
         const JSZipModule = await import('jszip');
         const JSZipClass = JSZipModule.default;
         const zip = await JSZipClass.loadAsync(file);
         const importedPrompts: Prompt[] = [];

         const entries = Object.entries(zip.files);
         for (const [relativePath, zipEntry] of entries) {
            if (!zipEntry.dir && relativePath.endsWith('.md')) {
                const content = await zipEntry.async('text');
                importedPrompts.push({
                   id: `prompt-${Date.now()}-${Math.random()}`,
                   projectId: "default",
                   title: zipEntry.name.split('/').pop()?.replace('.md', '') || 'Imported',
                   description: '',
                   promptText: content,
                   tags: ['imported'],
                   outputs: [],
                   lastEdited: new Date().toISOString(),
                   likes: [],
                   comments: [],
                   usageCount: 0,
                   versions: [],
                   ownerId: user.id,
                   collaborators: []
                });
            }
         }
         if (importedPrompts.length > 0) {
            onImportPrompts(importedPrompts);
            toast.success(`${importedPrompts.length} prompt ZIP arşivinden içe aktarıldı.`);
         } else {
            toast.warning('ZIP arşivinde .md dosyası bulunamadı.');
         }
      } else {
          toast.error('Desteklenmeyen dosya formatı. JSON, CSV, MD veya ZIP yükleyin.');
      }
    } catch {
      toast.error('Dosya işlenirken hata oluştu. Formatı kontrol edin.');
    }
    
    // Clear input
    e.target.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Information Section */}
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-xl font-bold mb-6 border-b pb-4">Profile Information</h2>
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative group flex-shrink-0">
                <img src={avatarUrl} alt={name} className="w-24 h-24 rounded-full object-cover" />
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="absolute inset-0 w-full h-full bg-black bg-opacity-0 group-hover:bg-opacity-50 flex flex-col items-center justify-center text-white rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 cursor-pointer"
                  aria-label="Change profile photo"
                >
                  <CameraIcon />
                  <span className="text-xs font-semibold mt-1">Change</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/png, image/jpeg, image/gif"
                />
              </div>
               <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
                  <p className="text-xs text-gray-500 mt-1">
                      Click on the image to upload a new one. <br/>
                      Recommended size: 200x200px.
                  </p>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-orange focus:border-brand-orange"
                required
              />
            </div>
            
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-orange focus:border-brand-orange"
              />
            </div>
          </div>
        </div>

        {/* Account Security Section */}
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-xl font-bold mb-6 border-b pb-4">Account Security</h2>
          <div className="space-y-6">
             <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-orange focus:border-brand-orange"
                  required
                />
            </div>
            <div>
                <p className="text-xs text-gray-500 mt-1">Leave password fields empty to keep your current password.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-orange focus:border-brand-orange"
                    placeholder="Min. 8 characters"
                  />
              </div>
               <div>
                  <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirm-new-password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-orange focus:border-brand-orange"
                    placeholder="Re-enter new password"
                  />
              </div>
            </div>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-xl font-bold mb-6 border-b pb-4">Data Management</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Export Prompts</h3>
              <p className="text-xs text-gray-500 mb-4">Download your prompt collection in various formats.</p>
              <div className="flex gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Export as JSON
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Export as CSV
                </button>
                <button
                  type="button"
                  onClick={handleExportZip}
                  className="px-4 py-2 bg-gray-900 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-gray-800 transition-colors shadow-sm"
                >
                  Download Collection as ZIP
                </button>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Import Prompts</h3>
              <p className="text-xs text-gray-500 mb-4">Upload from Notion (CSV/MD), Obsidian (MD/ZIP), or JSON.</p>
              <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-brand-orange border border-transparent rounded-lg text-sm font-medium text-white hover:bg-orange-600 focus:outline-none transition-colors shadow-sm">
                <span>Upload File</span>
                <input type="file" className="hidden" accept=".json,.csv,.zip,.md" onChange={handleImportFile} />
              </label>
            </div>
          </div>
        </div>

        {/* Onboarding Reset */}
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-xl font-bold mb-1 border-b pb-4">Uygulama Turu</h2>
          <p className="text-sm text-gray-500 mt-4 mb-4">Onboarding turunu tekrar görmek istiyorsan sıfırlayabilirsin.</p>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('promptverse_onboarding_completed');
              window.location.reload();
            }}
            className="px-4 py-2 border border-orange-300 text-brand-orange rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors"
          >
            🚀 Onboarding Turunu Tekrar Göster
          </button>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-brand-green border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors shadow-sm"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
