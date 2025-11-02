import { GoogleGenAI, Type } from "@google/genai";
import { Entry, EntryType, Intent, AIAction } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.warn("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const schema = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      enum: Object.values(Intent),
      description: "Намерение пользователя: создать (CREATE), обновить (UPDATE), удалить (DELETE) или дополнить (APPEND) запись."
    },
    targetId: {
      type: Type.STRING,
      description: "ID существующей записи для намерений UPDATE, DELETE, APPEND. Должен быть взят из предоставленного контекста."
    },
    data: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: Object.values(EntryType), description: "Тип записи, обязателен для CREATE." },
        title: { type: Type.STRING, description: "Заголовок для задачи, события или активности." },
        content: { type: Type.STRING, description: "Содержание для заметки, дневника или текст для APPEND." },
        description: { type: Type.STRING, description: "Описание для события." },
        dueDate: { type: Type.STRING, description: "Срок выполнения задачи (ISO 8601)." },
        startTime: { type: Type.STRING, description: "Время начала события (ISO 8601)." },
        endTime: { type: Type.STRING, description: "Время окончания события (ISO 8601)." },
        location: { type: Type.STRING, description: "Место проведения события." },
        activity: { type: Type.STRING, description: "Вид деятельности для таймлога." },
        duration: { type: Type.STRING, description: "Продолжительность таймлога." },
        isDone: { type: Type.BOOLEAN, description: "Статус выполнения задачи (true - выполнена)." }
      }
    }
  },
  required: ['intent']
};

const getEntryContent = (entry: Entry): string => {
  switch (entry.type) {
    case EntryType.NOTE:
    case EntryType.DIARY:
      return entry.content;
    case EntryType.TASK:
    case EntryType.EVENT:
      return entry.title;
    case EntryType.TIMELOG:
      return entry.activity;
    default:
      return '';
  }
};

export const processDictation = async (text: string, entries: Entry[]): Promise<AIAction> => {
  if (!text) {
    throw new Error("Input text cannot be empty.");
  }

  const contextEntries = entries.slice(0, 15).map(e => ({
    id: e.id,
    type: e.type,
    content: getEntryContent(e),
    timestamp: e.timestamp,
  }));

  const prompt = `
    Проанализируй запрос пользователя и определи его намерение.
    Контекст (существующие записи):
    ${JSON.stringify(contextEntries)}

    Запрос пользователя: "${text}"

    Твоя задача:
    1. Определи намерение: CREATE (создать новую запись), UPDATE (обновить существующую), DELETE (удалить) или APPEND (дополнить текст заметки/дневника).
    2. Если намерение НЕ CREATE, найди наиболее подходящую запись из контекста и укажи ее 'id' в поле 'targetId'. Если подходящей записи нет, считай намерение как CREATE.
    3. Извлеки все необходимые данные для выполнения намерения и помести их в объект 'data'.
    4. Для UPDATE указывай в 'data' только изменяемые поля.
    5. Для APPEND в 'data.content' укажи только тот текст, который нужно добавить.
    6. Всегда расставляй знаки препинания и используй заглавные буквы для имен собственных в тексте.
    7. Даты и время возвращай в формате ISO 8601.
    8. Верни результат строго в формате JSON согласно предоставленной схеме.
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });
    
    const jsonString = response.text.trim();
    const parsed = JSON.parse(jsonString);

    if (!parsed.intent) {
      throw new Error("AI response missing 'intent'");
    }
    if (parsed.intent !== Intent.CREATE && !parsed.targetId) {
       console.warn(`Intent was ${parsed.intent} but no targetId was provided. Falling back to CREATE.`);
       return {
         intent: Intent.CREATE,
         data: { type: EntryType.NOTE, content: text }
       } as AIAction;
    }
    
    return parsed as AIAction;

  } catch (error) {
    console.error("Error processing dictation with Gemini:", error);
    return {
      intent: Intent.CREATE,
      data: { type: EntryType.NOTE, content: `Ошибка обработки: ${text}` }
    } as AIAction;
  }
};
