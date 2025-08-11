# Clarix - AI-Powered Radiology Assistant

An intelligent diagnostic support system that assists radiologists and doctors in interpreting medical images such as X-rays and MRIs using advanced AI technology.

## 🏗️ Tech Stack

- **Frontend**: Next.js 15 with React 19
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS

## 🚀 Features

### Core Features
- 📤 **Image Upload & Preview**: Support for DICOM, JPG, PNG formats
- 🧠 **AI-Based Diagnosis**: Detects conditions like pneumonia, cardiomegaly, lung opacity, fractures
- 📄 **Auto-Generated Reports**: Structured radiology reports with impression, findings, recommendations
- 📊 **Heatmap Overlays**: Grad-CAM powered visualizations for abnormal regions
- 👤 **Role-Based Access**: Secure login for users, doctors, and super admins
- 🧠 **LLM-Based Q&A**: Domain-specific AI assistance for radiology questions

### User Roles
- **User**: Upload images, view predictions, review reports
- **Doctor**: All user features + access to overlay maps and patient history
- **Super Admin**: Full system control, user management, audit logs

## 📋 Prerequisites

- Node.js 18+ 
- Python 3.8+
- Supabase account
- Git

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Frontend dependencies
cd Clarix
npm install

# Backend dependencies
cd backend
pip install -r requirements.txt
```

### 2. Supabase Setup

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and API keys

2. **Database Schema**:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the contents of `backend/schema.sql`

3. **Storage Bucket**:
   - Go to Storage in your Supabase dashboard
   - Create a new bucket called `medical-images`
   - Set it to private with RLS enabled

### 3. Environment Configuration

Create `.env.local` in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Create `.env` in the `backend` directory:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
```

### 4. Start the Application

```bash
# Terminal 1: Start Frontend
npm run dev

# Terminal 2: Start Backend
cd backend
python main.py
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📁 Project Structure

```
Clarix/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   └── page.jsx          # Landing page
├── components/            # React components
├── lib/                  # Utilities and configurations
├── backend/              # FastAPI backend
│   ├── main.py          # Main API application
│   ├── requirements.txt  # Python dependencies
│   └── schema.sql       # Database schema
└── public/              # Static assets
```

## 🔐 Authentication Flow

1. **Sign Up**: Users can register with email/password and select role
2. **Email Verification**: Supabase sends confirmation email
3. **Login**: Users authenticate with email/password
4. **Role-Based Access**: Different features based on user role
5. **Session Management**: JWT tokens handled by Supabase

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

## 🔧 API Endpoints

### Authentication
- `POST /api/diagnose` - Create new diagnosis
- `GET /api/diagnoses` - Get user's diagnoses
- `GET /api/diagnoses/{id}` - Get specific diagnosis
- `PUT /api/diagnoses/{id}/status` - Update diagnosis status
- `POST /api/diagnoses/{id}/analyze` - Trigger AI analysis

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

## 🔮 Future Enhancements

- [ ] Real AI model integration (CheXNet/CheXAgent)
- [ ] Advanced image preprocessing
- [ ] Real-time collaboration features
- [ ] Mobile app development
- [ ] Advanced reporting templates
- [ ] Integration with PACS systems

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@clarix.com or create an issue in the repository.

---

**Note**: This is a development version. For production use, ensure proper security measures, HIPAA compliance, and thorough testing.
