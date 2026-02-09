import { Router, Request, Response } from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";

const router = Router();
const upload = multer({ dest: "uploads/" });

const PYTHON_API = process.env.PYTHON_API_URL || "http://127.0.0.1:8000";


router.post("/screen", upload.single("video"), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "Video file required" });
  }

  try {
    const formData = new FormData();
    formData.append(
      "video",
      fs.createReadStream(req.file.path),
      req.file.originalname
    );

    const response = await fetch(`${PYTHON_API}/api/screen`, {
      method: "POST",
      body: formData,
      headers: formData.getHeaders(),
    });

    const data = await response.json();

    fs.unlinkSync(req.file.path); // cleanup temp file

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Screening failed" });
  }
});

export default router;
