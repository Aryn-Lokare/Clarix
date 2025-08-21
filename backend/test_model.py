#!/usr/bin/env python3
"""
Test script to debug model loading and inference
"""
import os
import sys
import numpy as np
from PIL import Image

# Add current directory to path
sys.path.append(os.path.dirname(__file__))

# Test model loading
print("Testing model loading...")

# Check if model file exists
model_path = os.path.join(os.path.dirname(__file__), "models", "best_densenet121.pth")
print(f"Model path: {model_path}")
print(f"Model exists: {os.path.exists(model_path)}")

if os.path.exists(model_path):
    print(f"Model size: {os.path.getsize(model_path)} bytes")
    
    # Try to load the model
    try:
        import torch
        print(f"PyTorch version: {torch.__version__}")
        
        # Load the model
        print("Loading model...")
        model = torch.jit.load(model_path, map_location="cpu")
        model.eval()
        print("Model loaded successfully!")
        
        # Test with dummy input
        print("Testing inference...")
        dummy_input = torch.randn(1, 3, 224, 224)
        print(f"Dummy input shape: {dummy_input.shape}")
        
        with torch.no_grad():
            output = model(dummy_input)
            print(f"Output shape: {output.shape}")
            print(f"Output type: {type(output)}")
            print(f"Output: {output}")
            
        print("✅ Model test successful!")
        
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        import traceback
        traceback.print_exc()
else:
    print("❌ Model file not found!")

# Test image preprocessing
print("\nTesting image preprocessing...")
try:
    # Create a dummy image
    dummy_img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    print(f"Dummy image shape: {dummy_img.shape}")
    
    # Test OpenCV resize
    import cv2
    resized = cv2.resize(dummy_img, (224, 224))
    print(f"Resized shape: {resized.shape}")
    
    # Test normalization
    normalized = resized.astype(np.float32) / 255.0
    print(f"Normalized range: {normalized.min():.3f} to {normalized.max():.3f}")
    
    print("✅ Preprocessing test successful!")
    
except Exception as e:
    print(f"❌ Error in preprocessing: {e}")
    import traceback
    traceback.print_exc()
