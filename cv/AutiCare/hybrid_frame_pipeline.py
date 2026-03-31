"""
Hybrid frame-based image scoring pipeline.

Keeps all orchestration inside cv/AutiCare while reusing AutismDetector
from auti_care_helper.py in the same directory.
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Optional, Tuple
import sys

import cv2
import numpy as np
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_IMAGE_MODEL_PATH = PROJECT_ROOT / "models" / "best_autism_detector_model.h5"

try:
    from auti_care_helper import AutismDetector
except Exception as exc:  # pragma: no cover
    AutismDetector = None
    IMPORT_ERROR = exc
else:
    IMPORT_ERROR = None


class HybridFramePipeline:
    """Extract 3 frames and aggregate image-model predictions."""

    FRAME_POSITIONS: Dict[str, float] = {
        "start": 0.15,
        "middle": 0.50,
        "end": 0.85,
    }

    def __init__(self, model_path: Optional[str] = None):
        if AutismDetector is None:
            raise RuntimeError(f"Unable to import AutismDetector: {IMPORT_ERROR}")

        resolved_model_path = Path(model_path).expanduser().resolve() if model_path else DEFAULT_IMAGE_MODEL_PATH
        self.detector = AutismDetector(str(resolved_model_path))

    @staticmethod
    def _frame_index(total_frames: int, ratio: float) -> int:
        if total_frames <= 1:
            return 0
        return max(0, min(total_frames - 1, int(round((total_frames - 1) * ratio))))

    @staticmethod
    def _read_frame_with_fallback(cap: cv2.VideoCapture, target_idx: int, max_jump: int = 10):
        """Try target frame first, then nearby indices."""
        candidate_indices = [target_idx]
        for delta in range(1, max_jump + 1):
            candidate_indices.extend([target_idx - delta, target_idx + delta])

        for idx in candidate_indices:
            if idx < 0:
                continue
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ok, frame = cap.read()
            if ok and frame is not None:
                return idx, frame

        return None, None

    def extract_three_frames(self, video_path: str) -> List[Tuple[str, Image.Image, int, float]]:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError("Could not open uploaded video")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = float(cap.get(cv2.CAP_PROP_FPS) or 0.0)

        if total_frames <= 0:
            cap.release()
            raise ValueError("Video contains no readable frames")

        picked: List[Tuple[str, Image.Image, int, float]] = []

        for label, ratio in self.FRAME_POSITIONS.items():
            target_idx = self._frame_index(total_frames, ratio)
            actual_idx, frame_bgr = self._read_frame_with_fallback(cap, target_idx)
            if frame_bgr is None:
                continue

            frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(frame_rgb)
            timestamp = (actual_idx / fps) if fps > 0 else 0.0
            picked.append((label, pil_image, actual_idx, timestamp))

        cap.release()

        if not picked:
            raise ValueError("Unable to extract start/middle/end frames from video")

        return picked

    def analyze_video(self, video_path: str) -> Dict:
        frames = self.extract_three_frames(video_path)

        frame_results: List[Dict] = []
        raw_scores: List[float] = []

        for label, pil_image, frame_idx, timestamp in frames:
            prediction = self.detector.predict_image(pil_image)

            result_item = {
                "position": label,
                "frame_index": frame_idx,
                "timestamp_seconds": round(float(timestamp), 2),
                **prediction,
            }
            frame_results.append(result_item)

            score = prediction.get("raw_score")
            if score is not None:
                raw_scores.append(float(score))

        if not raw_scores:
            raise ValueError("No valid frame predictions were produced by the image model")

        autism_probability = float(np.median(raw_scores))
        autism_probability_percent = round(autism_probability * 100, 2)
        model_confidence_percent = round(max(autism_probability, 1 - autism_probability) * 100, 2)

        return {
            "overall": {
                "autism_probability_percent": autism_probability_percent,
                "model_confidence_percent": model_confidence_percent,
                "diagnosis": (
                    "AUTISTIC TRAITS DETECTED" if autism_probability >= 0.5 else "NON-AUTISTIC / TYPICAL"
                ),
                "frames_used": len(raw_scores),
                "aggregation": "median(raw_score from start/middle/end)",
            },
            "frame_results": frame_results,
        }
