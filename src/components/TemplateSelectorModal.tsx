import React, { useEffect, useState } from 'react';
import { X, Layout, Users, Ghost, HelpCircle, History } from 'lucide-react';
import { useVttStore, initialState } from '../store';

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExportHistoryItem {
  id: string;
  timestamp: number;
  roomName: string;
  data: any;
}

export const TemplateSelectorModal: React.FC<TemplateSelectorModalProps> = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      console.log("TemplateSelectorModal opened, loading history from IndexedDB...");
      import('../lib/db').then(db => {
        db.getHistory().then(items => {
          console.log("History loaded from IndexedDB:", items.length, "items");
          setHistory(items);
        }).catch(err => {
          console.error("Failed to load history from IndexedDB:", err);
          setHistory([]);
        });
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoad = (data: any, mode: 'default' | 'reset' | 'merge') => {
    if (mode === 'reset') {
      useVttStore.setState({ ...initialState, ...data });
    } else if (mode === 'merge') {
      const currentState = useVttStore.getState();
      const mergedState: any = { ...currentState };
      
      for (const key of Object.keys(data)) {
        if (key === '_importMode') continue;
        if (Array.isArray(data[key]) && Array.isArray(mergedState[key])) {
          const existing = [...mergedState[key]];
          data[key].forEach((newItem: any) => {
            if (newItem && typeof newItem === 'object' && newItem.id) {
              const index = existing.findIndex(e => e.id === newItem.id);
              if (index >= 0) {
                existing[index] = { ...existing[index], ...newItem };
              } else {
                existing.push(newItem);
              }
            } else if (!existing.includes(newItem)) {
              existing.push(newItem);
            }
          });
          mergedState[key] = existing;
        } else if (typeof data[key] === 'object' && !Array.isArray(data[key]) && data[key] !== null) {
          mergedState[key] = { ...mergedState[key], ...data[key] };
        } else {
          mergedState[key] = data[key];
        }
      }
      useVttStore.setState(mergedState);
    } else {
      useVttStore.setState(data);
    }
    onClose();
  };

  const templates = [
    {
      id: 'lg',
      name: 'Loups-Garous de Tiercelieu',
      description: 'Le classique jeu de déduction sociale et de survie.',
      icon: Users,
      color: 'bg-red-500/10 text-red-500 border-red-500/20'
    },
    {
      id: 'botc',
      name: 'Blood on the Clocktower',
      description: 'Un jeu complexe de bluff et de démonologie.',
      icon: Ghost,
      color: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
    },
    {
      id: 'quiz',
      name: 'Quiz',
      description: 'Transformez votre salle en plateau de jeu TV.',
      icon: HelpCircle,
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
          <div className="flex items-center gap-2">
            <Layout className="text-primary h-5 w-5" />
            <h3 className="font-bold text-lg">Choisir un style de jeu</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-accent rounded-md"
            title="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div 
                key={template.id}
                className="relative group cursor-not-allowed"
              >
                <div className="h-full border border-border rounded-lg p-4 bg-muted/20 flex flex-col items-center text-center gap-3 grayscale opacity-60">
                  <div className={`p-3 rounded-xl border-2 ${template.color}`}>
                    <template.icon size={32} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="font-bold text-sm">{template.name}</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {template.description}
                    </p>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-zinc-900/90 text-white text-[10px] font-bold px-2 py-1 rounded border border-zinc-700 shadow-xl">
                    Bientôt disponible
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Export History */}
          <div className="p-6 border-t border-border flex flex-col gap-4 bg-muted/10">
            <div className="flex items-center gap-2 text-muted-foreground">
              <History size={18} className="text-primary" />
              <h4 className="font-bold text-sm">Derniers exports</h4>
            </div>
            
            {history.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-border rounded-lg text-muted-foreground text-xs italic">
                Aucun historique d'export disponible.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {history.map((item) => (
                  <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-card border border-border rounded-lg shadow-sm hover:border-primary/50 transition-colors">
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-sm truncate">{item.roomName}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => handleLoad(item.data, 'default')}
                        className="flex-1 md:flex-none py-1.5 px-3 bg-blue-500/10 hover:bg-blue-600 text-blue-500 hover:text-white border border-blue-500/20 rounded text-[10px] font-bold transition-all uppercase tracking-wider"
                        title="Charger l'export tel quel"
                      >
                        Classique
                      </button>
                      <button 
                        onClick={() => handleLoad(item.data, 'reset')}
                        className="flex-1 md:flex-none py-1.5 px-3 bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 rounded text-[10px] font-bold transition-all uppercase tracking-wider"
                        title="Repartir de zéro avec ces données"
                      >
                        Repartir à 0
                      </button>
                      <button 
                        onClick={() => handleLoad(item.data, 'merge')}
                        className="flex-1 md:flex-none py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-500 hover:text-white border border-emerald-500/20 rounded text-[10px] font-bold transition-all uppercase tracking-wider"
                        title="Fusionner avec l'état actuel"
                      >
                        Fusionner
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-muted/30 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
