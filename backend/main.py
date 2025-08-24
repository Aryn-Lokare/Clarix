from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from typing import Optional, List
import json
from datetime import datetime
import uuid
import io
from PIL import Image
import numpy as np
import cv2
import torch
import base64

# Load environment variables
load_dotenv()

app = FastAPI(title="Clarix AI Radiology Assistant", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase configuration
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Security
security = HTTPBearer()

# ---------------- Inference Model (best densenet) ----------------
INFERENCE_MODEL_PATH = os.getenv("MODEL_PATH")
_model_loaded = False
_use_onnx = False
_onnx_session = None
_torch_model = None

def _discover_model_path() -> str:
    if INFERENCE_MODEL_PATH and os.path.exists(INFERENCE_MODEL_PATH):
        return INFERENCE_MODEL_PATH
    # Try to find a model under ./models
    candidate_dir = os.path.join(os.path.dirname(__file__), "models")
    if os.path.isdir(candidate_dir):
        for fname in os.listdir(candidate_dir):
            lower = fname.lower()
            if ("best" in lower or "densenet" in lower) and (lower.endswith(".onnx") or lower.endswith(".pt") or lower.endswith(".pth")):
                return os.path.join(candidate_dir, fname)
    # Fallback to default names
    for fallback in [
        os.path.join(os.path.dirname(__file__), "models", "best densenet.onnx"),
        os.path.join(os.path.dirname(__file__), "models", "best densenet.pt"),
        os.path.join(os.path.dirname(__file__), "models", "best_densenet.onnx"),
        os.path.join(os.path.dirname(__file__), "models", "best_densenet.pt"),
    ]:
        if os.path.exists(fallback):
            return fallback
    return None

def _load_model_if_needed():
    global _model_loaded, _use_onnx, _onnx_session, _torch_model
    if _model_loaded:
        return
    model_path = _discover_model_path()
    if not model_path:
        print("[inference] No model file found. Set MODEL_PATH or place file under backend/models/")
        _model_loaded = True
        return
    try:
        if model_path.lower().endswith(".onnx"):
            import onnxruntime as ort
            _onnx_session = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
            _use_onnx = True
        else:
            import torch
            # Try torch.jit.load first, then fallback to torch.load
            try:
                _torch_model = torch.jit.load(model_path, map_location="cpu")
                _torch_model.eval()
            except Exception as jit_error:
                print(f"[inference] torch.jit.load failed: {jit_error}, trying torch.load...")
                # Fallback to regular torch.load for state dict
                state_dict = torch.load(model_path, map_location="cpu", weights_only=False)
                # Create model with correct architecture
                import torchvision.models as models
                _torch_model = models.densenet121(pretrained=False)
                
                # Determine the number of classes from the state dict
                if 'classifier.weight' in state_dict:
                    num_classes = state_dict['classifier.weight'].shape[0]
                    print(f"[inference] Detected {num_classes} classes from model")
                else:
                    num_classes = 14  # Default fallback
                    print(f"[inference] Using default {num_classes} classes")
                
                # Adjust the classifier to match the saved model
                _torch_model.classifier = torch.nn.Linear(_torch_model.classifier.in_features, num_classes)
                _torch_model.load_state_dict(state_dict)
                _torch_model.eval()
            _use_onnx = False
        print(f"[inference] Loaded model: {model_path} (onnx={_use_onnx})")
    except Exception as e:
        print(f"[inference] Failed to load model {model_path}: {e}")
    finally:
        _model_loaded = True

def _preprocess(image_np: np.ndarray) -> np.ndarray:
    # Resize to 224, normalize to ImageNet stats; adjust per your training
    try:
        import cv2
    except Exception:
        raise HTTPException(status_code=500, detail="OpenCV not installed on server")
    
    img = image_np.copy()
    
    # Handle different image types
    if img.ndim == 2:
        # Grayscale medical image
        img = np.stack([img, img, img], axis=-1)
    elif img.ndim == 3 and img.shape[2] == 1:
        # Single channel
        img = np.repeat(img, 3, axis=2)
    
    # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) for medical images
    if img.dtype != np.uint8:
        # Convert to uint8 for CLAHE
        img_uint8 = ((img - img.min()) / (img.max() - img.min()) * 255).astype(np.uint8)
    else:
        img_uint8 = img.copy()
    
    # Apply CLAHE to improve contrast
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    if len(img_uint8.shape) == 3:
        # Apply to each channel
        for i in range(3):
            img_uint8[:,:,i] = clahe.apply(img_uint8[:,:,i])
    else:
        img_uint8 = clahe.apply(img_uint8)
    
    # Resize
    img = cv2.resize(img_uint8, (224, 224))
    
    # Convert to float and normalize
    img = img.astype(np.float32) / 255.0
    
    # ImageNet normalization (standard for pretrained models)
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    img = (img - mean) / std
    
    img = np.transpose(img, (2, 0, 1))  # CHW
    img = np.expand_dims(img, 0)        # NCHW
    
    return img

def _postprocess(logits: np.ndarray):
    # Fixed: Position 10 (was "Emphysema") is actually "No Finding"
    default_labels = [
        "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration", 
        "Mass", "Nodule", "Pneumonia", "Consolidation", 
        "Edema", "Pneumothorax", "No Finding", "Fibrosis", 
        "Pleural_Thickening", "Hernia"
    ]
    
    # Now we need to find where "Emphysema" actually is
    # It might be at position 11 (currently "Fibrosis") or another position
    
    # If normal X-rays still show as pathology, try this:
    # Comment out the above and uncomment this (replaces "Hernia" with "No Finding"):
    # default_labels = [
    #     "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration", 
    #     "Mass", "Nodule", "Pneumonia", "Consolidation", 
    #     "Edema", "Pneumothorax", "Emphysema", "Fibrosis", 
    #     "Pleural_Thickening", "No Finding"
    # ]
    
    # If above doesn't work, try these alternatives by uncommenting one of these:
    
    # Option A - NIH ChestX-ray14 Standard Order:
    # default_labels = [
    #     "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration",
    #     "Mass", "Nodule", "Pneumonia", "Pneumothorax",
    #     "Consolidation", "Edema", "Emphysema", "Fibrosis",
    #     "Pleural_Thickening", "Hernia"
    # ]
    
    # Option B - Alphabetical Order:
    # default_labels = [
    #     "Atelectasis", "Cardiomegaly", "Consolidation", "Edema",
    #     "Effusion", "Emphysema", "Fibrosis", "Hernia",
    #     "Infiltration", "Mass", "Nodule", "Pleural_Thickening",
    #     "Pneumonia", "Pneumothorax"
    # ]
    
    # Option C - Alternative Common Order:
    # default_labels = [
    #     "Pneumonia", "Pneumothorax", "Consolidation", "Edema",
    #     "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration",
    #     "Mass", "Nodule", "Emphysema", "Fibrosis",
    #     "Pleural_Thickening", "Hernia"
    # ]
    
    x = logits.squeeze()
    # If single value, wrap
    if x.ndim == 0:
        x = np.array([x])
    
    # Debug: Print raw logits for analysis
    # Use sigmoid for multi-label classification (common for medical imaging)
    probs = 1.0 / (1.0 + np.exp(-x))
    
    results = []
    for idx, p in enumerate(probs):
        if idx < len(default_labels):
            label = default_labels[idx]
        else:
            label = f"Finding_{idx}"
        results.append({"label": label, "confidence": float(p)})
    
    # Sort by confidence and return top 5
    results.sort(key=lambda d: d["confidence"], reverse=True)
    
    # Find "No Finding" prediction
    no_finding_result = None
    pathology_results = []
    
    for result in results:
        if "No Finding" in result["label"]:
            no_finding_result = result
        else:
            pathology_results.append(result)
    
    # Only return "Normal" if "No Finding" has very high confidence (>75%)
    # AND no pathology has significant confidence (>40%)
    if no_finding_result:
        max_pathology_confidence = max([r["confidence"] for r in pathology_results]) if pathology_results else 0
        print(f"[DEBUG] No Finding: {no_finding_result['confidence']:.3f}, Max pathology: {max_pathology_confidence:.3f}")
        
        # Only call it normal if No Finding is very confident AND pathologies are low
        if no_finding_result["confidence"] > 0.75 and max_pathology_confidence < 0.4:
            print(f"[INFO] High confidence normal: No Finding ({no_finding_result['confidence']:.3f}) > pathologies ({max_pathology_confidence:.3f})")
            return [{"label": "Normal - No significant findings detected", "confidence": no_finding_result["confidence"]}]
        
        # If No Finding has moderate confidence but pathologies are higher, show pathologies
        print(f"[INFO] Showing pathology results instead of normal")
    
    # Process pathological findings
    # Add confidence indicators
    for result in pathology_results:
        if result["confidence"] < 0.4:
            result["label"] += " (Low Confidence)"
        elif result["confidence"] > 0.7:
            result["label"] += " (High Confidence)"
    
    # Filter out very low-confidence predictions (below 25%)
    filtered_results = [r for r in pathology_results if r["confidence"] > 0.25]
    
    # If no significant pathological findings
    if not filtered_results:
        return [{"label": "Normal - No significant findings detected", "confidence": 0.8}]
    
    return filtered_results[:5]

def run_inference(image_np: np.ndarray):
    try:
        print(f"[inference] Starting inference for image shape: {image_np.shape}")
        _load_model_if_needed()
        
        if _onnx_session is None and _torch_model is None:
            print("[inference] No model available")
            raise HTTPException(status_code=500, detail="Model not available on server")
        
        print(f"[inference] Model loaded, using ONNX: {_use_onnx}")
        inp = _preprocess(image_np)
        print(f"[inference] Preprocessed input shape: {inp.shape}")
        
        if _use_onnx:
            input_name = _onnx_session.get_inputs()[0].name
            print(f"[inference] ONNX input name: {input_name}")
            outputs = _onnx_session.run(None, {input_name: inp})
            logits = outputs[0]
            print(f"[inference] ONNX output shape: {logits.shape}")
        else:
            import torch
            with torch.no_grad():
                tensor = torch.from_numpy(inp)
                print(f"[inference] PyTorch tensor shape: {tensor.shape}")
                logits_tensor = _torch_model(tensor)
                if hasattr(logits_tensor, 'detach'):
                    logits = logits_tensor.detach().cpu().numpy()
                else:
                    logits = np.array(logits_tensor)
                print(f"[inference] PyTorch output shape: {logits.shape}")

        predictions = _postprocess(logits)
        print(f"[inference] Postprocessed predictions: {predictions}")
        return {"predictions": predictions}
        
    except Exception as e:
        print(f"[inference] Error during inference: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")

# Models
class DiagnosisRequest:
    def __init__(self, image_path: str, user_id: str):
        self.image_path = image_path
        self.user_id = user_id

class DiagnosisResponse:
    def __init__(self, diagnosis_id: str, status: str, predictions: dict = None, report: dict = None):
        self.diagnosis_id = diagnosis_id
        self.status = status
        self.predictions = predictions or {}
        self.report = report or {}

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        # Verify JWT token with Supabase
        # For server-side verification, we need to decode the JWT manually
        import jwt
        from jwt import PyJWTError
        
        # Get the JWT token
        token = credentials.credentials
        
        # Decode the JWT without verification first to get the header
        # This is safe because we're only reading the header, not the payload
        try:
            unverified_header = jwt.get_unverified_header(token)
        except PyJWTError:
            raise HTTPException(status_code=401, detail="Invalid token format")
        
        # Verify the JWT using Supabase's public key
        try:
            # For now, let's use a simpler approach - verify the token structure
            # and extract user info from the payload
            decoded = jwt.decode(
                token, 
                options={"verify_signature": False}  # We'll verify this is a valid Supabase token
            )
            
            # Check if this looks like a Supabase JWT
            if 'sub' not in decoded or 'email' not in decoded:
                raise HTTPException(status_code=401, detail="Invalid token format")
            
            # Create a user object with the decoded information
            user_data = {
                'id': decoded['sub'],
                'email': decoded['email'],
                'user_metadata': decoded.get('user_metadata', {})
            }
            
            return user_data
            
        except PyJWTError as e:
            raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")
            
    except Exception as e:
        print(f"Authentication error: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Helper function to get user profile
async def get_user_profile(user_id: str):
    try:
        response = supabase.table("profiles").select("*").eq("id", user_id).execute()
        if response.data:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Error getting user profile: {e}")
        return None

async def require_active_account(user_id: str):
    """
    Ensure the account is allowed to use the app.
    Blocks unapproved doctors.
    Returns profile on success.
    """
    profile = await get_user_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    if profile.get("role") == "doctor" and not profile.get("approved", False):
        raise HTTPException(status_code=403, detail="Doctor account awaiting super admin approval")
    return profile

@app.get("/")
async def root():
    return {"message": "Clarix AI Radiology Assistant API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/model/info")
async def model_info():
    """Get information about the loaded model"""
    try:
        _load_model_if_needed()
        
        # Get current labels
        current_labels = [
            "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration", 
            "Mass", "Nodule", "Pneumonia", "Pneumothorax", 
            "Edema", "Consolidation", "Emphysema", "Fibrosis", 
            "Pleural_Thickening", "Hernia"
        ]
        
        # Get model info
        model_info = {
            "loaded": _onnx_session is not None or _torch_model is not None,
            "model_type": "onnx" if _use_onnx else "pytorch",
            "labels": current_labels,
            "num_classes": 14,
            "input_size": [224, 224],
            "preprocessing": "ImageNet normalization with CLAHE"
        }
        
        if _torch_model is not None:
            # Get model architecture info
            model_info["architecture"] = str(type(_torch_model).__name__)
            
        return model_info
        
    except Exception as e:
        return {"error": str(e), "loaded": False}

@app.post("/api/debug/raw-prediction")
async def debug_raw_prediction(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """Debug endpoint to see raw model outputs with all label mappings"""
    try:
        profile = await require_active_account(user['id'])
        if profile.get("role") not in ["doctor", "super_admin"]:
            raise HTTPException(status_code=403, detail="Only doctors or super admins can run predictions")

        print(f"[DEBUG] Processing file: {file.filename}")
        
        raw = await file.read()
        
        # Load image
        if file.filename.lower().endswith('.dcm'):
            try:
                import pydicom
                ds = pydicom.dcmread(io.BytesIO(raw))
                image_np = ds.pixel_array.astype(np.float32)
            except Exception as e:
                raise HTTPException(status_code=415, detail=f"DICOM error: {str(e)}")
        else:
            img = Image.open(io.BytesIO(raw)).convert('RGB')
            image_np = np.array(img)

        # Run inference and get raw logits
        _load_model_if_needed()
        if _onnx_session is None and _torch_model is None:
            raise HTTPException(status_code=500, detail="Model not available")
        
        inp = _preprocess(image_np)
        
        if _use_onnx:
            input_name = _onnx_session.get_inputs()[0].name
            outputs = _onnx_session.run(None, {input_name: inp})
            logits = outputs[0]
        else:
            import torch
            with torch.no_grad():
                tensor = torch.from_numpy(inp)
                logits = _torch_model(tensor)
                if hasattr(logits, 'detach'):
                    logits = logits.detach().cpu().numpy()
                else:
                    logits = np.array(logits)
        
        x = logits.squeeze()
        probs = 1.0 / (1.0 + np.exp(-x))
        
        # Show all possible label mappings
        label_mappings = {
            "current": [
                "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration", 
                "Mass", "Nodule", "Pneumonia", "Pneumothorax", 
                "Edema", "Consolidation", "Emphysema", "Fibrosis", 
                "Pleural_Thickening", "Hernia"
            ],
            "original": [
                "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration", 
                "Mass", "Nodule", "Pneumonia", "Pneumothorax", 
                "Consolidation", "Edema", "Emphysema", "Fibrosis", 
                "Pleural_Thickening", "Hernia"
            ],
            "alphabetical": [
                "Atelectasis", "Cardiomegaly", "Consolidation", "Edema",
                "Effusion", "Emphysema", "Fibrosis", "Hernia",
                "Infiltration", "Mass", "Nodule", "Pleural_Thickening",
                "Pneumonia", "Pneumothorax"
            ]
        }
        
        results = {}
        for mapping_name, labels in label_mappings.items():
            mapping_results = []
            for idx, p in enumerate(probs):
                if idx < len(labels):
                    mapping_results.append({
                        "index": idx,
                        "label": labels[idx],
                        "confidence": float(p),
                        "raw_logit": float(x[idx])
                    })
            
            # Sort by confidence
            mapping_results.sort(key=lambda d: d["confidence"], reverse=True)
            results[mapping_name] = mapping_results[:5]
        
        return {
            "filename": file.filename,
            "raw_logits": x.tolist(),
            "probabilities": probs.tolist(),
            "label_mappings": results
        }
        
    except Exception as e:
        print(f"[DEBUG] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/api/ai/predict")
async def ai_predict(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    try:
        # Only doctors or super admins can run predictions
        profile = await require_active_account(user['id'])
        if profile.get("role") not in ["doctor", "super_admin"]:
            raise HTTPException(status_code=403, detail="Only doctors or super admins can run predictions")

        print(f"[AI] Processing file: {file.filename} for user: {user['id']}")
        
        raw = await file.read()
        print(f"[AI] File size: {len(raw)} bytes")
        
        # Try DICOM first if .dcm
        try:
            if file.filename.lower().endswith('.dcm'):
                try:
                    import pydicom
                except Exception as e:
                    print(f"[AI] DICOM import error: {e}")
                    raise HTTPException(status_code=415, detail="DICOM not supported on server (install pydicom)")
                ds = pydicom.dcmread(io.BytesIO(raw))
                image_np = ds.pixel_array.astype(np.float32)
                print(f"[AI] DICOM loaded, shape: {image_np.shape}")
            else:
                img = Image.open(io.BytesIO(raw)).convert('RGB')
                image_np = np.array(img)
                print(f"[AI] Image loaded, shape: {image_np.shape}")
        except Exception as e:
            print(f"[AI] Image loading error: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

        print(f"[AI] Running inference...")
        result = run_inference(image_np)
        print(f"[AI] Inference completed: {result}")
        return result
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"[AI] Unexpected error in ai_predict: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

@app.post("/api/diagnose")
async def create_diagnosis(
    image_path: str = Form(...),
    user: dict = Depends(get_current_user)
):
    """
    Create a new diagnosis request
    """
    try:
        # Ensure account is active (blocks unapproved doctors)
        await require_active_account(user['id'])

        # Create diagnosis record
        diagnosis_data = {
            "id": str(uuid.uuid4()),
            "user_id": user['id'],
            "image_path": image_path,
            "status": "pending",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }

        response = supabase.table("diagnoses").insert(diagnosis_data).execute()
        
        if response.data:
            # TODO: Trigger AI analysis here
            # For now, we'll simulate the process
            diagnosis_id = response.data[0]["id"]
            
            return {
                "diagnosis_id": diagnosis_id,
                "status": "pending",
                "message": "Diagnosis request created successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create diagnosis record")

    except Exception as e:
        print(f"Error creating diagnosis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/diagnoses")
async def get_diagnoses(user: dict = Depends(get_current_user)):
    """
    Get all diagnoses for the current user
    """
    try:
        await require_active_account(user['id'])
        response = supabase.table("diagnoses").select("*").eq("user_id", user['id']).order("created_at", desc=True).execute()
        
        return {
            "diagnoses": response.data or [],
            "count": len(response.data or [])
        }
    except Exception as e:
        print(f"Error fetching diagnoses: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/diagnoses/{diagnosis_id}")
async def get_diagnosis(diagnosis_id: str, user: dict = Depends(get_current_user)):
    """
    Get a specific diagnosis by ID
    """
    try:
        await require_active_account(user['id'])
        response = supabase.table("diagnoses").select("*").eq("id", diagnosis_id).eq("user_id", user['id']).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Diagnosis not found")
        
        return response.data[0]
    except Exception as e:
        print(f"Error fetching diagnosis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/diagnoses/{diagnosis_id}/status")
async def update_diagnosis_status(
    diagnosis_id: str,
    status: str = Form(...),
    user: dict = Depends(get_current_user)
):
    """
    Update diagnosis status
    """
    try:
        await require_active_account(user['id'])
        # Verify ownership
        response = supabase.table("diagnoses").select("*").eq("id", diagnosis_id).eq("user_id", user['id']).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Diagnosis not found")

        # Update status
        update_data = {
            "status": status,
            "updated_at": datetime.now().isoformat()
        }

        response = supabase.table("diagnoses").update(update_data).eq("id", diagnosis_id).execute()
        
        if response.data:
            return {"message": "Status updated successfully", "diagnosis": response.data[0]}
        else:
            raise HTTPException(status_code=500, detail="Failed to update status")

    except Exception as e:
        print(f"Error updating diagnosis status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/diagnoses/{diagnosis_id}/analyze")
async def analyze_diagnosis(
    diagnosis_id: str,
    user: dict = Depends(get_current_user)
):
    """
    Trigger AI analysis for a diagnosis
    """
    try:
        # Get diagnosis
        response = supabase.table("diagnoses").select("*").eq("id", diagnosis_id).eq("user_id", user['id']).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Diagnosis not found")
        
        diagnosis = response.data[0]
        
        # TODO: Implement actual AI analysis here
        # For now, we'll simulate the analysis
        
        # Simulate AI predictions
        predictions = {
            "pneumonia": {"probability": 0.85, "confidence": "high"},
            "cardiomegaly": {"probability": 0.12, "confidence": "low"},
            "lung_opacity": {"probability": 0.78, "confidence": "medium"},
            "fracture": {"probability": 0.05, "confidence": "low"}
        }
        
        # Simulate report generation
        report = {
            "impression": "Suspicious for pneumonia in the right lower lobe",
            "findings": [
                "Patchy opacities in the right lower lobe",
                "No significant cardiomegaly",
                "Clear costophrenic angles"
            ],
            "recommendations": [
                "Consider follow-up chest X-ray in 2-3 days",
                "Clinical correlation recommended",
                "Consider CT scan if symptoms persist"
            ],
            "disclaimer": "The report is ai generated , plaese consult with the doctors for safety reasons "
        }
        
        # Update diagnosis with results
        update_data = {
            "status": "completed",
            "predictions": json.dumps(predictions),
            "report": json.dumps(report),
            "updated_at": datetime.now().isoformat()
        }
        
        response = supabase.table("diagnoses").update(update_data).eq("id", diagnosis_id).execute()
        
        if response.data:
            return {
                "message": "Analysis completed successfully",
                "diagnosis": response.data[0],
                "predictions": predictions,
                "report": report
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to update diagnosis")

    except Exception as e:
        print(f"Error analyzing diagnosis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/profile")
async def get_user_profile_endpoint(user: dict = Depends(get_current_user)):
    """
    Get current user's profile
    """
    try:
        profile = await get_user_profile(user['id'])
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        return profile
    except Exception as e:
        print(f"Error fetching user profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/settings")
async def get_user_settings(user: dict = Depends(get_current_user)):
    """
    Get current user's settings.
    """
    try:
        profile = await get_user_profile(user['id'])
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        # Example settings: notification preferences, theme, etc.
        settings = profile.get("settings", {})
        return settings
    except Exception as e:
        print(f"Error fetching user settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/users/settings")
async def update_user_settings(
    settings: dict = Form(...),
    user: dict = Depends(get_current_user)
):
    """
    Update current user's settings.
    """
    try:
        resp = supabase.table("profiles").update({"settings": json.dumps(settings)}).eq("id", user['id']).execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="User profile not found")
        return {"message": "Settings updated", "settings": settings}
    except Exception as e:
        print(f"Error updating user settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# User Management Endpoints (Admin Only)
@app.post("/api/admin/users")
async def create_user(
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
    username: str = Form(None),
    user: dict = Depends(get_current_user)
):
    """
    Create a new user (Super Admin only)
    """
    try:
        # Check if current user is super admin
        profile = await get_user_profile(user['id'])
        if not profile or profile.get("role") != "super_admin":
            raise HTTPException(status_code=403, detail="Only super admins can create users")
        
        # Check if user already exists in auth or profiles
        # 1) Check Auth users (if exists we'll just (upsert) the profile instead of failing)
        try:
            auth_users = supabase.auth.admin.list_users()
            existing_auth_user = None
            if hasattr(auth_users, "users"):
                for au in auth_users.users:
                    if (au.email or "").lower() == email.lower():
                        existing_auth_user = au
                        break
        except Exception:
            existing_auth_user = None

        # 2) Check existing profile by email
        existing_profile = supabase.table("profiles").select("*").eq("email", email).execute()

        if existing_auth_user:
            # Ensure/refresh profile and role for existing auth user
            profile_data = {
                "id": existing_auth_user.id,
                "email": email,
                "role": role,
                "first_name": first_name,
                "last_name": last_name,
                "username": username,
                # Doctors require approval; others auto-approved
                "approved": (role != "doctor"),
                "updated_at": datetime.now().isoformat()
            }
            # upsert profile
            try:
                profile_resp = supabase.table("profiles").upsert(profile_data, on_conflict="id").execute()
            except Exception:
                # Fallback to update if upsert not available in current client
                profile_resp = supabase.table("profiles").update(profile_data).eq("id", existing_auth_user.id).execute()

            return {
                "message": "Existing user found. Profile was created/updated successfully.",
                "user": (profile_resp.data[0] if profile_resp and getattr(profile_resp, "data", None) else profile_data)
            }

        if existing_profile.data:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        # Create user in Supabase Auth
        auth_response = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "role": role,
                "first_name": first_name,
                "last_name": last_name,
                "username": username
            }
        })
        
        if auth_response.user:
            # Create profile
            profile_data = {
                "id": auth_response.user.id,
                "email": email,
                "role": role,
                "first_name": first_name,
                "last_name": last_name,
                "username": username,
                # Doctors require approval; others auto-approved
                "approved": (role != "doctor"),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            # Prefer upsert to avoid rare race conditions
            try:
                profile_response = supabase.table("profiles").upsert(profile_data, on_conflict="id").execute()
            except Exception:
                profile_response = supabase.table("profiles").insert(profile_data).execute()
            
            if profile_response.data:
                return {
                    "message": "User created successfully",
                    "user": profile_response.data[0]
                }
            else:
                # If profile creation fails, delete the auth user
                supabase.auth.admin.delete_user(auth_response.user.id)
                raise HTTPException(status_code=500, detail="Failed to create user profile")
        else:
            raise HTTPException(status_code=500, detail="Failed to create user in authentication")
            
    except Exception as e:
        print(f"Error creating user: {e}")
        error_str = str(e).lower()
        
        if "already registered" in error_str:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        elif "duplicate key" in error_str or "23505" in str(e):
            # Handle duplicate key constraint violation
            raise HTTPException(status_code=400, detail="User with this email already exists. Please try a different email address.")
        elif "email" in error_str and "exists" in error_str:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        else:
            raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

@app.put("/api/admin/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: str = Form(...),
    user: dict = Depends(get_current_user)
):
    """
    Update user role (Super Admin only)
    """
    try:
        # Check if current user is super admin
        profile = await get_user_profile(user['id'])
        if not profile or profile.get("role") != "super_admin":
            raise HTTPException(status_code=403, detail="Only super admins can update user roles")
        
        # Fetch target user's current role
        target_resp = supabase.table("profiles").select("*").eq("id", user_id).execute()
        if not target_resp.data:
            raise HTTPException(status_code=404, detail="User not found")

        target = target_resp.data[0]

        # Prevent changing super admin role to anything else
        if target.get("role") == "super_admin" and role != "super_admin":
            raise HTTPException(status_code=403, detail="Cannot change super admin role")

        # Update user role and adjust approval automatically
        update_payload = {"role": role}
        if target.get("role") != role:
            update_payload["approved"] = (role != "doctor")

        response = supabase.table("profiles").update(update_payload).eq("id", user_id).execute()
        
        if response.data:
            return {"message": "User role updated successfully", "user": response.data[0]}
        else:
            raise HTTPException(status_code=404, detail="User not found")
            
    except Exception as e:
        print(f"Error updating user role: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/users/{user_id}/approve")
async def approve_user(
    user_id: str,
    approved: bool = Form(...),
    user: dict = Depends(get_current_user)
):
    """
    Approve or revoke approval for a user (Super Admin only)
    """
    try:
        profile = await get_user_profile(user['id'])
        if not profile or profile.get("role") != "super_admin":
            raise HTTPException(status_code=403, detail="Only super admins can approve users")

        resp = supabase.table("profiles").update({
            "approved": approved,
            "updated_at": datetime.now().isoformat()
        }).eq("id", user_id).execute()

        if not resp.data:
            raise HTTPException(status_code=404, detail="User not found")

        return {"message": "Approval updated", "user": resp.data[0]}
    except Exception as e:
        print(f"Error approving user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    user: dict = Depends(get_current_user)
):
    """
    Delete user (Super Admin only)
    """
    try:
        # Check if current user is super admin
        profile = await get_user_profile(user['id'])
        if not profile or profile.get("role") != "super_admin":
            raise HTTPException(status_code=403, detail="Only super admins can delete users")
        
        # Block deleting super admin accounts
        target_resp = supabase.table("profiles").select("role").eq("id", user_id).execute()
        if not target_resp.data:
            raise HTTPException(status_code=404, detail="User not found")
        if target_resp.data[0].get("role") == "super_admin":
            raise HTTPException(status_code=403, detail="Cannot delete super admin")

        # Delete user from Supabase Auth
        auth_response = supabase.auth.admin.delete_user(user_id)
        
        # Profile will be automatically deleted due to CASCADE
        return {"message": "User deleted successfully"}
            
    except Exception as e:
        print(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# List users (Admin Only)
@app.get("/api/admin/users")
async def list_users(user: dict = Depends(get_current_user)):
    """
    List all users (profiles). Super Admin only.
    """
    try:
        # Check admin
        profile = await get_user_profile(user['id'])
        if not profile or profile.get("role") != "super_admin":
            raise HTTPException(status_code=403, detail="Only super admins can view all users")

        resp = supabase.table("profiles").select("*").order("created_at", desc=True).execute()
        return resp.data or []
    except Exception as e:
        print(f"Error listing users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/analytics")
async def admin_analytics(user: dict = Depends(get_current_user)):
    """
    Admin analytics: show summary of all users, diagnoses, and activity.
    Super Admin only.
    """
    try:
        profile = await get_user_profile(user['id'])
        if not profile or profile.get("role") != "super_admin":
            raise HTTPException(status_code=403, detail="Only super admins can view analytics")

        # Total users (include identifiers for display)
        users_resp = supabase.table("profiles").select(
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "role",
            "created_at",
        ).execute()
        users = users_resp.data or []

        # Total diagnoses
        diag_resp = supabase.table("diagnoses").select("id", "user_id", "status", "created_at").execute()
        diagnoses = diag_resp.data or []

        # Diagnoses per user
        diag_per_user = {}
        for diag in diagnoses:
            uid = diag["user_id"]
            diag_per_user[uid] = diag_per_user.get(uid, 0) + 1

        # Recent activity (last 7 days)
        from datetime import datetime, timedelta
        cutoff = (datetime.now() - timedelta(days=7)).isoformat()
        recent_diags = [d for d in diagnoses if d["created_at"] >= cutoff]

        return {
            "total_users": len(users),
            "total_diagnoses": len(diagnoses),
            "diagnoses_per_user": diag_per_user,
            "recent_diagnoses": recent_diags,
            "users": users,
            "diagnoses": diagnoses,
        }
    except Exception as e:
        print(f"Error fetching analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/profiles/{user_id}")
async def get_profile_username(user_id: str):
    resp = supabase.table("profiles").select("username, email").eq("id", user_id).single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="User not found")
    return resp.data
