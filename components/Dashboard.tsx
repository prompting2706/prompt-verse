import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type Prompt, type Project, type User, type View, OutputType, MembershipType } from '../types';
import PromptCard from './PromptCard';
import { PlusIcon, SearchIcon, FilterIcon, SortIcon } from './icons/Icons';
import { PLAN_LIMITS } from '../constants';

interface DashboardProps {
  user: User;
  title: string;
  prompts: Prompt[];
  projects: Project[];
  onSelectPrompt: (prompt: Prompt) => void;
  onNewPrompt?: () => void;
  onUnarchivePrompt?: (promptId: string) => void;
  onDeletePrompt?: (promptId: string) => void;
  onArchivePrompt?: (promptId: string) => void;
  onOpenShareModal: (prompt: Prompt) => void;
  isArchivedView?: boolean;
  onNavigate?: (view: View) => void;
}

type SortKey = 'title' | 'lastEdited' | 'tags' | 'collaborators';
type SortDirection = 'asc' | 'desc';
interface SortConfig {
    key: SortKey;
    direction: SortDirection;
}

const Dashboard: React.FC<DashboardProps> = ({ user, title, prompts, projects, onSelectPrompt, onNewPrompt, onUnarchivePrompt, onDeletePrompt, onArchivePrompt, onOpenShareModal, isArchivedView = false, onNavigate }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedOutputTypes, setSelectedOutputTypes] = useState<OutputType[]>([]);
  const [selectedCollaboratorCounts, setSelectedCollaboratorCounts] = useState<string[]>([]);
  const [selectedEditedDates, setSelectedEditedDates] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'lastEdited', direction: 'desc' });
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSort(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filterRef, sortRef]);

  const allTags = useMemo(() => [...new Set(prompts.flatMap(p => p.tags))].sort(), [prompts]);

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    );
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleOutputTypeToggle = (type: OutputType) => {
    setSelectedOutputTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleCollaboratorCountToggle = (countStr: string) => {
    setSelectedCollaboratorCounts(prev =>
      prev.includes(countStr) ? prev.filter(c => c !== countStr) : [...prev, countStr]
    );
  };

  const handleEditedDateToggle = (dateStr: string) => {
    setSelectedEditedDates(prev =>
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );
  };

  const clearFilters = () => {
    setSelectedProjects([]);
    setSelectedTags([]);
    setSelectedOutputTypes([]);
    setSelectedCollaboratorCounts([]);
    setSelectedEditedDates([]);
  };

  const handleSortChange = (key: SortKey, direction: SortDirection) => {
    setSortConfig({ key, direction });
    setShowSort(false);
  };

  const activeFilterCount = selectedProjects.length + selectedTags.length + selectedOutputTypes.length + selectedCollaboratorCounts.length + selectedEditedDates.length;

  // Date category keys for filtering — kept in English as internal identifiers
  const DATE_CATEGORIES = ['Today', 'This Week', 'This Month', 'Older'];
  const dateCategoryLabels: Record<string, string> = {
    'Today': t('dashboard.filterDateToday', 'Today'),
    'This Week': t('dashboard.filterDateWeek', 'This Week'),
    'This Month': t('dashboard.filterDateMonth', 'This Month'),
    'Older': t('dashboard.filterDateOlder', 'Older'),
  };

  const processedPrompts = useMemo(() => {
    const filtered = prompts.filter(prompt => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' ||
        prompt.title.toLowerCase().includes(searchLower) ||
        prompt.description.toLowerCase().includes(searchLower) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(searchLower));

      const matchesProject = selectedProjects.length === 0 ||
        (prompt.projectId !== null && selectedProjects.includes(prompt.projectId));
      const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => prompt.tags.includes(tag));
      const matchesOutputTypes = selectedOutputTypes.length === 0 || prompt.outputs.some(out => selectedOutputTypes.includes(out.type));

      const collabCount = prompt.collaborators.length;
      let collabCategory = '0';
      if (collabCount === 1 || collabCount === 2) collabCategory = '1-2';
      else if (collabCount >= 3) collabCategory = '3+';
      const matchesCollaborators = selectedCollaboratorCounts.length === 0 || selectedCollaboratorCounts.includes(collabCategory);

      // BUG: Math.ceil caused off-by-one; use midnight-based comparison instead
      let dateCategory = 'Older';
      const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
      const editedMidnight = new Date(prompt.lastEdited); editedMidnight.setHours(0, 0, 0, 0);
      const diffDays = Math.round((todayMidnight.getTime() - editedMidnight.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) dateCategory = 'Today';
      else if (diffDays <= 7) dateCategory = 'This Week';
      else if (diffDays <= 30) dateCategory = 'This Month';
      const matchesEditedDate = selectedEditedDates.length === 0 || selectedEditedDates.includes(dateCategory);

      return matchesSearch && matchesProject && matchesTags && matchesOutputTypes && matchesCollaborators && matchesEditedDate;
    });

    return [...filtered].sort((a, b) => {
        const { key, direction } = sortConfig;
        const isAsc = direction === 'asc';
        switch (key) {
            case 'title':
                return isAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
            case 'lastEdited':
                return isAsc
                    ? new Date(a.lastEdited).getTime() - new Date(b.lastEdited).getTime()
                    : new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime();
            case 'tags': {
                const tagA = a.tags[0] || '';
                const tagB = b.tags[0] || '';
                return isAsc ? tagA.localeCompare(tagB) : tagB.localeCompare(tagA);
            }
            case 'collaborators':
                return isAsc ? a.collaborators.length - b.collaborators.length : b.collaborators.length - a.collaborators.length;
            default:
                return 0;
        }
    });
  }, [prompts, searchTerm, selectedProjects, selectedTags, selectedOutputTypes, selectedCollaboratorCounts, selectedEditedDates, sortConfig]);

  const sortOptions: {label: string, key: SortKey, direction: SortDirection}[] = [
      { label: t('dashboard.sortDateNewest'), key: 'lastEdited', direction: 'desc' },
      { label: t('dashboard.sortDateOldest'), key: 'lastEdited', direction: 'asc' },
      { label: t('dashboard.sortTitleAZ'), key: 'title', direction: 'asc' },
      { label: t('dashboard.sortTitleZA'), key: 'title', direction: 'desc' },
      { label: t('dashboard.sortTagAZ'), key: 'tags', direction: 'asc' },
      { label: t('dashboard.sortTagZA'), key: 'tags', direction: 'desc' },
      { label: t('dashboard.sortCollabMost'), key: 'collaborators', direction: 'desc' },
      { label: t('dashboard.sortCollabLeast'), key: 'collaborators', direction: 'asc' },
  ];

  const promptLimit = PLAN_LIMITS[user.membership].promptLimit;
  const isLimited = isFinite(promptLimit);
  const ownedCount = prompts.filter(p => p.ownerId === user.id).length;
  const usagePercent = isLimited ? Math.min((ownedCount / promptLimit) * 100, 100) : 0;
  const isNearLimit = isLimited && usagePercent >= 80;
  const isAtLimit = isLimited && ownedCount >= promptLimit;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        {onNewPrompt && (
          <button
            onClick={onNewPrompt}
            className="flex items-center gap-2 bg-brand-green text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-sm"
          >
            <PlusIcon />
            {t('dashboard.newPrompt')}
          </button>
        )}
      </div>

      {isLimited && !isArchivedView && (
        <div className={`mb-5 p-3 rounded-lg border ${isAtLimit ? 'bg-red-50 border-red-200' : isNearLimit ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex justify-between items-center mb-1.5">
            <span className={`text-xs font-medium ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-brand-orange' : 'text-gray-500'}`}>
              {isAtLimit
                ? t('dashboard.promptLimitReached')
                : t('dashboard.promptUsage', { count: ownedCount, limit: promptLimit })}
            </span>
            {(isNearLimit || isAtLimit) && (
              <button
                onClick={() => onNavigate?.({ type: 'upgrade', payload: null })}
                className="text-xs font-semibold text-brand-orange hover:text-orange-600 underline"
              >
                {t('dashboard.upgradePlan')}
              </button>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-brand-orange' : 'bg-brand-green'}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <div className="relative flex-grow">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder={t('dashboard.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-orange focus:border-brand-orange"
          />
        </div>
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-50"
          >
            <FilterIcon />
            {t('dashboard.filters')}
            {activeFilterCount > 0 && (
                <span className="bg-brand-orange text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">{activeFilterCount}</span>
            )}
          </button>
          {showFilters && (
            <div className="absolute z-10 top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-h-96 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-2 sticky top-0 bg-white z-10 pb-2">
                 <h3 className="text-base font-semibold">{t('dashboard.filterBy')}</h3>
                 {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="text-xs font-semibold text-brand-orange hover:text-orange-500">
                        {t('dashboard.clearAll')}
                    </button>
                 )}
              </div>

              <div className="mt-4">
                <h4 className="font-semibold text-sm mb-2 text-gray-600">{t('dashboard.filterProjects')}</h4>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                    {projects.map(project => (
                        <label key={project.id} className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100 cursor-pointer">
                            <input type="checkbox" checked={selectedProjects.includes(project.id)} onChange={() => handleProjectToggle(project.id)} className="rounded text-brand-orange focus:ring-brand-orange/50" />
                            <span className="text-sm text-gray-700">{project.name}</span>
                        </label>
                    ))}
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold text-sm mb-2 text-gray-600">{t('dashboard.filterTags')}</h4>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                     {allTags.map(tag => (
                        <label key={tag} className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100 cursor-pointer">
                            <input type="checkbox" checked={selectedTags.includes(tag)} onChange={() => handleTagToggle(tag)} className="rounded text-brand-orange focus:ring-brand-orange/50" />
                            <span className="text-sm text-gray-700">{tag}</span>
                        </label>
                    ))}
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold text-sm mb-2 text-gray-600">{t('dashboard.filterOutputType')}</h4>
                <div className="space-y-1 pr-2">
                    {Object.values(OutputType).map(type => (
                        <label key={type} className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100 cursor-pointer">
                            <input type="checkbox" checked={selectedOutputTypes.includes(type)} onChange={() => handleOutputTypeToggle(type)} className="rounded text-brand-orange focus:ring-brand-orange/50" />
                            <span className="text-sm text-gray-700 capitalize">{type}</span>
                        </label>
                    ))}
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold text-sm mb-2 text-gray-600">{t('dashboard.filterCollaborators')}</h4>
                <div className="space-y-1 pr-2">
                    {['0', '1-2', '3+'].map(count => (
                        <label key={count} className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100 cursor-pointer">
                            <input type="checkbox" checked={selectedCollaboratorCounts.includes(count)} onChange={() => handleCollaboratorCountToggle(count)} className="rounded text-brand-orange focus:ring-brand-orange/50" />
                            <span className="text-sm text-gray-700">{count} {t('dashboard.collabPeople')}</span>
                        </label>
                    ))}
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold text-sm mb-2 text-gray-600">{t('dashboard.filterLastEdited')}</h4>
                <div className="space-y-1 pr-2">
                    {DATE_CATEGORIES.map(dateRange => (
                        <label key={dateRange} className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100 cursor-pointer">
                            <input type="checkbox" checked={selectedEditedDates.includes(dateRange)} onChange={() => handleEditedDateToggle(dateRange)} className="rounded text-brand-orange focus:ring-brand-orange/50" />
                            <span className="text-sm text-gray-700">{dateCategoryLabels[dateRange]}</span>
                        </label>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setShowSort(!showSort)}
            className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-50"
          >
            <SortIcon />
            {t('dashboard.sort')}
          </button>
          {showSort && (
            <div className="absolute z-10 top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1">
              {sortOptions.map(option => {
                const isActive = sortConfig.key === option.key && sortConfig.direction === option.direction;
                return (
                  <button
                    key={option.label}
                    onClick={() => handleSortChange(option.key, option.direction)}
                    className={`w-full text-left px-4 py-2 text-sm ${isActive ? 'bg-orange-100 text-brand-orange' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {processedPrompts.length === 0 && (
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-gray-700">
            {prompts.length > 0
              ? t('dashboard.emptyFilterTitle')
              : (isArchivedView ? t('dashboard.emptyArchivedTitle') : t('dashboard.emptyTitle'))}
          </h2>
          <p className="text-gray-500 mt-2">
            {prompts.length > 0
              ? t('dashboard.emptyFilterDesc')
              : (isArchivedView ? t('dashboard.emptyArchivedDesc') : t('dashboard.emptyDesc'))}
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {processedPrompts.map(prompt => (
          <PromptCard
            key={prompt.id}
            user={user}
            prompt={prompt}
            projects={projects}
            onSelect={() => onSelectPrompt(prompt)}
            isArchived={isArchivedView}
            onUnarchive={onUnarchivePrompt}
            onDelete={onDeletePrompt}
            onArchive={onArchivePrompt}
            onOpenShareModal={onOpenShareModal}
            hideStats={true}
            />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
