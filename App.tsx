import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { processDictation } from './services/geminiService';
import * as googleApiService from './services/googleApiService';
import { AppStatus, Entry, TaskEntry, EntryType, AIAction, Intent, NoteEntry, DiaryEntry, EventEntry, TimelogEntry } from './types';
import { EntryCard } from './components/EntryCard';
import { Icon } from './components/Icon';
import { Loader } from './components/Loader';
import { Dashboard } from './components/Dashboard';
import { useGoogleAuth } from './hooks/useGoogleAuth';

const App: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [status, setStatus] = useState<AppStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition();
  const { isSignedIn, isInitialized, signIn, signOut, userProfile } = useGoogleAuth();

  const handleDictationEnd = useCallback(async (finalTranscript: string) => {
    if (finalTranscript.trim().length === 0) {
      setStatus('idle');
      return;
    }
    setStatus('processing');
    setError(null);
    try {
      const action: AIAction = await processDictation(finalTranscript, entries);
      
      setEntries(prev => {
        switch (action.intent) {
          case Intent.CREATE:
            const newEntry: Entry = {
              id: new Date().toISOString() + Math.random(),
              timestamp: new Date().toLocaleString('ru-RU'),
              syncedWithGoogle: false,
              ...action.data
            } as Entry;
            return [newEntry, ...prev];

          case Intent.UPDATE:
            return prev.map(entry =>
              entry.id === action.targetId
                ? { ...entry, ...action.data, timestamp: new Date().toLocaleString('ru-RU') }
                : entry
            );
          
          case Intent.APPEND:
             return prev.map(entry => {
                if (entry.id === action.targetId && (entry.type === EntryType.NOTE || entry.type === EntryType.DIARY)) {
                  const currentContent = (entry as NoteEntry | DiaryEntry).content;
                  return { ...entry, content: `${currentContent}\n${action.data.content}`, timestamp: new Date().toLocaleString('ru-RU') };
                }
                return entry;
             });

          case Intent.DELETE:
            return prev.filter(entry => entry.id !== action.targetId);

          default:
            return prev;
        }
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Не удалось обработать запись: ${message}`);
      setEntries(prev => [{
        id: new Date().toISOString(),
        type: EntryType.NOTE,
        content: `Ошибка: ${finalTranscript}`,
        timestamp: new Date().toLocaleString('ru-RU'),
        syncedWithGoogle: false,
      }, ...prev]);
    } finally {
      setStatus('idle');
    }
  }, [entries]);

  useEffect(() => {
    if (!isListening && transcript) {
      handleDictationEnd(transcript);
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, transcript]);
  
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      setStatus('listening');
    }
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };
  
  const handleToggleTask = (id: string) => {
      setEntries(prev => prev.map(entry => {
          if (entry.id === id && entry.type === EntryType.TASK) {
              return { ...entry, isDone: !(entry as TaskEntry).isDone };
          }
          return entry;
      }));
  };

  const handleSync = async (entry: Entry) => {
    try {
      switch (entry.type) {
        case EntryType.EVENT:
          await googleApiService.createCalendarEvent(entry as EventEntry);
          break;
        case EntryType.TASK:
          await googleApiService.createTask(entry as TaskEntry);
          break;
        case EntryType.DIARY:
          await googleApiService.createDoc(entry as DiaryEntry);
          break;
        case EntryType.TIMELOG:
          await googleApiService.appendToSheet(entry as TimelogEntry);
          break;
        default:
          console.warn(`Sync not implemented for type: ${entry.type}`);
          return;
      }
      // Mark as synced on success
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, syncedWithGoogle: true } : e));
    } catch (error) {
      console.error('Failed to sync entry with Google:', error);
      alert(`Не удалось синхронизировать запись: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };
  
  const dashboardData = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;
    
    const allTasks = entries.filter(e => e.type === EntryType.TASK) as TaskEntry[];
    const allEvents = entries.filter(e => e.type === EntryType.EVENT) as EventEntry[];

    const isDateToday = (dateStr?: string) => {
        if (!dateStr) return false;
        try {
            const date = new Date(dateStr).getTime();
            return date >= todayStart && date < todayEnd;
        } catch(e) { return false; }
    }

    const todayTasks = allTasks.filter(t => isDateToday(t.dueDate)).sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    const otherTasks = allTasks.filter(t => !isDateToday(t.dueDate));
    const todayEvents = allEvents.filter(e => isDateToday(e.startTime)).sort((a,b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime());
    const currentTimelog = entries.find(e => e.type === EntryType.TIMELOG) as TimelogEntry | undefined;
    
    return { todayTasks, otherTasks, todayEvents, currentTimelog };
  }, [entries]);

  const renderStatus = () => {
      if (!isSupported) {
          return <p className="text-center text-red-500">Распознавание речи не поддерживается в вашем браузере.</p>
      }
      if (!isSignedIn) {
          return <p className="text-center text-slate-500 min-h-[2.5rem]">Войдите в аккаунт Google, чтобы начать</p>
      }
      if (status === 'error') {
          return <p className="text-center text-red-500">{error}</p>
      }
      if (status === 'listening') {
          return <p className="text-center text-brand-secondary min-h-[2.5rem] px-4">{transcript || "Говорите..."}</p>
      }
       if (status === 'processing') {
          return <div className="min-h-[2.5rem] flex justify-center items-center"><Loader /></div>;
      }
      return <p className="text-center text-slate-500 min-h-[2.5rem]">Нажмите, чтобы создать или изменить запись</p>
  }

  const renderMainContent = () => {
    if (!isInitialized) {
      return <div className="text-center py-20"><Loader /></div>;
    }

    if (!isSignedIn) {
      return (
        <div className="text-center py-20">
          <Icon type="google" className="mx-auto w-16 h-16 text-slate-400" />
          <h2 className="mt-4 text-xl font-semibold text-slate-600">Требуется авторизация</h2>
          <p className="mt-2 text-slate-500 max-w-md mx-auto">Для синхронизации с Google Календарем, Задачами, Документами и Таблицами, пожалуйста, войдите в свой аккаунт Google.</p>
          <button onClick={signIn} className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary">
            <Icon type="google" className="w-5 h-5 mr-3" />
            Войти через Google
          </button>
        </div>
      );
    }

    return (
      <>
        <Dashboard 
          currentTimelog={dashboardData.currentTimelog}
          todayTasks={dashboardData.todayTasks}
          otherTasks={dashboardData.otherTasks}
          todayEvents={dashboardData.todayEvents}
        />
        
        {entries.length === 0 && status !== 'listening' && status !== 'processing' && (
             <div className="text-center py-10">
                <Icon type="note" className="mx-auto w-16 h-16 text-slate-300" />
                <h2 className="mt-4 text-xl font-semibold text-slate-600">Ваш список пока пуст</h2>
                <p className="mt-2 text-slate-500">Надиктуйте заметку, задачу или событие, и оно появится здесь.</p>
            </div>
        )}
        <div className="space-y-4">
          {entries.map(entry => (
            <EntryCard 
                key={entry.id} 
                entry={entry} 
                onDelete={handleDeleteEntry}
                onToggleTask={handleToggleTask}
                onSync={handleSync}
                isGoogleReady={isSignedIn}
            />
          ))}
        </div>
      </>
    );
  };
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <Icon type="mic" className="w-8 h-8 text-brand-primary" />
              <h1 className="text-2xl font-bold text-slate-800 ml-2">Голосовой Ассистент</h1>
            </div>
            {isSignedIn && userProfile && (
              <div className="flex items-center space-x-3">
                <img src={userProfile.picture} alt="profile" className="w-8 h-8 rounded-full"/>
                <button onClick={signOut} className="text-sm font-medium text-slate-600 hover:text-brand-primary">Выйти</button>
              </div>
            )}
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6 w-full max-w-3xl">
        {renderMainContent()}
      </main>

      <footer className="bg-white/90 backdrop-blur-lg sticky bottom-0 border-t border-slate-200">
        <div className="container mx-auto p-4 max-w-3xl flex flex-col items-center justify-center space-y-3">
          {renderStatus()}
          <button
            onClick={toggleListening}
            disabled={!isSupported || !isSignedIn}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-brand-light disabled:bg-slate-400 disabled:cursor-not-allowed
            ${isListening ? 'bg-red-500 animate-pulse-slow' : 'bg-brand-primary'}`}
            aria-label={isListening ? 'Остановить запись' : 'Начать запись'}
          >
            <Icon type={isListening ? 'stop' : 'mic'} className="w-8 h-8"/>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;