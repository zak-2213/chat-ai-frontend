import propTypes from "prop-types";

const Button = ({ onClick, label }) => {

  return (
    <button
      className="
        default-box
        h-[40px]
        w-[70px]
        text-white
        focus:border-[3px]
        "
      onClick={() => onClick()}
    >
      {label}
    </button>
  );
};

Button.propTypes = {
  onClick: propTypes.func.isRequired,
  label: propTypes.string.isRequired,
};

export default Button;
