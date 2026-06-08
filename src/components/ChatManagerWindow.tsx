import React, { useState, useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { useVttStore } from '../store';
import { getChannel } from '../lib/realtime-host';
import type { ChatMessage, Player, Team } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ChatManagerWindowProps {
  onClose: () => void;
}

interface Thread {
  id: string; // Player ID, Team ID, or combined key (e.g., 'a-b')
  name: string;
  type: 'player' | 'group' | 'spy';
  color?: string;
  icon?: string;
  senderName?: string; // For spy threads
  recipientName?: string; // For spy threads
}

export const ChatManagerWindow: React.FC<ChatManagerWindowProps> = ({ onClose }) => {
  const { players, teams, chatMessages, markChatMessagesAsRead, addChatMessage } = useVttStore();
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeThread]);

  // Marquer comme lu à l'ouverture du thread
  useEffect(() => {
    if (activeThread) {
      const hasUnread = getUnreadCount(activeThread.id, activeThread.type) > 0;
      if (hasUnread) {
        markChatMessagesAsRead(activeThread.id);
      }
    }
  }, [activeThread, chatMessages, markChatMessagesAsRead]);

  // Joueurs vivants
  const livingPlayers = players.filter(p => !p.isDead);

  // 1. Générer les canaux de groupe (Équipes)
  const groupThreads: Thread[] = teams.map(t => ({
    id: t.id,
    name: `Groupe : ${t.name}`,
    type: 'group',
    color: t.color,
    icon: t.icon || 'Users'
  }));

  // 2. Générer les canaux MJ ↔ Joueur
  const playerThreads: Thread[] = livingPlayers.map(p => ({
    id: p.id,
    name: p.name,
    type: 'player',
    color: p.color
  }));

  // 3. Générer les canaux d'espionnage (Chuchotements Joueur A ↔ Joueur B)
  // On regarde tous les messages où l'expéditeur et le destinataire sont des joueurs (aucun n'est 'gm' ou 'group')
  const spyThreads: Thread[] = [];
  chatMessages.forEach(msg => {
    if (
      msg.senderId !== 'gm' &&
      msg.recipientId !== 'gm' &&
      msg.recipientType === 'player'
    ) {
      const p1Id = msg.senderId;
      const p2Id = msg.recipientId;
      // Clé unique ordonnée pour le thread
      const threadId = [p1Id, p2Id].sort().join('--');

      if (!spyThreads.some(t => t.id === threadId)) {
        const p1 = players.find(p => p.id === p1Id);
        const p2 = players.find(p => p.id === p2Id);
        if (p1 && p2) {
          spyThreads.push({
            id: threadId,
            name: `${p1.name} ↔ ${p2.name}`,
            type: 'spy',
            senderName: p1.name,
            recipientName: p2.name
          });
        }
      }
    }
  });

  // Tous les threads disponibles
  const allThreads = [...groupThreads, ...playerThreads, ...spyThreads];

  // Sélectionner le premier thread par défaut s'il n'y en a pas d'actif
  useEffect(() => {
    if (!activeThread && allThreads.length > 0) {
      setActiveThread(allThreads[0]);
    }
  }, [activeThread, allThreads]);

  // Filtrer les messages pour le thread actif
  const getActiveMessages = (): ChatMessage[] => {
    if (!activeThread) return [];

    if (activeThread.type === 'group') {
      // Messages de groupe
      return chatMessages.filter(m => m.recipientId === activeThread.id);
    } else if (activeThread.type === 'player') {
      // Messages MJ ↔ Joueur
      return chatMessages.filter(m => 
        (m.senderId === 'gm' && m.recipientId === activeThread.id) ||
        (m.senderId === activeThread.id && m.recipientId === 'gm')
      );
    } else {
      // Espionnage : chuchotements entre deux joueurs
      const [p1Id, p2Id] = activeThread.id.split('--');
      return chatMessages.filter(m => 
        (m.senderId === p1Id && m.recipientId === p2Id) ||
        (m.senderId === p2Id && m.recipientId === p1Id)
      );
    }
  };

  // Nombre de messages non-lus par thread
  const getUnreadCount = (threadId: string, type: 'player' | 'group' | 'spy'): number => {
    if (type === 'group') {
      return chatMessages.filter(m => m.recipientId === threadId && m.unread).length;
    } else if (type === 'player') {
      return chatMessages.filter(m => m.senderId === threadId && m.recipientId === 'gm' && m.unread).length;
    } else {
      // Les chuchotements espionnés ne déclenchent pas de notifications non-lues
      return 0;
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !activeThread) return;
    if (activeThread.type === 'spy') return; // Read-only

    const message: ChatMessage = {
      id: uuidv4(),
      senderId: 'gm',
      senderName: 'Maître du Jeu',
      recipientId: activeThread.id,
      recipientType: activeThread.type === 'group' ? 'group' : 'gm',
      text: messageText.trim(),
      timestamp: Date.now()
    };

    // Envoyer via le canal Supabase Realtime
    const channel = getChannel();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'private_chat_message',
        payload: message
      }).then(() => {
        // Ajouter localement dans le store
        addChatMessage(message);
      }).catch(console.error);
    } else {
      // Mode local
      addChatMessage(message);
    }

    setMessageText('');
  };

  const DynamicIcon = ({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) => {
    const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
    return <IconComponent className={className} style={style} />;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[999] p-4 text-neutral-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col h-[75vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Icons.MessageSquareCode className="h-6 w-6 text-indigo-400" />
            <h2 className="text-lg font-bold">Messagerie Secrète & Chuchotements (MJ)</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-neutral-850 rounded-lg transition-all text-neutral-400 hover:text-neutral-200">
            <Icons.X className="h-5 w-5" />
          </button>
        </div>

        {/* Layout split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar gauche : Liste des canaux */}
          <div className="w-64 border-r border-neutral-800 flex flex-col bg-neutral-950/20">
            <div className="p-3 text-[10px] uppercase font-bold text-neutral-500 border-b border-neutral-850 tracking-wider">
              Discussions actives
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-4">
              {/* Canaux de groupe */}
              {groupThreads.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 py-1 text-[10px] font-semibold text-neutral-600 uppercase">Groupes / Équipes</div>
                  {groupThreads.map(t => {
                    const unread = getUnreadCount(t.id, t.type);
                    const isActive = activeThread?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setActiveThread(t)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                          isActive 
                            ? 'bg-indigo-650 text-white' 
                            : 'hover:bg-neutral-850 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <DynamicIcon name={t.icon || 'Users'} className="h-4 w-4" style={{ color: t.color }} />
                          <span className="truncate">{t.name}</span>
                        </span>
                        {unread > 0 && (
                          <span className="bg-red-500 text-white font-bold rounded-full text-[9px] px-1.5 py-0.5">
                            {unread}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Canaux individuels */}
              {playerThreads.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 py-1 text-[10px] font-semibold text-neutral-600 uppercase">MJ ↔ Joueurs</div>
                  {playerThreads.map(t => {
                    const unread = getUnreadCount(t.id, t.type);
                    const isActive = activeThread?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setActiveThread(t)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                          isActive 
                            ? 'bg-indigo-650 text-white' 
                            : 'hover:bg-neutral-850 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                          <span className="truncate">{t.name}</span>
                        </span>
                        {unread > 0 && (
                          <span className="bg-red-500 text-white font-bold rounded-full text-[9px] px-1.5 py-0.5">
                            {unread}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Chuchotements espionnés */}
              {spyThreads.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 py-1 text-[10px] font-semibold text-neutral-600 uppercase flex items-center gap-1">
                    <Icons.Eye className="h-3 w-3 text-emerald-500" />
                    Espionnage
                  </div>
                  {spyThreads.map(t => {
                    const isActive = activeThread?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setActiveThread(t)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                          isActive 
                            ? 'bg-indigo-650 text-white' 
                            : 'hover:bg-neutral-850 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <Icons.MessageSquareDashed className="h-3.5 w-3.5 text-neutral-500" />
                          <span className="truncate text-[11px]">{t.name}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Paneau central : Discussion active */}
          <div className="flex-1 flex flex-col bg-neutral-950/10">
            {activeThread ? (
              <>
                {/* Thread Header */}
                <div className="px-6 py-3 border-b border-neutral-800 flex items-center justify-between">
                  <span className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                    {activeThread.type === 'group' && <Icons.Users className="h-4 w-4 text-indigo-400" />}
                    {activeThread.type === 'player' && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeThread.color }} />}
                    {activeThread.type === 'spy' && <Icons.Eye className="h-4 w-4 text-emerald-500" />}
                    {activeThread.name}
                  </span>
                  {activeThread.type === 'spy' && (
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 border border-emerald-900 rounded-full font-bold uppercase">
                      Supervision active (Lecture seule)
                    </span>
                  )}
                </div>

                {/* Message list */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  {getActiveMessages().map((msg) => {
                    const isMe = msg.senderId === 'gm';
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col max-w-[70%] ${isMe ? 'ml-auto items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
                          <span>{msg.senderName}</span>
                          <span>•</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-neutral-800 text-neutral-200 rounded-tl-none border border-neutral-750'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                  {getActiveMessages().length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-600 gap-2 py-20 italic">
                      <Icons.MessageSquareText className="h-10 w-10 opacity-20" />
                      <span className="text-xs uppercase tracking-wider font-semibold">Aucun message échangé</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message input */}
                {activeThread.type !== 'spy' ? (
                  <div className="p-4 border-t border-neutral-800 bg-neutral-900/40 flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Écrire un message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendMessage();
                      }}
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 text-neutral-200"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="p-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl transition-all shadow-md"
                    >
                      <Icons.Send className="h-4.5 w-4.5" />
                    </button>
                  </div>
                ) : (
                  <div className="p-4 border-t border-neutral-800 bg-neutral-950/20 text-center text-xs text-neutral-500 font-semibold italic">
                    Les chuchotements entre joueurs ne peuvent pas être modifiés par le MJ.
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-neutral-600 gap-2">
                <Icons.MessageCircleHeart className="h-16 w-16 opacity-10" />
                <span className="text-sm font-semibold uppercase tracking-widest">Sélectionner un canal de discussion</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
