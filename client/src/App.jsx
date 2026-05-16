import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { MainLayout } from "./layouts/MainLayout";

// Organization Pages (Desktop Focused)
import { HomePage } from "./pages/HomePage";
import { ProductionPage } from "./pages/ProductionPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { AIAssistantPage } from "./pages/AIAssistantPage";
import { SettingsPage } from "./pages/SettingsPage"; 
import { SecurityPage } from "./pages/SecurityPage";

// Artisan Pages (Mobile Optimized)
import { ArtisanDashboard } from "./pages/ArtisanDashboard";
import { MoneyFlow } from "./pages/MoneyFlow";
import { ArtisanSettings } from "./pages/ArtisanSettings";
import { PriceAnalyser } from "./pages/PriceAnalyser";
import { InventoryPage } from "./pages/InventoryPage";
import { QualityCheck } from "./pages/QualityCheck";
import { AnalyticsPage } from "./pages/AnalyticsPage"; 

function App() {
  // Check login status
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("userInfo"));
  
  // Get user info to check role
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
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

        {isLoggedIn ? (
          <>
            {/* 1. ORGANIZATION FLOW (Desktop Sidebar Layout) */}
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

            {/* 2. ARTISAN FLOW (Mobile Full-Screen Layout) */}
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

            {/* FALLBACK FOR LOGGED IN USERS */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          /* REDIRECT TO LOGIN IF NOT LOGGED IN */
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;