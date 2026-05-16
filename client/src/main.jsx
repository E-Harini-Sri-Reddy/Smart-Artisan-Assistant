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

const GOOGLE_CLIENT_ID = "536895736885-l5th17umc2m8uo4nr2n5nslcajq27s1d.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <MantineProvider theme={theme} defaultColorScheme="light">
        <App />
      </MantineProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);