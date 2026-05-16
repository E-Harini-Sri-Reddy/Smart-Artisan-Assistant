import React, { useState } from "react";
import { Paper, Text, Title, SegmentedControl, Box, Anchor } from "@mantine/core";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import classes from "./LoginPage.module.css";
import leftSideImage from "../images/left-side.png";

export const LoginPage = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      localStorage.setItem("userInfo", JSON.stringify(data));
      setIsLoggedIn(true);
      navigate("/");
    } catch (error) {
      alert("Server Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.page}>
      <div className={classes.loginContainer}>
        <div className={classes.imageSection}>
          <img src={leftSideImage} alt="Login" className={classes.image} />
        </div>
        <div className={classes.formSection}>
          <Paper className={classes.form}>
            <Title order={2} className={classes.title}>Welcome Back!</Title>
            <Text c="dimmed" ta="center" mb="xl">Login securely with your Google account</Text>

            <Box style={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => alert("Login Failed")}
                useOneTap
                theme="filled_blue"
                shape="pill"
                width="300px"
              />
            </Box>

            <Text ta="center" mt="xl">
              Don't have an account?{" "}
              <Anchor component="button" fw={500} c="#4b3621" onClick={() => navigate("/register")}>
                Register here
              </Anchor>
            </Text>
          </Paper>
        </div>
      </div>
    </div>
  );
};