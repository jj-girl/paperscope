// Modified for FrontierLens Multisource: multiple data sources and shared AI workflows.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./ApiWorkbench";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
