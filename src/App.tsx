import {
  Link,
  Outlet,
  BrowserRouter,
} from "react-router-dom";
import "./App.css";
import AdminRoutes from "./admin/AdminRoutes";

function Shell() {
  return (
    <div>
      <header className="app-header">
        <h1>Lapor Admin</h1>
        <nav>
          <Link to="/admin/questions">
            Questions
          </Link>
          {" | "}
          <Link to="/admin/surveys">Surveys</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
      <AdminRoutes />
    </BrowserRouter>
  );
}
