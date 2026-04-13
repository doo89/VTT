import React, { useState } from 'react';
import { Trash2, Settings, Upload, Type, CheckSquare, Image as ImageIcon } from 'lucide-react';
import { useVttStore } from '../store';
import { uploadImageToStorage } from '../lib/supabase';

export const ChecklistContent: React.FC = () => {
  const { checklist, setChecklist } = useVttStore();
  const [openColorPickerId, setOpenColorPickerId] = useState<string | null>(null);

  // Close color picker when clicking elsewhere is handled implicitly by the buttons
  
  if (!checklist) return null;

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* List of blocks */}
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
        {checklist.map((item, index) => (
          <div key={item.id} className="flex gap-2 items-start w-full bg-muted/20 border border-border/50 rounded-md p-2">
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
                  className="w-full bg-transparent border-0 text-sm focus:outline-none focus:ring-0 resize-y min-h-[40px] p-0 m-0"
                />
              )}
              {item.type === 'checkbox' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.checked || false}
                    onChange={(e) => {
                      const newChecklist = [...checklist];
                      newChecklist[index].checked = e.target.checked;
                      setChecklist(newChecklist);
                    }}
                    className="w-4 h-4 rounded border-border"
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
                    className="flex-1 bg-transparent border-0 text-sm focus:outline-none focus:ring-0 px-0 py-1 font-medium"
                  />
                </div>
              )}
              {item.type === 'image' && (
                <div className="flex flex-col gap-2 w-full">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="Checklist" className="w-full max-h-48 object-contain rounded border border-border bg-black/20" />
                  ) : (
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border/50 rounded-md cursor-pointer hover:bg-muted/30 transition-colors text-muted-foreground w-full">
                      <Upload size={16} className="mb-1" />
                      <span className="text-[10px]">Charger une image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = await uploadImageToStorage(file);
                            if (url) {
                              const newChecklist = [...checklist];
                              newChecklist[index].imageUrl = url;
                              setChecklist(newChecklist);
                            }
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
            
            {/* Controls for item */}
            <div className="flex flex-col gap-1 items-end shrink-0 pl-2 border-l border-border/30">
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
            </div>
          </div>
        ))}
        {checklist.length === 0 && (
          <p className="text-xs text-muted-foreground italic text-center py-4">La checklist est vide.</p>
        )}
      </div>

      {/* Add buttons */}
      <div className="grid grid-cols-3 gap-2 mt-auto pt-3 border-t border-border bg-background/50 -mx-3 px-3 pb-0 rounded-b-md">
        <button
          onClick={() => setChecklist([...(checklist || []), { id: Date.now().toString() + 't', type: 'text', content: '', color: '#e4e4e7' }])}
          className="flex flex-col items-center justify-center gap-1.5 p-2 bg-muted/40 hover:bg-accent rounded border border-border/50 transition-colors text-muted-foreground hover:text-foreground"
          title="Ajouter du texte"
        >
          <Type size={14} />
          <span className="text-[9px] uppercase font-bold text-center">Texte</span>
        </button>
        <button
          onClick={() => setChecklist([...(checklist || []), { id: Date.now().toString() + 'c', type: 'checkbox', content: '', checked: false, color: '#e4e4e7' }])}
          className="flex flex-col items-center justify-center gap-1.5 p-2 bg-muted/40 hover:bg-accent rounded border border-border/50 transition-colors text-muted-foreground hover:text-foreground"
          title="Ajouter une tâche"
        >
          <CheckSquare size={14} />
          <span className="text-[9px] uppercase font-bold text-center">Tâche</span>
        </button>
        <button
          onClick={() => setChecklist([...(checklist || []), { id: Date.now().toString() + 'i', type: 'image', imageUrl: null }])}
          className="flex flex-col items-center justify-center gap-1.5 p-2 bg-muted/40 hover:bg-accent rounded border border-border/50 transition-colors text-muted-foreground hover:text-foreground"
          title="Ajouter une image"
        >
          <ImageIcon size={14} />
          <span className="text-[9px] uppercase font-bold text-center">Image</span>
        </button>
      </div>
    </div>
  );
};
