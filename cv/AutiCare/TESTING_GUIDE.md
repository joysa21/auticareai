# Model Testing with Streamlit Apps

This directory contains two Streamlit applications for testing and validating the autism screening models.

## Apps Overview

### 1. Image Model Tester (`test_image_model_app.py`)
Tests the image classification model with individual or batch image inputs.

**Features:**
- Single image upload and prediction
- Real-time confidence visualization
- Probability distribution charts
- Batch testing from folder
- Detailed prediction breakdown
- CSV/JSON export of results

**Run:**
```bash
streamlit run test_image_model_app.py
```

**How to Use:**
1. Upload a single image (JPG, PNG, BMP, GIF)
2. Model analyzes and predicts autism detection
3. View confidence scores and probability breakdown
4. (Optional) Test batch of images from a folder

### 2. Hybrid Pipeline Tester (`test_hybrid_pipeline_app.py`)
Tests the complete hybrid video screening pipeline end-to-end.

**Features:**
- Single video upload and analysis
- Full screening pipeline execution
- 3-frame hybrid confidence scoring
- Risk assessment display
- Behavioral indicators and objective signals
- Batch video testing
- Results download (JSON/CSV)
- Results analysis dashboard

**Run:**
```bash
streamlit run test_hybrid_pipeline_app.py
```

**How to Use:**
1. Upload a video file (MP4, AVI, MOV, MKV, FLV)
2. Pipeline runs screening model and hybrid confidence analysis
3. View risk level, confidence scores, and behavioral indicators
4. Download results as JSON or CSV
5. (Optional) Test multiple videos from a folder

## Installation Requirements

Make sure you have Streamlit installed:

```bash
pip install streamlit
```

If not already in requirements.txt, add it:
```bash
pip install streamlit pandas matplotlib
```

## Expected Output Format

### Image Model Output
```python
{
    'class_label': 'Autistic' | 'Non-Autistic',
    'confidence': float (0-1),
    'autism_probability': float (0-100),
    'non_autism_probability': float (0-100),
    'raw_scores': {...}
}
```

### Hybrid Pipeline Output
```python
{
    'screening_report': {
        'risk_assessment': {
            'level': 'Low' | 'Medium' | 'High',
            'confidence': float (0-1),
            'description': str
        },
        'metrics': {
            'objective_signals': {...},
            'behavioral_indicators': {...}
        }
    },
    'model_confidence_percent': float (0-100),
    'autism_probability_percent': float (0-100),
    'frames_analyzed': int
}
```

## Quick Start

### Test Image Model
```bash
# In terminal 1 (from cv/AutiCare directory)
streamlit run test_image_model_app.py
# Opens at http://localhost:8501
```

### Test Hybrid Pipeline
```bash
# In terminal 2 (from cv/AutiCare directory)
streamlit run test_hybrid_pipeline_app.py
# Opens at http://localhost:8502
```

To specify different ports:
```bash
streamlit run test_image_model_app.py --server.port 8503
streamlit run test_hybrid_pipeline_app.py --server.port 8504
```

## Test Data Preparation

### For Image Model Testing
Create test images in `cv/AutiCare/data/test_images/`:
```
data/
├── test_images/
│   ├── autistic_sample_1.jpg
│   ├── autistic_sample_2.jpg
│   ├── non_autistic_sample_1.jpg
│   └── non_autistic_sample_2.jpg
```

### For Hybrid Pipeline Testing
Create test videos in `cv/AutiCare/data/test_videos/`:
```
data/
├── test_videos/
│   ├── screening_test_1.mp4
│   ├── screening_test_2.mp4
│   └── screening_test_3.mp4
```

## Troubleshooting

**Issue:** Model not loading
- Ensure `models/best_autism_detector_model.h5` exists
- Check Python path includes current directory
- Verify TensorFlow/Keras installation

**Issue:** Video processing fails
- Ensure video codec is supported (MP4/H.264 recommended)
- Check video is not corrupted
- Verify sufficient disk space for processing

**Issue:** Streamlit not found
- Install: `pip install streamlit`
- Verify virtual environment is activated

## Model Accuracy Validation

Use these apps to:
1. **Validate Model Performance:** Compare predictions across different input types
2. **Test Edge Cases:** Try unusual lighting, angles, or subject distances
3. **Batch Validation:** Run multiple videos to check consistency
4. **Generate Test Reports:** Export results for documentation

## Next Steps

After testing:
1. Document accuracy metrics and edge cases
2. Identify model weaknesses from test results
3. Consider retraining if accuracy is below acceptable threshold
4. Use results for model optimization
5. Deploy with confidence metrics from testing

## Support

For issues or questions about the testing apps:
1. Check model files exist and are readable
2. Verify all dependencies are installed
3. Check Streamlit version: `streamlit --version`
4. Review error messages in terminal output
