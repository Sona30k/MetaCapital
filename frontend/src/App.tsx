import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import Terminal from "./pages/Terminal";
import StrategyLab from "./pages/StrategyLab";
import Portfolio from "./pages/Portfolio";
import NewsSentiment from "./pages/NewsSentiment";

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Terminal />} />
          <Route path="/strategies" element={<StrategyLab />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/insights" element={<NewsSentiment />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;
