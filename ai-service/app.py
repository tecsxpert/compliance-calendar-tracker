from flask import Flask, request, jsonify
import os
import json
import time
from collections import deque
from dotenv import load_dotenv
from groq import Groq

# Chroma
from services.chroma_service import ChromaService

# Fake Redis (no Docker needed)
import fakeredis
import hashlib

# -----------------------------
# INIT
# -----------------------------
app = Flask(__name__)

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env'))

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
chroma = ChromaService()

# Fake Redis
redis_client = fakeredis.FakeRedis(decode_responses=True)

CACHE_TTL = 900  # 15 minutes
MODEL_NAME = "llama-3.1-8b-instant"

# -----------------------------
# METRICS
# -----------------------------
response_times = deque(maxlen=10)
start_time = time.time()

cache_hits = 0
cache_misses = 0

# -----------------------------
# ROUTES
# -----------------------------
@app.route("/")
def home():
    return "AI Chatbot Running"


# -----------------------------
# QUERY (Day 5 + Day 8)
# -----------------------------
@app.route("/query", methods=["POST"])
def query():
    global cache_hits, cache_misses

    start = time.time()

    data = request.get_json()
    question = data.get("question")
    use_cache = data.get("use_cache", True)

    if not question:
        return jsonify({"error": "Question is required"}), 400

    # Create cache key
    cache_key = hashlib.sha256(question.encode()).hexdigest()

    # -----------------------------
    # CACHE CHECK
    # -----------------------------
    if use_cache:
        cached = redis_client.get(cache_key)

        if cached:
            cache_hits += 1
            result = json.loads(cached)

            end = time.time()
            response_times.append(end - start)

            return jsonify({
                "answer": result["answer"],
                "sources": result["sources"],
                "cache": "hit"
            })

    # -----------------------------
    # CACHE MISS
    # -----------------------------
    cache_misses += 1

    docs = chroma.query(question, top_k=3)

    if not docs:
        return jsonify({
            "answer": "No relevant data found",
            "sources": []
        })

    context = "\n".join(docs)

    prompt = f"""
Use the context below to answer.

Context:
{context}

Question:
{question}
"""

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}]
        )

        answer = response.choices[0].message.content

        result = {
            "answer": answer,
            "sources": docs
        }

        # Store in cache
        if use_cache:
            redis_client.setex(cache_key, CACHE_TTL, json.dumps(result))

        end = time.time()
        response_times.append(end - start)

        return jsonify({
            "answer": answer,
            "sources": docs,
            "cache": "miss"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------
# HEALTH (Day 7)
# -----------------------------
@app.route("/health", methods=["GET"])
def health():
    avg_response_time = (
        sum(response_times) / len(response_times)
        if response_times else 0
    )

    uptime = time.time() - start_time

    try:
        doc_count = chroma.collection.count()
    except:
        doc_count = 0

    return jsonify({
        "status": "healthy",
        "model": MODEL_NAME,
        "avg_response_time": round(avg_response_time, 4),
        "uptime_seconds": int(uptime),
        "chroma_doc_count": doc_count,
        "cache": {
            "hits": cache_hits,
            "misses": cache_misses
        }
    })


# -----------------------------
# RUN
# -----------------------------
if __name__ == "__main__":
    app.run(debug=True)