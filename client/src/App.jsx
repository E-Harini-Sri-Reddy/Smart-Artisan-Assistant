import { useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./App.css";

import { LoginPage } from "./pages/LoginPage";

import { MainLayout } from "./layouts/MainLayout";

import { HomePage } from "./pages/HomePage";
import { ProductionPage } from "./pages/ProductionPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { AIAssistantPage } from "./pages/AIAssistantPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SecurityPage } from "./pages/SecurityPage";
import { RegisterPage } from "./pages/RegisterPage";

function App() {

  const [isLoggedIn, setIsLoggedIn] =
    useState(
      !!localStorage.getItem(
        "userInfo"
      )
    );

  return (
    <BrowserRouter>

      <Routes>

        {/* LOGIN PAGE */}

        <Route
          path="/login"
          element={
            <LoginPage
              setIsLoggedIn={
                setIsLoggedIn
              }
            />
          }
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        {/* PROTECTED ROUTES */}

        {isLoggedIn ? (

          <Route
            element={<MainLayout />}
          >

            <Route
              path="/"
              element={<HomePage />}
            />

            <Route
              path="/production"
              element={
                <ProductionPage />
              }
            />

            <Route
              path="/payments"
              element={
                <PaymentsPage />
              }
            />

            <Route
              path="/reports"
              element={<ReportsPage />}
            />

            <Route
              path="/ai-assistant"
              element={
                <AIAssistantPage />
              }
            />

            <Route
              path="/settings"
              element={
                <SettingsPage />
              }
            />

            <Route
              path="/security"
              element={
                <SecurityPage />
              }
            />

            {/* UNKNOWN ROUTE */}

            <Route
              path="*"
              element={
                <Navigate
                  to="/"
                  replace
                />
              }
            />

          </Route>

        ) : (

          <>

            {/* REDIRECT ROOT */}

            <Route
              path="/"
              element={
                <Navigate
                  to="/login"
                  replace
                />
              }
            />

            {/* ALL UNKNOWN ROUTES */}

            <Route
              path="*"
              element={
                <Navigate
                  to="/login"
                  replace
                />
              }
            />

          </>

        )}

      </Routes>

    </BrowserRouter>
  );
}

export default App;