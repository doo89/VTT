import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { TagFormData, TagFormUpdate } from '../../types/tag-form';
import { TagGeneralTab } from './TagGeneralTab';
import { TagAppearanceTab } from './TagAppearanceTab';
import { TagFieldsTab } from './TagFieldsTab';
import { TagSmartphoneTab } from './TagSmartphoneTab';
import { TagContainerTab } from './TagContainerTab';

type TabId = 'general' | 'appearance' | 'fields' | 'smartphone' | 'container';

interface Props {
  initialData: TagFormData;
  onUpdate: (updates: TagFormUpdate) => void;
  categories: { id: string; name: string; color: string }[];
  roles: { id: string; name: string }[];
  teams: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  actions: { id: string; name: string }[];
  handouts: { id: string; name: string }[];
  handleImageFile: (file: File, onUpdate: (url: string) => void) => Promise<void>;
  tagsByCategory: Record<string, Array<{ id: string; name: string; color: string; icon: string }>>;
  tagCategories: { id: string; name: string; icon: string; color: string }[];
  showContainerTab?: boolean;
  isInstance?: boolean;
  onDeleteImage?: () => void;
  onApply?: () => void;
  onCancel?: () => void;
  hasChanges?: boolean;
  isUploading?: boolean;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'general', label: 'Général' },
  { id: 'appearance', label: 'Apparence' },
  { id: 'fields', label: 'Champs' },
  { id: 'smartphone', label: 'Smartphone' },
  { id: 'container', label: 'Container' },
];

export const TagFormContent: React.FC<Props> = ({
  initialData, onUpdate, categories, roles, teams, tags, actions, handouts,
  handleImageFile, tagsByCategory, tagCategories, showContainerTab = true,
  isInstance, onDeleteImage, onApply, onCancel, hasChanges, isUploading
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  const visibleTabs = useMemo(
    () => TABS.filter(t => t.id !== 'container' || showContainerTab),
    [showContainerTab]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentId: TabId) => {
    const idx = visibleTabs.findIndex(t => t.id === currentId);
    if (idx === -1) return;
    if (e.key === 'ArrowLeft') {
      const prev = (idx - 1 + visibleTabs.length) % visibleTabs.length;
      setActiveTab(visibleTabs[prev].id);
    } else if (e.key === 'ArrowRight') {
      const next = (idx + 1) % visibleTabs.length;
      setActiveTab(visibleTabs[next].id);
    }
  }, [visibleTabs]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full">
      <div role="tablist" aria-label="Onglets de configuration" className="flex border-b border-border mb-4 sticky top-0 bg-card z-10 shrink-0">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            id={`tag-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`tag-tabpanel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onKeyDown={(e) => handleKeyDown(e, tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex-1 min-h-[44px] ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
        <div role="tabpanel" id="tag-tabpanel-general" aria-labelledby="tag-tab-general" hidden={activeTab !== 'general'}>
          {activeTab === 'general' && <TagGeneralTab data={initialData} onUpdate={onUpdate} categories={categories} />}
        </div>
        <div role="tabpanel" id="tag-tabpanel-appearance" aria-labelledby="tag-tab-appearance" hidden={activeTab !== 'appearance'}>
          {activeTab === 'appearance' && <TagAppearanceTab data={initialData} onUpdate={onUpdate} handleImageFile={handleImageFile} onDeleteImage={onDeleteImage} isUploading={isUploading} />}
        </div>
        <div role="tabpanel" id="tag-tabpanel-fields" aria-labelledby="tag-tab-fields" hidden={activeTab !== 'fields'}>
          {activeTab === 'fields' && <TagFieldsTab data={initialData} onUpdate={onUpdate} roles={roles} teams={teams} />}
        </div>
        <div role="tabpanel" id="tag-tabpanel-smartphone" aria-labelledby="tag-tab-smartphone" hidden={activeTab !== 'smartphone'}>
          {activeTab === 'smartphone' && (
            <TagSmartphoneTab
              data={initialData}
              onUpdate={onUpdate}
              tags={tags}
              roles={roles}
              actions={actions}
              handouts={handouts}
              isInstance={isInstance}
            />
          )}
        </div>
        <div role="tabpanel" id="tag-tabpanel-container" aria-labelledby="tag-tab-container" hidden={activeTab !== 'container'}>
          {activeTab === 'container' && (
            <TagContainerTab
              data={initialData}
              onUpdate={onUpdate}
              tagsByCategory={tagsByCategory}
              tagCategories={tagCategories}
              isInstance={isInstance}
            />
          )}
        </div>
      </div>

      {(onApply || onCancel) && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-4 shrink-0">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-muted text-muted-foreground hover:text-foreground hover:bg-accent rounded-md text-sm font-medium transition-colors min-h-[44px]"
            >
              Annuler
            </button>
          )}
          {onApply && (
            <button
              onClick={onApply}
              disabled={!hasChanges}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {isUploading ? 'Upload en cours...' : 'Appliquer'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
