from flask import Flask, jsonify
from routes.health_routes import health_bp

app = Flask(__name__)

# Register blueprint
app.register_blueprint(health_bp)

@app.route("/")
def home():
    return jsonify({"message": "AI Service Running"})

if __name__ == "__main__":
    app.run(port=5000, debug=True)