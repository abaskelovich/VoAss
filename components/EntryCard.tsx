import React, { useState } from 'react';
import { Entry, EntryType, TaskEntry, NoteEntry, EventEntry, DiaryEntry, TimelogEntry } from '../types';
import { EntryIcon, Icon } from './Icon';

interface EntryCardProps {
  entry: Entry;
  onDelete: (id: string) => void;
  onToggleTask?: (id: string) => void;
  onSync: (entry: Entry) => Promise<void>;
  isGoogleReady: boolean;
}

const typeColors: { [key in EntryType]: { bg: string; text: string; icon: string, action: string } } = {
  [EntryType.NOTE]: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: 'text-yellow-500', action: 'hover:bg-yellow-200' },
  [EntryType.TASK]: { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'text-blue-500', action: 'hover:bg-blue-200' },
  [EntryType.EVENT]: { bg: 'bg-purple-100', text: 'text-purple-800', icon: 'text-purple-500', action: 'hover:bg-purple-200' },
  [EntryType.DIARY]: { bg: 'bg-green-100', text: 'text-green-800', icon: 'text-green-500', action: 'hover:bg-green-200' },
  [EntryType.TIMELOG]: { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: 'text-indigo-500', action: 'hover:bg-indigo-200' },
};


const CopyButton: React.FC<{ icon: 'google-keep', textToCopy: string, tooltip: string, colorClass: string }> = ({ icon, textToCopy, tooltip, colorClass }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button onClick={handleCopy} aria-label={tooltip} title={tooltip} className={`p-1.5 rounded-full text-slate-500 hover:text-slate-800 ${colorClass} transition-colors`}>
      <Icon type={copied ? 'check' : icon} className={`w-5 h-5 ${copied ? 'text-green-600' : ''}`} />
    </button>
  );
};


const SyncButton: React.FC<{ entry: Entry, onSync: (entry: Entry) => Promise<void>, isGoogleReady: boolean, colorClass: string, tooltip: string, icon: 'google-tasks' | 'google-sheets' | 'calendar-add' | 'doc-add' }> = ({ entry, onSync, isGoogleReady, colorClass, tooltip, icon }) => {
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        if (!isGoogleReady || entry.syncedWithGoogle || isSyncing) return;
        setIsSyncing(true);
        try {
            await onSync(entry);
        } catch (error) {
            console.error("Sync failed:", error);
            // Optionally show an error state
        } finally {
            setIsSyncing(false);
        }
    };
    
    let buttonContent;
    let title = tooltip;

    if (entry.syncedWithGoogle) {
        buttonContent = <Icon type="check" className="w-5 h-5 text-green-600" />;
        title = "Синхронизировано";
    } else if (isSyncing) {
        buttonContent = <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-600"></div>;
        title = "Синхронизация...";
    } else {
        buttonContent = <Icon type={icon} className="w-5 h-5" />;
    }

    return (
        <button
            onClick={handleSync}
            disabled={!isGoogleReady || entry.syncedWithGoogle || isSyncing}
            title={title}
            className={`p-1.5 rounded-full text-slate-500 transition-colors ${!entry.syncedWithGoogle && isGoogleReady ? `${colorClass} hover:text-slate-800` : 'cursor-default'}`}
        >
            {buttonContent}
        </button>
    );
};


// --- Card Layout ---

const Card: React.FC<{ entry: Entry; children: React.ReactNode; onDelete: (id: string) => void; actionContent?: React.ReactNode; }> = ({ entry, children, onDelete, actionContent }) => {
  const colors = typeColors[entry.type];
  return (
    <div className={`relative w-full ${colors.bg} rounded-xl shadow-md p-4 transition-all duration-300 hover:shadow-lg`}>
      <div className="flex items-start space-x-4">
        <div className={`flex-shrink-0 p-2 rounded-full bg-white ${colors.icon}`}>
          <EntryIcon type={entry.type} className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          {children}
          <div className="flex justify-between items-center mt-3">
             <p className="text-xs text-slate-400">{entry.timestamp}</p>
             <div className="flex items-center space-x-1">
                {actionContent}
             </div>
          </div>
        </div>
      </div>
      <button 
        onClick={() => onDelete(entry.id)}
        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors"
        aria-label="Удалить запись"
      >
        <Icon type="trash" className="w-5 h-5" />
      </button>
    </div>
  );
};

