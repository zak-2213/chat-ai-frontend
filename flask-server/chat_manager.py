import os
import json
from uuid import uuid4
from ai_manager import AIManager

class ChatManager:
    def __init__(self, storage_dir=".chat_history"):
        if not os.path.exists(storage_dir):
            os.mkdir(storage_dir)

        self.storage_dir = storage_dir
        self.current_chat = {
            "id": "",
            "system": "",
            "chat_name": "NEW CHAT",
            "context": []
        }
        self.current_chat_path = None
        self._ai_manager = AIManager(provider="claude", model="claude-3-5-haiku-20241022")

    def create_new_chat(self):
        chat_id = str(uuid4())
        self.current_chat = {
            "id": chat_id,
            "system": "",
            "chat_name": "NEW CHAT",
            "context": []
        }
        self.current_chat_path = self._get_chat_path(chat_id)

        return self.current_chat

    def load_chat(self, chat_id):
        self.current_chat_path = self._get_chat_path(chat_id)

        if os.path.exists(self.current_chat_path):
            with open(self.current_chat_path, 'r') as f:
                self.current_chat = json.load(f)

        return self.current_chat

    def _generate_chat_name(self):
        if len(self.current_chat["context"]) < 2:
            return

        first_user_text = None
        for message in self.current_chat["context"]:
            if message["role"] == "user":
                # Check if there's any text content in the message
                text_contents = [item["text"] for item in message["content"] if item["type"] == "text"]
                if text_contents:
                    first_user_text = text_contents[0]
                    break

        if not first_user_text:
            return

        first_assistant = next(
            (msg["content"] for msg in self.current_chat["context"]
            if msg["role"] == "assistant"),
            None
        )

        if not first_assistant:
            return

        first_exchange = [
            {
                "role": "user",
                "content": first_user_text
            },
            {
                "role": "assistant",
                "content": first_assistant
            }
        ]

        first_exchange.append({
            "role": "user",
            "content": [{
                "type": "text",
                "text": "Using the first couple of messages, create a concise name for this chat relevant to the discussion. Avoid including words referencing 'chat' or 'discussion'. Respond with only the chat name and nothing else."
            }]
        })
        response_text = self._ai_manager.get_response(first_exchange).content[0].text.strip().upper()
        self.current_chat["chat_name"] = response_text
        # Save the updated chat with new name
        self._save_chat()

    def update_chat_name(self, chat_id, new_name):
        chat_path = self._get_chat_path(chat_id)

        with open(chat_path, 'r') as f:
            chat_data = json.load(f)

        chat_data["chat_name"] = new_name
        self._save_chat(chat_data, chat_path)

    def get_system_prompt(self, chat_id):
        chat_path = self._get_chat_path(chat_id)

        if os.path.exists(chat_path):
            with open(chat_path, 'r') as f:
                chat_data = json.load(f)
        else:
            chat_data = self.current_chat

        return chat_data["system"]

    def update_system_prompt(self, chat_id, new_prompt):
        chat_path = self._get_chat_path(chat_id)

        if os.path.exists(chat_path):
            with open(chat_path, 'r') as f:
                chat_data = json.load(f)
        else:
            chat_data = self.current_chat

        chat_data["system"] = new_prompt
        self._save_chat(chat_data, chat_path)

    def add_message(self, chat_id, content, role="user"):
        self.current_chat["context"].append({
            "role": role,
            "content": content
        })

        if ((len(self.current_chat["context"]) >= 2) and (self.current_chat["chat_name"] == "NEW CHAT")):
            self._generate_chat_name()

        chat_path = self._get_chat_path(chat_id)
        self._save_chat(chat_data=self.current_chat, chat_path=chat_path)

    def get_chat_history(self):
        history = []

        for filename in os.listdir(self.storage_dir):
            if filename.endswith('.json'):
                filepath = os.path.join(self.storage_dir, filename)

                with open(filepath, 'r') as f:
                    history.append(json.load(f))

        return history

    def delete_chat(self, chat_id):
        chat_path = self._get_chat_path(chat_id)

        if os.path.exists(chat_path):
            os.remove(chat_path)
            return True

        return False

    def _get_chat_path(self, chat_id):
        return os.path.join(self.storage_dir, f"chat_{chat_id}.json")

    def _save_chat(self, chat_data=None, chat_path=None):
        chat_data = chat_data or self.current_chat
        chat_path = chat_path or self.current_chat_path

        if not chat_path:
            chat_path = self._get_chat_path(chat_data["id"])

        # Ensure directory exists
        os.makedirs(os.path.dirname(chat_path), exist_ok=True)

        try:
            with open(chat_path, 'w') as f:
                json.dump(chat_data, f, indent=2)
        except Exception as e:
            print(f"Error saving chat: {e}")
