"""
Streamlit app to test and validate the autism image classification model
"""
import streamlit as st
import numpy as np
from PIL import Image
import os
import sys
from pathlib import Path
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    roc_curve,
    precision_recall_curve,
)
import matplotlib.pyplot as plt

# Add root directory to path to access auti_care_helper
# Path: cv/AutiCare/test_image_model_app.py -> need to go up 3 levels to root
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from auti_care_helper import AutismDetector

st.set_page_config(
    page_title="Image Model Tester",
    page_icon="🔍",
    layout="wide"
)

st.title("🔍 Autism Screening Image Model Tester")
st.markdown("Test the image classification model by uploading images and checking predictions")

# Initialize model
@st.cache_resource
def load_model():
    try:
        detector = AutismDetector()
        return detector
    except Exception as e:
        st.error(f"Failed to load model: {str(e)}")
        return None

detector = load_model()

if detector is None:
    st.error("❌ Could not load the autism detector model. Please ensure the model file exists.")
    st.stop()

st.success("✅ Model loaded successfully!")


def normalize_prediction(result: dict) -> dict:
    """Normalize AutismDetector output into UI-friendly fields."""
    if not isinstance(result, dict):
        raise ValueError("Invalid prediction response format")

    if result.get("error"):
        raise ValueError(result["error"])

    raw_score = float(result.get("raw_score", 0.0))
    raw_score = max(0.0, min(1.0, raw_score))

    diagnosis = str(result.get("diagnosis", "UNKNOWN"))
    class_label = "Autistic" if "AUTISTIC TRAITS" in diagnosis.upper() else "Non-Autistic"

    confidence_pct = float(result.get("confidence", 0.0))
    autism_probability = raw_score * 100.0
    non_autism_probability = 100.0 - autism_probability

    return {
        "class_label": class_label,
        "diagnosis": diagnosis,
        "confidence_pct": confidence_pct,
        "autism_probability": autism_probability,
        "non_autism_probability": non_autism_probability,
        "raw_score": raw_score,
    }


def evaluate_image_test_split(test_dir: Path):
    """Evaluate model on labeled image test split and return metrics + plot data."""
    if not test_dir.exists():
        raise FileNotFoundError(f"Test directory not found: {test_dir}")

    class_dirs = [d for d in test_dir.iterdir() if d.is_dir()]
    if len(class_dirs) < 2:
        raise ValueError("Expected at least 2 class folders inside test directory")

    # Heuristic class mapping by folder names
    positive_aliases = {"autistic", "asd", "autism"}
    negative_aliases = {"non_autistic", "non-autistic", "typical", "normal"}

    positive_dir = None
    negative_dir = None

    for d in class_dirs:
        name = d.name.strip().lower()
        if any(alias in name for alias in positive_aliases):
            positive_dir = d
        elif any(alias in name for alias in negative_aliases):
            negative_dir = d

    if positive_dir is None or negative_dir is None:
        sorted_dirs = sorted(class_dirs, key=lambda x: x.name.lower())
        negative_dir = sorted_dirs[0]
        positive_dir = sorted_dirs[1]

    image_exts = {".jpg", ".jpeg", ".png", ".bmp", ".gif", ".webp"}
    y_true = []
    y_score = []
    rows = []

    for class_dir, label in [(negative_dir, 0), (positive_dir, 1)]:
        for img_path in sorted(class_dir.rglob("*")):
            if img_path.is_file() and img_path.suffix.lower() in image_exts:
                try:
                    img = Image.open(img_path).convert("RGB")
                    pred = normalize_prediction(detector.predict_image(img))
                    score = float(pred["raw_score"])

                    y_true.append(label)
                    y_score.append(score)
                    rows.append(
                        {
                            "file": str(img_path.name),
                            "ground_truth": "Autistic" if label == 1 else "Non-Autistic",
                            "predicted": pred["class_label"],
                            "score": score,
                        }
                    )
                except Exception as e:
                    rows.append(
                        {
                            "file": str(img_path.name),
                            "ground_truth": "Autistic" if label == 1 else "Non-Autistic",
                            "predicted": f"ERROR: {e}",
                            "score": np.nan,
                        }
                    )

    if not y_true:
        raise ValueError("No valid images found in test split")

    y_pred = [1 if s >= 0.5 else 0 for s in y_score]

    metrics = {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1": f1_score(y_true, y_pred, zero_division=0),
        "count": len(y_true),
        "positive_dir": positive_dir.name,
        "negative_dir": negative_dir.name,
    }

    # AUC requires both classes present
    if len(set(y_true)) == 2:
        metrics["roc_auc"] = roc_auc_score(y_true, y_score)
        fpr, tpr, _ = roc_curve(y_true, y_score)
        pr_precision, pr_recall, _ = precision_recall_curve(y_true, y_score)
    else:
        metrics["roc_auc"] = np.nan
        fpr, tpr = np.array([0, 1]), np.array([0, 1])
        pr_precision, pr_recall = np.array([1.0]), np.array([0.0])

    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])

    return metrics, rows, cm, (fpr, tpr), (pr_precision, pr_recall)

