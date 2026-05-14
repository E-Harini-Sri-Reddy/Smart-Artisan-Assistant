import express from "express";

const router = express.Router();

router.post("/", async (req, res) => {
  const { message } = req.body;

  res.json({
    reply:
      "AI response for: " + message,
  });
});

export default router;