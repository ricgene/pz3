# Quick Start Guide

This guide will help you start both the 007 Productivity Agent and the React client.

## Prerequisites

- Python 3.11
- Node.js and npm
- LangSmith API key
- LangSmith workflow ID

## Environment Setup

1. Set up Python environment:
```bash
cd ~/gitl/lang-pz3
python3.11 -m venv .venv_py311
source .venv_py311/bin/activate
pip install -r requirements.txt
```

2. Set up React environment:
```bash
cd ~/gitl/pz3/client-agent/client
npm install
```

3. Configure environment variables:
   - Create `.env` file in `client-agent/client` with:
   ```
   VITE_LANGSMITH_API_KEY=your_api_key_here
   VITE_LANGSMITH_WORKFLOW_ID=your_workflow_id_here
   ```

## Starting the Services

1. Start the 007 Productivity Agent:
```bash
cd ~/gitl/lang-pz3
source .venv_py311/bin/activate
python agent/workflowbond7.py
```

2. In a new terminal, start the React client:
```bash
cd ~/gitl/pz3/client-agent/client
npm run dev
```

## Testing

1. Open your browser to `http://localhost:5173` (or the port shown in your terminal)
2. You should see the chat interface
3. Try sending a message to test the 007 agent

## Troubleshooting

If you encounter issues:
1. Check that both services are running
2. Verify your environment variables are set correctly
3. Check the console for any error messages
4. Make sure your LangSmith API key and workflow ID are valid 