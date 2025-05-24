/*

This will now be Make to GCP and then to Firebase and then langgraph.

{
"Task":"tn"
"State":"GA"
"Posted":"2025-05-15T01:11:12.235Z"
"vendors":"I recommend the following top-rated vendors for Air Quality/Mold/Radon Testing/Remediation within 10 miles of your location: 1. ABC Mold Testing & Remediation Services - Average feedback rating: 4.9/5.0 - Distance from location: 5 miles 2. XYZ Radon Specialists - Average feedback rating: 4.8/5.0 - Distance from location: 7 miles 3. JKL Air Quality Experts - Average feedback rating: 4.7/5.0 - Distance from location: 9 miles These vendors have demonstrated excellence in th..."
"Appemail":"ceo@pitvipersports.com"
"Category":"Air Quality/Mold/Radon Testing/Remediation"
"custemail":"ceo@pitvipersports.com"
"If Due Date":"2025-05-14T00:00:00.000Z"
"Task Budget":133
"description":"de"
"Full Address":"3960 Timberbrook Lane"
"Customer Name":"Marcus Crockett"
}


*/

function callWebhook(jsonPayload) {
  // Your GCP webhook URL
  var webhookUrl = 'https://us-central1-prizmpoc.cloudfunctions.net/processEmailAndStoreInFirebase';
 
  // Log the payload for debugging
  Logger.log("Sending payload: " + JSON.stringify(jsonPayload));
  
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': jsonPayload,
    'headers': {
      'X-API-Key': 'dG7P2xK8nJ9fL3qRvW6zAyB4mS5tE1cX0hQ7jF2pN3gV'
    },
    'muteHttpExceptions': true
  };
 
  try {
    // Implement exponential backoff for the API call
    var response = callWithBackoff(function() {
      return UrlFetchApp.fetch(webhookUrl, options);
    });
    
    Logger.log('Response: ' + response.getContentText());
   
    // Create a log entry in Google Sheets (optional)
    //logToSheet(JSON.stringify(jsonPayload), response.getContentText(), response.getResponseCode());
   
  } catch (error) {
    Logger.log('Error: ' + error.toString());
   
    // Log errors too
    //logToSheet(JSON.stringify(jsonPayload), error.toString(), 500);
  }
}