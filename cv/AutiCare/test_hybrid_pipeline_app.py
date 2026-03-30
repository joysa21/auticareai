"""
Streamlit app to test and validate the hybrid video screening pipeline
"""
import streamlit as st
import numpy as np
from pathlib import Path
import os
import sys
import tempfile
import json
from datetime import datetime
import matplotlib.pyplot as plt
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, roc_curve

# Add root directory to path to access modules
# Path: cv/AutiCare/test_hybrid_pipeline_app.py -> need to go up 3 levels to root
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
sys.path.insert(0, str(Path(__file__).parent))

from hybrid_frame_pipeline import HybridFramePipeline
from autism_screening_model import AutismScreeningModel


def normalize_screening_result(screening_model: AutismScreeningModel, screening_output):
    """Return report dict regardless of whether output is BehavioralMetrics or already a dict."""
    if isinstance(screening_output, dict):
        return screening_output

    if hasattr(screening_output, "to_dict") and hasattr(screening_output, "calculate_risk_score"):
        return screening_model.build_report(screening_output)

    raise ValueError("Unsupported screening output type")


def normalize_hybrid_result(hybrid_output: dict):
    """Return stable keys from hybrid pipeline output."""
    if not isinstance(hybrid_output, dict):
        raise ValueError("Unsupported hybrid output type")

    overall = hybrid_output.get("overall", {}) if isinstance(hybrid_output.get("overall"), dict) else {}
    frame_results = hybrid_output.get("frame_results", [])

    model_confidence_percent = hybrid_output.get(
        "model_confidence_percent", overall.get("model_confidence_percent", 0)
    )
    autism_probability_percent = hybrid_output.get(
        "autism_probability_percent", overall.get("autism_probability_percent", 0)
    )
    frames_analyzed = hybrid_output.get("frames_analyzed", overall.get("frames_used", len(frame_results)))

    return {
        "model_confidence_percent": model_confidence_percent,
        "autism_probability_percent": autism_probability_percent,
        "frames_analyzed": frames_analyzed,
        "diagnosis": overall.get("diagnosis", "N/A"),
        "raw": hybrid_output,
    }


def _ground_truth_from_manifest_item(item: dict):
    """Extract binary ground truth label (1 autistic, 0 non-autistic) from manifest row."""
    if "is_autistic" in item:
        return int(bool(item["is_autistic"]))

    for key in ["label", "diagnosis", "class", "ground_truth"]:
        if key in item and isinstance(item[key], str):
            value = item[key].strip().lower()
            if any(token in value for token in ["autistic", "autism", "asd", "positive"]):
                return 1
            if any(token in value for token in ["non", "typical", "negative", "normal"]):
                return 0

    # risk_class expected as one-hot [low, medium, high]
    if isinstance(item.get("risk_class"), list) and len(item["risk_class"]) == 3:
        idx = int(np.argmax(item["risk_class"]))
        return 0 if idx == 0 else 1

    raise ValueError(f"Unable to infer ground-truth label from row: {item}")


def _resolve_video_path(base_dir: Path, raw_path: str) -> Path:
    p = Path(raw_path)
    return p if p.is_absolute() else (base_dir / p).resolve()


