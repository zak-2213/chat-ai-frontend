import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { useLocation } from "react-router-dom";

const SystemPrompt = () => {
  const location = useLocation();
  const id = location.state.id;
  const [sysPrompt, setSysPrompt] = useState("");
  const [showScroll, setShowScroll] = useState(false);
  const textareaRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // First set the ID in the server
    fetch("http://localhost:5000/get-system", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: id }),
    })
      .then((res) => res.json())
      .then((sys) => setSysPrompt(sys.System))
      .catch((err) => console.error("Error getting system prompt:", err));
  }, [id]);

  const handleInput = (e) => {
    setSysPrompt(e.target.value);
    e.target.style.height = "200px"; // Reset to minimum height
    const scrollHeight = e.target.scrollHeight;
    if (scrollHeight > 200) {
      // Only grow if content exceeds minimum height
      e.target.style.height = `${Math.min(scrollHeight, 600)}px`;
    }
    setShowScroll(scrollHeight > 600);
  };

  const clearInput = () => {
    setSysPrompt("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "200px"; // Or whatever your initial height is
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault(); // Prevent default behavior if necessary
      setSystem();
    }
  };

  const setSystem = () =>
    fetch("http://localhost:5000/set-system", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: id, system: sysPrompt }),
    })
      .then(() => handleNav())
      .catch((err) => console.error("Error setting new system prompt:", err));

  const handleCancel = () => {
    clearInput();
    handleNav();
  }
  
  const handleNav = () => {
    navigate(`/`, {
      state: {
        chatId: id,
      },
    });
  };

  return (
    <div className="bg-black h-screen w-full flex flex-col items-center">
      <h1 className="title text-center text-4xl font-bold">SYSTEM PROMPT</h1>
      <hr className="mt-5 mb-10 w-full" />
      <textarea
        ref={textareaRef}
        name="Chat input"
        className={`
                    default-box
                    text-white
                    min-h-[200px]
                    max-h-[600px]
                    w-[600px]
                    mb-5
                    focus:border-[3px]
                    ${showScroll ? "custom-scrollbar" : "no-scrollbar"}
                  `}
        value={sysPrompt}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Set system prompt"
        rows="1"
        style={{
          padding: "10px",
          lineHeight: "20px",
        }}
      />
      <div className="flex gap-6">
        <Button onClick={setSystem} label="SET" />
        <Button onClick={clearInput} label="CLEAR" />
        {/* TODO: should reset changes */}
        <Button onClick={handleCancel} label="CANCEL" />
      </div>
    </div>
  );
};

export default SystemPrompt;
