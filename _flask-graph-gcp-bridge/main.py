import os
import json
import requests
import logging
from flask import Flask, request, jsonify
from functools import wraps

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure environment variables
LANGSMITH_API_KEY = os.environ.get("LANGSMITH_API_KEY")
LANGSMITH_API_URL = os.environ.get("LANGSMITH_API_URL", "https://smith.langchain.com/api/v1")
PROJECT_NAME = os.environ.get("LANGSMITH_PROJECT", "prizm-workflow-2")
GRAPH_NAME = os.environ.get("LANGSMITH_GRAPH", "contractor_workflow2")
API_KEY = os.environ.get("API_KEY", "your-secret-api-key")  # Change this in production

app = Flask(__name__)

def require_api_key(view_function):
    @wraps(view_function)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('x-api-key')
        if api_key and api_key == API_KEY:
            return view_function(*args, **kwargs)
        return jsonify({"error": "Invalid or missing API key"}), 401
    return decorated_function

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "version": "0.1.0"}), 200

@app.route('/workflow', methods=['POST'])
@require_api_key
def run_workflow():
    data = request.json
    logger.info(f"Received request with data: {json.dumps(data, default=str)[:200]}...")
    
    # Basic validation
    required_fields = ['customer', 'task', 'vendor']
    for field in required_fields:
        if field not in data:
            logger.error(f"Missing required field: {field}")
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    try:
        # Compose headers with the LangSmith API key
        headers = {
            "Authorization": f"Bearer {LANGSMITH_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # Construct the URL to invoke the graph
        url = f"{LANGSMITH_API_URL}/projects/{PROJECT_NAME}/graphs/{GRAPH_NAME}/invoke"
        logger.info(f"Invoking LangSmith graph at: {url}")
        
        # Call the API
        logger.info("Sending request to LangSmith")
        response = requests.post(
            url,
            headers=headers,
            json=data,
            timeout=30  # Set a reasonable timeout
        )
        
        # Check for errors
        response.raise_for_status()
        result = response.json()
        logger.info(f"Received successful response from LangSmith: {str(result)[:200]}...")
        
        # Return the result
        return jsonify(result), 200
    
    except requests.exceptions.RequestException as e:
        # Handle API errors
        error_message = str(e)
        logger.error(f"Error invoking workflow: {error_message}")
        try:
            if e.response and e.response.text:
                error_details = json.loads(e.response.text)
                error_message = error_details.get('detail', str(e))
        except:
            pass
        
        return jsonify({
            "error": "Error invoking workflow",
            "detail": error_message
        }), 500

# Entry point for Cloud Functions
def workflow_api(request):
    with app.request_context(request.environ):
        return app.full_dispatch_request()

# For local testing
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))