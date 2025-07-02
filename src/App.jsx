import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Chat from "./pages/Chat";
import History from "./pages/History";
import SystemPrompt from "./pages/SystemPrompt";
import ModelSelection from "./pages/ModelSelection";
import {AIManager} from "./services/AiManager";
import ChatManager from "./services/ChatManager";
import UploadManager from "./services/UploadManager";

export default function App() {
    let aiManager = new AIManager();
    let chatManager = new ChatManager();
    let uploadManager = new UploadManager();
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Chat aiManager={aiManager} chatManager={chatManager} uploadManager={uploadManager}/>} />
        <Route path="/history" element={<History chatManager={chatManager}/>} />
        <Route path="/system-prompt" element={<SystemPrompt chatManager={chatManager}/>} />
        <Route path="/models" element={<ModelSelection aiManager={aiManager}/>} />
      </Routes>
    </Router>
  );
}
