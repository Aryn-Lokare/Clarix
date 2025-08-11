'use client'

import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { useCTA } from '../../hooks/useCTA'

export default function HowItWorksPage() {
  const { handleStartTrial, handleScheduleDemo } = useCTA()
  
  const steps = [
    {
      id: 1,
      title: 'Upload Images',
      description: 'Upload your X-ray or MRI images in JPG, PNG, or DICOM format. Our platform supports multiple file formats and ensures secure, encrypted uploads.',
      details: [
        'Drag & drop interface',
        'Multiple format support (DICOM, JPG, PNG)',
        'Secure encrypted upload',
        'Real-time preview',
        'Batch upload capability'
      ],
      icon: '📤'
    },
    {
      id: 2,
      title: 'AI Analysis',
      description: 'Our advanced AI models analyze the images using state-of-the-art deep learning algorithms to identify potential medical conditions.',
      details: [
        'CheXNet-based analysis',
        'Multiple condition detection',
        'Confidence scoring',
        'Fast processing (<30 seconds)',
        'Continuous model improvement'
      ],
      icon: '🧠'
    },
    {
      id: 3,
      title: 'Review Results',
      description: 'View AI predictions with confidence scores and visual heatmaps that highlight areas of concern for better interpretability.',
      details: [
        'Confidence percentages',
        'Visual heatmap overlays',
        'Multiple condition predictions',
        'Comparative analysis',
        'Historical trend tracking'
      ],
      icon: '📊'
    },
    {
      id: 4,
      title: 'Generate Report',
      description: 'Auto-generate structured radiology reports that you can review, edit, and finalize before sharing with patients or colleagues.',
      details: [
        'Professional report format',
        'Editable sections',
        'Clinical recommendations',
        'PDF export',
        'Integration with EMR systems'
      ],
      icon: '📋'
    }
  ]

  const benefits = [
    {
      title: 'Increased Accuracy',
      description: 'AI assistance helps reduce diagnostic errors and improves overall accuracy.',
      stat: '95%+',
      icon: '🎯'
    },
    {
      title: 'Time Savings',
      description: 'Reduce analysis time from hours to minutes with automated processing.',
      stat: '80%',
      icon: '⚡'
    },
    {
      title: 'Cost Reduction',
      description: 'Lower operational costs through improved efficiency and automation.',
      stat: '60%',
      icon: '💰'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            How Clarix
            <span className="block text-green-400">Works</span>
          </h1>
          <p className="text-xl sm:text-2xl text-blue-100 max-w-3xl mx-auto">
            Simple, efficient workflow designed for medical professionals to get accurate AI-powered diagnostic insights in minutes
          </p>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {steps.map((step, index) => (
            <div key={step.id} className={`flex flex-col lg:flex-row items-center gap-12 mb-20 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mr-6">
                    {step.id}
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">{step.title}</h3>
                    <div className="text-4xl">{step.icon}</div>
                  </div>
                </div>
                <p className="text-lg text-gray-600 mb-6">{step.description}</p>
                <ul className="space-y-3">
                  {step.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-4"></span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual */}
              <div className="flex-1">
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 text-center">
                  <div className="text-8xl mb-4">{step.icon}</div>
                  <div className="text-2xl font-bold text-gray-800">{step.title}</div>
                  <div className="w-full h-2 bg-gray-200 rounded-full mt-6">
                    <div 
                      className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${(step.id / steps.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              The Benefits You'll See
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Healthcare professionals using Clarix report significant improvements in their workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-8 rounded-xl bg-gray-50">
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <div className="text-4xl font-bold text-blue-600 mb-2">{benefit.stat}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Process */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Behind the Scenes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced AI technology working to provide accurate diagnoses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Image Preprocessing', desc: 'Standardization and enhancement', icon: '🔧' },
              { title: 'Feature Extraction', desc: 'Deep learning pattern recognition', icon: '🔍' },
              { title: 'Classification', desc: 'Multi-label condition detection', icon: '🏷️' },
              { title: 'Confidence Scoring', desc: 'Reliability assessment', icon: '📈' }
            ].map((process, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg text-center">
                <div className="text-3xl mb-4">{process.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{process.title}</h3>
                <p className="text-gray-600 text-sm">{process.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-8">
            {[
              {
                q: "How accurate is the AI diagnosis?",
                a: "Our AI models achieve 95%+ accuracy on standard medical imaging datasets, constantly improving through machine learning and expert validation."
              },
              {
                q: "What image formats are supported?",
                a: "We support DICOM (medical standard), JPG, and PNG formats. Images are processed securely with HIPAA compliance."
              },
              {
                q: "How long does analysis take?",
                a: "Most analyses complete in under 30 seconds, allowing for real-time diagnostic support during patient consultations."
              },
              {
                q: "Can I edit the generated reports?",
                a: "Yes, all generated reports are fully editable. You can modify findings, add clinical notes, and customize recommendations before finalizing."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join the AI revolution in medical imaging and provide better patient care
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
