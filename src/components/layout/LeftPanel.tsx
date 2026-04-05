import { ChevronLeft, ChevronRight, Play, Tags, UserCircle2, Users, FileText } from 'lucide-react';
import React from 'react';
import { cn } from '../../lib/utils';
import { useVttStore } from '../../store';
import { GameTab } from './tabs/GameTab';
import { PlayersTab } from './tabs/PlayersTab';
import { RolesTab } from './tabs/RolesTab';
import { TagsTab } from './tabs/TagsTab';
import { HandoutsTab } from './tabs/HandoutsTab';

export const LeftPanel: React.FC = () => {
  const { isLeftPanelOpen, activeLeftTab, setActiveLeftTab, toggleLeftPanel } = useVttStore();

  if (!isLeftPanelOpen) {
    return (
      <div className="absolute left-0 top-0 h-full flex items-center z-50">
        <button
          onClick={toggleLeftPanel}
          className="bg-card border border-border rounded-r-md p-2 shadow-md hover:bg-accent"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'players', icon: Users, label: 'Joueurs' },
    { id: 'roles', icon: UserCircle2, label: 'Rôles' },
    { id: 'tags', icon: Tags, label: 'Tags' },
    { id: 'handouts', icon: FileText, label: 'Aides' },
    { id: 'game', icon: Play, label: 'Jeu' },
  ] as const;

  return (
    <div className="w-[320px] h-full bg-card border-r border-border flex flex-col relative z-40 shrink-0">
      <div className="flex border-b border-border p-2 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeLeftTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveLeftTab(tab.id as any)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center p-2 rounded-md transition-colors",
                isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeLeftTab === 'players' && <PlayersTab />}
        {activeLeftTab === 'roles' && <RolesTab />}
        {activeLeftTab === 'tags' && <TagsTab />}
        {activeLeftTab === 'handouts' && <HandoutsTab />}
        {activeLeftTab === 'game' && <GameTab />}
      </div>

      <button
        onClick={toggleLeftPanel}
        className="absolute -right-8 top-1/2 transform -translate-y-1/2 bg-card border border-l-0 border-border rounded-r-md p-2 shadow-md hover:bg-accent"
      >
        <ChevronLeft size={20} />
      </button>
    </div>
  );
};