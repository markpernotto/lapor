import {
  Routes,
  Route,
  Link,
  Outlet,
  BrowserRouter,
} from "react-router-dom";
import QuestionsPage from "./QuestionsPage";
import SurveysPage from "./SurveysPage";

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

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/admin" element={<Shell />}>
        <Route
          path="questions"
          element={<QuestionsPage />}
        />
        <Route
          path="surveys"
          element={<SurveysPage />}
        />
      </Route>
    </Routes>
  );
}
