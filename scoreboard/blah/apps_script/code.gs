// Replace these values before deploying
const SPREADSHEET_ID = '1hadLnlAP0r_DTEwmppJ6QP3aT3YvT21h_d41KhCPbs8'; // from your sheet URL
const SHEET_NAME = 'Sheet1';
const SECRET_TOKEN = 'b1a2d3e4-f5a6-4b7c-8d9e-0123456789ab'; // keep secret


function _getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
}

function _jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Append a row. Accepts JSON POST with body either { token: "...", data: { Map:..., "CT Score":..., ... } }
function doPost(e) {
  try {
    const raw = e.postData && e.postData.contents ? e.postData.contents : null;
    if (!raw) return _jsonResponse({ error: 'No POST body' });

    const body = JSON.parse(raw);
    const token = body.token || (e.parameter && e.parameter.token);
    if (token !== SECRET_TOKEN) return _jsonResponse({ error: 'Unauthorized' });

    const payload = body.data || body;
    const sheet = _getSheet();

    const row = [
      payload.Map || '',
      payload.Half || '',
      (payload['CT Score'] !== undefined) ? payload['CT Score'] : '',
      (payload['TR Score'] !== undefined) ? payload['TR Score'] : '',
      (typeof payload['Players JSON'] === 'string') ? payload['Players JSON'] : JSON.stringify(payload['Players JSON'] || []),
      payload.Date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      (payload['Match ID'] !== undefined) ? payload['Match ID'] : '',
      payload['Tracker Server'] || ''
    ];

    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      sheet.appendRow(row);
    } finally {
      lock.releaseLock();
    }

    return _jsonResponse({ result: 'ok' });
  } catch (err) {
    return _jsonResponse({ error: err.message || String(err) });
  }
}


// GET endpoints for convenience. ?action=last&token=...
function doGet(e) {
  try {
    const action = (e.parameter && e.parameter.action) ? e.parameter.action : '';
    const token = e.parameter && e.parameter.token;
    if (token !== SECRET_TOKEN) return _jsonResponse({ error: 'Unauthorized' });

    const sheet = _getSheet();
    const data = sheet.getDataRange().getValues();

    if (action === 'last') {
      if (data.length <= 1) return _jsonResponse({ last: null });
      
      const headers = data[0];
      const lastRow = data[data.length - 1];
      const obj = {};
      headers.forEach((h, i) => { obj[h] = lastRow[i]; });
      return _jsonResponse({ last: obj });
    }

    // default: return full sheet
    const headers = data[0] || [];
    const rows = [];
    for (let r = 1; r < data.length; r++) {
      const row = {};
      headers.forEach((h, i) => row[h] = data[r][i]);
      rows.push(row);
    }
    return _jsonResponse({ rows });
  } catch (err) {
    return _jsonResponse({ error: err.message || String(err) });
  }
}
