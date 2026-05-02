from flask import Flask, request, jsonify
import os
import json
from dotenv import load_dotenv
from groq import Groq

# ✅ Create Flask app (you missed this earlier)
app = Flask(__name__)

# Load .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env'))

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


@app.route("/")
def home():
    return "AI Chatbot Running"


# ✅ Day 1 / Day 2 API
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()

    if not data or "message" not in data:
        return jsonify({"error": "No message provided"}), 400

    user_input = data["message"]

    if not user_input.strip():
        return jsonify({"error": "Message cannot be empty"}), 400

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "user", "content": user_input}
            ]
        )

        return jsonify({
            "reply": response.choices[0].message.content
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ✅ Day 3 API (NEW)
@app.route("/categorise", methods=["POST"])
def categorise():
    data = request.get_json()
    text = data.get("text")

    if not text:
        return jsonify({"error": "Text is required"}), 400

    prompt = f"""
Classify the following text into one of these categories:
[Finance, Health, Technology, Education, Entertainment, Other]

Text: "{text}"

Return ONLY valid JSON in this format:
{{
  "category": "string",
  "confidence": number (0 to 1),
  "reasoning": "short explanation"
}}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        result_text = response.choices[0].message.content

        # Parse JSON safely
        result = json.loads(result_text)

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "error": "Failed to process request",
            "details": str(e)
        }), 500


if __name__ == "__main__":
    app.run(debug=True)