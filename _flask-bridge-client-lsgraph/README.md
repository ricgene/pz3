# LangGraph Bridge Server

This server provides a bridge between the TypeScript client and the Python LangGraph agent.

## Setup

1. Create and activate virtual environment:
```bash
# Create virtual environment with Python 3.11
python3.11 -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On Unix/MacOS:
source .venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
# Create a .env file with:
LANGSMITH_API_KEY=your_api_key_here
LANGSMITH_API_URL=https://smith.langchain.com/api/v1
LANGSMITH_PROJECT=prizm-workflow-2
LANGSMITH_GRAPH=contractor_workflow2
API_KEY=your_secret_api_key
```

## Running the Server

Start the server:
```bash
python langgraph-server.py
```

The server will start on port 8000 by default. You can change this by setting the PORT environment variable.

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /api/agent` - Main endpoint for interacting with the LangGraph agent

## Development

The server uses Flask and provides a mock response when the LangGraph workflow is unavailable. The mock response uses the 007 persona for consistency.

## Troubleshooting

If you encounter issues:
1. Make sure your virtual environment is activated
2. Check that all environment variables are set correctly
3. Verify that the LangGraph workflow is properly imported
4. Check the logs for any error messages 