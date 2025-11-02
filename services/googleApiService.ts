import { EventEntry, TaskEntry, DiaryEntry, TimelogEntry } from '../types';

const SPREADSHEET_NAME = "Голосовой Ассистент Логи";

// --- Helper to find or create the spreadsheet ---
let spreadsheetId: string | null = null;

const getSpreadsheetId = async (): Promise<string> => {
    if (spreadsheetId) {
        return spreadsheetId;
    }

    try {
        // 1. Search for the spreadsheet by name
        const response = await window.gapi.client.sheets.spreadsheets.get({
            // This is a bit of a hack since there's no direct search. We list files and filter.
            // For a real app, we'd use the Drive API for a proper search.
            // Here, we just try to get it, and if it fails, we create it.
            // This part of gapi doesn't support searching, so we will store id in localstorage
        });

        const storedId = localStorage.getItem('spreadsheetId');
        if(storedId) {
           try {
             await window.gapi.client.sheets.spreadsheets.get({ spreadsheetId: storedId });
             spreadsheetId = storedId;
             return spreadsheetId;
           } catch (e) {
             localStorage.removeItem('spreadsheetId');
           }
        }
        
        // 2. If not found, create it
        console.log(`Spreadsheet "${SPREADSHEET_NAME}" not found, creating it.`);
        const createResponse = await window.gapi.client.sheets.spreadsheets.create({}, {
            properties: {
                title: SPREADSHEET_NAME
            },
            sheets: [{
                properties: {
                    title: 'Логи Времени',
                    gridProperties: {
                        rowCount: 1,
                        columnCount: 4
                    }
                }
            }]
        });

        spreadsheetId = createResponse.result.spreadsheetId;
        localStorage.setItem('spreadsheetId', spreadsheetId!);

        // Add headers to the newly created sheet
        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: 'A1:D1',
            valueInputOption: 'RAW',
        }, {
            values: [['Активность', 'Начало', 'Конец', 'Длительность']]
        });
        
        return spreadsheetId!;

    } catch (error) {
        console.error("Error finding or creating spreadsheet:", error);
        throw new Error("Could not access or create the Google Sheet.");
    }
};


// --- API Functions ---

export const createCalendarEvent = async (entry: EventEntry) => {
    const event = {
        'summary': entry.title,
        'location': entry.location || '',
        'description': entry.description || '',
        'start': {
            'dateTime': entry.startTime || new Date().toISOString(),
            'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        'end': {
            'dateTime': entry.endTime || new Date(new Date(entry.startTime || Date.now()).getTime() + 60*60*1000).toISOString(),
            'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
    };

    const request = window.gapi.client.calendar.events.insert({
        'calendarId': 'primary',
        'resource': event,
    });

    return new Promise((resolve, reject) => {
        request.execute((event: any) => {
            if (event.error) {
                reject(event.error);
            } else {
                console.log('Event created: ' + event.htmlLink);
                resolve(event);
            }
        });
    });
};

export const createTask = async (entry: TaskEntry) => {
    const task = {
        title: entry.title,
        ...(entry.dueDate && { due: entry.dueDate }),
        status: 'needsAction'
    };

    const request = window.gapi.client.tasks.tasks.insert({
        tasklist: '@default', // Uses the default task list
        resource: task
    });

    return new Promise((resolve, reject) => {
        request.execute((response: any) => {
            if (response.error) {
                reject(response.error);
            } else {
                console.log('Task created: ', response.title);
                resolve(response);
            }
        });
    });
};

export const createDoc = async (entry: DiaryEntry) => {
    const title = entry.content.substring(0, 50).split(' ').slice(0, 7).join(' ');
    
    const request = window.gapi.client.docs.documents.create({
        title: title,
    });
    
    const doc = await request;
    const documentId = doc.result.documentId;
    
    // Now insert the content
    const updateRequest = window.gapi.client.docs.documents.batchUpdate({
      documentId: documentId,
      resource: {
        requests: [
          {
            insertText: {
              location: {
                index: 1, // Title is at index 0, so we start at 1
              },
              text: entry.content,
            },
          },
        ],
      },
    });

    return await updateRequest;
};


export const appendToSheet = async (entry: TimelogEntry) => {
    const sheetId = await getSpreadsheetId();
    
    const values = [
        [
            entry.activity || '',
            entry.startTime ? new Date(entry.startTime).toLocaleString('ru-RU') : '',
            entry.endTime ? new Date(entry.endTime).toLocaleString('ru-RU') : '',
            entry.duration || ''
        ]
    ];

    const request = window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: 'A1',
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: values
        }
    });

    return new Promise((resolve, reject) => {
        request.execute((response: any) => {
            if (response.error) {
                reject(response.error);
            } else {
                console.log('Appended to sheet:', response);
                resolve(response);
            }
        });
    });
};