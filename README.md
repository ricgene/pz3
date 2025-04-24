




richard notes
  - will want pub-sub?  ask ai, project?

# Purpose and high level description of our ai system Prizm (legacy + new) service:

   Use proceses to enable a customers to submit a Tasks to a legacy mobile(Glide) app and have the new
   subsystems and be matched to qualified vendors.  
   
   These processes will enable the Task to progress from initiation trough to completion.
   
   This first process acts as a project manager.  At any given time, we expect to have many separate Tasks
   in progress across one or more customers and their vendors.

   The second process that works as back-office process to provide metrics of projects in-progress, 
   projects completed, and financial updates ( number of projects completed, value of projects completed,
   total made by the Prizm services team).

 # process 1: Customer-lgawf1-Vendor: repos/functions. 
   ## Legacy Prizm mobile app in Glide sends an email to Gmail to initiate the new service components.

'''
New task posted: 2025-03-25T19:47:07.846Z
Fud
Type: Appliance Purchase, Title: Fud, Description: Rud, Address: 1150 compass pointe xing, Alpharetta, ga, 30005, Due: 3/26/2025, 12:00:00 AM, Budget: $1


1150 compass pointe xing, Alpharetta, ga, 30005

Due Date:2025-03-26T00:00:00.000Z

State: GA
'''
   to-do:
      add user name and email.
      create unique task name (useremail,taskname no space, taskdate)

   ## foilboi@gmail.com account recieves the mail. and gmailtoagent in script.google.com runs processEmails() function.
      The processEmails is in ./gmail-gcpWebhook/processEmails.js.


      This script calls the GCP webhook processEmailAndStoreInFirebase which is in ./server-agent/index.js with:
{
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
}

   ## This GCP firebase function:
        - puts the task information into FireStore, get by email.
        - sends an email with ./touch-user/index.ts via senGrid to user with "a message" 
          to open  https://prizm-agent1-1.netlify.app and begin their task.  
          The source code for prizm-agent1-1.netlify.app begins with ./client-agent/client/index.html
      
   ## anytime a user logs in, the app gets their latest state:
      - call fb with their email, get task(s) in flight: hold the next graph/graph-input in fb.  
         - task is new, call graph as-is
           - greeting is:
             - "Congratulations ... new Task {}, I'm here to assist you.  We have found an
               excellent vendor, {} to perform this task.  Can you reach out them today or tomorrow?"
         - other graph paths and/or other graphs.

   ## cust either uses prizm-agent1-1.netlify.app in a timely manner, {} days, or does not:
     ### if they do then ./hello-graph/agent/"workflow.py" is called
       #### the task data passed to "workflow".py is:
{
        "customer": {
            "name": "John Smith",
            "email": "john.smith@example.com",
            "phoneNumber": "555-123-4567",
            "zipCode": "94105"
        },
        "task": {
            "description": "Kitchen renovation",
            "category": "Remodeling"
        },
        "vendor": {
            "name": "Bay Area Remodelers",
            "email": "contact@bayarearemodelers.com",
            "phoneNumber": "555-987-6543"
        }
    }
       #### The customer greeting in the conversation that begins with "Congratulations..." 
            from above is given to the app via this step in the workflow.
         ##### if the cust has a positive sentiment
            conversational agent responds "Wonderful, talk to you soon."

         optional - later
           ###### we will reach out to the vendor as well - ok?
             ####### if yes email vendor
             ####### if no, dont email vendor
             ####### lagent checkpoint task {}

         ##### if they have a negative sentiment
           ###### lagent asks them about their concerns if not already shared.
               "Tell us about you concerns"
             ####### workflow.py stores that information in db {} and
                     escelates this via email to Prizm Admin(padmin) with details {}

     ### if they don't reach out to the vendor in x days, then they get a reminder ...
       #### the task data {} with status "reminder: N(1-max)" is passed in to the langGraph agent(lagent).
         ##### repeat to max
           ######  
             ####### the lagent stores that information in db {} and emails the vendor with task {}
           ###### if no meet in {meet1-days}
             ####### escelate to {admins} with task {} reminder {N}

 # process 2: ./admin-agent/<no code yet>
   # will be a gcp function called every {} minutes on a cron.
   # it takes the latest Task states from LangGraph memory and updates FireStore
   # it has to know which it has updates for and which it does not.
   # it does not need run in langgraph.
   gitl/hello-graph/
      query-trace-filter-out-scanned.py
      query-langgraph.py

README.md - injest
   - script.google.com gmailtoagent processEmails()

