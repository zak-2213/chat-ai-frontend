import { useState, useEffect, useRef } from "react";
import UserChatBox from "../components/UserChatBox";
import ResponseChatBox from "../components/ResponseChatBox";
import TextInput from "../components/TextInput";
import ChatHeader from "../components/ChatHeader";
import { useLocation } from "react-router-dom";

const Chat = () => {
  const location = useLocation();
  const chatContainerRef = useRef(null);
  const [chatId, setChatId] = useState(location.state?.chatId || null);
  const [chat, setChat] = useState([]);
  const [model, setModel] = useState({
    id: "claude-3-5-sonnet-20241022",
    display_name: "Claude 3.5 Sonnet (New)",
    context_window: 200000,
    input_token_cost: 3,
    output_token_cost: 15,
  });
  const [tokenCount, setTokenCount] = useState(0);
  const [tokenCost, setTokenCost] = useState(0.0);
  const [chatName, setChatName] = useState("NEW CHAT");
  const [assistantMessage, setAssistantMessage] = useState("");

  useEffect(() => {
    if (chatId) {
      fetch("http://localhost:5000/get-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: chatId }),
      })
        .then((res) => res.json())
        .then((convo) => setChat(convo.Chat.context))
        .catch((err) => console.error("Error getting chat:", err));
    } else {
      fetch("http://localhost:5000/new-chat")
        .then((res) => res.json())
        .then((convo) => {
          setChat(convo.Chat.context);
          setChatId(convo.Chat.id);
        })
        .catch((err) => console.error("Error starting new chat:", err));
    }
  }, []);

  useEffect(() => {
    if (location.state?.model) {
      setModel(location.state.model);
    }
  }, [location.state?.model]);

  useEffect(() => {
    if (chatName === "NEW CHAT") {
      fetch("http://localhost:5000/get-chat-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: chatId }),
      })
        .then((res) => res.json())
        .then((chat_name) => setChatName(chat_name.Name))
        .catch((error) => console.error("Error getting chat name:", error));
    }
  }, [assistantMessage]);

  useEffect(() => {
    if (chat.length > 0) {
      fetch("http://localhost:5000/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: chat }),
      })
        .then((res) => res.json())
        .then((tokens) => {
          setTokenCount(tokens.input_tokens + tokens.output_tokens);
          calcTokenCost(tokens.input_tokens, tokens.output_tokens);
        })
        .catch((err) => {
          console.error("Error counting tokens:", err);
          setTokenCost(0);
          setTokenCount(0);
        });
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

  const sendMessage = (content) => {
    setChat((prevChat) => [...prevChat, { role: "user", content: content }]);
    // Reset the assistant's message
    setAssistantMessage("");

    fetch("http://localhost:5000/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: content,
        id: chatId,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullMessage = "";

        function read() {
          reader.read().then(({ done, value }) => {
            if (done) {
              // Finished reading, append the assistant's message to chat
              setChat((prevChat) => [
                ...prevChat,
                { role: "assistant", content: fullMessage.trim() },
              ]);
              setAssistantMessage("");
              return;
            }
            const chunk = decoder.decode(value, { stream: true });
            fullMessage += chunk;
            // Update the assistant's message with the new chunk
            setAssistantMessage(fullMessage);
            return read();
          });
        }
        return read();
      })
      .catch((error) => {
        console.error("Error receiving message:", error);
        setAssistantMessage("Error: Failed to get response");
      });
  };

  return (
    <div className="bg-black h-screen w-full flex flex-col overflow-hidden">
      <ChatHeader
        chat_name={chatName}
        model={model.display_name}
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
                  />
                ),
              )}
              {assistantMessage && (
                <ResponseChatBox key="assistant" message={assistantMessage} />
              )}
            </>
          )}
        </div>
      }
      <TextInput sendMessage={sendMessage} />
    </div>
  );
};

export default Chat;
