import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
//import { PrimeReactProvider } from "primereact/api";
import App from "./App";
//import "./index.css";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import ptxSourceReducer from "./ptxSourceSlice";

const store = configureStore({
  reducer: {
    ptxSource: ptxSourceReducer,
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
