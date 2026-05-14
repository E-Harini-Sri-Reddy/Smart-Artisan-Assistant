import React from "react";

import {
  IconGauge,
  IconTools,
  IconCreditCard,
  IconChartBar,
  IconRobot,
  IconAdjustments,
  IconLock,
  IconLogout,
} from "@tabler/icons-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import classes from "./SideBar.module.css";

import logo from "../images/smart-artisan-logo-dark-removebg.png";

const navItems = [
  {
    label: "Dashboard / Home",
    icon: IconGauge,
    link: "/",
  },

  {
    label: "Production",
    icon: IconTools,
    link: "/production",
  },

  {
    label: "Payments",
    icon: IconCreditCard,
    link: "/payments",
  },

  {
    label: "Reports",
    icon: IconChartBar,
    link: "/reports",
  },

  {
    label: "AI Assistant",
    icon: IconRobot,
    link: "/ai-assistant",
  },

  {
    label: "Settings",
    icon: IconAdjustments,
    link: "/settings",
  },

  {
    label: "Security",
    icon: IconLock,
    link: "/security",
  },
];

export const SideBar = () => {

  const navigate = useNavigate();

  const handleLogout = () => {

    /* REMOVE USER DATA */

    localStorage.removeItem(
      "userInfo"
    );

    /* REDIRECT TO LOGIN */

    navigate("/login");

    /* REFRESH APP STATE */

    window.location.reload();
  };

  return (
    <div className={classes.navbar}>

      {/* TOP SECTION */}

      <div>

        {/* LOGO */}

        <div className={classes.header}>

          <img
            src={logo}
            alt="Smart Artisan Logo"
            className={classes.logo}
          />

        </div>

        {/* NAVIGATION */}

        <div className={classes.links}>

          {navItems.map((item) => {

            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.link}
                className={({ isActive }) =>
                  isActive
                    ? `${classes.link} ${classes.active}`
                    : classes.link
                }
              >

                <Icon
                  size={20}
                  stroke={1.8}
                />

                <span>
                  {item.label}
                </span>

              </NavLink>
            );
          })}

        </div>

      </div>

      {/* BOTTOM SECTION */}

      <div className={classes.bottomSection}>

        {/* LOGOUT BUTTON */}

        <button
          className={classes.logoutButton}
          onClick={handleLogout}
        >

          <IconLogout
            size={20}
            stroke={1.8}
          />

          <span>
            Logout
          </span>

        </button>

        {/* FOOTER */}

        <div className={classes.footer}>
          Smart Artisan v1.0.0
        </div>

      </div>

    </div>
  );
};