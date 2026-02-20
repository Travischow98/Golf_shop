/**
 * Deploy this file in Google Apps Script.
 * - New project at script.google.com
 * - Paste this code
 * - Deploy as Web App (Anyone with link)
 * - Put URL into GOOGLE_APPS_SCRIPT_WEBHOOK
 */
const SHEET_NAME = 'Golf Shop Orders';
const TARGET_EDITOR = 'plugo.hk@gmail.com';

function doPost(e) {
  const payload = JSON.parse(e.postData.contents || '{}');
  const sheet = getSheet();

  sheet.appendRow([
    payload.orderCount || '',
    payload.orderId || '',
    payload.createdAt || '',
    payload.customerName || '',
    payload.email || '',
    payload.phone || '',
    (payload.products || []).join(', ')
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet() {
  const files = DriveApp.getFilesByName(SHEET_NAME);
  let spreadsheet;

  if (files.hasNext()) {
    spreadsheet = SpreadsheetApp.open(files.next());
  } else {
    spreadsheet = SpreadsheetApp.create(SHEET_NAME);
    spreadsheet.getActiveSheet().appendRow([
      'Order Count',
      'Order ID',
      'Created At',
      'Name',
      'Email',
      'Phone',
      'Products'
    ]);
    DriveApp.getFileById(spreadsheet.getId()).addEditor(TARGET_EDITOR);
  }

  return spreadsheet.getActiveSheet();
}
