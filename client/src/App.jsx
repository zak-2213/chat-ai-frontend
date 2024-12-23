import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Chat from "./pages/Chat";
import History from "./pages/History";
import SystemPrompt from "./pages/SystemPrompt";
import ModelSelection from "./pages/ModelSelection";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Chat />} />
        <Route path="/history" element={<History />} />
        <Route path="/system-prompt" element={<SystemPrompt />} />
        <Route path="/models" element={<ModelSelection />} />
      </Routes>
    </Router>
  );
}
