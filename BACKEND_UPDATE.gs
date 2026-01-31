/**
 * Modificaciones para Google Apps Script
 *
 * Estas funciones deben ser actualizadas en el script de Google Apps Script
 * que actúa como backend para la aplicación.
 */

// Agregar soporte para paginación en la función doPost
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  const sheetName = data.sheetName;
  let result;

  switch (action) {
    case 'GET_ALL':
      const { limit, offset, orderBy, order } = data;
      result = getAllData(sheetName, { limit, offset, orderBy, order });
      break;

    case 'ADD':
      result = addData(sheetName, data.rowData);
      break;

    case 'UPDATE':
      result = updateData(sheetName, data.id, data.rowData);
      break;

    case 'DELETE':
      result = deleteData(sheetName, data.id);
      break;

    default:
      throw new Error(`Acción desconocida: ${action}`);
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true, data: result }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Modificar la función getAllData para soportar paginación y ordenamiento
function getAllData(sheetName, options = {}) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet "${sheetName}" no encontrado`);

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Solo encabezados o vacío

  const headers = data[0];
  const rows = data.slice(1);

  // Convertir a objetos
  let results = rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });

  // Ordenar si se especifica (para viajes por fechaHora descendente)
  if (options.orderBy) {
    results.sort((a, b) => {
      const valA = a[options.orderBy];
      const valB = b[options.orderBy];

      if (options.order === 'desc') {
        return valB > valA ? 1 : -1;
      }
      return valA > valB ? 1 : -1;
    });
  }

  // Aplicar paginación
  if (options.limit) {
    const start = options.offset || 0;
    results = results.slice(start, start + options.limit);
  }

  return results;
}