# Create two columns for layout
col1, col2 = st.columns([1, 2])

with col1:
    st.subheader("📤 Upload Image")
    uploaded_file = st.file_uploader(
        "Choose an image file",
        type=["jpg", "jpeg", "png", "bmp", "gif"],
        help="Upload an image to test the autism detection model"
    )

    if uploaded_file is not None:
        # Display uploaded image
        image = Image.open(uploaded_file)
        st.image(image, caption="Uploaded Image", width="stretch")
        
        # Get image info
        st.write(f"**Image Size:** {image.size}")
        st.write(f"**Image Format:** {image.format}")

with col2:
    if uploaded_file is not None:
        st.subheader("🤖 Model Prediction")
        
        try:
            # Make prediction
            with st.spinner("Analyzing image..."):
                prediction_raw = detector.predict_image(image.convert("RGB"))
                prediction = normalize_prediction(prediction_raw)
                
            # Display results in an organized way
            result_col1, result_col2 = st.columns(2)
            
            with result_col1:
                st.metric(
                    "Predicted Class",
                    prediction['class_label'],
                    delta=None
                )
                
                # Display confidence as progress bar
                confidence = prediction['confidence_pct']
                st.metric(
                    "Confidence Score",
                    f"{confidence:.2f}%",
                    delta=None
                )
            
            with result_col2:
                st.metric(
                    "Autism Probability",
                    f"{prediction['autism_probability']:.2f}%",
                    delta=None
                )
                
                st.metric(
                    "Non-Autism Probability",
                    f"{prediction['non_autism_probability']:.2f}%",
                    delta=None
                )
            
            # Display prediction details
            st.markdown("---")
            st.subheader("📊 Detailed Prediction")
            
            # Create visualization
            pred_col1, pred_col2 = st.columns(2)
            
            with pred_col1:
                st.write("**Raw Prediction Scores:**")
                st.write(f"- raw_score: {prediction['raw_score']:.4f}")
                st.write(f"- diagnosis: {prediction['diagnosis']}")
            
            with pred_col2:
                st.write("**Prediction Interpretation:**")
                if prediction['class_label'] == 'Autistic':
                    st.warning(f"🚨 Model detected **autistic traits** with {confidence:.1f}% confidence")
                else:
                    st.info(f"✅ Model detected **non-autistic patterns** with {confidence:.1f}% confidence")
            
            # Display prediction breakdown
            st.markdown("---")
            st.subheader("📈 Prediction Breakdown")
            
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
            
            # Class probability pie chart
            labels = ['Autistic', 'Non-Autistic']
            sizes = [
                prediction['autism_probability'],
                prediction['non_autism_probability']
            ]
            colors = ['#ff6b6b', '#51cf66']
            
            ax1.pie(sizes, labels=labels, autopct='%1.1f%%', colors=colors, startangle=90)
            ax1.set_title('Class Probability Distribution', fontweight='bold')
            
            # Confidence bar
            categories = ['Confidence\nScore']
            values = [confidence]
            
            ax2.barh(categories, values, color='#4c6ef5')
            ax2.set_xlim(0, 100)
            ax2.set_xlabel('Percentage (%)')
            ax2.set_title('Model Confidence', fontweight='bold')
            
            for i, v in enumerate(values):
                ax2.text(v + 2, i, f'{v:.1f}%', va='center')
            
            st.pyplot(fig)
            
        except Exception as e:
            st.error(f"❌ Error during prediction: {str(e)}")
            import traceback
            st.error(traceback.format_exc())
    else:
        st.info("👆 Please upload an image to get started")


