import { OpenAI } from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { encoding_for_model } from "tiktoken";
import ollama from "ollama";

// Abstract class equivalent
class AIProvider {
  get_all_models() {
    throw new Error("Method 'get_all_models()' must be implemented");
  }

  get_current_model() {
    throw new Error("Method 'get_current_model()' must be implemented");
  }

  set_model(model) {
    throw new Error("Method 'set_model()' must be implemented");
  }

  get_token_count(messages) {
    throw new Error("Method 'get_token_count()' must be implemented");
  }

  get_response(chat) {
    throw new Error("Method 'get_response()' must be implemented");
  }

  get_response_stream(messages, system) {
    throw new Error("Method 'get_response_stream()' must be implemented");
  }
}

class DeepseekProvider extends AIProvider {
  static MODELS = {
    "deepseek-chat": {
      id: "deepseek-chat",
      display_name: "Deepseek V3",
      context_window: 64000,
      input_token_cost: 0.27,
      output_token_cost: 1.1,
    },
  };

  constructor(model = "deepseek-chat") {
    super();
    this._client = new OpenAI({
      baseURL: "https://api.deepseek.com",
    });
    this._model = DeepseekProvider.MODELS[model];
  }

  get_all_models() {
    return Object.values(DeepseekProvider.MODELS);
  }

  get_current_model() {
    return this._model;
  }

  set_model(model) {
    if (DeepseekProvider.MODELS[model]) {
      this._model = DeepseekProvider.MODELS[model];
    } else {
      throw new Error(`Model ${model} not found`);
    }
  }

  get_token_count(messages) {
    try {
      const enc = encoding_for_model("gpt-4o");
      let userTokenCount = 0;
      let assistantTokenCount = 0;

      messages.forEach((msg) => {
        const content = msg.content;
        let text = "";

        if (typeof content === "string") {
          text = content;
        } else if (Array.isArray(content)) {
          text = content
            .map((part) => (part.type === "text" ? part.text : ""))
            .join("");
        }

        if (msg.role === "user") {
          userTokenCount += enc.encode(text).length;
        } else if (msg.role === "assistant") {
          assistantTokenCount += enc.encode(text).length;
        }
      });

      return {
        input_tokens: userTokenCount,
        output_tokens: assistantTokenCount,
      };
    } catch (error) {
      console.error(`Error counting tokens: ${error.message}`);
      return {
        input_tokens: 0,
        output_tokens: 0,
      };
    }
  }

  async get_response(chat) {
    const response = await this._client.chat.completions.create({
      model: this._model.id,
      messages: chat,
      stream: false,
    });
    return response.choices[0].message.content;
  }

  async *get_response_stream(messages, system) {
    const allMessages = [...messages];
    if (system) {
      allMessages.unshift({ role: "system", content: system });
    }

    const stream = await this._client.chat.completions.create({
      model: this._model.id,
      messages: allMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.choices[0].delta.content) {
        yield chunk.choices[0].delta.content;
      }
    }
  }
}

class ClaudeProvider extends AIProvider {
  static MODELS = {
    "claude-3-7-sonnet-20250219": {
      id: "claude-3-7-sonnet-20250219",
      display_name: "Claude 3.7 Sonnet",
      context_window: 200000,
      input_token_cost: 3,
      output_token_cost: 15,
    },
    "claude-3-5-haiku-20241022": {
      id: "claude-3-5-haiku-20241022",
      display_name: "Claude 3.5 Haiku",
      context_window: 200000,
      input_token_cost: 1,
      output_token_cost: 5,
    },
  };

  constructor(model = "claude-3-7-sonnet-20250219") {
    super();
    this._client = new Anthropic();
    this._model = ClaudeProvider.MODELS[model];
  }

  get_all_models() {
    return Object.values(ClaudeProvider.MODELS);
  }

  get_current_model() {
    return this._model;
  }

  set_model(model) {
    if (ClaudeProvider.MODELS[model]) {
      this._model = ClaudeProvider.MODELS[model];
    } else {
      throw new Error(`Model ${model} not found`);
    }
  }

