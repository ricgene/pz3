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
    
    if "hello" in message or "hi" in message:
        response = "Hello! I'm your AI assistant. How can I help you with your home improvement needs today?"
    elif "faucet" in message or "leak" in message:
        response = "I see you need help with a faucet repair. Leaky faucets are common issues that can waste water and increase your utility bills. Most faucet repairs involve replacing worn washers, O-rings, or cartridges. Would you like me to recommend a licensed plumber in your area, or are you interested in DIY instructions?"
    elif "kitchen" in message or "renovation" in message:
        response = "Kitchen renovations are significant projects that can add value to your home. Based on industry data, the average kitchen renovation costs between $25,000 and $40,000, though smaller projects might be $10,000-$15,000. Would you like me to help you break down the potential costs for your specific kitchen project?"
    else:
        response = f"I understand you're interested in your project. Can you tell me more about what you're trying to achieve?"
    
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