def evaluate_hybrid_models_from_manifest(screening_model, hybrid_pipeline, manifest_items, base_dir: Path):
    rows = []
    y_true = []
    y_score_screening = []
    y_score_hybrid = []

    # Deterministic risk-level to positive score mapping for ROC
    risk_to_score = {
        "low": 0.2,
        "medium": 0.6,
        "high": 0.85,
    }

    for item in manifest_items:
        video_rel = item.get("video_path") or item.get("path")
        if not video_rel:
            continue

        gt = _ground_truth_from_manifest_item(item)
        video_path = _resolve_video_path(base_dir, video_rel)

        if not video_path.exists():
            rows.append({
                "video": str(video_rel),
                "error": "file_not_found",
                "ground_truth": gt,
            })
            continue

        screening_raw = screening_model.process_video(str(video_path))
        hybrid_raw = hybrid_pipeline.analyze_video(str(video_path))

        screening_report = normalize_screening_result(screening_model, screening_raw)
        hybrid_norm = normalize_hybrid_result(hybrid_raw)

        risk_level = str(screening_report.get("risk_assessment", {}).get("level", "low")).lower()
        screening_score = risk_to_score["medium"]
        for key, val in risk_to_score.items():
            if key in risk_level:
                screening_score = val
                break

        hybrid_score = float(hybrid_norm.get("autism_probability_percent", 0)) / 100.0

        y_true.append(gt)
        y_score_screening.append(screening_score)
        y_score_hybrid.append(hybrid_score)

        rows.append(
            {
                "video": str(video_rel),
                "ground_truth": "Autistic" if gt == 1 else "Non-Autistic",
                "screening_risk": screening_report.get("risk_assessment", {}).get("level", "N/A"),
                "screening_score": round(screening_score, 4),
                "hybrid_score": round(hybrid_score, 4),
            }
        )

    if not y_true:
        raise ValueError("No valid labeled videos were evaluated")

    y_pred_screening = [1 if s >= 0.5 else 0 for s in y_score_screening]
    y_pred_hybrid = [1 if s >= 0.5 else 0 for s in y_score_hybrid]

    metrics = {
        "screening": {
            "accuracy": accuracy_score(y_true, y_pred_screening),
            "precision": precision_score(y_true, y_pred_screening, zero_division=0),
            "recall": recall_score(y_true, y_pred_screening, zero_division=0),
            "f1": f1_score(y_true, y_pred_screening, zero_division=0),
        },
        "hybrid": {
            "accuracy": accuracy_score(y_true, y_pred_hybrid),
            "precision": precision_score(y_true, y_pred_hybrid, zero_division=0),
            "recall": recall_score(y_true, y_pred_hybrid, zero_division=0),
            "f1": f1_score(y_true, y_pred_hybrid, zero_division=0),
        },
    }

    if len(set(y_true)) == 2:
        metrics["screening"]["auc"] = roc_auc_score(y_true, y_score_screening)
        metrics["hybrid"]["auc"] = roc_auc_score(y_true, y_score_hybrid)
        fpr_s, tpr_s, _ = roc_curve(y_true, y_score_screening)
        fpr_h, tpr_h, _ = roc_curve(y_true, y_score_hybrid)
    else:
        metrics["screening"]["auc"] = np.nan
        metrics["hybrid"]["auc"] = np.nan
        fpr_s, tpr_s = np.array([0, 1]), np.array([0, 1])
        fpr_h, tpr_h = np.array([0, 1]), np.array([0, 1])

    curves = {
        "screening": (fpr_s, tpr_s),
        "hybrid": (fpr_h, tpr_h),
    }

    return metrics, curves, rows

st.set_page_config(
    page_title="Hybrid Pipeline Tester",
    page_icon="🎥",
    layout="wide"
)

st.title("🎥 Hybrid Video Screening Pipeline Tester")
st.markdown("Test the complete hybrid screening pipeline with video input")

# Initialize components
@st.cache_resource
def load_pipeline():
    try:
        screening_model = AutismScreeningModel()
        hybrid_pipeline = HybridFramePipeline()
        return screening_model, hybrid_pipeline
    except Exception as e:
        st.error(f"Failed to load pipeline: {str(e)}")
        return None, None

screening_model, hybrid_pipeline = load_pipeline()

if screening_model is None or hybrid_pipeline is None:
    st.error("❌ Could not load the screening pipeline. Please ensure all required files exist.")
    st.stop()

st.success("✅ Hybrid pipeline loaded successfully!")

# Create tabs for different testing modes
tab1, tab2, tab3 = st.tabs(["📹 Single Video Test", "📊 Batch Video Test", "📈 Results Analysis"])

