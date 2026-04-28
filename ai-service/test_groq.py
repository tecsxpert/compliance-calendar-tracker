from services.groq_client import GroqClient

def main():
    client = GroqClient()

    prompt = "Explain Artificial Intelligence in simple terms"

    response = client.generate_response(prompt)

    print("\nResponse:\n")
    print(response)


if __name__ == "__main__":
    main()