import { v4 as uuidv4 } from "uuid";
import { AIManager } from "./AiManager";

class ChatManager {
  constructor(storageKey = ".chat_history") {
    this.storageKey = storageKey;
    this.currentChat = {
      id: "",
      system: "",
      chat_name: "NEW CHAT",
      context: [],
    };
    this.aiManager = new AIManager("ollama", "gemma3n:e4b");
    this.loadFromStorage();
  }

  loadFromStorage() {
    const data = localStorage.getItem(this.storageKey);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        this.chats = parsed.chats || {};
        this.currentChat = parsed.currentChat || this.currentChat;
      } catch (e) {
        console.error("Error loading chat data:", e);
        this.chats = {};
      }
    } else {
      this.chats = {};
    }
  }

  saveToStorage() {
    const data = JSON.stringify({
      chats: this.chats,
      currentChat: this.currentChat,
    });
    localStorage.setItem(this.storageKey, data);
  }

  createNewChat() {
    const chatId = uuidv4();
    this.currentChat = {
      id: chatId,
      system: "",
      chat_name: "NEW CHAT",
      context: [],
    };
    this.chats[chatId] = this.currentChat;
    this.saveToStorage();
    return this.currentChat;
  }

  loadChat(chatId) {
    if (this.chats[chatId]) {
      this.currentChat = this.chats[chatId];
      return this.currentChat;
    }
    return this.createNewChat();
  }

  async generateChatName() {
    if (this.currentChat.context.length < 2) return;

    // Find first user message with text content
    let firstUserText = null;
    for (const message of this.currentChat.context) {
      if (message.role === "user") {
        if (typeof message.content === "string") {
          firstUserText = message.content;
          break;
        } else if (Array.isArray(message.content)) {
          const textContent = message.content
            .filter((item) => item.type === "text")
            .map((item) => item.text)
            .join("");
          if (textContent) {
            firstUserText = textContent;
            break;
          }
        }
      }
    }

    if (!firstUserText) return;

    // Find first assistant response
    const firstAssistant = this.currentChat.context.find(
      (msg) => msg.role === "assistant",
    )?.content;

    if (!firstAssistant) return;

    // Prepare messages for name generation
    const firstExchange = [
      { role: "user", content: firstUserText },
      { role: "assistant", content: firstAssistant },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Using the first couple of messages, create a concise name for this chat relevant to the discussion. Avoid including words referencing 'chat' or 'discussion'. Respond with only the chat name and nothing else.",
          },
        ],
      },
    ];

    try {
      const response = await this.aiManager.get_response(firstExchange);
      let responseText;

      if (typeof response === "string") {
        responseText = response;
      } else if (Array.isArray(response)) {
        responseText = response
          .filter((item) => item.type === "text")
          .map((item) => item.text)
          .join("");
      } else {
        responseText = response.content[0].text;
      }

      this.currentChat.chat_name = responseText.trim().toUpperCase();
      this.saveToStorage();
    } catch (error) {
      console.error("Error generating chat name:", error);
    }
  }

  updateChatName(chatId, newName) {
    if (this.chats[chatId]) {
      this.chats[chatId].chat_name = newName;
      this.saveToStorage();
    }
  }

  getSystemPrompt(chatId) {
    return this.chats[chatId]?.system || "";
  }

  updateSystemPrompt(chatId, newPrompt) {
    if (this.chats[chatId]) {
      this.chats[chatId].system = newPrompt;
      this.saveToStorage();
    }
  }

  async addMessage(chatId, content, role = "user") {
    if (!this.chats[chatId]) return;

    // Only store text content (skip documents/files)
    if (
      typeof content === "string" ||
      (Array.isArray(content) && content.some((part) => part.type === "text"))
    ) {
      this.chats[chatId].context.push({
        role,
        content,
      });

      if (
        this.chats[chatId].context.length >= 2 &&
        this.chats[chatId].chat_name === "NEW CHAT"
      ) {
        await this.generateChatName();
      }

      this.saveToStorage();
    }
  }

  getChatHistory() {
    return Object.values(this.chats);
  }

  deleteChat(chatId) {
    if (this.chats[chatId]) {
      delete this.chats[chatId];
      this.saveToStorage();
      return true;
    }
    return false;
  }
}

export default ChatManager;
