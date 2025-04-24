# Google Cloud Function Deployment

## Prerequisites
1. Install the Google Cloud SDK: https://cloud.google.com/sdk/docs/install
2. Initialize and authenticate:
   ```
   gcloud init
   gcloud auth login
   ```

## Create a New Project (optional)
```
gcloud projects create [PROJECT_ID] --name="Contractor Workflow API"
gcloud config set project [PROJECT_ID]
```

## Enable Required APIs
```
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
```

## Prepare Files
Create a new directory for your Cloud Function:
```
mkdir contractor-api
cd contractor-api
```

Create the following files:
- `main.py` (the code I provided)
- `requirements.txt` (the requirements I provided)

## Set Environment Variables
Create a .env.yaml file:
```yaml
LANGSMITH_API_KEY: "your-langsmith-api-key"
LANGSMITH_PROJECT: "prizm-workflow-2"
LANGSMITH_GRAPH: "contractor_workflow2"
API_KEY: "your-secret-api-key"
```

## Deploy the Function
```
gcloud functions deploy workflow-api \
  --gen2 \
  --runtime=python311 \
  --region=us-central1 \
  --source=. \
  --entry-point=workflow_api \
  --trigger-http \
  --allow-unauthenticated \
  --env-vars-file .env.yaml
```

## Test the Deployment
You can test your deployment with curl:

```bash
curl -X POST \
  https://REGION-PROJECT_ID.cloudfunctions.net/workflow-api/workflow \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-api-key" \
  -d '{
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
  }'
```