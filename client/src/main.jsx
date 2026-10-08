import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider, createTheme } from "@mantine/core";
import { GoogleOAuthProvider } from "@react-oauth/google";

import App from "./App";
import "@mantine/core/styles.css";
import "./index.css"; // Ensure your global styles are loaded

// You can define a custom theme here later to match your "Smart Artisan" branding
const theme = createTheme({
  primaryColor: 'blue', // Or the brown/earthy tone from your UI
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  console.warn(
    "VITE_GOOGLE_CLIENT_ID is not set. Google sign-in will not work until it is added to the client .env file.",
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || ""}>
      <MantineProvider theme={theme} defaultColorScheme="light">
        <App />
      </MantineProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);