# Add batch testing section
st.markdown("---")
st.subheader("📁 Batch Testing from Folder")

batch_col1, batch_col2 = st.columns([1, 2])

with batch_col1:
    st.write("**Test multiple images from a folder**")
    test_folder = st.text_input(
        "Enter folder path",
        placeholder="e.g., ./data/test_images",
        help="Path to folder containing test images"
    )
    
    if st.button("Run Batch Test", key="batch_test"):
        if not os.path.exists(test_folder):
            st.error(f"❌ Folder not found: {test_folder}")
        else:
            # Get all image files
            image_extensions = ('.jpg', '.jpeg', '.png', '.bmp', '.gif')
            image_files = [f for f in os.listdir(test_folder) 
                          if f.lower().endswith(image_extensions)]
            
            if not image_files:
                st.warning("No image files found in the folder")
            else:
                st.info(f"Found {len(image_files)} images. Processing...")
                
                results = []
                progress_bar = st.progress(0)
                status_text = st.empty()
                
                for idx, img_file in enumerate(image_files):
                    status_text.text(f"Processing {idx + 1}/{len(image_files)}: {img_file}")
                    
                    try:
                        img_path = os.path.join(test_folder, img_file)
                        img = Image.open(img_path).convert("RGB")

                        prediction_raw = detector.predict_image(img)
                        prediction = normalize_prediction(prediction_raw)
                        results.append({
                            'filename': img_file,
                            'predicted_class': prediction['class_label'],
                            'confidence': prediction['confidence_pct'],
                            'autism_prob': prediction['autism_probability']
                        })
                    except Exception as e:
                        st.warning(f"⚠️ Failed to process {img_file}: {str(e)}")
                    
                    progress_bar.progress((idx + 1) / len(image_files))
                
                status_text.text(f"✅ Completed processing {len(results)} images")
                
                # Display results
                with batch_col2:
                    st.subheader("📊 Batch Test Results")
                    
                    if results:
                        # Summary statistics
                        autistic_count = sum(1 for r in results if r['predicted_class'] == 'Autistic')
                        non_autistic_count = len(results) - autistic_count
                        avg_confidence = np.mean([r['confidence'] for r in results])
                        
                        stat_col1, stat_col2, stat_col3 = st.columns(3)
                        
                        stat_col1.metric("Total Images", len(results))
                        stat_col2.metric("Autistic Detected", autistic_count)
                        stat_col3.metric("Avg Confidence", f"{avg_confidence:.1f}%")
                        
                        st.markdown("---")
                        st.write("**Individual Results:**")
                        
                        # Create a detailed results table
                        import pandas as pd
                        df = pd.DataFrame(results)
                        df['confidence'] = df['confidence'].apply(lambda x: f"{x:.2f}%")
                        df['autism_prob'] = df['autism_prob'].apply(lambda x: f"{x:.2f}%")
                        df = df.rename(columns={
                            'filename': 'Image File',
                            'predicted_class': 'Prediction',
                            'confidence': 'Confidence',
                            'autism_prob': 'Autism Prob'
                        })
                        
                        st.dataframe(df, use_container_width=True)


st.markdown("---")
st.subheader("📉 Accuracy Curves on Test Split")

default_test_dir = Path(__file__).parent / "data" / "image_model" / "test"
eval_col1, eval_col2 = st.columns([1, 2])

