import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground w-full max-w-md rounded-xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={20} className="text-yellow-500" />
            {title}
          </div>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground p-1.5 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">{message}</p>
        </div>
        <div className="flex justify-end gap-3 p-4 border-t border-border bg-muted/30">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium shadow-sm transition-colors"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
};
