function processEmails() {
  // Search for unread emails with a specific label or search criteria
  var threads = GmailApp.search('is:unread');
  var processedCount = 0;
  const MAX_EMAILS_PER_RUN = 5; // Limit number of emails processed per execution
  
  Logger.log("Found " + threads.length + " unread threads");
 
  for (var i = 0; i < threads.length && processedCount < MAX_EMAILS_PER_RUN; i++) {
    var messages = threads[i].getMessages();
    Logger.log("Thread " + i + " has " + messages.length + " messages");
   
    for (var j = 0; j < messages.length && processedCount < MAX_EMAILS_PER_RUN; j++) {
      var message = messages[j];
      var subject = message.getSubject();
      var body = message.getPlainBody();
      
      // Log raw message details for debugging
      Logger.log("Processing message - Subject: " + subject);
      Logger.log("Email body: " + body);
     
      // Check if this is a task email
      if (subject.includes("New Task") || body.includes("New task posted:")) {
        // Parse the email content into a structured object
        var parsedData = parseEmailContent(body);
        
        // Call your webhook with the parsed data
        // Add validation to ensure we have minimum required fields before sending
        if (!parsedData.customerRequest || !parsedData.customerContext) {
          Logger.log("WARNING: Missing required fields in parsed data. Not sending to webhook.");
          Logger.log("Parsed data: " + JSON.stringify(parsedData));
          
          // Mark as read but add a different label for review
          message.markRead();
          message.getThread().addLabel(GmailApp.getUserLabelByName('parsing-failed'));
          processedCount++;
          continue;
        }
        
        Logger.log("Parsed data: " + JSON.stringify(parsedData));
        callWebhook(parsedData);
       
        // Mark as read and apply a processed label
        message.markRead();
        message.getThread().addLabel(GmailApp.getUserLabelByName('processed-tasks'));
        message.getThread().removeLabel(GmailApp.getUserLabelByName('tasks-to-process'));
        
        processedCount++;
        
        // Add a small delay between API calls to avoid rate limiting
        if (processedCount < MAX_EMAILS_PER_RUN) {
          Utilities.sleep(1000); // 1 second delay
        }
      }
    }
  }
  
  Logger.log("Processed " + processedCount + " emails in this execution");
}

