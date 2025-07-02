import propTypes from "prop-types";

const Button = ({ onClick, label, className }) => {
  return (
    <button
      className={`
        default-box
        text-white
        focus:border-[3px]
        px-4 py-2
        ${className}
      `}
      onClick={() => onClick()}
    >
      {label}
    </button>
  );
};

Button.propTypes = {
  onClick: propTypes.func.isRequired,
  label: propTypes.string.isRequired,
  className: propTypes.string,
};

export default Button;
