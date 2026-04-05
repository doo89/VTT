import React, { useRef, useState } from 'react';
import { useVttStore } from '../../../store';
import { Upload, Trash2, Eye, EyeOff } from 'lucide-react';

export const HandoutsTab: React.FC = () => {
  const { handouts, addHandout, deleteHandout, toggleHandout } = useVttStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newHandoutName, setNewHandoutName] = useState('');

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        addHandout({
          name: newHandoutName || file.name.split('.')[0],
          imageUrl: e.target?.result as string,
          isOpen: true, // open by default when created
          x: 50,
          y: 50,
          width: 400,
          height: 300,
          isMaximized: false,
        });
        setNewHandoutName('');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className="font-semibold text-sm border-b border-border pb-1">Ajouter une Aide de Jeu</h3>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Nom (optionnel)"
            value={newHandoutName}
            onChange={(e) => setNewHandoutName(e.target.value)}
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 w-full py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors"
          >
            <Upload size={16} /> Uploader une image
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground text-center">Idéal pour les règles, aides-mémoires ou indices visuels.</p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-semibold text-sm border-b border-border pb-1">Mes Aides de Jeu</h3>
        <div className="flex flex-col gap-2">
          {handouts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune aide de jeu pour l'instant.</p>
          ) : (
            handouts.map(handout => (
              <div key={handout.id} className="flex items-center justify-between p-2 rounded-md border border-border bg-card hover:bg-accent/50 group">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded shrink-0 bg-muted overflow-hidden border border-border">
                    <img src={handout.imageUrl} alt={handout.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm font-medium truncate" title={handout.name}>{handout.name}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleHandout(handout.id)}
                    className={`p-1.5 rounded-md transition-colors ${handout.isOpen ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                    title={handout.isOpen ? "Masquer sur l'écran" : "Afficher sur l'écran"}
                  >
                    {handout.isOpen ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => deleteHandout(handout.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
