const features = [
  {
    title: 'Image Upload & Preview',
    description:
      'Upload X-rays or MRIs in DICOM, JPG, or PNG formats. Real-time image previews, multiple uploads, and clean drag-and-drop support for smoother workflow.',
    icon: '/file.svg',
    iconBg: 'bg-[#4F7CFE]',
  },
  {
    title: 'AI-Based Diagnosis',
    description:
      'Advanced AI models detect conditions like pneumonia, cardiomegaly, lung opacity, and fractures with confidence scores for reliable predictions.',
    icon: '/globe.svg',
    iconBg: 'bg-[#45E6A4]',
  },
  {
    title: 'Auto-Generated Reports',
    description:
      'Structured, human-readable radiology reports with impression, findings, and recommendations. Doctors can edit and finalize with ease.',
    icon: '/next.svg',
    iconBg: 'bg-[#4F7CFE]',
  },
  {
    title: 'Heatmap Overlays',
    description:
      'Grad-CAM powered heatmaps highlight abnormal regions, building confidence and interpretability in AI predictions for doctors.',
    icon: '/globe.svg',
    iconBg: 'bg-[#45E6A4]',
  },
  {
    title: 'Role-Based Access',
    description:
      'Secure login for radiologists and doctors with history management. Stores anonymized patient data with access control mechanisms.',
    icon: '/vercel.svg',
    iconBg: 'bg-[#4F7CFE]',
  },
  {
    title: 'LLM-Based Q&A',
    description:
      'Ask radiology-related questions directly within the platform. Domain-specific LLM provides insights and explanations for better decision making.',
    icon: '/window.svg',
    iconBg: 'bg-[#45E6A4]',
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-[#f9fafb]">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold font-satoshi text-[#0A0A19] mb-2">
          Powerful Features for Medical Professionals
        </h2>
        <p className="text-gray-500 font-poppins mb-12 max-w-3xl mx-auto">
          Advanced AI technology designed to enhance diagnostic accuracy and streamline your workflow
        </p>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md p-6 text-left transition"
            >
              <div className={`w-10 h-10 ${feature.iconBg} rounded-lg flex items-center justify-center mb-4`}>
                <img src={feature.icon} alt={feature.title} className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold font-poppins text-[#0A0A19] mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-500 font-poppins text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