# ============== TAB 1: Single Video Test ==============
with tab1:
    col1, col2 = st.columns([1, 2])
    
    with col1:
        st.subheader("📤 Upload Video")
        uploaded_video = st.file_uploader(
            "Choose a video file",
            type=["mp4", "avi", "mov", "mkv", "flv"],
            help="Upload a video to test the hybrid screening pipeline"
        )
        
        if uploaded_video is not None:
            st.write(f"**File Name:** {uploaded_video.name}")
            st.write(f"**File Size:** {uploaded_video.size / (1024*1024):.2f} MB")
    
    with col2:
        if uploaded_video is not None:
            st.subheader("🤖 Pipeline Analysis")
            
            try:
                # Save uploaded file temporarily
                with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_file:
                    tmp_file.write(uploaded_video.read())
                    tmp_path = tmp_file.name
                
                # Run screening
                with st.spinner("🔄 Running screening pipeline..."):
                    screening_raw = screening_model.process_video(tmp_path)
                    hybrid_raw = hybrid_pipeline.analyze_video(tmp_path)
                    screening_result = normalize_screening_result(screening_model, screening_raw)
                    hybrid_result = normalize_hybrid_result(hybrid_raw)
                
                # Display results
                st.success("✅ Analysis Complete!")
                
                # Create metrics row
                metric_col1, metric_col2, metric_col3 = st.columns(3)
                
                with metric_col1:
                    risk_level = screening_result.get('risk_assessment', {}).get('level', 'Unknown')
                    st.metric("Risk Level", risk_level)
                
                with metric_col2:
                    confidence = screening_result.get('risk_assessment', {}).get('confidence', 0)
                    st.metric("Report Confidence", f"{confidence * 100:.1f}%")
                
                with metric_col3:
                    hybrid_confidence = hybrid_result.get('model_confidence_percent', 0)
                    st.metric("Hybrid Confidence", f"{hybrid_confidence}%")
                
                st.markdown("---")
                
                # Display screening results
                st.subheader("📋 Screening Assessment")
                
                screening_col1, screening_col2 = st.columns([1, 1])
                
                with screening_col1:
                    st.write("**Risk Assessment Details:**")
                    risk_info = screening_result.get('risk_assessment', {})
                    if risk_info:
                        st.write(f"- **Level:** {risk_info.get('level', 'N/A')}")
                        st.write(f"- **Confidence:** {risk_info.get('confidence', 0) * 100:.1f}%")
                        st.write(f"- **Description:** {risk_info.get('description', 'N/A')}")
                
                with screening_col2:
                    st.write("**Hybrid Pipeline Results:**")
                    st.write(f"- **Model Confidence:** {hybrid_result.get('model_confidence_percent', 0)}%")
                    st.write(f"- **Autism Probability:** {hybrid_result.get('autism_probability_percent', 0)}%")
                    st.write(f"- **Frame Count Analyzed:** {hybrid_result.get('frames_analyzed', 0)}")
                    st.write(f"- **Diagnosis:** {hybrid_result.get('diagnosis', 'N/A')}")
                
                st.markdown("---")
                
                # Display objective signals
                st.subheader("📊 Objective Signals")
                
                signals = screening_result.get('metrics', {}).get('objective_signals', {})
                if signals:
                    signal_col1, signal_col2 = st.columns(2)
                    
                    for idx, (signal_name, signal_data) in enumerate(signals.items()):
                        if idx % 2 == 0:
                            col = signal_col1
                        else:
                            col = signal_col2
                        
                        with col:
                            st.write(f"**{signal_name.replace('_', ' ').title()}**")
                            st.write(f"- Value: {signal_data.get('value', 'N/A')}")
                            st.write(f"- Baseline: {signal_data.get('baseline', 'N/A')}")
                            st.write(f"- Status: {signal_data.get('status', 'N/A')}")
                else:
                    st.info("No objective signals available")
                
                st.markdown("---")
                
                # Display behavioral indicators
                st.subheader("✅ Behavioral Indicators")
                
                indicators = screening_result.get('metrics', {}).get('behavioral_indicators', {})
                if indicators:
                    indicator_list = [name.replace('_', ' ').title() for name, value in indicators.items() if value]
                    if indicator_list:
                        for indicator in indicator_list:
                            st.write(f"✓ {indicator}")
                    else:
                        st.info("No behavioral indicators detected")
                else:
                    st.info("No behavioral indicators available")
                
                st.markdown("---")
                
                # Display raw results for debugging
                with st.expander("🔧 Raw Results (JSON)"):
                    result_col1, result_col2 = st.columns(2)
                    
                    with result_col1:
                        st.write("**Screening Model Results:**")
                        st.json(screening_result)
                    
                    with result_col2:
                        st.write("**Hybrid Pipeline Results:**")
                        st.json(hybrid_result.get("raw", hybrid_result))
                
                # Cleanup
                os.unlink(tmp_path)
                
                # Download results option
                st.markdown("---")
                st.subheader("💾 Download Results")
                
                combined_result = {
                    'timestamp': datetime.now().isoformat(),
                    'video_filename': uploaded_video.name,
                    'screening_report': screening_result,
                    'hybrid_confidence': hybrid_result.get("raw", hybrid_result)
                }
                
                col_download1, col_download2 = st.columns(2)
                
                with col_download1:
                    st.download_button(
                        label="📥 Download JSON Results",
                        data=json.dumps(combined_result, indent=2),
                        file_name=f"screening_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                        mime="application/json"
                    )
                
                with col_download2:
                    st.download_button(
                        label="📊 Download CSV Summary",
                        data=f"""Video File,Risk Level,Report Confidence,Hybrid Confidence,Autism Probability
{uploaded_video.name},{risk_level},{confidence * 100:.1f}%,{hybrid_confidence}%,{hybrid_result.get('autism_probability_percent', 0)}%""",
                        file_name=f"screening_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                        mime="text/csv"
                    )
                
            except Exception as e:
                st.error(f"❌ Error during analysis: {str(e)}")
                import traceback
                st.error(traceback.format_exc())
            finally:
                if 'tmp_path' in locals() and os.path.exists(tmp_path):
                    os.unlink(tmp_path)
        else:
            st.info("👆 Please upload a video to get started")