  get_token_count(messages) {
    try {
      let userTokenCount = 0;
      let assistantTokenCount = 0;

      messages.forEach((msg) => {
        const text =
          typeof msg.content === "string"
            ? msg.content
            : msg.content.map((part) => part.text).join("");

        const count = this._client.countTokens(text);

        if (msg.role === "user") {
          userTokenCount += count;
        } else if (msg.role === "assistant") {
          assistantTokenCount += count;
        }
      });

      return {
        input_tokens: userTokenCount,
        output_tokens: assistantTokenCount,
      };
    } catch (error) {
      console.error(`Error counting tokens: ${error.message}`);
      return {
        input_tokens: 0,
        output_tokens: 0,
      };
    }
  }

  async get_response(chat) {
    try {
      // Normalize messages to string format
      const normalizedMessages = this.normalizeMessages(chat);

      const response = await ollama.chat({
        model: this._model.id,
        messages: normalizedMessages,
        stream: false,
      });

      return response.message.content;
    } catch (error) {
      console.error("Ollama API error:", error);
      throw new Error(`Ollama error: ${error.message}`);
    }
  }

  async *get_response_stream(messages, system) {
    try {
      // Normalize messages to string format
      const normalizedMessages = this.normalizeMessages(messages);

      // Add system prompt as a separate message
      if (system) {
        normalizedMessages.unshift({
          role: "system",
          content: system,
        });
      }

      const response = await ollama.chat({
        model: this._model.id,
        messages: normalizedMessages,
        stream: true,
      });

      for await (const chunk of response) {
        if (chunk.message?.content) {
          yield chunk.message.content;
        }
      }
    } catch (error) {
      console.error("Ollama streaming error:", error);
      throw new Error(`Ollama streaming error: ${error.message}`);
    }
  }

  // Convert Claude-style message format to simple string format
  normalizeMessages(messages) {
    return messages.map((msg) => {
      let content = "";

      if (typeof msg.content === "string") {
        content = msg.content;
      } else if (Array.isArray(msg.content)) {
        // Concatenate all text parts
        content = msg.content
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("\n");
      }

      return {
        role: msg.role,
        content: content,
      };
    });
  }

  #extractSystemMessage(messages) {
    let system = "";
    const filteredMessages = [];

    messages.forEach((msg) => {
      if (msg.role === "system") {
        system +=
          typeof msg.content === "string"
            ? msg.content + "\n"
            : msg.content.map((part) => part.text).join("\n");
      } else {
        filteredMessages.push(msg);
      }
    });

    return { system, filteredMessages };
  }
}

class OllamaProvider extends AIProvider {
  static MODELS = {
    "gpt-oss:20b": {
      id: "gpt-oss:20b",
      display_name: "GPT OSS",
      context_window: 128000,
      input_token_cost: 0,
      output_token_cost: 0,
    },
    "qwen2.5-coder:7b": {
      id: "qwen2.5-coder:7b",
      display_name: "Qwen 2.5 Coder 7b",
      context_window: 128000,
      input_token_cost: 0,
      output_token_cost: 0,
    },
  };

  constructor(model = "gpt-oss:20b") {
    super();
    this.set_model(model); // Use set_model to initialize
  }

  get_all_models() {
    return Object.values(OllamaProvider.MODELS);
  }

  get_current_model() {
    return this._model;
  }

  set_model(model) {
    if (OllamaProvider.MODELS[model]) {
      this._model = OllamaProvider.MODELS[model];
    } else {
      OllamaProvider.MODELS[model] = {
        id: model,
        display_name: model,
        context_window: 4096,
        input_token_cost: 0,
        output_token_cost: 0,
      };
      this._model = OllamaProvider.MODELS[model];
    }
  }

  get_token_count(messages) {
    // Simple approximation (4 characters ≈ 1 token)
    let totalChars = 0;

    messages.forEach((msg) => {
      if (typeof msg.content === "string") {
        totalChars += msg.content.length;
      } else if (Array.isArray(msg.content)) {
        msg.content.forEach((item) => {
          if (item.text) totalChars += item.text.length;
        });
      }
    });

    return {
      input_tokens: Math.floor(totalChars / 4),
      output_tokens: 0,
    };
  }

