import React, { useState } from "react";

import {
  Anchor,
  Button,
  Checkbox,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

import { useNavigate } from "react-router-dom";

import classes from "./LoginPage.module.css";

import leftSideImage from "../images/left-side.png";

export const LoginPage = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");

        setLoading(false);

        return;
      }

      localStorage.setItem("userInfo", JSON.stringify(data));

      setIsLoggedIn(true);

      navigate("/");
    } catch (error) {
      console.log(error);

      alert("Server Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.page}>
      <div className={classes.loginContainer}>
        {/* LEFT IMAGE */}

        <div className={classes.imageSection}>
          <img
            src={leftSideImage}
            alt="Login Visual"
            className={classes.image}
          />
        </div>

        {/* RIGHT FORM */}

        <div className={classes.formSection}>
          <Paper className={classes.form}>
            <Title order={2} className={classes.title}>
              Welcome!
            </Title>

            <Text c="dimmed" mt={6} mb="xl">
              Login to continue to Smart Artisan Assistant
            </Text>

            {/* EMAIL */}

            <TextInput
              label="Email address"
              placeholder="hello@gmail.com"
              size="md"
              radius="md"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            {/* PASSWORD */}

            <PasswordInput
              label="Password"
              placeholder="Your password"
              mt="md"
              size="md"
              radius="md"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            {/* REMEMBER */}

            <Checkbox label="Keep me logged in" mt="xl" size="md" />

            {/* LOGIN BUTTON */}

            <Button
              fullWidth
              mt="xl"
              size="md"
              radius="md"
              color="#4b3621"
              loading={loading}
              styles={{
                root: {
                  backgroundColor: "#4b3621",
                },
              }}
              onClick={handleLogin}
            >
              Login
            </Button>

            {/* REGISTER */}

            <Text ta="center" mt="md">
              Don&apos;t have an account?{" "}
              <Anchor
                component="button"
                fw={500}
                c="#4b3621"
                underline="always"
                onClick={() => navigate("/register")}
              >
                Register
              </Anchor>
            </Text>
          </Paper>
        </div>
      </div>
    </div>
  );
};
