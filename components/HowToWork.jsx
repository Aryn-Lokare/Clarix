'use client';

export default function HowToWorks() {
  const steps = [
    {
      id: 1,
      title: 'Upload Images',
      description: 'Upload your X-ray or MRI images in JPG, or PNG format',
      bg: 'bg-blue-500 text-white',
    },
    {
      id: 2,
      title: 'AI Analysis',
      description:
        'Our advanced AI models analyze the images and identify potential conditions',
      bg: 'bg-green-200 text-black',
    },
    {
      id: 3,
      title: 'Review Results',
      description:
        'View AI predictions, confidence scores, and heatmap visualizations',
      bg: 'bg-blue-400 text-white',
    },
    {
      id: 4,
      title: 'Generate Report',
      description:
        'Auto-generate structured radiology reports that you can edit and finalize',
      bg: 'bg-green-200 text-black',
    },
  ];

  return (
    <section className="py-16 bg-white text-center">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">How Clarix Works</h2>
        <p className="text-gray-600 mb-12 text-lg">
          Simple, efficient workflow designed for medical professionals
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-semibold ${step.bg} mb-4`}
              >
                {step.id}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-gray-600 max-w-xs">{step.description}</p>
            </div>
          ))}
        </div>

        <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-full transition">
          Start Your Free Trial →
        </button>
      </div>
    </section>
  );
}
