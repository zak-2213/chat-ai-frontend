import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

const ModelSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const chatId = location.state.id;
  const [modelList, setModelList] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/get-models")
      .then((res) => res.json())
      .then((models) => setModelList(models))
      .catch((err) => console.error("Error fetching models:", err));
  }, []);

  const handleClick = (model) => {
    fetch("http://localhost:5000/set-model", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model }),
    }).catch((err) => console.error("Error setting model:", err));

    navigate(`/`, {
      state: {
        chatId: chatId,
        model: model,
      },
    });
  };

  return (
    <div className="bg-black h-screen w-full flex flex-col ">
      <h1 className="title text-center text-4xl font-bold">SELECT MODEL</h1>
      <hr className="mb-10" />
      <div className="overflow-scroll hide-scrollbar">
        {modelList.length === 0 ? (
          <p className="text-white font-bold m-5">LOADING MODELS</p>
        ) : (
          <>
            {modelList.map((model) => (
              <div key={model.id} className="flex">
                <p
                  className="text-white thick-underline font-bold cursor-pointer text-center m-5"
                  onClick={() => handleClick(model)}
                >
                  {model.display_name}
                </p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default ModelSelection;
