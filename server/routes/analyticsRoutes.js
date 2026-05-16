import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data"; // Standard built-in for multi-part server communication

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Keep raw binary in memory buffer

const N8N_ANALYZER_URL = "http://localhost:5678/webhook/5e338c08-63d1-44a5-a74c-5302d0b504d1";

// POST endpoint acting as a secure bridge to n8n
router.post("/analyze-price", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image payload attached to body." });
    }

    // Pack the file buffer back into a multi-part form stream
    const n8nForm = new FormData();
    n8nForm.append("image", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    // Forward the payload directly to the local n8n runtime
    const n8nResponse = await axios.post(N8N_ANALYZER_URL, n8nForm, {
      headers: {
        ...n8nForm.getHeaders(),
      },
    });

    // Return the analyzer results back to the frontend dashboard view
    return res.json({
      success: true,
      n8nData: n8nResponse.data
    });

  } catch (error) {
    console.error("Internal forwarding error to n8n server:", error.message);
    next(error);
  }
});

export default router;