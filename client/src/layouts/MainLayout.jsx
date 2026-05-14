import React from "react";

import { Outlet } from "react-router-dom";

import { SideBar } from "../components/SideBar";
import { AIAssistantButton } from "../components/AIAssistantButton";

import classes from "./MainLayout.module.css";

export const MainLayout = () => {
  return (
    <div className={classes.layout}>

      {/* SIDEBAR */}
      <SideBar />

      {/* PAGE CONTENT */}
      <div className={classes.content}>
        <Outlet />
      </div>

      {/* GLOBAL AI ASSISTANT (ONLY FOR LOGGED-IN AREA) */}
      <AIAssistantButton />

    </div>
  );
};