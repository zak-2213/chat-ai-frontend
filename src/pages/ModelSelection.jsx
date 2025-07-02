import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../components/Button";

const ModelSelection = ({ aiManager }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const chatId = location.state?.id;
  const [providers, setProviders] = useState({});
  const [currentProvider, setCurrentProvider] = useState(null);
  const [modelList, setModelList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const providers = aiManager.get_all_providers();
        setProviders(providers);
        
        const currentProvider = aiManager.get_current_provider();
        setCurrentProvider(currentProvider);
        
        const models = aiManager.get_all_models();
        setModelList(models);
      } catch (err) {
        console.error("Error initializing models:", err);
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, [aiManager]);

  const handleProviderChange = async (providerId) => {
    try {
      setLoading(true);
      const currentProvider = aiManager.set_provider(providerId);
      setCurrentProvider(currentProvider);
      
      const models = aiManager.get_all_models();
      setModelList(models);
    } catch (err) {
      console.error("Error in handleProviderChange:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleModelSelect = (model) => {
    aiManager.set_model(model.id);
    navigate("/", {
      state: {
        chatId: chatId,
        model: model,
      },
    });
  };

  return (
    <div className="bg-black h-screen w-full flex flex-col p-4">
      <h1 className="title text-center text-4xl font-bold text-white">SELECT MODEL</h1>
      <hr className="border-white" />

      {/* Provider Selection */}
      <div className="mb-8">
        <h2 className="text-white text-2xl mb-3">AI Provider</h2>
        <div className="flex gap-4 flex-wrap">
          {Object.entries(providers).map(([id, name]) => (
            <Button
              className={`w-32 ${currentProvider?.id === id ? 'bg-black' : ''}`}
              key={id}
              onClick={() => handleProviderChange(id)}
              label={name}
            />
          ))}
        </div>
      </div>

      {/* Model Selection */}
      <div className="overflow-y-auto flex-grow">
        <h2 className="text-white text-2xl mb-3">Available Models</h2>
        
        {loading ? (
          <p className="text-white font-bold m-5">LOADING MODELS...</p>
        ) : modelList.length === 0 ? (
          <p className="text-white font-bold m-5">NO MODELS AVAILABLE</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {modelList.map((model) => (
              <div 
                key={model.id} 
                className="default-box p-4  cursor-pointer focus:border-[3px] transition"
                onClick={() => handleModelSelect(model)}
              >
                <h3 className="text-white font-bold text-lg">{model.display_name}</h3>
                <p className="text-gray-400 text-sm">{model.id}</p>
                <div className="mt-2 text-gray-500 text-xs">
                  <p>Context: {model.context_window.toLocaleString()} tokens</p>
                  <p>Cost: ${model.input_token_cost}/1M in · ${model.output_token_cost}/1M out</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelSelection;
