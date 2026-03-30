"""
Standalone Helper for Integrating AutiCare AI Model into other projects.
Usage:
    from auti_care_helper import AutismDetector
    # Option 1: auto-load default model from ./models/best_autism_detector_model.h5
    detector = AutismDetector()
    # Option 2: pass explicit model path
    # detector = AutismDetector('/absolute/path/to/your_model.h5')
    result = detector.predict_image('child_photo.jpg')
    print(result['diagnosis'], result['confidence'])
"""
import tensorflow as tf
import numpy as np
import cv2
from PIL import Image
import os
from pathlib import Path


DEFAULT_MODEL_PATH = Path(__file__).resolve().parent / "models" / "best_autism_detector_model.h5"


def _legacy_binary_operands(x, y):
    if isinstance(x, (list, tuple)) and len(x) == 2:
        return x[0], x[1]
    return x, y


class LegacyMultiply(tf.keras.layers.Layer):
    """Compatibility layer for legacy H5 models serialized with class_name='Multiply'."""

    def call(self, x, y=1.0):
        left, right = _legacy_binary_operands(x, y)
        return tf.math.multiply(left, right)


class TrueDivide(tf.keras.layers.Layer):
    """Compatibility layer for legacy H5 models serialized with class_name='TrueDivide'."""

    def call(self, x, y=1.0):
        left, right = _legacy_binary_operands(x, y)
        return tf.math.truediv(left, right)


class LegacySubtract(tf.keras.layers.Layer):
    """Compatibility layer for legacy H5 models serialized with class_name='Subtract'."""

    def call(self, x, y=0.0):
        left, right = _legacy_binary_operands(x, y)
        return tf.math.subtract(left, right)

class AutismDetector:
    def __init__(self, model_path=None):
        resolved_model_path = Path(model_path).expanduser().resolve() if model_path else DEFAULT_MODEL_PATH

        if not resolved_model_path.exists():
            raise FileNotFoundError(
                f"Model file not found at {resolved_model_path}. "
                f"Pass model_path explicitly or place the model at {DEFAULT_MODEL_PATH}."
            )

        try:
            self.model = tf.keras.models.load_model(str(resolved_model_path))
        except Exception:
            self.model = tf.keras.models.load_model(
                str(resolved_model_path),
                custom_objects={
                    "Multiply": LegacyMultiply,
                    "TrueDivide": TrueDivide,
                    "Subtract": LegacySubtract,
                },
                compile=False,
            )
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    def is_human_present(self, pil_image):
        """Check for human presence using Haar Cascades."""
        img_cv = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
        return len(faces) > 0

    def preprocess(self, pil_image):
        """Prepare image for the AI model."""
        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')
        img_resized = pil_image.resize((224, 224))
        img_array = np.array(img_resized).astype(np.float32) / 255.0
        return np.expand_dims(img_array, axis=0)

    def predict_image(self, image_input):
        """
        Predict Autism from a single image.
        image_input: path to image or PIL Image object
        """
        if isinstance(image_input, str):
            pil_image = Image.open(image_input)
        else:
            pil_image = image_input

        if not self.is_human_present(pil_image):
            return {"error": "No human detected. Please upload a clear photo of the child."}

        processed = self.preprocess(pil_image)
        score = self.model.predict(processed, verbose=0)[0][0]
        return self._interpret(score)

    def predict_video(self, video_path, sampling_rate=10, frames_per_sample=3):
        """
        Predict Autism from a video by sampling frames.
        """
        cap = cv2.VideoCapture(video_path)
        predictions = []
        frame_count = 0
        human_detected_count = 0
        total_samples = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % sampling_rate < frames_per_sample:
                total_samples += 1
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(frame_rgb)
                
                if self.is_human_present(pil_img):
                    human_detected_count += 1
                    processed = self.preprocess(pil_img)
                    pred = self.model.predict(processed, verbose=0)[0][0]
                    predictions.append(pred)
            frame_count += 1
        
        cap.release()

        if total_samples > 0 and (human_detected_count / total_samples) < 0.3:
            return {"error": "Non-human video detected. Please upload a video showing the child clearly."}

        if not predictions:
            return {"error": "Could not process any frames from the video."}

        return self._interpret(np.mean(predictions))

    def _interpret(self, score):
        """Convert probability score to human-readable result."""
        is_autistic = score > 0.5
        confidence = score if is_autistic else (1 - score)
        return {
            "diagnosis": "AUTISTIC TRAITS DETECTED" if is_autistic else "NON-AUTISTIC / TYPICAL",
            "confidence": round(float(confidence) * 100, 2),
            "raw_score": float(score)
        }
