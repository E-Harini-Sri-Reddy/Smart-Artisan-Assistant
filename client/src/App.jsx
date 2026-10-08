import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { MainLayout } from "./layouts/MainLayout";

// Organization Pages (Desktop Focused)
import { HomePage } from "./pages/HomePage";
import { ProductionPage } from "./pages/ProductionPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { AIAssistantPage } from "./pages/AIAssistantPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SecurityPage } from "./pages/SecurityPage";

// Artisan Pages (Mobile Optimized) — also used by Organization Users
import { ArtisanDashboard } from "./pages/ArtisanDashboard";
import { MoneyFlow } from "./pages/MoneyFlow";
import { ArtisanSettings } from "./pages/ArtisanSettings";
import { PriceAnalyser } from "./pages/PriceAnalyser";
import { InventoryPage } from "./pages/InventoryPage";
import { QualityCheck } from "./pages/QualityCheck";
import { AnalyticsPage } from "./pages/AnalyticsPage";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("userInfo"),
  );

  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
  // Organization Admins use org UI; Individual Artisans and Org Users use artisan UI
  const role = userInfo?.role;

  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route
          path="/login"
          element={<LoginPage setIsLoggedIn={setIsLoggedIn} />}
        />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {isLoggedIn ? (
          <>
            {role === "organization" && (
              <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/production" element={<ProductionPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/ai-assistant" element={<AIAssistantPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/security" element={<SecurityPage />} />
              </Route>
            )}

            {role === "artisan" && (
              <>
                <Route path="/" element={<ArtisanDashboard />} />
                <Route path="/money-flow" element={<MoneyFlow />} />
                <Route path="/settings" element={<ArtisanSettings />} />
                <Route path="/price-analyser" element={<PriceAnalyser />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/quality-check" element={<QualityCheck />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
              </>
            )}

            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
