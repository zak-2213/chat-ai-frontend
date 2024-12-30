import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Button from "../components/Button";

const ModelSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const chatId = location.state.id;
  const [providers, setProviders] = useState({});
  const [currentProvider, setCurrentProvider] = useState(null);
  const [modelList, setModelList] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/get-providers")
      .then((res) => res.json())
      .then((data) => {
        setProviders(data.providers);
      })
      .catch((err) => console.error("Error fetching providers:", err));

    fetch("http://localhost:5000/get-current-provider")
      .then((res) => res.json())
      .then((data) => {
        setCurrentProvider(data.current_provider);
      })
      .catch((err) => console.error("Error fetching current provider:", err));

    fetch("http://localhost:5000/get-models")
      .then((res) => res.json())
      .then((data) => {
        setModelList(data);
      })
      .catch((err) => console.error("Error fetching models:", err));
  }, []);

  const handleProviderChange = async (providerId) => {
    try {
      const providerResponse = await fetch(
        "http://localhost:5000/set-provider",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ provider: providerId }),
        },
      );

      if (!providerResponse.ok) {
        throw new Error("Failed to set provider");
      }

      const providerData = await providerResponse.json();

      setCurrentProvider(providerData.current_provider);

      const modelsResponse = await fetch("http://localhost:5000/get-models");
      if (!modelsResponse.ok) {
        throw new Error("Failed to fetch models");
      }

      const models = await modelsResponse.json();
      setModelList(models);
    } catch (err) {
      console.error("Error in handleProviderChange:", err);
    }
  };

  const handleModelSelect = (model) => {
    fetch("http://localhost:5000/set-model", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ modelId: model.id }),
    }).catch((err) => console.error("Error setting model:", err));

    navigate(`/`, {
      state: {
        chatId: chatId,
        model: model,
      },
    });
  };

  return (
    <div className="bg-black h-screen w-full flex flex-col">
      <h1 className="title text-center text-4xl font-bold">SELECT MODEL</h1>
      <hr className="mb-5" />

      {/* Provider Selection */}
      <div className="mb-8">
        <h2 className="text-white text-2xl mb-3">AI Provider</h2>
        <div className="flex gap-4">
          {Object.entries(providers).map(([id, name]) => (
            <Button
              className="w-32"
              key={id}
              onClick={() => handleProviderChange(id)}
              label={name}
            />
          ))}
        </div>
      </div>

      {/* Model Selection */}
      <div className="overflow-scroll hide-scrollbar">
        <h2 className="text-white text-2xl mb-3">Available Models</h2>
        {modelList.length === 0 ? (
          <p className="text-white font-bold m-5">LOADING MODELS</p>
        ) : (
          modelList.map((model) => (
            <div key={model.id} className="flex">
              <p
                className="text-white thick-underline font-bold cursor-pointer text-center m-5"
                onClick={() => handleModelSelect(model)}
              >
                {model.display_name}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ModelSelection;
