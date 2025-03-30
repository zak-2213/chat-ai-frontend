import PropTypes from "prop-types";
import ReactMarkdown from "react-markdown";

const ResponseChatBox = ({ message }) => {
  return (
    <div className="w-full">
      <div
        className="
          text-white
          pl-4
          inline-block
          max-w-[70%]
    "
      >
        ASSISTANT:
      </div>
      <br />
      <div className="pl-4 inline-block max-w-[70%] text-white break-words prose prose-invert">
        <ReactMarkdown>{message}</ReactMarkdown>
      </div>
    </div>
  );
};

ResponseChatBox.propTypes = {
  message: PropTypes.string.isRequired,
};

export default ResponseChatBox;
