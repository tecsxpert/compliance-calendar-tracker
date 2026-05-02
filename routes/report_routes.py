from flask import Blueprint, request, jsonify
from services.async_service import process_report_async
from datetime import datetime
import uuid
import threading

report_bp = Blueprint("report", __name__)

stored_reports = {}
lock = threading.Lock()


@report_bp.route("/generate-report", methods=["POST"])
def generate():
    data = request.get_json()

    if not isinstance(data, dict) or "text" not in data:
        return jsonify({"error": "Please enter valid input"}), 400

    user_input = data["text"]

    report_id = str(uuid.uuid4())

    with lock:
        stored_reports[report_id] = {
            "status": "PENDING",
            "data": None,
            "created_at": datetime.utcnow().isoformat()
        }

    process_report_async(report_id, user_input, stored_reports, lock)

    return jsonify({
        "report_id": report_id,
        "status": "PENDING"
    })



@report_bp.route("/report/<report_id>", methods=["GET"])
def get_report(report_id):
    with lock:
        report = stored_reports.get(report_id)

    if not report:
        return jsonify({"error": "Report not found"}), 404

    return jsonify(report)