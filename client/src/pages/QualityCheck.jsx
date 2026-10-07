import React, { useRef, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Container,
  Group,
  Image,
  List,
  Loader,
  Paper,
  RingProgress,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconBulb,
  IconCamera,
  IconCircleCheck,
  IconEye,
  IconScan,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const N8N_QC_WEBHOOK_URL = import.meta.env.VITE_N8N_QC_WEBHOOK_URL;

export function QualityCheck() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = async () => {
    setCameraActive(true);
    setResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Camera error:", error);
      setCameraActive(false);
      alert("Camera access denied.");
    }
  };

  const stopCamera = () => {
    videoRef.current?.srcObject?.getTracks().forEach((track) => {
      track.stop();
    });

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    context.drawImage(videoRef.current, 0, 0, 640, 480);

    setImage(canvas.toDataURL("image/jpeg", 0.9));
    stopCamera();
  };

  const dataURItoBlob = (dataURI) => {
    const [header, data] = dataURI.split(",");
    const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";

    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new Blob([bytes], { type: mime });
  };

  const parseResponse = (response) => {
    let data = response;

    if (Array.isArray(data)) {
      data = data[0];
    }

    if (typeof data === "string") {
      data = JSON.parse(data);
    }

    if (data?.output && typeof data.output === "string") {
      try {
        data = JSON.parse(data.output);
      } catch {
        // Keep original object if output isn't JSON
      }
    }

    if (Array.isArray(data)) {
      data = data[0];
    }

    if (!data || typeof data !== "object") {
      throw new Error("Invalid response from n8n.");
    }

    const score = Number(data.quality_score);

    if (Number.isNaN(score)) {
      throw new Error("Invalid quality_score in n8n response.");
    }

    const safeScore = Math.min(Math.max(score, 0), 10);
    const label = String(data.quality_label || "UNKNOWN").toUpperCase();

    const observations = Array.isArray(data.observations)
      ? data.observations
      : data.observations
        ? [data.observations]
        : [];

    const improvementTips = Array.isArray(data.improvement_tips)
      ? data.improvement_tips
      : data.improvement_tips
        ? [data.improvement_tips]
        : [];

    let color = "orange";
    let status = "Needs Improvement";

    if (safeScore >= 8) {
      color = "green";
      status = "Excellent Quality";
    } else if (safeScore >= 5) {
      color = "blue";
      status = "Good Quality";
    }

    return {
      score: safeScore,
      percentage: safeScore * 10,
      label,
      status,
      color,
      observations,
      improvementTips,
    };
  };

  const runQualityCheck = async () => {
    if (!image) {
      alert("Please capture an image first!");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();

      formData.append("image", dataURItoBlob(image), "artisan-product-qc.jpg");

      const response = await axios.post(N8N_QC_WEBHOOK_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("n8n response:", response.data);

      setResult(parseResponse(response.data));
    } catch (error) {
      console.error("Quality check error:", error);
      alert(error?.message || "Unable to process the quality check.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setImage(null);
    setResult(null);
    startCamera();
  };

  const reset = () => {
    setImage(null);
    setResult(null);
  };

  return (
    <Container size="xs" py="xl">
      <Group mb="xl">
        <ActionIcon variant="subtle" color="gray" onClick={() => navigate("/")}>
          <IconArrowLeft size={24} />
        </ActionIcon>

        <Title order={3}>AI Quality Check</Title>
      </Group>

      {!image && !cameraActive && !result && (
        <Paper
          withBorder
          p="xl"
          radius="lg"
          ta="center"
          onClick={startCamera}
          style={{
            borderStyle: "dashed",
            cursor: "pointer",
          }}
        >
          <Stack align="center">
            <IconScan size={50} color="orange" />
            <Text fw={700}>Scan Product for Feedback</Text>
            <Text size="xs" c="dimmed">
              AI will rate your finish and suggest improvements
            </Text>
          </Stack>
        </Paper>
      )}

      {cameraActive && (
        <Stack>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: "100%",
              borderRadius: "16px",
            }}
          />

          <Button
            color="orange"
            size="lg"
            radius="xl"
            onClick={capturePhoto}
            leftSection={<IconCamera size={20} />}
          >
            Capture for Analysis
          </Button>

          <canvas
            ref={canvasRef}
            width="640"
            height="480"
            style={{ display: "none" }}
          />
        </Stack>
      )}

      {image && !loading && !result && (
        <Stack>
          <Image src={image} radius="md" />

          <Button color="orange" onClick={runQualityCheck}>
            Run AI Audit
          </Button>

          <Button variant="subtle" color="gray" onClick={handleRetake}>
            Retake
          </Button>
        </Stack>
      )}

      {loading && (
        <Paper p="xl" ta="center">
          <Loader color="orange" size="lg" />

          <Text mt="md" fw={600}>
            Analyzing textures and symmetry...
          </Text>
        </Paper>
      )}

      {result && (
        <Stack>
          <Paper withBorder p="lg" radius="lg" shadow="sm">
            <Group justify="center">
              <RingProgress
                size={120}
                roundCaps
                thickness={12}
                sections={[
                  {
                    value: result.percentage,
                    color: result.color,
                  },
                ]}
                label={
                  <Text ta="center" fw={900} size="xl">
                    {result.score}
                  </Text>
                }
              />

              <Stack gap={4}>
                <Text fw={700} size="lg">
                  Quality Score
                </Text>

                <Badge color={result.color} variant="light" size="lg">
                  {result.status}
                </Badge>

                <Text size="xs" c="dimmed">
                  {result.label} · {result.score}/10
                </Text>
              </Stack>
            </Group>
          </Paper>

          {result.observations.length > 0 && (
            <Paper withBorder p="lg" radius="lg" shadow="sm">
              <Group mb="md">
                <ThemeIcon color="blue" variant="light" radius="xl">
                  <IconEye size={18} />
                </ThemeIcon>

                <Text fw={700}>AI Observations</Text>
              </Group>

              <List
                spacing="sm"
                size="sm"
                icon={
                  <ThemeIcon color="blue" size={20} radius="xl">
                    <IconCircleCheck size={12} />
                  </ThemeIcon>
                }
              >
                {result.observations.map((item, index) => (
                  <List.Item key={index}>{item}</List.Item>
                ))}
              </List>
            </Paper>
          )}

          {result.improvementTips.length > 0 && (
            <Paper
              withBorder
              p="lg"
              radius="lg"
              shadow="sm"
              bg="var(--mantine-color-gray-0)"
            >
              <Group mb="md">
                <ThemeIcon color="orange" variant="light" radius="xl">
                  <IconBulb size={18} />
                </ThemeIcon>

                <Text fw={700}>Improvement Tips</Text>
              </Group>

              <List
                spacing="sm"
                size="sm"
                icon={
                  <ThemeIcon color="orange" size={20} radius="xl">
                    <IconCircleCheck size={12} />
                  </ThemeIcon>
                }
              >
                {result.improvementTips.map((item, index) => (
                  <List.Item key={index}>{item}</List.Item>
                ))}
              </List>
            </Paper>
          )}

          <Button fullWidth variant="light" color="orange" onClick={reset}>
            Scan New Item
          </Button>
        </Stack>
      )}
    </Container>
  );
}
