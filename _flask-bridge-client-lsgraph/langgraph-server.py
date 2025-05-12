# langgraph-server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import json
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('langgraph-server')

# Import your LangGraph workflow
# Adjust the import path as needed for your specific setup
#import sys
#sys.path.append("/path/to/my/modules/")
sys.path.append(os.path.join(os.path.dirname(__file__), "../hello-graph/agent"))
try:
    from workflow2 import app as workflow_app
    logger.info("Successfully imported LangGraph workflow")
except Exception as e:
    logger.error(f"Error importing LangGraph workflow: {str(e)}")
    logger.error("Using mock workflow instead")
    workflow_app = None

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify the server is running"""
    return jsonify({
        "status": "ok", 
        "workflow_loaded": workflow_app is not None
    })

@app.route('/api/agent', methods=['POST'])
def agent_endpoint():
    """Main endpoint for interacting with the LangGraph agent"""
    try:
        # Get the request data
        data = request.json
        
        if not data:
            logger.warning("No input data provided")
            return jsonify({"error": "No input data provided"}), 400
        
        # Log the incoming request
        logger.info(f"Received request: {json.dumps(data, indent=2)}")
        
        # Check if workflow is available
        if workflow_app is None:
            logger.warning("LangGraph workflow not available, using mock response")
            return mock_response(data)
        
        # Process the input with the LangGraph workflow
        try:
            logger.info("Processing with LangGraph workflow")
            result = workflow_app.invoke(data)
            logger.info(f"LangGraph workflow result: {json.dumps(result, default=str)}")
            
            # Return the result
            return jsonify(result)
        except Exception as e:
            logger.error(f"Error in LangGraph workflow: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return mock_response(data)
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def mock_response(data):
    """Generate a mock response when the workflow is unavailable"""
    message = data.get("task", {}).get("description", "")
    message = message.lower() if isinstance(message, str) else ""
    
    # Get user name from memory context if available
    user_name = data.get("memory", {}).get("user_name", "unknown")
    is_first_message = data.get("memory", {}).get("is_first_message", False)
    
    # Use 007 persona for all responses
    if is_first_message:
        if user_name == "unknown":
            response = "Hello! I'm 007, your personal productivity agent. I don't think we've met before. What's your name?"
        else:
            response = f"Hello {user_name}! I'm 007, your personal productivity agent. How can I help you today?"
    elif "hello" in message or "hi" in message:
        response = f"Hello {user_name}! I'm 007, your personal productivity agent. How can I help you today?"
    elif "faucet" in message or "leak" in message:
        response = "I see you need help with a faucet repair. As your productivity agent, I can help you find a licensed plumber in your area or provide DIY instructions. What would you prefer?"
    elif "kitchen" in message or "renovation" in message:
        response = "Kitchen renovations are significant projects that can add value to your home. As your productivity agent, I can help you break down the potential costs for your specific kitchen project. What's your budget range?"
    else:
        response = f"I understand you're interested in your project. As your productivity agent, I'm here to help. Can you tell me more about what you're trying to achieve?"
    
    # Format response to match workflow output structure
    return jsonify({
        "customer_email": data.get("customer", {}).get("email"),
        "vendor_email": data.get("vendor", {}).get("email"),
        "project_summary": f"Project inquiry from {data.get('customer', {}).get('name', 'customer')}",
        "sentiment": "positive",
        "reason": "",
        "messages": [{
            "type": "ai",
            "content": response
        }]
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    logger.info(f"Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)