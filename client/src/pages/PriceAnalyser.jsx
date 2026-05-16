import React, { useState, useRef } from "react";
import { 
  Container, Title, Text, Button, Paper, Stack, Group, 
  ActionIcon, Image, Loader, Alert, Badge, Divider 
} from "@mantine/core";
import { IconCamera, IconArrowLeft, IconRefresh, IconScan, IconInfoCircle } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export function PriceAnalyser() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null); // Will hold n8n response
  const [cameraActive, setCameraActive] = useState(false);

  // Start Camera
  const startCamera = async () => {
    setCameraActive(true);
    setPrediction(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Please allow camera access to use this feature.");
    }
  };

  // Capture Photo
  const capturePhoto = () => {
    const context = canvasRef.current.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    const dataUrl = canvasRef.current.toDataURL("image/jpeg");
    setImage(dataUrl);
    
    // Stop camera streams
    videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    setCameraActive(false);
  };

  // Send to n8n for AI Analysis
  const analyzePrice = async () => {
    setLoading(true);
    try {
      // Replace with your n8n Webhook URL later
      // const response = await axios.post("YOUR_N8N_WEBHOOK_URL", { image });
      
      // MOCK RESPONSE for now
      setTimeout(() => {
        setPrediction({
          item: "Hand-painted Terracotta Vase",
          suggestedRange: "₹850 - ₹1,200",
          confidence: "88%",
          reasoning: "Similar items in North India market sell for this range based on intricate pattern work."
        });
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error("Analysis failed", error);
      setLoading(false);
    }
  };

  return (
    <Container size="xs" py="xl">
      <Group mb="xl">
        <ActionIcon variant="subtle" onClick={() => navigate("/")} color="gray" size="lg">
          <IconArrowLeft size={24} />
        </ActionIcon>
        <Title order={3}>AI Price Analyser</Title>
      </Group>

      <Stack gap="md">
        {!image && !cameraActive && (
          <Paper withBorder p="xl" radius="lg" ta="center" onClick={startCamera} style={{ cursor: 'pointer', borderStyle: 'dashed' }}>
            <Stack align="center">
              <IconCamera size={50} color="gray" />
              <Text fw={500}>Tap to scan your product</Text>
              <Text size="xs" c="dimmed">AI will suggest a competitive market price</Text>
            </Stack>
          </Paper>
        )}

        {cameraActive && (
          <Stack>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '12px', transform: 'scaleX(-1)' }} />
            <Button color="orange" size="lg" radius="xl" onClick={capturePhoto} leftSection={<IconScan size={20} />}>
              Capture Product
            </Button>
            <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }} />
          </Stack>
        )}

        {image && !loading && !prediction && (
          <Stack>
            <Image src={image} radius="md" />
            <Group grow>
              <Button variant="light" color="gray" onClick={() => {setImage(null); startCamera();}}>Retake</Button>
              <Button color="orange" onClick={analyzePrice}>Analyse Price</Button>
            </Group>
          </Stack>
        )}

        {loading && (
          <Paper withBorder p="xl" radius="md" ta="center">
            <Loader color="orange" size="lg" mb="sm" />
            <Text fw={500}>AI is studying your product...</Text>
          </Paper>
        )}

        {prediction && (
          <Paper withBorder p="xl" radius="lg" shadow="md" style={{ borderTop: '4px solid orange' }}>
            <Stack>
              <Group justify="space-between">
                <Text size="sm" fw={700} c="dimmed">PREDICTION RESULT</Text>
                <Badge color="green">{prediction.confidence} Match</Badge>
              </Group>
              <Title order={4}>{prediction.item}</Title>
              <Divider />
              <Group justify="space-between">
                <Text fw={600}>Market Price Range:</Text>
                <Text size="xl" fw={900} c="orange">{prediction.suggestedRange}</Text>
              </Group>
              <Alert icon={<IconInfoCircle size={16} />} color="blue" radius="md">
                {prediction.reasoning}
              </Alert>
              <Button fullWidth variant="light" color="orange" onClick={() => {setPrediction(null); setImage(null);}}>
                Scan Another Item
              </Button>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}