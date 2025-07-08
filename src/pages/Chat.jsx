import { useState, useEffect, useRef } from "react";
import UserChatBox from "../components/UserChatBox";
import ResponseChatBox from "../components/ResponseChatBox";
import TextInput from "../components/TextInput";
import ChatHeader from "../components/ChatHeader";
import { useLocation } from "react-router-dom";

const Chat = ({aiManager, chatManager, uploadManager}) => {
  const location = useLocation();
  const chatContainerRef = useRef(null);
  const [chatId, setChatId] = useState(location.state?.chatId || null);
  const [chat, setChat] = useState([]);
  const [model, setModel] = useState({
    id: "gemma3n:e4b",
    display_name: "Gemma 3n",
    context_window: 32000,
    input_token_cost: 0,
    output_token_cost: 0
  });
  const [tokenCount, setTokenCount] = useState(0);
  const [tokenCost, setTokenCost] = useState(0.0);
  const [chatName, setChatName] = useState("NEW CHAT");
  const [assistantMessage, setAssistantMessage] = useState("");

  useEffect(() => {
    if (chatId) {
        let chat = chatManager.loadChat(chatId);
        setChat(chat.context);
    } else {
        let chat = chatManager.createNewChat();
        setChat(chat.context);
        setChatId(chat.id);
    }
  }, []);

  useEffect(() => {
    if (location.state?.model) {
      setModel(location.state.model);
    }
  }, [location.state?.model]);

  useEffect(() => {
      async function newChat() {
          if (chatName === "NEW CHAT") {
              await chatManager.generateChatName();
              setChatName(chatManager.currentChat.chat_name);
          }
      }
  }, [assistantMessage]);

  useEffect(() => {
    if (chat.length > 0) {
        let tokens = aiManager.get_token_count(chat);
        setTokenCount(tokens.input_tokens + tokens.output_tokens);
        calcTokenCost(tokens.input_tokens, tokens.output_tokens);
    }
  }, [chat]);

  useEffect(() => {
    scrollToBottom();
  }, [chat, assistantMessage]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  const calcTokenCost = (input_tokens, output_tokens) => {
    const dollar_cost =
      model.input_token_cost * 10 ** -6 * input_tokens +
      model.output_token_cost * 10 ** -6 * output_tokens;
    setTokenCost(Number(dollar_cost.toFixed(2)));
  };

const sendMessage = async (content) => {
    // Add user message to chat
    setChat((prevChat) => [...prevChat, { role: "user", content: content }]);
    
    // Add to chat manager
    await chatManager.addMessage(chatId, content, "user");
    
    // Reset assistant message
    setAssistantMessage("");
    let fullMessage = "";

    try {
        // Get context and system prompt
        const context = chatManager.currentChat.context;
        const system = chatManager.currentChat.system;
        
        // Get the response stream
        const stream = await aiManager.get_response_stream(context, system);
        
        // Process the stream
        for await (const chunk of stream) {
            if (chunk) {
                fullMessage += chunk;
                setAssistantMessage(fullMessage);
            }
        }
        
        // Add assistant response to chat
        setChat((prevChat) => [...prevChat, { role: "assistant", content: fullMessage }]);
        await chatManager.addMessage(chatId, fullMessage, "assistant");
        
        // Reset assistant message
        setAssistantMessage("");
    } catch (error) {
        console.error("Error receiving message:", error);
        setAssistantMessage("Error: Failed to get response");
    }
};

  return (
    <div className="bg-black h-screen w-full flex flex-col overflow-hidden">
      <ChatHeader
        chat_name={chatName}
        model={model}
        token_count={tokenCount}
        context_window={model.context_window}
        token_cost={tokenCost}
        chatId={chatId}
      />
      {
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto overflow-scroll hide-scrollbar"
        >
          {chat.length === 0 ? (<></>) : (
            <>
              {chat.map((message, chatIndex) =>
                message.role === "user" ? (
                  message.content.map((content, contentIndex) => (
                    <UserChatBox
                      key={`user-${chatIndex}-${contentIndex}`}
                      message={content}
                      isFirst={contentIndex === 0}
                    />
                  ))
                ) : (
                  <ResponseChatBox
                    key={`assistant-${chatIndex}`}
                    message={message.content}
                    model_name={model.display_name.toUpperCase()}
                  />
                ),
              )}
              {assistantMessage && (
                <ResponseChatBox key="assistant" message={assistantMessage} model_name={model.display_name.toUpperCase()} />
              )}
            </>
          )}
        </div>
      }
      <TextInput sendMessage={sendMessage} uploadManager={uploadManager} />
    </div>
  );
};

export default Chat;
