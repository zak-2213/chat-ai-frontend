import { useState, useRef, useEffect } from "react";
import propTypes from "prop-types";
import Button from "./Button";

const TextInput = ({ sendMessage }) => {
  const [content, setContent] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [showScroll, setShowScroll] = useState(false);
  const textareaRef = useRef(null);

  const handleInput = (e) => {
    setInputVal(e.target.value);
    e.target.style.height = "inherit"; // Reset height
    const scrollHeight = e.target.scrollHeight;
    e.target.style.height = `${Math.min(scrollHeight, 200)}px`; // Max height of 200px
    setShowScroll(scrollHeight > 200);
  };

  const clearInput = () => {
    setInputVal("");
    setContent([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px"; // Or whatever your initial height is
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault(); // Prevent default behavior if necessary
      handleSendMessage();
    }
  };

  const handlePaste = (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    const items = clipboardData.items;

    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault(); // Prevent default paste behavior for images
          const blob = items[i].getAsFile();
          
          // Generate a filename for the pasted image
          const now = new Date();
          const filename = `pasted-image-${now.getTime()}.png`;
          
          // Create a File object from the Blob
          const file = new File([blob], filename, { type: blob.type });
          
          // Upload the file
          handleUpload(file);
          return;
        }
      }
    }
    // If no image is found, let the default paste behavior happen
  };
  
  const handleUpload = async (file) => {
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("http://localhost:5000/upload-file", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      setContent((prev) => [
        ...prev,
        {
          ...data.FileData,
          filename: file.name,
        },
      ]);
    } catch (err) {
      console.error("Error uploading file:", err);
    }
  };

  const handleSendMessage = () => {
    let messagesToSend = content.map((item) => {
      const { filename, ...itemWithoutFilename } = item;
      return itemWithoutFilename;
    });

    if (inputVal.trim()) {
      messagesToSend.push({
        type: "text",
        text: inputVal,
      });
    }

    if (messagesToSend.length > 0) {
      sendMessage(messagesToSend);
      clearInput();
    }
  };

  const removeContent = (index) => {
    setContent(content.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-2">
      {content.length > 0 && (
        <div className="w-full max-w-[500px] mx-auto flex flex-wrap gap-2">
          {content.map((item, index) => (
            <div key={index} className="relative">
              {(item.type === "image" || item.type === "document") && (
                <div className="px-3 py-1 flex items-center gap-2">
                  <span className="text-gray-300 text-sm">
                    {item.filename || "File uploaded"}
                  </span>
                  <button
                    onClick={() => removeContent(index)}
                    className="text-white"
                  >
                    ✕
                  </button>
                </div>
              )}
              {item.type === "text" && (
                <div className="px-3 py-1 bg-gray-800 rounded flex items-center gap-2">
                  <pre className="text-gray-300 text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto custom-scrollbar">
                    {item.text}
                  </pre>
                  <button
                    onClick={() => removeContent(index)}
                    className="text-white"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="p-5 flex items-center justify-center gap-1">
        <textarea
          ref={textareaRef}
          name="Chat input"
          className={`
                  default-box
                  text-white
                  min-h-[40px]
                  max-h-[200px]
                  w-[500px]
                  focus:border-[3px]
                  px-2
                  py-1
                  ${showScroll ? "custom-scrollbar" : "no-scrollbar"}
                `}
          value={inputVal}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          rows="1"
        />
        <Button onClick={handleSendMessage} label="SEND" className="h-[40px]" />
        <div className="relative">
          <button className="default-box h-[40px] w-[70px] text-white focus:border-[3px]">
            UPLOAD
          </button>
          <input
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            type="file"
            multiple
            onChange={(event) => {
              Array.from(event.target.files).forEach((file) => {
                handleUpload(file);
              });
            }}
            title=""
          />
        </div>
      </div>
    </div>
  );
};

TextInput.propTypes = {
  sendMessage: propTypes.func.isRequired,
};

export default TextInput;
