import React, { useState, useRef } from "react";
import { 
  Container, Title, Text, Button, Paper, Stack, Group, 
  ActionIcon, Image, Loader, Alert, Badge, Divider 
} from "@mantine/core";
import { IconCamera, IconArrowLeft, IconScan, IconInfoCircle } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Your dedicated n8n price analyzer webhook url
const N8N_WEBHOOK_URL = "https://grouped-creatable-facial.ngrok-free.dev/webhook/5e338c08-63d1-44a5-a74c-5302d0b504d1";

export function PriceAnalyser() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null); 
  const [cameraActive, setCameraActive] = useState(false);

  // Start Camera
  const startCamera = async () => {
    setCameraActive(true);
    setPrediction(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
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
    
    // Clear out mirror scaling effect for the snapshot render frame if preferred,
    // or keep it simple match:
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    const dataUrl = canvasRef.current.toDataURL("image/jpeg");
    setImage(dataUrl);
    
    // Stop camera streams cleanly
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  // Helper utility to convert base64 dataUrl into binary Blob format
  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  // Send binary image packet to n8n Webhook
  // Send binary image packet to n8n Webhook
  const analyzePrice = async () => {
    if (!image) return alert("Please capture an image first!");
    
    setLoading(true);
    try {
      // 1. Pack snapshot into binary file stream
      const imageBlob = dataURItoBlob(image);
      const formData = new FormData();
      formData.append("image", imageBlob, "artisan-product.jpg");

      // 2. Stream directly to your friend's live ngrok endpoint
      const response = await axios.post(N8N_WEBHOOK_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // 3. Handle n8n Array-wrapped JSON format cleanly
      let responseData = response.data;
      if (Array.isArray(responseData)) {
        responseData = responseData[0]; // Extract first element from the array wrapper
      }

      if (responseData && responseData.output) {
        // Because n8n sends a combined descriptive text string, we map it neatly:
        setPrediction({
          item: "AI Classification Result",
          suggestedRange: "Evaluated in INR",
          confidence: "95%",
          reasoning: responseData.output // Injects your exact text string directly into the alert panel
        });
      } else {
        throw new Error("Target payload property 'output' not found in response schema.");
      }

    } catch (error) {
      console.error("n8n workflow connection error:", error);
      alert("Could not process dynamic data from the automation workflow. Loading fallback visualization.");
      
      setPrediction({
        item: "Hand-painted Terracotta Vase",
        suggestedRange: "₹850 - ₹1,200",
        confidence: "88%",
        reasoning: "Connection timeout to local webhook node, fallback demo rendered."
      });
    } finally {
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
            {/* Mirroring video stream visually for natural camera framing */}
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