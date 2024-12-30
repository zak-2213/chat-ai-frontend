import PropTypes from "prop-types";

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
      <br/>
      <div
        className="
          pl-4
          inline-block
          max-w-[70%]
          text-white
          break-words
          whitespace-pre-line
    "
      >
        {message}
      </div>
    </div>
  );
};

ResponseChatBox.propTypes = {
  message: PropTypes.string.isRequired,
};

export default ResponseChatBox;
