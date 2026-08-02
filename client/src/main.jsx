import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AccessibilityProvider } from "./a11y/AccessibilityContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AccessibilityProvider>
      <App />
    </AccessibilityProvider>
  </React.StrictMode>
);
