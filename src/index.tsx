import React from "react";
import ReactDOM from "react-dom/client";
import App from "./frontend/App";
import reportWebVitals from "./reportWebVitals";
import "./frontend/api/axiosConfig"; // Importa a configuração do axios

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
