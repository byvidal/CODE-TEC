require("dotenv").config();

const path = require("path");
const cors = require("cors");
const express = require("express");
const apiRouter = require("./routes/api");

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/api", apiRouter);

app.use((request, response, next) => {
  if (request.path.startsWith("/api")) {
    response.status(404).json({
      error: "Ruta de API no encontrada."
    });
    return;
  }

  next();
});

app.use((error, _request, response, _next) => {
  console.error("Error:", error.message);
  const statusCode = error.statusCode || 400;
  const payload = {
    error: error.message || "Ocurrio un error inesperado."
  };

  if (error.code) {
    payload.code = error.code;
  }

  if (error.membership) {
    payload.membership = error.membership;
  }

  if (error.plans) {
    payload.plans = error.plans;
  }

  response.status(statusCode).json(payload);
});

app.listen(PORT, () => {
  console.log(`PDA disponible en http://localhost:${PORT}`);
});
