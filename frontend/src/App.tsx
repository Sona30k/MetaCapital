import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Strategies from "./pages/Strategies";
import Insights from "./pages/Insights";

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex" }}>

        {/* Sidebar */}
        <div style={{
          width: "220px",
          background: "#4A0F0F",   // maroon theme
          color: "white",
          height: "100vh",
          padding: "20px"
        }}>
          <h2>💰 MetaCapital</h2>

          <p><Link to="/" style={{ color: "white", textDecoration: "none" }}>Dashboard</Link></p>
          <p><Link to="/strategies" style={{ color: "white", textDecoration: "none" }}>Strategies</Link></p>
          <p><Link to="/insights" style={{ color: "white", textDecoration: "none" }}>Insights</Link></p>
        </div>

        {/* Main Content */}
        <div style={{
          flex: 1,
          padding: "20px",
          background: "#F5E6D3",   // beige theme
          minHeight: "100vh"
        }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/strategies" element={<Strategies />} />
            <Route path="/insights" element={<Insights />} />
          </Routes>
        </div>

      </div>
    </BrowserRouter>
  );
}

export default App;