from abc import ABC, abstractmethod
import anthropic
import tiktoken
from openai import OpenAI
from email import message
from multiprocessing.managers import Value

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

class DeepseekProvider(AIProvider):
    MODELS = {
        "deepseek-chat": {
            "id": "deepseek-chat",
            "display_name": "Deepseek V3",
            "context_window": 64000,
            "input_token_cost": 0.27,
            "output_token_cost": 1.1
        },
    }

    def __init__(self, model="deepseek-chat"):
        self._client = OpenAI(base_url="https://api.deepseek.com")
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
        user_messages = [msg["content"][0]["text"] for msg in messages if msg["role"] == "user"]
        assistant_messages = [msg["content"] for msg in messages if msg["role"] == "assistant"]
        enc = tiktoken.get_encoding("o200k_base")

        try:
            user_token_count = sum(len(enc.encode(msg)) for msg in user_messages)
            assistant_token_count = sum(len(enc.encode(msg)) for msg in assistant_messages)

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
        response = self._client.chat.completions.create(
            model=self._model["id"],
            messages=chat,
            stream=False
        )

        return response.choices[0].message.content

    def get_response_stream(self, messages, system):
        stream = self._client.chat.completions.create(
            model=self._model["id"],
            messages=messages,
            stream=True
        )

        for chunk in stream:
            yield chunk.choices[0].delta.content


class ClaudeProvider(AIProvider):
    MODELS = {
        "claude-3-5-sonnet-20241022": {
            "id": "claude-3-5-sonnet-20241022",
            "display_name": "Claude 3.5 Sonnet (New)",
            "context_window": 200000,
            "input_token_cost": 3,
            "output_token_cost": 15
        },
        "claude-3-5-haiku-20241022": {
            "id": "claude-3-5-haiku-20241022",
            "display_name": "Claude 3.5 Haiku",
            "context_window": 200000,
            "input_token_cost": 1,
            "output_token_cost": 5
        }
    }

    def __init__(self, model="claude-3-5-sonnet-20241022"):
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
        "claude": {
            "name": "Anthropic",
            "class": ClaudeProvider
        },
        "deepseek": {
            "name": "Deepseek",
            "class": DeepseekProvider
        }
    }

    def __init__(self, provider="deepseek", model=None):
        if provider not in self.PROVIDERS:
            raise ValueError(f"Provider {provider} not supported")

        self.current_provider = provider
        self.provider_instance = self.PROVIDERS[provider]["class"](model=model) if model else self.PROVIDERS[provider]["class"]()

    def get_all_providers(self):
        return {k: v["name"] for k, v in self.PROVIDERS.items()}

    def get_current_provider(self):
        return {
            "id": self.current_provider,
            "name": self.PROVIDERS[self.current_provider]["name"]
        }

    def set_provider(self, provider, model=None):
        if not provider:
            raise ValueError("Provider ID cannot be empty")

        if provider not in self.PROVIDERS:
            raise ValueError(f"Provider '{provider}' not supported. Available providers: {list(self.PROVIDERS.keys())}")

        try:
            self.current_provider = provider
            self.provider_instance =  self.PROVIDERS[provider]["class"]()
            return self.get_current_provider()
        except Exception as e:
            raise Exception(f"Failed to initialize provider '{provider}': {str(e)}")

    def get_all_models(self):
        return self.provider_instance.get_all_models()

    def get_current_model(self):
        return self.provider_instance.get_current_model()

    def set_model(self, model):
        return self.provider_instance.set_model(model)

    def get_token_count(self, messages):
        return self.provider_instance.get_token_count(messages)

    def get_response(self, chat):
        return self.provider_instance.get_response(chat)

    def get_response_stream(self, messages, system):
        return self.provider_instance.get_response_stream(messages, system)