# ============== TAB 2: Batch Video Test ==============
with tab2:
    st.subheader("📁 Batch Video Testing")
    
    batch_col1, batch_col2 = st.columns([1, 2])
    
    with batch_col1:
        st.write("**Test multiple videos from a folder**")
        batch_folder = st.text_input(
            "Enter folder path",
            placeholder="e.g., ./test_videos",
            help="Path to folder containing test videos"
        )
        
        if st.button("Run Batch Test", key="batch_test"):
            if not os.path.exists(batch_folder):
                st.error(f"❌ Folder not found: {batch_folder}")
            else:
                # Get all video files
                video_extensions = ('.mp4', '.avi', '.mov', '.mkv', '.flv')
                video_files = [f for f in os.listdir(batch_folder) 
                              if f.lower().endswith(video_extensions)]
                
                if not video_files:
                    st.warning("No video files found in the folder")
                else:
                    st.info(f"Found {len(video_files)} videos. Processing...")
                    
                    results = []
                    progress_bar = st.progress(0)
                    status_text = st.empty()
                    
                    for idx, vid_file in enumerate(video_files):
                        status_text.text(f"Processing {idx + 1}/{len(video_files)}: {vid_file}")
                        
                        try:
                            vid_path = os.path.join(batch_folder, vid_file)
                            
                            screening_raw = screening_model.process_video(vid_path)
                            hybrid_raw = hybrid_pipeline.analyze_video(vid_path)
                            screening_result = normalize_screening_result(screening_model, screening_raw)
                            hybrid_result = normalize_hybrid_result(hybrid_raw)
                            
                            results.append({
                                'filename': vid_file,
                                'risk_level': screening_result.get('risk_assessment', {}).get('level', 'Unknown'),
                                'screening_confidence': screening_result.get('risk_assessment', {}).get('confidence', 0),
                                'hybrid_confidence': hybrid_result.get('model_confidence_percent', 0),
                                'autism_probability': hybrid_result.get('autism_probability_percent', 0)
                            })
                        except Exception as e:
                            st.warning(f"⚠️ Failed to process {vid_file}: {str(e)}")
                        
                        progress_bar.progress((idx + 1) / len(video_files))
                    
                    status_text.text(f"✅ Completed processing {len(results)} videos")
                    
                    # Display results
                    with batch_col2:
                        st.subheader("📊 Batch Test Results")
                        
                        if results:
                            # Summary statistics
                            avg_hybrid_conf = np.mean([r['hybrid_confidence'] for r in results])
                            avg_autism_prob = np.mean([r['autism_probability'] for r in results])
                            
                            stat_col1, stat_col2, stat_col3 = st.columns(3)
                            
                            stat_col1.metric("Total Videos", len(results))
                            stat_col2.metric("Avg Hybrid Confidence", f"{avg_hybrid_conf:.1f}%")
                            stat_col3.metric("Avg Autism Probability", f"{avg_autism_prob:.1f}%")
                            
                            st.markdown("---")
                            st.write("**Detailed Results:**")
                            
                            # Create results table
                            import pandas as pd
                            df = pd.DataFrame(results)
                            df['screening_confidence'] = df['screening_confidence'].apply(lambda x: f"{x * 100:.1f}%")
                            df['hybrid_confidence'] = df['hybrid_confidence'].apply(lambda x: f"{x:.1f}%")
                            df['autism_probability'] = df['autism_probability'].apply(lambda x: f"{x:.1f}%")
                            df = df.rename(columns={
                                'filename': 'Video File',
                                'risk_level': 'Risk Level',
                                'screening_confidence': 'Report Conf',
                                'hybrid_confidence': 'Hybrid Conf',
                                'autism_probability': 'Autism Prob'
                            })
                            
                            st.dataframe(df, use_container_width=True)


