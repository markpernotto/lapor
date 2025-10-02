import { Routes, Route } from "react-router-dom";
import QuestionsPage from "./QuestionsPage";
import SurveysPage from "./SurveysPage";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route
        path="/admin/questions"
        element={<QuestionsPage />}
      />
      <Route
        path="/admin/surveys"
        element={<SurveysPage />}
      />
    </Routes>
  );
}
