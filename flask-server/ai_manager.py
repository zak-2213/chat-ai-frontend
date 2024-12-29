from abc import ABC, abstractmethod
import anthropic
from openai import OpenAI

class AIProvider(ABC):
    @abstractmethod
    def get_all_models(self):
        pass

    @abstractmethod
    def get_current_model(self):
        pass

    @abstractmethod
    def set_model(self, model):
        pass

    @abstractmethod
    def get_token_count(self, messages):
        pass

    @abstractmethod
    def get_response(self, chat):
        pass

    @abstractmethod
    def get_response_stream(self, messages, system):
        pass


class ClaudeProvider(AIProvider):
    MODELS = {
        "sonnet": {
            "id": "claude-3-5-sonnet-20241022",
            "display_name": "Claude 3.5 Sonnet (New)",
            "context_window": 200000,
            "input_token_cost": 3,
            "output_token_cost": 15
        },
        "haiku": {
            "id": "claude-3-5-haiku-20241022",
            "display_name": "Claude 3.5 Haiku",
            "context_window": 200000,
            "input_token_cost": 1,
            "output_token_cost": 5
        }
    }

    def __init__(self, model="sonnet"):
        self._client = anthropic.Anthropic()
        self._model = self.MODELS[model]

    def get_all_models(self):
        return list(self.MODELS.values())

    def get_current_model(self):
        return self._model

    def set_model(self, model):
        if model in self.MODELS:
            self._model = self.MODELS[model]
        else:
            raise ValueError(f"Model {model} not found")

    def get_token_count(self, messages):
        user_messages = [msg for msg in messages if msg["role"] == "user"]
        assistant_messages = [msg for msg in messages if msg["role"] == "assistant"]

        try:
            user_token_count = self._client.messages.count_tokens(
                model=self._model["id"],
                messages=user_messages
            ).input_tokens if user_messages else 0

            # Count tokens for assistant messages
            assistant_token_count = self._client.messages.count_tokens(
                model=self._model["id"],
                messages=assistant_messages
            ).input_tokens if assistant_messages else 0

            return {
                "input_tokens": user_token_count,
                "output_tokens": assistant_token_count,
            }
        except Exception as e:
            print(f"Error counting tokens: {str(e)}")
            return {
                "input_tokens": 0,
                "output_tokens": 0
            }

    def get_response(self, chat):
        response = self._client.messages.create(
            model=self._model["id"],
            max_tokens=1024,
            messages=chat
        )

        return response

    def get_response_stream(self, messages, system):
        with self._client.messages.stream(
            max_tokens=1024,
            messages=messages,
            system=system,
            model=self._model["id"]
        ) as stream:
            for text in stream.text_stream:
                yield text

class AIManager:
    PROVIDERS = {
        "claude": ClaudeProvider
    }

    def __init__(self, provider="claude", model=None):
        if provider not in self.PROVIDERS:
            raise ValueError(f"Provider {provider} not supported")
            
        self.provider = self.PROVIDERS[provider](model=model) if model else self.PROVIDERS[provider]()

    def get_all_models(self):
        return self.provider.get_all_models()

    def get_current_model(self):
        return self.provider.get_current_model()
    
    def set_model(self, model):
        return self.provider.set_model(model)
    
    def get_token_count(self, messages):
        return self.provider.get_token_count(messages)
    
    def get_response(self, chat):
        return self.provider.get_response(chat)
    
    def get_response_stream(self, messages, system):
        return self.provider.get_response_stream(messages, system)