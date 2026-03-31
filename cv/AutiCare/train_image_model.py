"""
Train/retrain the image model used by auti_care_helper.py.

Expected dataset structure (inside cv/AutiCare/data/image_model):
  train/
    typical/
    autistic/
  val/
    typical/
    autistic/
  test/
    typical/
    autistic/
"""

from __future__ import annotations

import argparse
from pathlib import Path

import tensorflow as tf


AUTOTUNE = tf.data.AUTOTUNE
IMG_SIZE = (224, 224)
BATCH_SIZE = 32


def build_model() -> tf.keras.Model:
    base = tf.keras.applications.MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights="imagenet",
    )
    base.trainable = False

    inputs = tf.keras.Input(shape=(224, 224, 3))
    # Normalize [0, 1] input to [-1, 1] using serializable Keras layer ops.
    # This avoids legacy op layers (e.g., TrueDivide) that can break H5 loading.
    x = tf.keras.layers.Rescaling(scale=2.0, offset=-1.0)(inputs)
    x = base(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    outputs = tf.keras.layers.Dense(1, activation="sigmoid")(x)

    model = tf.keras.Model(inputs, outputs)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="binary_crossentropy",
        metrics=["accuracy", tf.keras.metrics.AUC(name="auc")],
    )
    return model


def make_dataset(data_dir: Path, subset: str, shuffle: bool, class_names: list[str]) -> tf.data.Dataset:
    subset_dir = data_dir / subset
    if not subset_dir.exists():
        raise FileNotFoundError(f"Missing dataset folder: {subset_dir}")

    # Keep label mapping fixed so positive/autistic class is label 1.
    # class_names[0] -> label 0, class_names[1] -> label 1
    return tf.keras.utils.image_dataset_from_directory(
        subset_dir,
        labels="inferred",
        label_mode="binary",
        class_names=class_names,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        shuffle=shuffle,
    )


def prepare(ds: tf.data.Dataset, training: bool) -> tf.data.Dataset:
    if training:
        augmentation = tf.keras.Sequential([
            tf.keras.layers.RandomFlip("horizontal"),
            tf.keras.layers.RandomRotation(0.08),
            tf.keras.layers.RandomZoom(0.1),
            tf.keras.layers.RandomContrast(0.1),
        ])

        ds = ds.map(lambda x, y: (augmentation(x, training=True), y), num_parallel_calls=AUTOTUNE)

    ds = ds.map(lambda x, y: (tf.cast(x, tf.float32) / 255.0, y), num_parallel_calls=AUTOTUNE)
    return ds.prefetch(AUTOTUNE)


def main() -> None:
    parser = argparse.ArgumentParser(description="Train image model for AutiCare helper")
    parser.add_argument("--data-dir", default="data/image_model", help="Dataset root inside cv/AutiCare")
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--fine-tune-epochs", type=int, default=8)
    parser.add_argument(
        "--negative-class",
        default="typical",
        help="Folder name for class label 0 (e.g., typical or Non_Autistic)",
    )
    parser.add_argument(
        "--positive-class",
        default="autistic",
        help="Folder name for class label 1 (e.g., autistic or Autistic)",
    )
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parents[1]

    data_dir = (script_dir / args.data_dir).resolve()
    output_model_path = project_root / "models" / "best_autism_detector_model.h5"
    checkpoints_dir = script_dir / "outputs" / "checkpoints"
    logs_dir = script_dir / "outputs" / "logs"

    checkpoints_dir.mkdir(parents=True, exist_ok=True)
    logs_dir.mkdir(parents=True, exist_ok=True)
    output_model_path.parent.mkdir(parents=True, exist_ok=True)

    class_names = [args.negative_class, args.positive_class]
    train_ds = prepare(make_dataset(data_dir, "train", shuffle=True, class_names=class_names), training=True)
    val_ds = prepare(make_dataset(data_dir, "val", shuffle=False, class_names=class_names), training=False)
    test_ds = prepare(make_dataset(data_dir, "test", shuffle=False, class_names=class_names), training=False)

    model = build_model()

    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(
            filepath=str(output_model_path),
            save_best_only=True,
            monitor="val_auc",
            mode="max",
        ),
        tf.keras.callbacks.EarlyStopping(
            monitor="val_auc",
            mode="max",
            patience=5,
            restore_best_weights=True,
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_auc",
            mode="max",
            factor=0.5,
            patience=2,
        ),
        tf.keras.callbacks.TensorBoard(log_dir=str(logs_dir)),
    ]

    print(f"Training on: {data_dir}")
    history = model.fit(train_ds, validation_data=val_ds, epochs=args.epochs, callbacks=callbacks)

    # Fine-tune last layers
    base_model = next(layer for layer in model.layers if isinstance(layer, tf.keras.Model))
    base_model.trainable = True
    for layer in base_model.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
        loss="binary_crossentropy",
        metrics=["accuracy", tf.keras.metrics.AUC(name="auc")],
    )

    model.fit(train_ds, validation_data=val_ds, epochs=args.fine_tune_epochs, callbacks=callbacks)

    loss, acc, auc = model.evaluate(test_ds, verbose=0)
    print(f"Test accuracy: {acc:.4f}, test auc: {auc:.4f}, test loss: {loss:.4f}")
    print(f"Best model saved to: {output_model_path}")


if __name__ == "__main__":
    main()
