const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

export const sheetsApi = {
  async getAll(sheetName: string, options?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    order?: 'asc' | 'desc'
  }) {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'GET_ALL',
        sheetName,
        ...options
      })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async add(sheetName: string, rowData: any) {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'ADD', sheetName, rowData }),
      mode: 'no-cors'
    });
    // Wait for Sheets to process the write
    await new Promise(resolve => setTimeout(resolve, 800));
    return this.getAll(sheetName);
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async update(sheetName: string, id: number, rowData: any) {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'UPDATE', sheetName, id, rowData }),
      mode: 'no-cors'
    });
    // Wait for Sheets to process the write
    await new Promise(resolve => setTimeout(resolve, 800));
    return this.getAll(sheetName);
  },

  async delete(sheetName: string, id: number) {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'DELETE', sheetName, id }),
      mode: 'no-cors'
    });
    // Wait for Sheets to process the write
    await new Promise(resolve => setTimeout(resolve, 800));
    return this.getAll(sheetName);
  }
};
