import PropTypes from "prop-types";

const UserChatBox = ({ message, isFirst }) => {
  return (
    <div className="w-full flex flex-col mb-10 mt-10">
      {isFirst && <div className="text-gray-200 px-4 mb-2"><b>YOU:</b></div>}
      <div className="max-w px-4">
        {message.type === "text" ? (
          <div className="text-gray-200 break-words whitespace-pre-line">
            {message.text}
          </div>
        ) : message.type === "image" ? (
          <img
            src={`data:${message.source.media_type};base64,${message.source.data}`}
            alt="User uploaded image"
            className="max-w-full rounded-lg"
          />
        ) : null}
      </div>
    </div>
  );
};

UserChatBox.propTypes = {
  message: PropTypes.object.isRequired,
  isFirst: PropTypes.bool.isRequired,
};

export default UserChatBox;
