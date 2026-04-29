import threading
from services.groq_client import generate_report

def process_report_async(report_id, user_input, store, lock):
    def task():
        try:
            result = generate_report(user_input)

            with lock:
                if not result:
                    store[report_id]["status"] = "FAILED"
                    store[report_id]["data"] = None
                else:
                    store[report_id]["status"] = "COMPLETED"
                    store[report_id]["data"] = result

        except Exception:
            with lock:
                store[report_id]["status"] = "FAILED"
                store[report_id]["data"] = None

    thread = threading.Thread(target=task, daemon=True)
    thread.start()