# ============== TAB 3: Results Analysis ==============
with tab3:
    st.subheader("📈 Results Analysis & Visualization")

    st.info(
        "Upload a labeled manifest (JSON) to compute accuracy curves for both models on your video test set."
    )

    default_manifest = Path(__file__).parent / "data" / "video_model" / "labels" / "val_manifest.template.json"

    cfg1, cfg2 = st.columns([1, 2])
    with cfg1:
        manifest_file = st.file_uploader(
            "Manifest JSON",
            type=["json"],
            help="Each row should include video_path and a label field (diagnosis/label/is_autistic/risk_class)",
        )
        manifest_path_input = st.text_input("Or manifest path", value=str(default_manifest))
        base_dir_input = st.text_input(
            "Base directory for relative video paths",
            value=str(Path(__file__).parent),
        )
        run_eval = st.button("Run Hybrid Evaluation", key="run_hybrid_eval")

    with cfg2:
        if run_eval:
            try:
                if manifest_file is not None:
                    manifest_items = json.load(manifest_file)
                else:
                    with open(manifest_path_input, "r") as f:
                        manifest_items = json.load(f)

                if not isinstance(manifest_items, list):
                    raise ValueError("Manifest must be a JSON array of items")

                with st.spinner("Evaluating screening and hybrid models on labeled videos..."):
                    metrics, curves, rows = evaluate_hybrid_models_from_manifest(
                        screening_model=screening_model,
                        hybrid_pipeline=hybrid_pipeline,
                        manifest_items=manifest_items,
                        base_dir=Path(base_dir_input),
                    )

                c1, c2 = st.columns(2)
                with c1:
                    st.markdown("**Screening Model**")
                    st.metric("Accuracy", f"{metrics['screening']['accuracy'] * 100:.2f}%")
                    st.metric("F1", f"{metrics['screening']['f1'] * 100:.2f}%")
                    st.metric("ROC-AUC", "N/A" if np.isnan(metrics['screening']['auc']) else f"{metrics['screening']['auc']:.3f}")

                with c2:
                    st.markdown("**Hybrid 3-Frame Model**")
                    st.metric("Accuracy", f"{metrics['hybrid']['accuracy'] * 100:.2f}%")
                    st.metric("F1", f"{metrics['hybrid']['f1'] * 100:.2f}%")
                    st.metric("ROC-AUC", "N/A" if np.isnan(metrics['hybrid']['auc']) else f"{metrics['hybrid']['auc']:.3f}")

                fig, axes = plt.subplots(1, 2, figsize=(14, 4.8))

                # ROC comparison
                fpr_s, tpr_s = curves["screening"]
                fpr_h, tpr_h = curves["hybrid"]
                axes[0].plot(fpr_s, tpr_s, label=f"Screening (AUC={metrics['screening']['auc']:.3f}" if not np.isnan(metrics['screening']['auc']) else "Screening (AUC=N/A)")
                axes[0].plot(fpr_h, tpr_h, label=f"Hybrid (AUC={metrics['hybrid']['auc']:.3f}" if not np.isnan(metrics['hybrid']['auc']) else "Hybrid (AUC=N/A)")
                axes[0].plot([0, 1], [0, 1], "--", color="gray")
                axes[0].set_title("ROC Curves")
                axes[0].set_xlabel("False Positive Rate")
                axes[0].set_ylabel("True Positive Rate")
                axes[0].legend(loc="lower right")

                # Metric bar chart
                labels = ["Accuracy", "Precision", "Recall", "F1"]
                screening_vals = [
                    metrics["screening"]["accuracy"],
                    metrics["screening"]["precision"],
                    metrics["screening"]["recall"],
                    metrics["screening"]["f1"],
                ]
                hybrid_vals = [
                    metrics["hybrid"]["accuracy"],
                    metrics["hybrid"]["precision"],
                    metrics["hybrid"]["recall"],
                    metrics["hybrid"]["f1"],
                ]
                x = np.arange(len(labels))
                w = 0.36
                axes[1].bar(x - w / 2, screening_vals, w, label="Screening")
                axes[1].bar(x + w / 2, hybrid_vals, w, label="Hybrid")
                axes[1].set_xticks(x, labels)
                axes[1].set_ylim(0, 1)
                axes[1].set_title("Metric Comparison")
                axes[1].legend()

                st.pyplot(fig)

                import pandas as pd

                with st.expander("Per-video evaluation details"):
                    st.dataframe(pd.DataFrame(rows), use_container_width=True)

            except Exception as e:
                st.error(f"Evaluation failed: {e}")


