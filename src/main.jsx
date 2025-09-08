import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";
import "reactflow/dist/style.css";
import App from "./App";

// const root = createRoot(document.getElementById("root"));
const container = document.querySelector('#app');
const root = createRoot(container);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
