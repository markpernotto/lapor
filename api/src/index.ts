import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import questionsRouter from "./routes/questions";
import surveysRouter from "./routes/surveys";
<<<<<<< HEAD
import adminRouter from "./routes/admin";
=======
>>>>>>> origin/main

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/questions", questionsRouter);
app.use("/api/surveys", surveysRouter);
<<<<<<< HEAD
app.use("/api/admin", adminRouter);
=======
>>>>>>> origin/main

const port = process.env.PORT || 4000;
if (require.main === module) {
  app.listen(port, () => {
    console.log(
      `API listening on http://localhost:${port}`,
    );
  });
}

export default app;