# Add information section
with st.expander("ℹ️ Hybrid Pipeline Information"):
    st.markdown("""
    ### Hybrid Pipeline Architecture
    - **Screening Model:** Analyzes full video for behavioral patterns
    - **Image Confidence Pipeline:** Extracts 3 key frames and aggregates predictions
    - **Hybrid Score:** Combines both screening assessment and image confidence
    
    ### How It Works
    1. **Frame Extraction:** Extracts frames at 15%, 50%, and 85% of video duration
    2. **Image Classification:** Runs each frame through the image model
    3. **Aggregation:** Uses median confidence across the 3 frames
    4. **Screening:** Full video behavioral analysis
    5. **Results:** Combined assessment with confidence metrics
    
    ### Output Interpretation
    - **Model Confidence %:** Overall confidence in the prediction (0-100%)
    - **Autism Probability %:** Estimated likelihood of autism spectrum traits
    - **Risk Level:** Clinical risk assessment (Low/Medium/High)
    - **Behavioral Indicators:** Specific traits detected in the video
    - **Objective Signals:** Quantified behavioral measurements
    
    ### Recommended Video Inputs
    - Duration: 1-5 minutes
    - Clear facial visibility
    - Good lighting
    - Single subject focus
    - Natural behavior recordings
    """)

st.markdown("---")
st.caption("Hybrid Video Screening Pipeline Tester v1.0")
