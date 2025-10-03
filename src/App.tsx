import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import "./App.css";
import AdminRoutes from "./admin/AdminRoutes";
import SurveyView from "./SurveyView";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/survey/:surveyId"
          element={<SurveyView />}
        />
      </Routes>
      <AdminRoutes />
    </BrowserRouter>
  );
}