  async get_response(chat) {
    try {
      // Normalize messages to string format
      const normalizedMessages = this.normalizeMessages(chat);

      const response = await ollama.chat({
        model: this._model.id,
        messages: normalizedMessages,
        stream: false,
      });

      return response.message.content;
    } catch (error) {
      console.error("Ollama API error:", error);
      throw new Error(`Ollama error: ${error.message}`);
    }
  }

  async *get_response_stream(messages, system) {
    try {
      // Normalize messages to string format
      const normalizedMessages = this.normalizeMessages(messages);

      // Add system prompt as a separate message
      if (system) {
        normalizedMessages.unshift({
          role: "system",
          content: system,
        });
      }

      const response = await ollama.chat({
        model: this._model.id,
        messages: normalizedMessages,
        stream: true,
      });

      for await (const chunk of response) {
        if (chunk.message?.content) {
          yield chunk.message.content;
        }
      }
    } catch (error) {
      console.error("Ollama streaming error:", error);
      throw new Error(`Ollama streaming error: ${error.message}`);
    }
  }

  // Convert Claude-style message format to simple string format
  normalizeMessages(messages) {
    return messages.map((msg) => {
      let content = "";

      if (typeof msg.content === "string") {
        content = msg.content;
      } else if (Array.isArray(msg.content)) {
        // Concatenate all text parts
        content = msg.content
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("\n");
      }

      return {
        role: msg.role,
        content: content,
      };
    });
  }
}

class AIManager {
  static PROVIDERS = {
    claude: {
      name: "Anthropic",
      class: ClaudeProvider,
    },
    deepseek: {
      name: "Deepseek",
      class: DeepseekProvider,
    },
    ollama: {
      name: "Ollama",
      class: OllamaProvider,
    },
  };

  constructor(provider = "ollama", model = "gemma3n:e4b") {
    if (!AIManager.PROVIDERS[provider]) {
      throw new Error(`Provider ${provider} not supported`);
    }

    this.current_provider = provider;
    const ProviderClass = AIManager.PROVIDERS[provider].class;
    this.provider_instance = model
      ? new ProviderClass(model)
      : new ProviderClass();
  }

  get_all_providers() {
    return Object.fromEntries(
      Object.entries(AIManager.PROVIDERS).map(([id, config]) => [
        id,
        config.name,
      ]),
    );
  }

  get_current_provider() {
    return {
      id: this.current_provider,
      name: AIManager.PROVIDERS[this.current_provider].name,
    };
  }

  set_provider(provider, model = null) {
    if (!provider) {
      throw new Error("Provider ID cannot be empty");
    }

    if (!AIManager.PROVIDERS[provider]) {
      const available = Object.keys(AIManager.PROVIDERS).join(", ");
      throw new Error(
        `Provider '${provider}' not supported. Available providers: ${available}`,
      );
    }

    try {
      this.current_provider = provider;
      const ProviderClass = AIManager.PROVIDERS[provider].class;
      this.provider_instance = model
        ? new ProviderClass(model)
        : new ProviderClass();

      return this.get_current_provider();
    } catch (error) {
      throw new Error(
        `Failed to initialize provider '${provider}': ${error.message}`,
      );
    }
  }

  get_all_models() {
    return this.provider_instance.get_all_models();
  }

  get_current_model() {
    return this.provider_instance.get_current_model();
  }

  set_model(model) {
    return this.provider_instance.set_model(model);
  }

  get_token_count(messages) {
    return this.provider_instance.get_token_count(messages);
  }

  async get_response(chat) {
    return this.provider_instance.get_response(chat);
  }

  async *get_response_stream(messages, system) {
    for await (const chunk of this.provider_instance.get_response_stream(
      messages,
      system,
    )) {
      yield chunk;
    }
  }
}

export { AIManager, DeepseekProvider, ClaudeProvider, OllamaProvider };
