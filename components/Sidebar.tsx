
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { type User, type Project, type View, MembershipType } from '../types';
import { PLAN_LIMITS } from '../constants';
import { HomeIcon, MarketplaceIcon, OrdersIcon, PlusIcon, SettingsIcon, EditIcon, CartIcon, ArchiveIcon, TrashIcon, ArrowUpIcon, ShareUserIcon, StoreIcon, ExploreIcon, BookmarkIcon, UserIcon, ChatBubbleIcon, GiftIcon, ClipboardListIcon } from './icons/Icons';
import VerifiedBadge from './VerifiedBadge';

interface SidebarProps {
  user: User;
  projects: Project[];
  activeView: View['type'];
  onNavigate: (view: View) => void;
  onCreateProject: (projectName: string) => void;
  onUpdateProject: (projectId: string, newName: string) => void;
  onDeleteProject: (projectId: string) => void;
  onSelectProject: (projectId: string) => void;
  onShareProject: (project: Project) => void;
  selectedProjectId: string | null;
  cartItemCount: number;
  pendingCommissionsCount?: number;
  onLogout: () => void;
  activeProfileUserId?: string;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  project: Project | null;
}

const Sidebar: React.FC<SidebarProps> = ({ user, projects, activeView, onNavigate, onCreateProject, onUpdateProject, onDeleteProject, onSelectProject, onShareProject, selectedProjectId, cartItemCount, pendingCommissionsCount, onLogout, activeProfileUserId }) => {
  const { t, i18n } = useTranslation();
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [editingProject, setEditingProject] = useState<{id: string, name: string} | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, project: null });
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const currentLang = i18n.language?.startsWith('tr') ? 'tr' : 'en';

  const toggleLanguage = () => {
    const next = currentLang === 'tr' ? 'en' : 'tr';
    i18n.changeLanguage(next);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu.visible && contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            setContextMenu(prev => ({ ...prev, visible: false }));
        }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [contextMenu.visible]);


  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
      setNewProjectName('');
      setIsCreatingProject(false);
    }
  };

  const handleSaveProjectName = () => {
    if (editingProject && editingProject.name.trim()) {
        onUpdateProject(editingProject.id, editingProject.name.trim());
    }
    setEditingProject(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          handleSaveProjectName();
      } else if (e.key === 'Escape') {
          setEditingProject(null);
      }
  };

  const handleContextMenu = (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    const isOwner = project.ownerId === user.id;
    if (isOwner) {
        setContextMenu({ visible: true, x: e.pageX, y: e.pageY, project });
    }
  };

  const handleEditClick = () => {
    if (!contextMenu.project) return;
    setEditingProject({ id: contextMenu.project.id, name: contextMenu.project.name });
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleShareClick = () => {
    if (!contextMenu.project) return;
    onShareProject(contextMenu.project);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleDeleteClick = () => {
    if (!contextMenu.project) return;
    onDeleteProject(contextMenu.project.id);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };


  return (
    <aside className="w-64 bg-white p-6 flex flex-col h-screen border-r border-gray-200 sticky top-0">
      <div className="flex items-center gap-3 mb-8">
        <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full" />
        <div>
          <div className="flex items-center gap-1">
            <h2 className="font-bold text-sm">{user.name}</h2>
            <VerifiedBadge status={user.verificationStatus} size="sm" />
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
            user.membership === MembershipType.TEAM ? 'bg-purple-100 text-purple-700' :
            user.membership === MembershipType.PRO ? 'bg-orange-100 text-brand-orange' :
            user.membership === MembershipType.CREATOR ? 'bg-blue-100 text-blue-600' :
            'bg-gray-100 text-gray-500'
          }`}>{PLAN_LIMITS[user.membership].label}</span>
        </div>
      </div>

      <nav className="flex-1 flex flex-col justify-between overflow-hidden">
        <div className="overflow-y-auto -mr-4 pr-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('nav.general')}</h3>
          <ul>
            <NavItem icon={<HomeIcon />} label={t('nav.myPrompts')} isActive={activeView === 'dashboard' && !selectedProjectId} onClick={() => onNavigate({ type: 'dashboard', payload: null })} />
            <NavItem icon={<ExploreIcon />} label={t('nav.explore')} isActive={activeView === 'explore'} onClick={() => onNavigate({ type: 'explore', payload: null })} />
            <NavItem icon={<UserIcon />} label={t('nav.myProfile')} isActive={activeView === 'profile' && activeProfileUserId === user.id} onClick={() => onNavigate({ type: 'profile', payload: { userId: user.id } })} />
            <NavItem icon={<ChatBubbleIcon />} label={t('nav.messages')} isActive={activeView === 'messages'} onClick={() => onNavigate({ type: 'messages', payload: null })} />
            <NavItem icon={<BookmarkIcon />} label={t('nav.favorites')} isActive={activeView === 'favorites'} onClick={() => onNavigate({ type: 'favorites', payload: null })} />
            <NavItem icon={<MarketplaceIcon />} label={t('nav.marketplace')} isActive={activeView === 'marketplace'} onClick={() => onNavigate({ type: 'marketplace', payload: null })} />
            <NavItem icon={<StoreIcon />} label={t('nav.myStore')} isActive={activeView === 'myStore'} onClick={() => onNavigate({ type: 'myStore', payload: null })} />
            <NavItem icon={<CartIcon />} label={t('nav.myCart')} isActive={activeView === 'cart'} onClick={() => onNavigate({ type: 'cart', payload: null })} badgeCount={cartItemCount} />
            <NavItem icon={<OrdersIcon />} label={t('nav.myOrders')} isActive={activeView === 'orders'} onClick={() => onNavigate({ type: 'orders', payload: null })} />
            <NavItem icon={<ArchiveIcon />} label={t('nav.archived')} isActive={activeView === 'archived'} onClick={() => onNavigate({ type: 'archived', payload: null })} />
            <NavItem icon={<ArrowUpIcon />} label={t('nav.upgrade')} isActive={activeView === 'upgrade'} onClick={() => onNavigate({ type: 'upgrade', payload: null })} />
            <NavItem icon={<GiftIcon />} label={t('nav.referral')} isActive={activeView === 'referral'} onClick={() => onNavigate({ type: 'referral', payload: null })} highlight />
            <NavItem icon={<ClipboardListIcon />} label={t('nav.commissions')} isActive={activeView === 'commissions'} onClick={() => onNavigate({ type: 'commissions', payload: null })} badgeCount={pendingCommissionsCount} />
          </ul>

          <div className="mt-8">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('nav.projects')}</h3>
              <button onClick={() => setIsCreatingProject(!isCreatingProject)} className="text-gray-400 hover:text-brand-orange transition-colors">
                <PlusIcon />
              </button>
            </div>
            {isCreatingProject && (
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder={t('projects.newProjectPlaceholder')}
                  className="w-full text-sm border-gray-300 rounded-md focus:ring-brand-orange focus:border-brand-orange"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                />
                <button onClick={handleCreateProject} className="p-2 bg-brand-green text-white rounded-md hover:bg-green-600">
                    <PlusIcon />
                </button>
              </div>
            )}
            <ul className="space-y-1">
              {projects.map(project => (
                <li key={project.id} onContextMenu={(e) => handleContextMenu(e, project)}>
                  {editingProject?.id === project.id ? (
                    <div className="flex items-center gap-3 w-full pr-3 pl-3 py-1.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }}></span>
                      <input
                        type="text"
                        value={editingProject.name}
                        onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                        onKeyDown={handleEditKeyDown}
                        onBlur={handleSaveProjectName}
                        autoFocus
                        className="w-full text-sm border-gray-300 rounded-md p-1 focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectProject(project.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md text-left transition-colors ${
                        selectedProjectId === project.id ? 'bg-orange-100 text-brand-orange font-semibold' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color }}></span>
                      <span className="truncate">{project.name}</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="pt-4 space-y-2">
            <NavItem icon={<SettingsIcon />} label={t('nav.settings')} isActive={activeView === 'settings'} onClick={() => onNavigate({ type: 'settings', payload: null })} />

            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
              title={currentLang === 'tr' ? 'Switch to English' : "Türkçe'ye geç"}
            >
              <span className="text-base leading-none">🌐</span>
              <span className="font-medium">{currentLang === 'tr' ? 'English' : 'Türkçe'}</span>
            </button>

            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t('nav.signOut')}
            </button>

            {/* Legal links */}
            <div className="flex items-center gap-3 px-3 pt-1 pb-1">
              <button
                onClick={() => onNavigate({ type: 'privacy', payload: null })}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Privacy
              </button>
              <span className="text-gray-300 text-xs">·</span>
              <button
                onClick={() => onNavigate({ type: 'terms', payload: null })}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Terms
              </button>
            </div>
        </div>
      </nav>
      {contextMenu.visible && contextMenu.project && (
        <div
            ref={contextMenuRef}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed z-50 w-40 bg-white rounded-md shadow-lg border border-gray-200"
        >
            <ul className="py-1">
                <li>
                    <button onClick={handleEditClick} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3">
                        <EditIcon className="w-4 h-4" />
                        {t('projects.contextEdit')}
                    </button>
                </li>
                <li>
                    <button onClick={handleShareClick} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3">
                        <ShareUserIcon className="w-4 h-4" />
                        {t('projects.contextShare')}
                    </button>
                </li>
                <li>
                    <button onClick={handleDeleteClick} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3">
                        <TrashIcon className="w-4 h-4" />
                        {t('projects.contextDelete')}
                    </button>
                </li>
            </ul>
        </div>
    )}
    </aside>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badgeCount?: number;
  highlight?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick, badgeCount, highlight }) => {
  const { t } = useTranslation();
  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
          isActive
            ? 'bg-orange-100 text-brand-orange font-semibold'
            : highlight
              ? 'text-amber-600 hover:bg-amber-50 font-medium'
              : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center gap-3">
            {icon}
            {label}
        </div>
        {badgeCount && badgeCount > 0 ? (
            <span className="bg-brand-orange text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">{badgeCount}</span>
        ) : highlight && !isActive ? (
            <span className="text-xs bg-amber-100 text-amber-600 font-semibold px-1.5 py-0.5 rounded-full">{t('nav.newBadge')}</span>
        ) : null}
      </button>
    </li>
  );
};


export default Sidebar;
