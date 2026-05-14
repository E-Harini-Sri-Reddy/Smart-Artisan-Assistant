import React, { useState } from "react";

import {
  Anchor,
  Button,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

import { useNavigate } from "react-router-dom";

import classes from "./LoginPage.module.css";

import leftSideImage from "../images/left-side.png";

export const RegisterPage = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert("Registration successful!");

      navigate("/login");
    } catch (error) {
      console.log(error);

      alert("Server Error");
    }
  };

  return (
    <div className={classes.page}>
      <div className={classes.loginContainer}>
        {/* LEFT IMAGE */}

        <div className={classes.imageSection}>
          <img src={leftSideImage} alt="Register" className={classes.image} />
        </div>

        {/* FORM */}

        <div className={classes.formSection}>
          <Paper className={classes.form}>
            <Title order={2} className={classes.title}>
              Create Account
            </Title>

            <TextInput
              label="Full Name"
              placeholder="John Doe"
              mt="md"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <TextInput
              label="Email"
              placeholder="hello@gmail.com"
              mt="md"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <PasswordInput
              label="Password"
              placeholder="Enter password"
              mt="md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button fullWidth mt="xl" color="#4b3621" onClick={handleRegister}>
              Register
            </Button>

            <Text ta="center" mt="md">
              Already have an account?{" "}
              <Anchor
                component="button"
                c="#4b3621"
                onClick={() => navigate("/login")}
              >
                Login
              </Anchor>
            </Text>
          </Paper>
        </div>
      </div>
    </div>
  );
};
