#!/usr/bin/env python3
"""
Clarix Setup Script
Helps with initial project configuration
"""

import os
import sys
import subprocess
from pathlib import Path

def print_banner():
    print("""
    ╔══════════════════════════════════════════════════════════════╗
    ║                    Clarix Setup Script                       ║
    ║              AI-Powered Radiology Assistant                  ║
    ╚══════════════════════════════════════════════════════════════╝
    """)

def check_prerequisites():
    """Check if required tools are installed"""
    print("🔍 Checking prerequisites...")
    
    # Check Node.js
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Node.js: {result.stdout.strip()}")
        else:
            print("❌ Node.js not found")
            return False
    except FileNotFoundError:
        print("❌ Node.js not found")
        return False
    
    # Check Python
    try:
        result = subprocess.run(['python', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Python: {result.stdout.strip()}")
        else:
            print("❌ Python not found")
            return False
    except FileNotFoundError:
        print("❌ Python not found")
        return False
    
    # Check npm
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ npm: {result.stdout.strip()}")
        else:
            print("❌ npm not found")
            return False
    except FileNotFoundError:
        print("❌ npm not found")
        return False
    
    # Check pip
    try:
        result = subprocess.run(['pip', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ pip: {result.stdout.strip()}")
        else:
            print("❌ pip not found")
            return False
    except FileNotFoundError:
        print("❌ pip not found")
        return False
    
    return True

def install_dependencies():
    """Install frontend and backend dependencies"""
    print("\n📦 Installing dependencies...")
    
    # Install frontend dependencies
    print("Installing frontend dependencies...")
    try:
        subprocess.run(['npm', 'install'], check=True)
        print("✅ Frontend dependencies installed")
    except subprocess.CalledProcessError:
        print("❌ Failed to install frontend dependencies")
        return False
    
    # Install backend dependencies
    print("Installing backend dependencies...")
    try:
        backend_path = Path("backend")
        if backend_path.exists():
            subprocess.run(['pip', 'install', '-r', 'backend/requirements.txt'], check=True)
            print("✅ Backend dependencies installed")
        else:
            print("❌ Backend directory not found")
            return False
    except subprocess.CalledProcessError:
        print("❌ Failed to install backend dependencies")
        return False
    
    return True

def create_env_files():
    """Create environment files with templates"""
    print("\n🔧 Creating environment files...")
    
    # Frontend .env.local
    frontend_env = """# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
"""
    
    # Backend .env
    backend_env = """# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
"""
    
    # Create frontend .env.local
    if not os.path.exists('.env.local'):
        with open('.env.local', 'w') as f:
            f.write(frontend_env)
        print("✅ Created .env.local")
    else:
        print("ℹ️  .env.local already exists")
    
    # Create backend .env
    backend_env_path = Path("backend/.env")
    if not backend_env_path.exists():
        backend_env_path.parent.mkdir(exist_ok=True)
        with open(backend_env_path, 'w') as f:
            f.write(backend_env)
        print("✅ Created backend/.env")
    else:
        print("ℹ️  backend/.env already exists")

def print_next_steps():
    """Print next steps for setup"""
    print("""
    🎉 Setup completed! Next steps:
    
    1. 🔐 Configure Supabase:
       - Create a project at https://supabase.com
       - Run the SQL schema from backend/schema.sql
       - Create a 'medical-images' storage bucket
    
    2. 🔧 Update Environment Variables:
       - Edit .env.local with your Supabase credentials
       - Edit backend/.env with your Supabase credentials
    
    3. 🚀 Start the Application:
       # Terminal 1: Frontend
       npm run dev
       
       # Terminal 2: Backend
       cd backend
       python main.py
    
    4. 🌐 Access the Application:
       - Frontend: http://localhost:3000
       - Backend API: http://localhost:8000
       - API Docs: http://localhost:8000/docs
    
    📚 For detailed instructions, see README.md
    """)

def main():
    print_banner()
    
    if not check_prerequisites():
        print("\n❌ Prerequisites not met. Please install the required tools.")
        sys.exit(1)
    
    if not install_dependencies():
        print("\n❌ Failed to install dependencies.")
        sys.exit(1)
    
    create_env_files()
    print_next_steps()

if __name__ == "__main__":
    main()
