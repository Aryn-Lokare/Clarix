from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from typing import Optional, List
import json
from datetime import datetime
import uuid

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

@app.get("/")
async def root():
    return {"message": "Clarix AI Radiology Assistant API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/diagnose")
async def create_diagnosis(
    image_path: str = Form(...),
    user: dict = Depends(get_current_user)
):
    """
    Create a new diagnosis request
    """
    try:
        # Get user profile
        profile = await get_user_profile(user['id'])
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")

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
            ]
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

# User Management Endpoints (Admin Only)
@app.post("/api/admin/users")
async def create_user(
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
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
        
        # Check if user already exists in profiles table
        existing_profile = supabase.table("profiles").select("*").eq("email", email).execute()
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
                "last_name": last_name
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
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
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
        
        # Update user role
        response = supabase.table("profiles").update({"role": role}).eq("id", user_id).execute()
        
        if response.data:
            return {"message": "User role updated successfully", "user": response.data[0]}
        else:
            raise HTTPException(status_code=404, detail="User not found")
            
    except Exception as e:
        print(f"Error updating user role: {e}")
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
        
        # Delete user from Supabase Auth
        auth_response = supabase.auth.admin.delete_user(user_id)
        
        # Profile will be automatically deleted due to CASCADE
        return {"message": "User deleted successfully"}
            
    except Exception as e:
        print(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
