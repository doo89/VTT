import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useVttStore } from '../store';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
  label?: string; // Optional label for accessibility/UI
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, className = '', label }) => {
  const recentColors = useVttStore((state) => state.recentColors);
  const addRecentColor = useVttStore((state) => state.addRecentColor);
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Position below the button
      setCoords({
        left: rect.left,
        top: rect.bottom + 8, // 8px spacing
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If click is outside both the button and the popover, close it.
      if (
        isOpen &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    // Also close on scroll to prevent detached floating
    document.addEventListener('scroll', () => setIsOpen(false), true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', () => setIsOpen(false), true);
    };
  }, [isOpen]);

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value.toUpperCase();
    onChange(newColor);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    addRecentColor(e.target.value.toUpperCase());
  };

  const handleColorClick = (c: string) => {
    onChange(c);
    addRecentColor(c);
    setIsOpen(false);
  };

  return (
    <>
      <div
        className={`relative inline-block ${className || 'w-8 h-8'}`}
        ref={buttonRef}
      >
        <div
          className="w-full h-full rounded-md cursor-pointer border border-border shadow-sm flex items-center justify-center bg-background hover:bg-accent transition-colors overflow-hidden"
          onClick={() => setIsOpen(!isOpen)}
          title={label || "Choisir une couleur"}
        >
          <div
            className="w-full h-full"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>

      {isOpen && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[9999] bg-popover border border-border rounded-md shadow-2xl p-3 w-48"
          style={{
            left: `${coords.left}px`,
            top: `${coords.top}px`,
            // Ensure it doesn't go off the right side of the screen
            transform: coords.left + 192 > window.innerWidth ? `translateX(-${coords.left + 192 - window.innerWidth + 16}px)` : 'none'
          }}
        >
          <div className="mb-3">
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Couleur personnalisée</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={color}
                onChange={handleNativeChange}
                onBlur={handleBlur}
                className="w-full h-8 cursor-pointer rounded border border-border p-0"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Couleurs récentes</label>
            <div className="grid grid-cols-4 gap-2">
              {recentColors.map((c, i) => (
                <button
                  key={`${c}-${i}`}
                  onClick={() => handleColorClick(c)}
                  className="w-full aspect-square rounded shadow-sm border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
