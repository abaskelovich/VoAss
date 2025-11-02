import React from 'react';
import { EntryType } from '../types';

interface IconProps {
  type: 'mic' | 'mic-off' | 'stop' | 'note' | 'task' | 'event' | 'diary' | 'timelog' | 'check' | 'trash' | 'copy' | 'calendar-add' | 'doc-add' | 'google-keep' | 'google-tasks' | 'google-sheets' | 'google' | 'sync';
  className?: string;
}

const icons: { [key in IconProps['type']]: React.ReactElement } = {
  mic: <><path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 19v4" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 23h8" /></>,
  'mic-off': <><path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 19v4" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 23h8" /><line x1="1" y1="1" x2="23" y2="23" /></>,
  stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
  note: <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
  task: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  event: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  diary: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
  timelog: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
  check: <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />,
  trash: <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
  copy: <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />,
  'calendar-add': <><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 11v6m-3-3h6" /></>,
  'doc-add': <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  'google-keep': <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m6 5H6a2 2 0 01-2-2V5a2 2 0 012-2h8.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  'google-tasks': <><path d="M21 12.7V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h5.3" /><path d="m16 21 5-5-1.5-1.5-3.5 3.5-2-2L12.5 18l3.5 3.5Z" /></>,
  'google-sheets': <><path d="M3 17V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path d="M9 5v14M5 9h14M5 13h14" /></>,
  'google': <path d="M20.94 11.031c0-0.75-.062-1.469-.187-2.156H12v4.062h4.984c-0.219 1.328-0.86 2.453-1.828 3.188v2.672h3.438c2.016-1.859 3.187-4.594 3.187-7.766zM12 22c2.812 0 5.172-0.938 6.906-2.531l-3.438-2.672c-0.938 0.625-2.125 1-3.469 1-2.64 0-4.89-1.78-5.687-4.187H2.765v2.75C4.609 19.828 8.047 22 12 22zM6.312 13.812c-0.187-0.547-0.312-1.125-0.312-1.734s0.125-1.188 0.312-1.734V7.594H2.765c-0.609 1.219-0.984 2.578-0.984 4.031s0.375 2.812 0.984 4.031L6.312 13.812z"/>,
  'sync': <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.696h-4.992v.001M21.015 4.356v4.992m0 0h-4.992m4.992 0l-3.181-3.183a8.25 8.25 0 00-11.664 0l-3.181 3.183" />,
};

export const EntryIcon: React.FC<{ type: EntryType, className?: string }> = ({ type, className }) => {
  const iconMap: { [key in EntryType]: IconProps['type'] } = {
    [EntryType.NOTE]: 'note',
    [EntryType.TASK]: 'task',
    [EntryType.EVENT]: 'event',
    [EntryType.DIARY]: 'diary',
    [EntryType.TIMELOG]: 'timelog',
  };
  return <Icon type={iconMap[type]} className={className} />;
};

export const Icon: React.FC<IconProps> = ({ type, className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    {icons[type]}
  </svg>
);