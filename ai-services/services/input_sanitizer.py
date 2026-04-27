import re
from flask import request, jsonify

# Patterns for malicious input
SUSPICIOUS_PATTERNS = [
    r"<script.*?>.*?</script>",   # XSS
    r"ignore instructions",       # prompt injection
    r"reveal.*secret",            # data leak attempts
    r"drop table",                # SQL injection
    r"--",                        # SQL comment
]

def is_malicious(text):
    text = text.lower()
    for pattern in SUSPICIOUS_PATTERNS:
        if re.search(pattern, text):
            return True
    return False

def sanitize_input():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Invalid input"}), 400

    for key, value in data.items():
        if isinstance(value, str):
            # Remove HTML tags
            clean_value = re.sub(r"<.*?>", "", value)

            # Check for malicious patterns
            if is_malicious(clean_value):
                return jsonify({
                    "error": "Malicious input detected"
                }), 400

            data[key] = clean_value

    return None  # No issues 