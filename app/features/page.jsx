'use client'

import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useCTA } from '../../hooks/useCTA'

export default function FeaturesPage() {
  const { handleStartTrial, handleScheduleDemo } = useCTA()
  
  const features = [
    {
      icon: '📤',
      title: 'Image Upload & Preview',
      description: 'Upload X-rays or MRIs in DICOM, JPG, or PNG formats. Real-time image previews, multiple uploads, and clean drag-and-drop support for smoother workflow.',
      benefits: ['Support for DICOM, JPG, PNG formats', 'Real-time previews', 'Multiple file uploads', 'Drag & drop interface']
    },
    {
      icon: '🧠',
      title: 'AI-Based Diagnosis',
      description: 'Advanced AI models detect conditions like pneumonia, cardiomegaly, lung opacity, and fractures with confidence scores for reliable predictions.',
      benefits: ['Pneumonia detection', 'Cardiomegaly identification', 'Lung opacity analysis', 'Fracture detection in MRIs']
    },
    {
      icon: '📊',
      title: 'Auto-Generated Reports',
      description: 'Structured, human-readable radiology reports with impression, findings, and recommendations. Doctors can edit and finalize with ease.',
      benefits: ['Structured report format', 'Professional impression section', 'Detailed findings', 'Clinical recommendations']
    },
    {
      icon: '🔥',
      title: 'Heatmap Overlays',
      description: 'Grad-CAM powered heatmaps highlight abnormal regions, building confidence and interpretability in AI predictions for doctors.',
      benefits: ['Visual abnormality highlighting', 'Confidence building', 'Interpretable AI decisions', 'Enhanced diagnostic accuracy']
    },
    {
      icon: '🔒',
      title: 'Role-Based Access',
      description: 'Secure login for radiologists and doctors with history management. Stores timestamp of each diagnosis and anonymized patient data for MVP.',
      benefits: ['Secure authentication', 'Role management', 'History tracking', 'Privacy compliance']
    },
    {
      icon: '🤖',
      title: 'LLM-Based Q&A',
      description: 'Ask radiology-related questions directly within the platform. Domain-specific LLM provides insights and explanations for better decision making.',
      benefits: ['Real-time medical queries', 'Domain-specific insights', 'Educational support', 'Decision assistance']
    }
  ]

  const technicalFeatures = [
    {
      title: 'High Accuracy AI Models',
      description: 'Our models achieve 95%+ accuracy on standard medical imaging datasets.',
      metric: '95%+'
    },
    {
      title: 'Fast Processing',
      description: 'Average analysis time of under 30 seconds per image.',
      metric: '<30s'
    },
    {
      title: 'HIPAA Compliant',
      description: 'Full compliance with healthcare data protection regulations.',
      metric: '100%'
    },
    {
      title: 'Uptime Guarantee',
      description: '99.9% uptime with enterprise-grade infrastructure.',
      metric: '99.9%'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Powerful Features for
            <span className="block text-green-400">Medical Professionals</span>
          </h1>
          <p className="text-xl sm:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
            Advanced AI technology designed to enhance diagnostic accuracy and streamline your workflow
          </p>
          <div className="flex items-center justify-center space-x-8 text-sm">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
              AI-Powered Analysis
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
              HIPAA Compliant
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
              24/7 Support
            </div>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Core Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need for comprehensive medical image analysis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-500">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Technical Excellence
            </h2>
            <p className="text-xl text-gray-600">
              Built with enterprise-grade performance and reliability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {technicalFeatures.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-3xl font-bold p-6 rounded-2xl mb-4">
                  {feature.metric}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Streamlined Workflow
            </h2>
            <p className="text-xl text-gray-600">
              From upload to diagnosis in just a few simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Upload', desc: 'Upload medical images' },
              { step: '02', title: 'Analyze', desc: 'AI processes the image' },
              { step: '03', title: 'Review', desc: 'Review AI predictions' },
              { step: '04', title: 'Report', desc: 'Generate final report' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
                {index < 3 && (
                  <div className="hidden md:block w-full h-0.5 bg-gray-300 mt-8 relative">
                    <div className="absolute right-0 top-0 w-2 h-2 bg-blue-600 rounded-full transform translate-x-1 -translate-y-0.5"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Experience the Future of Medical Imaging?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of medical professionals who trust Clarix for accurate, fast diagnostic support.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={handleStartTrial}
              className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition duration-300"
            >
              Start Free Trial
            </button>
            <button 
              onClick={handleScheduleDemo}
              className="border border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition duration-300"
            >
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
