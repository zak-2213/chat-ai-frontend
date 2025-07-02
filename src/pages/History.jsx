import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const History = ({chatManager}) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
      let history = chatManager.getChatHistory();
      setChatHistory(history);
  }, [refresh]);

  const handleClick = (id) => {
    navigate(`/`, {
      state: {
        chatId: id,
      },
    });
  };

  const startEditing = (id, currentName) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const handleNameChange = (e) => setEditingName(e.target.value);

  const handleKeyDown = (e, id) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit(id);
    }
    if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  const saveEdit = (id) => {
      chatManager.updateChatName(id, editingName);
      setEditingId(null);
      setRefresh(!refresh);
  };

  const deleteChat = (id) => {
      let success = chatManager.deleteChat(id);
      if (success) {
        setRefresh(!refresh);
      } else {
        console.error("Error deleting chat:", err)
      }
  };

  return (
    <div className="bg-black h-screen w-full flex flex-col ">
      <h1 className="title text-center text-4xl font-bold">CHAT HISTORY</h1>
      <hr className="mb-10" />
      <div className="overflow-scroll hide-scrollbar">
        {chatHistory.length === 0 ? (
          <p
            className="text-white thick-underline font-bold cursor-pointer m-5"
            onClick={() => handleClick(null)}
          >
            NEW CHAT
          </p>
        ) : (
          <>
            {chatHistory.map((history) => (
              <div key={history.id} className="flex">
                {editingId === history.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={handleNameChange}
                    onKeyDown={(e) => handleKeyDown(e, history.id)}
                    onBlur={() => saveEdit(history.id)}
                    autoFocus
                    className="text-white bg-black border-b border-white m-5 focus:outline-none"
                  />
                ) : (
                  <p
                    className="text-white thick-underline font-bold cursor-pointer text-center m-5"
                    onClick={() => 
                      handleClick(history.id)}
                  >
                    {history.chat_name}
                  </p>
                )}
                <button
                  className="ml-4"
                  onClick={() => startEditing(history.id, history.chat_name)}
                >
                  <svg
                    fill="#FFFFFF"
                    width="20px"
                    height="20px"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M18.111,2.293,9.384,11.021a.977.977,0,0,0-.241.39L8.052,14.684A1,1,0,0,0,9,16a.987.987,0,0,0,.316-.052l3.273-1.091a.977.977,0,0,0,.39-.241l8.728-8.727a1,1,0,0,0,0-1.414L19.525,2.293A1,1,0,0,0,18.111,2.293ZM11.732,13.035l-1.151.384.384-1.151L16.637,6.6l.767.767Zm7.854-7.853-.768.767-.767-.767.767-.768ZM3,5h8a1,1,0,0,1,0,2H4V20H17V13a1,1,0,0,1,2,0v8a1,1,0,0,1-1,1H3a1,1,0,0,1-1-1V6A1,1,0,0,1,3,5Z" />
                  </svg>
                </button>
                <button className="ml-4" onClick={() => deleteChat(history.id)}>
                  <svg
                    fill="#FFFFFF"
                    width="20px"
                    height="18"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M7,18V14a1,1,0,0,1,2,0v4a1,1,0,0,1-2,0Zm5,1a1,1,0,0,0,1-1V14a1,1,0,0,0-2,0v4A1,1,0,0,0,12,19Zm4,0a1,1,0,0,0,1-1V14a1,1,0,0,0-2,0v4A1,1,0,0,0,16,19ZM23,6v4a1,1,0,0,1-1,1H21V22a1,1,0,0,1-1,1H4a1,1,0,0,1-1-1V11H2a1,1,0,0,1-1-1V6A1,1,0,0,1,2,5H7V2A1,1,0,0,1,8,1h8a1,1,0,0,1,1,1V5h5A1,1,0,0,1,23,6ZM9,5h6V3H9Zm10,6H5V21H19Zm2-4H3V9H21Z" />
                  </svg>
                </button>
              </div>
            ))}
            <p
              className="text-white thick-underline font-bold cursor-pointer m-5"
              onClick={() => handleClick(null)}
            >
              NEW CHAT
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default History;