with eval_col1:
    test_dir_input = st.text_input(
        "Test split path",
        value=str(default_test_dir),
        help="Folder containing class subfolders for the image model test set",
    )
    run_eval = st.button("Run Accuracy Evaluation", key="run_accuracy_eval")

with eval_col2:
    if run_eval:
        try:
            with st.spinner("Evaluating image model on test split..."):
                metrics, rows, cm, roc_data, pr_data = evaluate_image_test_split(Path(test_dir_input))

            m1, m2, m3, m4, m5 = st.columns(5)
            m1.metric("Accuracy", f"{metrics['accuracy'] * 100:.2f}%")
            m2.metric("Precision", f"{metrics['precision'] * 100:.2f}%")
            m3.metric("Recall", f"{metrics['recall'] * 100:.2f}%")
            m4.metric("F1", f"{metrics['f1'] * 100:.2f}%")
            m5.metric("ROC-AUC", "N/A" if np.isnan(metrics['roc_auc']) else f"{metrics['roc_auc']:.3f}")

            st.caption(
                f"Samples: {metrics['count']} | Negative class folder: {metrics['negative_dir']} | "
                f"Positive class folder: {metrics['positive_dir']}"
            )

            fig, axes = plt.subplots(1, 3, figsize=(18, 4.8))

            # Confusion matrix
            ax_cm = axes[0]
            im = ax_cm.imshow(cm, cmap="Blues")
            ax_cm.set_title("Confusion Matrix")
            ax_cm.set_xticks([0, 1], labels=["Pred Non-Autistic", "Pred Autistic"], rotation=20)
            ax_cm.set_yticks([0, 1], labels=["True Non-Autistic", "True Autistic"])
            for i in range(cm.shape[0]):
                for j in range(cm.shape[1]):
                    ax_cm.text(j, i, cm[i, j], ha="center", va="center", color="black")
            fig.colorbar(im, ax=ax_cm, fraction=0.046, pad=0.04)

            # ROC curve
            fpr, tpr = roc_data
            ax_roc = axes[1]
            ax_roc.plot(fpr, tpr, label=(f"AUC={metrics['roc_auc']:.3f}" if not np.isnan(metrics['roc_auc']) else "AUC=N/A"))
            ax_roc.plot([0, 1], [0, 1], linestyle="--", color="gray")
            ax_roc.set_title("ROC Curve")
            ax_roc.set_xlabel("False Positive Rate")
            ax_roc.set_ylabel("True Positive Rate")
            ax_roc.legend(loc="lower right")

            # Precision-Recall curve
            pr_precision, pr_recall = pr_data
            ax_pr = axes[2]
            ax_pr.plot(pr_recall, pr_precision)
            ax_pr.set_title("Precision-Recall Curve")
            ax_pr.set_xlabel("Recall")
            ax_pr.set_ylabel("Precision")

            st.pyplot(fig)

            with st.expander("Per-image evaluation details"):
                import pandas as pd

                st.dataframe(pd.DataFrame(rows), use_container_width=True)

        except Exception as e:
            st.error(f"Evaluation failed: {e}")


# Add information section
with st.expander("ℹ️ Model Information"):
    st.markdown("""
    ### Image Model Details
    - **Architecture:** Image Classification with Keras
    - **Input Size:** 224x224 RGB images
    - **Classes:** Autistic, Non-Autistic
    - **Output:** Class label + confidence score
    
    ### How to Use
    1. Upload an image file (JPG, PNG, etc.)
    2. Model will analyze and predict
    3. View confidence and probability scores
    4. Optional: Test multiple images from a folder
    
    ### Model Performance Metrics
    - **Confidence Score:** How confident the model is in the prediction
    - **Autism Probability:** Likelihood of autistic characteristics
    - **Non-Autism Probability:** Likelihood of non-autistic patterns
    
    ### Recommended Image Inputs
    - Clear facial images
    - Well-lit conditions
    - Direct face/eye contact
    - Individual portraits
    """)
