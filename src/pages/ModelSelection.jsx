import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Button from "../components/Button";

const ModelSelection = ({aiManager}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const chatId = location.state.id;
  const [providers, setProviders] = useState({});
  const [currentProvider, setCurrentProvider] = useState(null);
  const [modelList, setModelList] = useState([]);

  useEffect(() => {
      let providers = aiManager.get_all_providers();
      setProviders(providers);
      let current_provider = aiManager.get_current_provider();
      setCurrentProvider(current_provider);
      let models = aiManager.get_all_models();
      setModelList(models);
  }, []);

  const handleProviderChange = async (providerId) => {
    try {
      let current_provider = aiManager.set_provider(providerId);
      setCurrentProvider(current_provider);

      let models = aiManager.get_all_models();
      setModelList(models);
    } catch (err) {
      console.error("Error in handleProviderChange:", err);
    }
  };

  const handleModelSelect = (model) => {
    aiManager.set_model(model.id);

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
