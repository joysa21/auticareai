# Dataset layout for training

Keep all training assets under this `cv/AutiCare/data` folder.

## 1) Image model dataset (for `auti_care_helper.py` retraining)

Place cropped/clear child face images in class folders:

- `image_model/train/autistic/`
- `image_model/train/typical/`
- `image_model/val/autistic/`
- `image_model/val/typical/`
- `image_model/test/autistic/`
- `image_model/test/typical/`

Supported formats: `.jpg`, `.jpeg`, `.png`.

## 2) Video model dataset (for `deep_learning_classifier.py`)

- Put video files in `video_model/videos/`
- Put label manifest JSON files in `video_model/labels/`

Template manifests are provided:
- `video_model/labels/train_manifest.template.json`
- `video_model/labels/val_manifest.template.json`

Each manifest item must include:
- `video_path` (relative to `cv/AutiCare`)
- `risk_class` as one-hot `[low, medium, high]`
- optional behavioral targets: `eye_contact`, `attention_shifts`, `gestures`, `social_gaze`, `response_latency`
