from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv
from groq import Groq
from services.chroma_service import ChromaService

app = Flask(__name__)

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env'))

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
chroma = ChromaService()


@app.route("/")
def home():
    return "AI Chatbot Running"


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()

    if not data or "message" not in data:
        return jsonify({"error": "No message provided"}), 400

    user_input = data["message"].strip()
    if not user_input:
        return jsonify({"error": "Message cannot be empty"}), 400

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": user_input}]
        )
        return jsonify({"reply": response.choices[0].message.content})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/query", methods=["POST"])
def query():
    data = request.get_json()

    if not data or "question" not in data:
        return jsonify({"error": "Question is required"}), 400

    question = data["question"].strip()
    if not question:
        return jsonify({"error": "Question cannot be empty"}), 400

    try:
        # Step 1: Retrieve top-3 relevant documents
        docs = chroma.query(question, top_k=3)

        if not docs:
            return jsonify({"answer": "No relevant data found.", "sources": []})

        # Step 2: Build context + prompt
        context = "\n\n".join(docs)

        prompt = f"""You are a helpful assistant. Use ONLY the context below to answer the question. If the answer is not in the context, say "I don't know based on the provided information."

Context:
{context}

Question:
{question}

Answer clearly and concisely."""

        # Step 3: Query LLM
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}]
        )

        return jsonify({
            "answer": response.choices[0].message.content,
            "sources": docs
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)