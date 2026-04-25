import React, { useState } from 'react';
import { Trash2, Settings, Type, CheckSquare, Zap, X, GripVertical } from 'lucide-react';
import { useVttStore } from '../store';

export const ChecklistContent: React.FC = () => {
  const { checklist, setChecklist, actions, executeAction } = useVttStore();
  const [openColorPickerId, setOpenColorPickerId] = useState<string | null>(null);
  const [openActionPickerId, setOpenActionPickerId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (!checklist) return null;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newChecklist = [...checklist];
    const draggedItem = newChecklist[draggedIndex];
    newChecklist.splice(draggedIndex, 1);
    newChecklist.splice(index, 0, draggedItem);
    
    setChecklist(newChecklist);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* List of blocks */}
      <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1">
        {checklist.map((item, index) => (
          <div 
            key={item.id} 
            draggable 
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex gap-2 items-center w-full bg-black/40 border border-border/50 rounded-md p-1.5 px-2 transition-opacity ${draggedIndex === index ? 'opacity-30' : ''}`}
          >
            <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0">
               <GripVertical size={14} />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              {item.type === 'text' && (
                <textarea
                  value={item.content || ''}
                  onChange={(e) => {
                    const newChecklist = [...checklist];
                    newChecklist[index].content = e.target.value;
                    setChecklist(newChecklist);
                  }}
                  placeholder="Votre texte..."
                  style={{ color: item.color || '#e4e4e7' }}
                  className="w-full bg-transparent border-0 text-sm focus:outline-none focus:ring-0 resize-y min-h-[30px] p-0 m-0"
                />
              )}
              {item.type === 'checkbox' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.checked || false}
                    onChange={(e) => {
                      const newChecked = e.target.checked;
                      const newChecklist = [...checklist];
                      newChecklist[index].checked = newChecked;
                      setChecklist(newChecklist);
                      
                      // Execute action if provided and becoming checked
                      if (newChecked && item.actionId) {
                        executeAction(item.actionId, {});
                      }
                    }}
                    className="w-4 h-4 rounded border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={item.content || ''}
                    onChange={(e) => {
                      const newChecklist = [...checklist];
                      newChecklist[index].content = e.target.value;
                      setChecklist(newChecklist);
                    }}
                    placeholder="Tâche..."
                    style={{ color: item.color || '#e4e4e7' }}
                    className="flex-1 bg-transparent border-0 text-sm focus:outline-none focus:ring-0 px-0 py-0 font-medium h-6"
                  />
                </div>
              )}
            </div>
            
            {/* Controls for item */}
            <div className="flex items-center gap-1 shrink-0 pl-2 border-l border-border/30 h-6">
              {item.type === 'checkbox' && (
                <div className="relative">
                  <button 
                    onClick={() => setOpenActionPickerId(openActionPickerId === item.id ? null : item.id)}
                    className={`p-1 rounded transition-colors ${item.actionId ? 'text-yellow-500 bg-yellow-500/10' : 'text-muted-foreground hover:text-yellow-500'} ${openActionPickerId === item.id ? 'bg-yellow-500/20' : ''}`}
                    title="Action automatique"
                  >
                    <Zap size={12} fill={item.actionId ? "currentColor" : "none"} />
                  </button>
                  {openActionPickerId === item.id && (
                    <div className="absolute right-0 bottom-full mb-1 w-48 bg-popover border border-border rounded shadow-xl z-[300] flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <div className="flex items-center justify-between p-2 border-b border-border bg-muted/30">
                         <span className="text-[10px] font-black uppercase tracking-widest">Choisir une action</span>
                         <button onClick={() => setOpenActionPickerId(null)} className="text-muted-foreground hover:text-foreground">
                           <X size={10} />
                         </button>
                      </div>
                      <div className="max-h-40 overflow-y-auto custom-scrollbar p-1">
                        <button
                          onClick={() => {
                            const newChecklist = [...checklist];
                            newChecklist[index].actionId = null;
                            setChecklist(newChecklist);
                            setOpenActionPickerId(null);
                          }}
                          className={`w-full text-left px-2 py-1.5 text-[11px] rounded hover:bg-accent transition-colors mb-1 border border-dashed border-border/50 ${!item.actionId ? 'bg-accent/50 text-accent-foreground' : 'text-muted-foreground'}`}
                        >
                          Aucune action
                        </button>
                        {actions.map((action: any) => (
                          <button
                            key={action.id}
                            onClick={() => {
                              const newChecklist = [...checklist];
                              newChecklist[index].actionId = action.id;
                              setChecklist(newChecklist);
                              setOpenActionPickerId(null);
                            }}
                            className={`w-full text-left px-2 py-1.5 text-[11px] rounded hover:bg-accent transition-colors flex items-center gap-2 ${item.actionId === action.id ? 'bg-accent text-accent-foreground font-bold' : ''}`}
                          >
                            <Zap size={10} />
                            <span className="truncate">{action.name}</span>
                          </button>
                        ))}
                        {actions.length === 0 && (
                          <div className="p-2 text-[10px] text-muted-foreground italic text-center">
                            Aucune action créée
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {(item.type === 'text' || item.type === 'checkbox') && (
                <div className="relative">
                  <button 
                    onClick={() => setOpenColorPickerId(openColorPickerId === item.id ? null : item.id)}
                    className={`p-1 rounded transition-colors ${openColorPickerId === item.id ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary'}`}
                    title="Couleur du texte"
                  >
                    <Settings size={12} />
                  </button>
                  {openColorPickerId === item.id && (
                    <div className="absolute right-0 top-full mt-1 flex flex-wrap w-32 bg-popover border border-border p-2 rounded shadow-lg z-[200] gap-1 animate-in fade-in zoom-in duration-75">
                      {['#ffffff', '#e4e4e7', '#a1a1aa', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'].map(c => (
                        <button
                          key={c}
                          onClick={() => {
                            const newChecklist = [...checklist];
                            newChecklist[index].color = c;
                            setChecklist(newChecklist);
                            setOpenColorPickerId(null);
                          }}
                          className={`w-4 h-4 rounded-full border border-border/50 hover:scale-110 transition-transform ${item.color === c ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => {
                  const newChecklist = checklist.filter((_, i) => i !== index);
                  setChecklist(newChecklist);
                }}
                className="text-muted-foreground hover:text-white hover:bg-destructive p-1 rounded transition-colors"
                title="Supprimer ce bloc"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
        {checklist.length === 0 && (
          <p className="text-xs text-muted-foreground italic text-center py-4">La checklist est vide.</p>
        )}
      </div>

      {/* Add buttons */}
      <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-border bg-background/50 -mx-3 px-3 pb-0 rounded-b-md">
        <button
          onClick={() => setChecklist([...(checklist || []), { id: Date.now().toString() + 't', type: 'text', content: '', color: '#e4e4e7' }])}
          className="flex flex-col items-center justify-center gap-1 p-1.5 bg-muted/40 hover:bg-accent rounded border border-border/50 transition-colors text-muted-foreground hover:text-foreground"
          title="Ajouter du texte"
        >
          <Type size={14} />
          <span className="text-[9px] uppercase font-bold text-center">Texte</span>
        </button>
        <button
          onClick={() => setChecklist([...(checklist || []), { id: Date.now().toString() + 'c', type: 'checkbox', content: '', checked: false, color: '#e4e4e7' }])}
          className="flex flex-col items-center justify-center gap-1 p-1.5 bg-muted/40 hover:bg-accent rounded border border-border/50 transition-colors text-muted-foreground hover:text-foreground"
          title="Ajouter une tâche"
        >
          <CheckSquare size={14} />
          <span className="text-[9px] uppercase font-bold text-center">Tâche</span>
        </button>
      </div>
    </div>
  );
};
