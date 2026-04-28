from flask import Flask, request, jsonify
from services.groq_client import GroqClient

app = Flask(__name__)

client = GroqClient()

@app.route("/")
def home():
    return "AI Service Running"

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    prompt = data.get("prompt")

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    response = client.generate_response(prompt)

    return jsonify({
        "response": response
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)