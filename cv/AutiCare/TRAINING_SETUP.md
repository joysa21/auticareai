# Training setup (inside cv/AutiCare)

## Where to put dataset

### A) For helper image model (`auti_care_helper.py`)
Use this folder layout:

- `data/image_model/train/typical/`
- `data/image_model/train/autistic/`
- `data/image_model/val/typical/`
- `data/image_model/val/autistic/`
- `data/image_model/test/typical/`
- `data/image_model/test/autistic/`

Put image files (`.jpg/.jpeg/.png`) inside each class folder.

### B) For optional deep video model (`deep_learning_classifier.py`)

- Videos: `data/video_model/videos/`
- Label manifests: `data/video_model/labels/`

Template manifests:
- `data/video_model/labels/train_manifest.template.json`
- `data/video_model/labels/val_manifest.template.json`

## How to retrain helper model

From project root:

1. Install deps for CV module
   `pip install -r cv/AutiCare/requirements.txt`

2. Run training script
   `python cv/AutiCare/train_image_model.py --epochs 20 --fine-tune-epochs 8`

3. Output model
   The best model is saved to:
   `models/best_autism_detector_model.h5`

This is the exact path used by your hybrid pipeline.

## Quick verify after training

`python - <<'PY'
from auti_care_helper import AutismDetector
AutismDetector()
print('OK: helper model loads')
PY`
