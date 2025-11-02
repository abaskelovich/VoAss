export enum EntryType {
  NOTE = 'NOTE',
  TASK = 'TASK',
  EVENT = 'EVENT',
  DIARY = 'DIARY',
  TIMELOG = 'TIMELOG',
}

export enum Intent {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPEND = 'APPEND',
}

interface BaseEntry {
  id: string;
  type: EntryType;
  timestamp: string;
  syncedWithGoogle?: boolean;
}

export interface NoteEntry extends BaseEntry {
  type: EntryType.NOTE;
  content: string;
}

export interface TaskEntry extends BaseEntry {
  type: EntryType.TASK;
  title: string;
  dueDate?: string;
  isDone: boolean;
}

export interface EventEntry extends BaseEntry {
  type: EntryType.EVENT;
  title: string;
  startTime?: string; // ISO 8601 format
  endTime?: string; // ISO 8601 format
  description?: string;
  location?: string;
}

export interface DiaryEntry extends BaseEntry {
  type: EntryType.DIARY;
  content: string;
}

export interface TimelogEntry extends BaseEntry {
  type: EntryType.TIMELOG;
  activity: string;
  startTime?: string;
  endTime?: string;
  duration?: string;
}

export type Entry = NoteEntry | TaskEntry | EventEntry | DiaryEntry | TimelogEntry;

export type AppStatus = 'idle' | 'listening' | 'processing' | 'error';

// Type definitions for AI Actions
type BaseData = Omit<Entry, 'id' | 'timestamp'>;

export type CreateAction = { intent: Intent.CREATE, data: BaseData };
export type UpdateAction = { intent: Intent.UPDATE, targetId: string, data: Partial<BaseData> };
export type DeleteAction = { intent: Intent.DELETE, targetId: string };
export type AppendAction = { intent: Intent.APPEND, targetId: string, data: { content: string } };

export type AIAction = CreateAction | UpdateAction | DeleteAction | AppendAction;