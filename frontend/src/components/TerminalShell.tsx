import { NavLink, Outlet } from "react-router-dom";
import { QuoteTape } from "./QuoteTape";
import { useLiveQuotes } from "../hooks/useLiveQuotes";

const tickers = ["AAPL", "TSLA", "MSFT", "GOOGL"];

export function TerminalShell() {
  const { quotes, connected } = useLiveQuotes(tickers);

  return (
    <div className="terminal-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">MC</span>
          <div>
            <strong>MetaCapital</strong>
            <small>Agent Terminal</small>
          </div>
        </div>
        <nav>
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/strategies">Strategies</NavLink>
          <NavLink to="/insights">Insights</NavLink>
        </nav>
      </aside>

      <main className="workspace">
        <QuoteTape quotes={quotes} connected={connected} />
        <Outlet />
      </main>
    </div>
  );
}
