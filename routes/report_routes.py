from flask import Blueprint, request, jsonify
from services.groq_client import generate_report
from datetime import datetime

report_bp = Blueprint("report", __name__)

@report_bp.route("/generate-report", methods=["POST"])
def generate():
    data = request.get_json()

    if not isinstance(data, dict) or "text" not in data:
        return jsonify({"error": "Please enter valid input"}), 400

    user_input = data.get("text")

    if not isinstance(user_input, str) or not user_input.strip():
        return jsonify({"error": "Please enter valid input"}), 400

    result = generate_report(user_input)

  
    result["generated_at"] = datetime.utcnow().isoformat()

    
    return jsonify(result)