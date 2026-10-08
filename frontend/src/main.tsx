// Modified for FrontierLens Multisource: multiple data sources and shared AI workflows.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./SourceApp";
import { LanguageProvider } from "./i18n";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
