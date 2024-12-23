This project is a web-based AI chat bot application using Claude AI (will add other providers in the future). It features a React frontend and a Flask backend, allowing users to interact with Claude in real-time conversations.

Key features:
- Real-time chat interface with Claude AI
- Multiple chat management (create, edit, delete conversations)
- File upload capability (images, PDFs, text files)
- Customizable system prompts
- Token usage tracking
- Model selection

The frontend is built with React and Tailwind CSS. The backend uses Flask to handle API requests and integrates with the Anthropic API to communicate with Claude.
The design was inspired by https://owickstrom.github.io/the-monospace-web/


To run the project:
1. Set up and run the Flask server
   `python server.py`
3. Start the React development server
   `npm run dev`
5. Open the application in your web browser

Note: You'll need to have an Anthropic API key to use Claude's capabilities.
