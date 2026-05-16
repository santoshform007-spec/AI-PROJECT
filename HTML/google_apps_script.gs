/**
 * GOOGLE APPS SCRIPT BACKEND
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Delete any existing code and paste this code.
 * 4. Click the 'Save' icon.
 * 5. Click 'Deploy' > 'New Deployment'.
 * 6. Select 'Web App'.
 * 7. Set 'Execute as' to 'Me'.
 * 8. Set 'Who has access' to 'Anyone'.
 * 9. Click 'Deploy', authorize the permissions, and copy the 'Web App URL'.
 * 10. Paste the URL into the 'SCRIPT_URL' variable in your 'script.js' file.
 */

var SHEET_NAME = "Sheet1"; // Change this if your sheet has a different name

function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  
  // Remove header row
  data.shift();
  
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  
  var name = e.parameter.name;
  var pno = e.parameter.pno;
  var mobile = e.parameter.mobile;
  var posting = e.parameter.posting;
  
  if (action == 'add') {
    sheet.appendRow([name, pno, mobile, posting]);
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  }
  
  if (action == 'update') {
    var originalPno = e.parameter.originalPno;
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] == originalPno) { // Column 2 is PNO (Index 1)
        var row = i + 1;
        sheet.getRange(row, 1, 1, 4).setValues([[name, pno, mobile, posting]]);
        return ContentService.createTextOutput("Update Success").setMimeType(ContentService.MimeType.TEXT);
      }
    }
  }
  
  if (action == 'delete') {
    var deletePno = e.parameter.pno;
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] == deletePno) { // Column 2 is PNO (Index 1)
        sheet.deleteRow(i + 1);
        return ContentService.createTextOutput("Delete Success").setMimeType(ContentService.MimeType.TEXT);
      }
    }
  }
  
  return ContentService.createTextOutput("Action Not Found").setMimeType(ContentService.MimeType.TEXT);
}
