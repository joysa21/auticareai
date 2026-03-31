"""
Terminal test script for hybrid video screening.

Runs the same logic as /api/screen-hybrid without starting the server.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from autism_screening_model import AutismScreeningModel
from hybrid_frame_pipeline import HybridFramePipeline


def main() -> None:
    parser = argparse.ArgumentParser(description="Test hybrid screening on a local video file")
    parser.add_argument("video_path", help="Path to input video file")
    parser.add_argument(
        "--model-path",
        default=None,
        help="Optional path to .h5 model for AutismDetector (defaults to models/best_autism_detector_model.h5)",
    )
    parser.add_argument(
        "--include-frame-details",
        action="store_true",
        help="Include per-frame prediction details in output",
    )
    parser.add_argument(
        "--output-json",
        default=None,
        help="Optional output JSON file path",
    )
    args = parser.parse_args()

    video_path = Path(args.video_path).expanduser().resolve()
    if not video_path.exists():
        raise FileNotFoundError(f"Video not found: {video_path}")

    screening_model = AutismScreeningModel()
    hybrid_pipeline = HybridFramePipeline(model_path=args.model_path)

    metrics = screening_model.process_video(str(video_path))
    report = screening_model.generate_report(metrics, quiet=True)

    frame_analysis = hybrid_pipeline.analyze_video(str(video_path))

    response = {
        "screening_report": report,
        "confidence_score": frame_analysis["overall"],
    }

    if args.include_frame_details:
        response["frame_details"] = frame_analysis["frame_results"]

    if args.output_json:
        output_path = Path(args.output_json).expanduser().resolve()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(response, indent=2))
        print(f"Saved response to: {output_path}")

    print(json.dumps(response, indent=2))


if __name__ == "__main__":
    main()
