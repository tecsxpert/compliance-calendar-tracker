from groq import Groq
import os
from dotenv import load_dotenv
import json

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_ai_response(user_input):
    try:
        with open("prompts/describe_prompt.txt", "r") as f:
            template = f.read()

        prompt = template.replace("{user_input}", user_input)

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}]
        )

        return response.choices[0].message.content

    except Exception as e:
        return str(e)
    
def get_recommendations(user_input):
    with open("prompts/recommend_prompt.txt", "r") as f:
        template = f.read()

    prompt = template.replace("{user_input}", user_input)

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}]
    )

    content = response.choices[0].message.content.strip()

    
    if content.startswith("```"):
        content = content.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(content)
    except Exception as e:
        return {
            "error": "Invalid JSON from AI",
            "raw_output": content
        }
def generate_report(user_input):
    with open("prompts/report_prompt.txt", "r") as f:
        template = f.read()

    prompt = template.replace("{user_input}", user_input)

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}]
    )

    content = response.choices[0].message.content.strip()

   
    if content.startswith("```"):
        content = content.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(content)
    except:
        return {"error": "Invalid JSON", "raw": content}