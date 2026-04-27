from flask import Flask,jsonify
from services.input_sanitizer import sanitize_input
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
app = Flask(__name__)
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["30 per minute"]
)
@app.before_request
def check_input():
    if sanitize_input():
        return sanitize_input()

@app.route("/health")
def health():
    return {"status": "AI service running"}

@app.route("/test", methods=["POST"])
@limiter.limit("10 per minute")
def test():
    return {"message": "Request successful"}

@app.errorhandler(429)
def rate_limit_exceeded(e):
    return jsonify({
        "error": "Too many requests",
        "message": "Rate limit exceeded. Try again later."
    }), 429

if __name__ == "__main__":
    app.run(port=5000)