function parseEmailContent(emailBody) {
  // Initialize data object with default values
  var data = {
    timestamp: null,
    title: null,
    description: null,
    address: null,
    dueDate: null,
    budget: null
  };
  
  // Extract timestamp
  var timestampMatch = emailBody.match(/\*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
  if (timestampMatch) {
    data.timestamp = timestampMatch[1];
  }
  
  // Extract title
  var titleMatch = emailBody.match(/Title:\s*([^,]+)/);
  if (titleMatch) {
    data.title = titleMatch[1].trim();
  }
  
  // Extract description
  var descMatch = emailBody.match(/Description:\s*([^,]+)/);
  if (descMatch) {
    data.description = descMatch[1].trim();
  }
  
  // Extract address
  var addressMatch = emailBody.match(/Address:\s*([^,]+,[^,]+,[^,]+,[^,]+)/);
  if (addressMatch) {
    data.address = addressMatch[1].trim();
  } else {
    // Try alternate pattern
    addressMatch = emailBody.match(/(\d+\s+[\w\s.]+,\s*[\w\s]+,\s*[a-zA-Z]{2},\s*\d{5})/);
    if (addressMatch) {
      data.address = addressMatch[1].trim();
    }
  }
  
  // Extract due date
  var dueDateMatch = emailBody.match(/Due Date:(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
  if (dueDateMatch) {
    data.dueDate = dueDateMatch[1];
  } else {
    // Try alternate pattern
    dueDateMatch = emailBody.match(/Due:\s*(\d+\/\d+\/\d+)/);
    if (dueDateMatch) {
      data.dueDate = dueDateMatch[1].trim();
    }
  }
  
  // Extract budget
  var budgetMatch = emailBody.match(/Budget:\s*\$([0-9.]+)/);
  if (budgetMatch) {
    data.budget = parseInt(budgetMatch[1]); // Convert to number
  }
  
  // Extract all type information
  var typeMatch = emailBody.match(/Type:\s*([^,]+)/);
  var type = typeMatch ? typeMatch[1].trim() : "";
  
  // Calculate typeLine (this is what the webhook function expects based on the code)
  var typeLine = "";
  if (type) typeLine += "Type: " + type;
  if (data.title) {
    if (typeLine) typeLine += ", ";
    typeLine += "Title: " + data.title;
  }
  if (data.description) {
    if (typeLine) typeLine += ", ";
    typeLine += "Description: " + data.description;
  }
  if (data.address) {
    if (typeLine) typeLine += ", ";
    typeLine += "Address: " + data.address;
  }
  if (data.dueDate) {
    if (typeLine) typeLine += ", ";
    typeLine += "Due: " + data.dueDate;
  }
  if (data.budget) {
    if (typeLine) typeLine += ", ";
    typeLine += "Budget: $" + data.budget;
  }
  
  // For debugging purposes, log each extracted field
  Logger.log("Extracted timestamp: " + data.timestamp);
  Logger.log("Extracted title: " + data.title);
  Logger.log("Extracted description: " + data.description);
  Logger.log("Extracted address: " + data.address);
  Logger.log("Extracted due date: " + data.dueDate);
  Logger.log("Extracted budget: " + data.budget);
  Logger.log("Generated typeLine: " + typeLine);
  
  // Create JSON structure exactly matching what the processRequest function expects
  return {
    "customerRequest": {
      "customerId": "task-" + Date.now(),
      "requestType": "task_creation",
      "productId": data.title || "Task",
      "urgency": "medium",
      "preferredLanguage": "en-US"
    },
    "customerContext": {
      "loyaltyTier": "standard",
      "previousInteractions": 0,
      "taskData": {
        "timestamp": data.timestamp,
        "typeLine": typeLine,
        "details": {
          "title": data.title,
          "description": data.description,
          "address": data.address,
          "dueDate": data.dueDate,
          "budget": data.budget
        }
      }
    }
  };
}

function callWebhook(parsedData) {
  // Your GCP webhook URL
  var webhookUrl = 'https://us-central1-prizmpoc.cloudfunctions.net/processEmailAndStoreInFirebase';
 
  // Log the exact JSON string we're sending for debugging
  var jsonPayload = JSON.stringify(parsedData);
  Logger.log("Sending JSON payload: " + jsonPayload);
  
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
    //logToSheet(JSON.stringify(parsedData), response.getContentText(), response.getResponseCode());
   
  } catch (error) {
    Logger.log('Error: ' + error.toString());
   
    // Log errors too
    //logToSheet(JSON.stringify(parsedData), error.toString(), 500);
  }
}

// Optional: Log processing results to a Google Sheet
function logToSheet(emailBody, response, statusCode) {
  //var sheet = SpreadsheetApp.openById('YOUR_SPREADSHEET_ID').getSheetByName('Logs');
  //sheet.appendRow([new Date(), emailBody.substring(0, 100) + '...', response, statusCode]);
}

// Exponential backoff implementation
function callWithBackoff(callback, maxRetries = 5) {
  var retries = 0;
  var result;
  var error;
  
  while (retries < maxRetries) {
    try {
      result = callback();
      return result; // Success - return the result
    } catch (e) {
      error = e;
      if (e.toString().includes("Limit Exceeded")) {
        // If we hit a rate limit, wait with exponential backoff
        var waitTime = Math.pow(2, retries) * 1000 + Math.random() * 1000;
        Logger.log("Rate limit hit. Retrying in " + waitTime + "ms");
        Utilities.sleep(waitTime);
        retries++;
      } else {
        // For other errors, don't retry
        throw e;
      }
    }
  }
  
  // If we're here, we've hit max retries
  throw error;
}

// Create a time-based trigger to run automatically
function createTrigger() {
  // Delete existing triggers
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
 
  // Create a new trigger to run every 1 minute
  ScriptApp.newTrigger('processEmails')
    .timeBased()
    .everyMinutes(1)
    .create();
    
  Logger.log("Trigger created successfully to run every 1 minute");
}

// Run this function to install the trigger programmatically
function installTrigger() {
  createTrigger();
}