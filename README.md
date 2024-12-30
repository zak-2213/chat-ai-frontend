This project is a web-based AI chat bot application using Claude and Deepseek. It features a React frontend and a Flask backend, allowing users to interact with the AI assistant in real-time conversations.

Key features:

- Real-time chat interface with LLM
- Multiple chat management (create, edit, delete conversations)
- File upload capability (images, PDFs, text files)
- Customizable system prompts
- Token usage tracking
- Model selection

The frontend is built with React and Tailwind CSS. The backend uses Flask to handle API requests and integrates with the Anthropic API to communicate with Claude.
The design was inspired by https://owickstrom.github.io/the-monospace-web/

To run the project:

1. Set up and run the Flask server
   `pip install -r requirements.txt`
   `python server.py`
2. Start the React development server
   `npm install`
   `npm run dev`
3. Open the application in your web browser

Note: You'll need to have an Anthropic API key to use Claude's capabilities.
