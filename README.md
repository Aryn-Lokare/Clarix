# Clarix - AI-Powered Medical Imaging Platform

## 🩺 Overview

Clarix is a comprehensive AI-powered medical imaging platform designed for medical professionals and healthcare institutions. It provides advanced diagnostic insights for chest X-rays using deep learning models, along with a complete messaging system for doctor-patient communication.

## ✨ Features

- **AI-Powered Diagnosis**: Advanced chest X-ray analysis using DenseNet121 deep learning model
- **Role-Based Access Control**: Separate interfaces for patients, doctors, and super admins
- **Real-time Messaging**: Secure communication between patients and doctors
- **Report Generation**: Professional PDF reports with patient information and analysis results
- **Dashboard Analytics**: Comprehensive statistics and analysis tracking
- **Admin Panel**: User management, system monitoring, and analytics
- **Responsive Design**: Modern, mobile-friendly interface built with Next.js and Tailwind CSS
- **Security**: End-to-end encryption and HIPAA-compliant data handling

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React features
- **Tailwind CSS 4** - Modern utility-first CSS framework
- **Supabase** - Authentication and real-time database

### Backend
- **FastAPI** - High-performance Python API framework
- **PyTorch** - Deep learning model inference
- **ONNX Runtime** - Optimized model deployment
- **OpenCV** - Image processing
- **Google Generative AI** - AI-powered chat responses

### Database
- **Supabase (PostgreSQL)** - Cloud database with real-time features
- **Row Level Security (RLS)** - Fine-grained access control

### AI/ML
- **DenseNet121** - Pre-trained model for chest X-ray classification
- **14-class pathology detection** - Including pneumonia, cardiomegaly, edema, etc.
- **Image preprocessing** - CLAHE enhancement and normalization

### User Roles
- **Patients/Users**: Upload medical images, view analyses, message doctors
- **Doctors**: Review patient analyses, respond to consultations, generate reports
- **Super Admins**: User management, system analytics, platform configuration

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (version 18 or higher)
- **Python** (version 3.8 or higher)
- **npm** or **yarn**
- **Supabase account** (for database and authentication)
- **Google AI API key** (for AI chat features)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Aryn-Lokare/Clarix.git
cd Clarix
```

### 2. Frontend Setup

```bash
# Install Node.js dependencies
npm install

# Or using yarn
yarn install
```

### 3. Backend Setup

```bash
# Create a virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 4. Environment Configuration

Create environment files for both frontend and backend:

#### Frontend Environment (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### Backend Environment (`backend/.env`)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GOOGLE_API_KEY=your_google_ai_api_key
MODEL_PATH=./models/best_densenet.onnx
```

### 5. Database Setup

1. **Create Supabase Project**: Sign up at [supabase.com](https://supabase.com) and create a new project

2. **Run Database Schema**: Execute the SQL files in the `backend/` directory:
   - `backend/schema.sql` - Main database schema
   - `backend/contact-messages-schema.sql` - Contact and messaging tables
   - `backend/create-diagnoses-table.sql` - Diagnoses tracking

3. **Setup RLS Policies**: Run the following SQL to create the messaging view:
   ```sql
   CREATE OR REPLACE VIEW public.messaging_profiles AS
   SELECT id, username, email, first_name, last_name, role
   FROM public.profiles;
   
   GRANT SELECT ON public.messaging_profiles TO authenticated;
   GRANT SELECT ON public.messaging_profiles TO anon;
   ```

4. **Create Admin User**: Run one of the admin creation scripts to set up your first super admin account

### 6. AI Model Setup

1. **Download Model**: Place your trained DenseNet121 model in `backend/models/`
2. **Supported Formats**: `.onnx`, `.pt`, or `.pth` files
3. **Model Name**: Use `best_densenet.onnx` or similar naming convention

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start the Backend Server**:
   ```bash
   cd backend
   python -m uvicorn main:app --reload --port 8000
   ```

2. **Start the Frontend Development Server**:
   ```bash
   # In the root directory
   npm run dev
   ```

3. **Access the Application**:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000`
   - API Documentation: `http://localhost:8000/docs`

### Production Deployment

1. **Build the Frontend**:
   ```bash
   npm run build
   npm start
   ```

2. **Run Backend in Production**:
   ```bash
   cd backend
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

## 📁 Project Structure

```
Clarix/
├── app/                        # Next.js app directory
│   ├── admin/                 # Admin panel pages
│   ├── auth/                  # Authentication pages
│   ├── dashboard/             # User dashboard
│   ├── doctor/                # Doctor-specific pages
│   ├── messages/              # Messaging interface
│   └── api/                   # API routes
├── backend/                   # Python FastAPI backend
│   ├── main.py               # Main API application
│   ├── models/               # AI model files
│   └── *.sql                 # Database schema files
├── components/               # Reusable React components
├── lib/                     # Utility libraries
├── public/                  # Static assets
├── requirements.txt         # Python dependencies
├── package.json            # Node.js dependencies
└── README.md              # This file
```

## 🔐 Security Features

- **Authentication**: Secure user authentication via Supabase
- **Authorization**: Role-based access control (RBAC)
- **Data Privacy**: HIPAA-compliant data handling
- **Encryption**: End-to-end encrypted communications
- **RLS**: Row-level security in database
- **Input Validation**: Comprehensive input sanitization

## 🗄️ Database Schema

### Tables
- **profiles**: User profiles with roles
- **diagnoses**: Medical image analysis records
- **patient_records**: Anonymized patient data
- **system_logs**: Audit trail for system actions

### Security
- Row Level Security (RLS) enabled on all tables
- Role-based access policies
- JWT token authentication

## 🧪 Testing

```bash
# Run frontend tests
npm test

# Run backend tests
cd backend
python -m pytest

# Test AI model
python test_model.py
```

## 📊 API Documentation

The API documentation is automatically generated and available at:
- Development: `http://localhost:8000/docs`
- Interactive API explorer with all endpoints documented

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build
# Deploy to Vercel
```

### Backend (Railway/Render)
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
# Deploy to Railway or Render
```

## 🏥 Medical Disclaimer

This software is intended for educational and research purposes only. It should not be used as a substitute for professional medical diagnosis or treatment. Always consult with qualified healthcare professionals for medical decisions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation at `/docs`

---

**Clarix** - Advancing healthcare through AI-powered medical imaging solutions.
