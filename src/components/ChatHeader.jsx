import propTypes from "prop-types";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ChatHeader = ({
  chat_name,
  model,
  token_count,
  context_window,
  token_cost,
  chatId,
}) => {
  const navigate = useNavigate();

  const handleHist = () => navigate("/history");

  const handleSys = () =>
    navigate("/system-prompt", {
      state: {
        id: chatId,
      },
    });

  const handleModel = () =>
    navigate("/models", {
      state: {
        id: chatId,
      },
    });

  return (
    <table>
      <tbody>
        <tr>
          <td rowSpan="2" colSpan="4" className="w-1/2 p-4 align-middle">
            <h1 className="title text-center text-4xl font-bold">AI CHATBOT</h1>
          </td>
          <th className="text-white text-center p-2 align-middle">
            CURRENT CHAT
          </th>
          <td
            className="w-min text-white text-center p-2 align-middle thick-underline font-bold cursor-pointer"
            onClick={handleHist}
          >
            {chat_name}
          </td>
        </tr>
        <tr>
          <th className="text-white text-center p-2 align-middle">MODEL</th>
          <td
            className="w-min text-white text-center p-2 align-middle thick-underline font-bold cursor-pointer"
            onClick={handleModel}
          >
            {model.display_name}
          </td>
        </tr>
        <tr>
          <th className="text-white text-center p-2 align-middle">
            TOKEN COUNT
          </th>
          <td className="w-min text-white text-center p-2 align-middle">
            {token_count}/{model.context_window}
          </td>
          <th className="text-white text-center p-2 align-middle">COST</th>
          <td className="w-min text-white text-center p-2 align-middle">
            ${token_cost}
          </td>
          <th className="text-white text-center p-2 align-middle">
            SYSTEM PROMPT
          </th>
          <td
            className="w-min text-white text-center p-2 align-middle thick-underline font-bold cursor-pointer"
            onClick={handleSys}
          >
            VIEW/EDIT
          </td>
        </tr>
      </tbody>
    </table>
  );
};

ChatHeader.propTypes = {
  chat_name: propTypes.string.isRequired,
  model: propTypes.object.isRequired,
  token_count: propTypes.number.isRequired,
  token_cost: propTypes.number.isRequired,
};

export default ChatHeader;
