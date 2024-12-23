import os
import json
from uuid import uuid4
from flask import Flask, request, Response, stream_with_context
from flask_cors import CORS
from claude import ClaudeManager
from chat_manager import ChatManager
from upload_manager import UploadManager

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type"]
    }
})
chat_manager = ChatManager()
upload_manager = UploadManager()
claude_manager = ClaudeManager()

@app.route('/get-chat', methods=["POST"])
def get_chat():
    data = request.get_json()
    chat = chat_manager.load_chat(data["id"])
    return {"Status": "Success", "Chat": chat}

@app.route('/edit', methods=["POST"])
def edit_chat_name():
    data = request.get_json()
    try:
        chat_manager.update_chat_name(data["id"], data["new_name"])
        return {"Status": "Success"}
    except Exception as e:
        return {"Status": "Error", "Message": str(e)}, 500

@app.route('/send-message', methods=['POST'])
def send_message():
    data = request.get_json()
    print(f"data: {data}")
    chat_manager.add_message(data["id"], data["content"], "user")

    def generate():
        assistant_content = ''

        try:
            for chunk in claude_manager.get_response_stream(chat_manager.current_chat["context"], chat_manager.current_chat["system"]):
                assistant_content += chunk
                yield chunk

            chat_manager.add_message(data["id"], assistant_content, role="assistant")

        except Exception as e:
            yield f"Error: {str(e)}"

    return Response(stream_with_context(generate()), mimetype='text/plain')

@app.route('/tokens', methods=["POST"])
def count_tokens():
    data = request.get_json()
    messages = data["messages"]

    try:
        num_tokens = claude_manager.get_token_count(messages)
    except Exception as e:
        return {"Status": "Error", "Message": str(e)}, 500

    return num_tokens

@app.route('/delete', methods=["POST"])
def delete_chat():
    data = request.get_json()

    try:
        if chat_manager.delete_chat(data["id"]):
            return {"Status": "Success", "Message": "Chat deleted successfully"}
        else:
            return {"Status": "Error", "Message": "Chat file not found"}, 404
    except Exception as e:
        return {"Status": "Error", "Message": str(e)}, 500

@app.route('/history')
def get_history():
    return {"History": chat_manager.get_chat_history()}

@app.route('/new-chat')
def new_chat():
    return {"Chat": chat_manager.create_new_chat()}


@app.route('/get-chat-name', methods=["POST"])
def get_chat_name():
    try:
        chat_name = chat_manager.current_chat["chat_name"]
        return {"Status": "Success", "Name": chat_name}
    except Exception as e:
        return {"Status": "Error", "Message": str(e)}, 500

@app.route('/get-system', methods=["POST"])
def get_system():
    data = request.get_json()
    return {"Status": "Success", "System": chat_manager.get_system_prompt(data["id"])}

@app.route('/set-system', methods=["POST"])
def set_system():
    data = request.get_json()

    try:
        chat_manager.update_system_prompt(data["id"], data["system"])
        return {"Status": "Success"}
    except Exception as e:
        return {"Status": "Error", "Message": str(e)}, 500

@app.route('/upload-file', methods=["POST"])
def upload_file():
    file = request.files['file']
    
    try:
        file_data = upload_manager.upload(file)
        return {"Status": "Success", "FileData": file_data}
    except Exception as e:
        return {"Status": "Error", "Message": str(e)}, 500

@app.route('/get-models')
def get_models():
    return claude_manager.get_all_models()
    
@app.route('/get-model')
def get_model():
    return claude_manager.get_current_model()

@app.route('/set-model', methods=["POST"])
def set_model():
    data = request.get_json()
    model = data["model"]
    
    try:
        claude_manager.set_model(model)
        return {"Status": "Success"}
    except Exception as e:
        return {"Status": "Error", "Message": str(e)}, 500
    
if __name__ == "__main__":
    app.run(debug=True)
