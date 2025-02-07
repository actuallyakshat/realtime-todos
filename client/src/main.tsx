import { Provider } from "jotai";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import ApplicationRoutes from "./application-routes";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider>
      <BrowserRouter>
        <ApplicationRoutes />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
