import React, { useState } from 'react';
import { TaskEntry, EventEntry, TimelogEntry } from '../types';
import { Icon } from './Icon';

// --- Reusable Section Component ---

interface DashboardSectionProps {
  title: string;
  icon: 'task' | 'event' | 'timelog';
  initialItemCount: number;
  children: React.ReactNode[];
}

const DashboardSection: React.FC<DashboardSectionProps> = ({ title, icon, initialItemCount, children }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!children || children.length === 0) {
    return null;
  }

  const visibleItems = isExpanded ? children : children.slice(0, initialItemCount);
  const hasMoreItems = children.length > initialItemCount;

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex items-center mb-3">
        <Icon type={icon} className="w-6 h-6 text-brand-primary" />
        <h3 className="text-lg font-semibold text-slate-700 ml-2">{title}</h3>
      </div>
      <div className="space-y-2">
        {visibleItems}
      </div>
       {children.length === 0 && <p className="text-sm text-slate-500 italic">Нет записей на сегодня.</p>}
      {hasMoreItems && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-center mt-3 p-2 text-sm font-semibold text-brand-secondary hover:bg-brand-light rounded-md transition-colors"
        >
          {isExpanded ? `Свернуть` : `Показать еще ${children.length - initialItemCount}`}
        </button>
      )}
    </div>
  );
};


// --- Item Renderers for Dashboard Lists ---

const TaskItem: React.FC<{task: TaskEntry}> = ({ task }) => (
    <div className={`flex items-center p-2 rounded-md ${task.isDone ? 'opacity-50' : 'bg-slate-50'}`}>
        <div className={`w-1.5 h-6 rounded-full mr-3 ${task.isDone ? 'bg-slate-400' : 'bg-blue-500'}`}></div>
        <p className={`flex-grow text-slate-700 ${task.isDone ? 'line-through' : ''}`}>{task.title}</p>
        {task.dueDate && <p className="text-sm text-slate-500 ml-2">{new Date(task.dueDate).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>}
    </div>
);

const EventItem: React.FC<{event: EventEntry}> = ({ event }) => (
    <div className="flex items-center p-2 rounded-md bg-slate-50">
        <div className="w-1.5 h-6 rounded-full mr-3 bg-purple-500"></div>
        <p className="flex-grow text-slate-700">{event.title}</p>
        {event.startTime && <p className="text-sm font-medium text-slate-600 ml-2">{new Date(event.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>}
    </div>
);


// --- Main Dashboard Component ---

interface DashboardProps {
  currentTimelog?: TimelogEntry;
  todayTasks: TaskEntry[];
  otherTasks: TaskEntry[];
  todayEvents: EventEntry[];
}

export const Dashboard: React.FC<DashboardProps> = ({ currentTimelog, todayTasks, otherTasks, todayEvents }) => {
  const allTasks = [...todayTasks, ...otherTasks];

  return (
    <div className="mb-6 space-y-4">
      {currentTimelog && (
        <div className="bg-white rounded-xl shadow p-4 flex items-center">
            <Icon type="timelog" className="w-6 h-6 text-indigo-500" />
            <div className="ml-3">
                 <p className="text-sm text-slate-500">Текущая активность</p>
                 <p className="text-lg font-semibold text-slate-800">{currentTimelog.activity}</p>
            </div>
        </div>
      )}

      <DashboardSection title="Задачи" icon="task" initialItemCount={3}>
        {allTasks.map(task => <TaskItem key={task.id} task={task} />)}
      </DashboardSection>

      <DashboardSection title="События на сегодня" icon="event" initialItemCount={2}>
        {todayEvents.map(event => <EventItem key={event.id} event={event} />)}
      </DashboardSection>
    </div>
  );
};