// --- Specific Card Implementations ---

export const EntryCard: React.FC<EntryCardProps> = ({ entry, onDelete, onToggleTask, onSync, isGoogleReady }) => {
  const colors = typeColors[entry.type];

  switch (entry.type) {
    case EntryType.NOTE:
      return (
        <Card entry={entry} onDelete={onDelete} actionContent={<CopyButton icon="google-keep" textToCopy={entry.content} tooltip="Скопировать в Google Keep (API недоступно)" colorClass={colors.action}/>}>
          <p className={`${colors.text} whitespace-pre-wrap`}>{entry.content}</p>
        </Card>
      );
    case EntryType.TASK:
      const task = entry as TaskEntry;
      return (
        <Card entry={entry} onDelete={onDelete} actionContent={<SyncButton entry={entry} onSync={onSync} isGoogleReady={isGoogleReady} icon="google-tasks" tooltip="Добавить в Google Tasks" colorClass={colors.action} />}>
            <div className="flex items-center">
                 <button 
                    onClick={() => onToggleTask && onToggleTask(task.id)}
                    className={`mr-3 flex-shrink-0 w-6 h-6 rounded-md border-2 ${task.isDone ? 'bg-brand-secondary border-brand-secondary' : 'border-slate-400'} flex items-center justify-center transition-all`}
                    aria-label={task.isDone ? 'Отметить как невыполненную' : 'Отметить как выполненную'}
                >
                    {task.isDone && <Icon type="check" className="w-4 h-4 text-white"/>}
                 </button>
                 <div>
                    <p className={`${colors.text} font-semibold ${task.isDone ? 'line-through text-slate-500' : ''}`}>{task.title}</p>
                    {task.dueDate && <p className={`text-sm ${colors.text} opacity-75`}>{new Date(task.dueDate).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>}
                </div>
            </div>
        </Card>
      );
    case EntryType.EVENT:
      return (
        <Card entry={entry} onDelete={onDelete} actionContent={<SyncButton entry={entry} onSync={onSync} isGoogleReady={isGoogleReady} icon="calendar-add" tooltip="Добавить в Google Календарь" colorClass={colors.action} />}>
          <p className={`${colors.text} font-semibold`}>{entry.title}</p>
          {entry.startTime && <p className={`text-sm ${colors.text} opacity-80`}>Время: {new Date(entry.startTime).toLocaleString('ru-RU')}</p>}
          {entry.location && <p className={`text-sm ${colors.text} opacity-80`}>Место: {entry.location}</p>}
          {entry.description && <p className={`text-sm ${colors.text} opacity-80 mt-1`}>{entry.description}</p>}
        </Card>
      );
    case EntryType.DIARY:
      return (
        <Card entry={entry} onDelete={onDelete} actionContent={<SyncButton entry={entry} onSync={onSync} isGoogleReady={isGoogleReady} icon="doc-add" tooltip="Создать Google Doc" colorClass={colors.action} />}>
          <p className={`${colors.text} whitespace-pre-wrap`}>{entry.content}</p>
        </Card>
      );
    case EntryType.TIMELOG:
      return (
        <Card entry={entry} onDelete={onDelete} actionContent={<SyncButton entry={entry} onSync={onSync} isGoogleReady={isGoogleReady} icon="google-sheets" tooltip="Добавить в Google Sheets" colorClass={colors.action} />}>
          <p className={`${colors.text} font-semibold`}>{entry.activity}</p>
          {(entry.startTime || entry.endTime) && (
            <p className={`text-sm ${colors.text} opacity-80`}>
              {entry.startTime} - {entry.endTime}
            </p>
          )}
          {entry.duration && <p className={`text-sm ${colors.text} opacity-80`}>Длительность: {entry.duration}</p>}
        </Card>
      );
    default:
      return null;
  }
};