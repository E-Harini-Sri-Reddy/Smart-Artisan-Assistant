import {
  IconGauge,
  IconTools,
  IconCreditCard,
  IconChartBar,
  IconAdjustments,
  IconLock,
  IconLogout,
  IconPackage,
  IconClipboardList,
} from "@tabler/icons-react";

import { NavLink, useNavigate } from "react-router-dom";

import classes from "./SideBar.module.css";

import logo from "../images/smart-artisan-logo-dark-removebg.png";

const navItems = [
  {
    label: "Dashboard / Home",
    icon: IconGauge,
    link: "/",
  },
  {
    label: "Products",
    icon: IconPackage,
    link: "/products",
  },
  {
    label: "Assignments",
    icon: IconClipboardList,
    link: "/assignments",
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
    localStorage.removeItem("userInfo");
    navigate("/login");
    window.location.reload();
  };

  return (
    <div className={classes.navbar}>
      <div>
        <div className={classes.header}>
          <img
            src={logo}
            alt="Smart Artisan Logo"
            className={classes.logo}
          />
        </div>

        <div className={classes.links}>
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.link}
                end={item.link === "/"}
                className={({ isActive }) =>
                  isActive
                    ? `${classes.link} ${classes.active}`
                    : classes.link
                }
              >
                <Icon size={20} stroke={1.8} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      <div className={classes.bottomSection}>
        <button className={classes.logoutButton} onClick={handleLogout}>
          <IconLogout size={20} stroke={1.8} />
          <span>Logout</span>
        </button>

        <div className={classes.footer}>Smart Artisan</div>
      </div>
    </div>
  );
};
