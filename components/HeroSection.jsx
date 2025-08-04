// components/HeroSection.jsx
export default function HeroSection() {
  return (
    <section className="w-full min-h-screen bg-gradient-to-b from-[#f1f7ff] to-white flex items-center justify-center px-4">
      <div className="text-center max-w-3xl">
        <h1 className="text-5xl sm:text-6xl font-satoshi font-bold leading-tight text-[#4F7CFE]">
          Clarity in every scan.
        </h1>
        <h2 className="text-5xl sm:text-6xl font-satoshi font-bold text-[#0A0A19] mt-2">
          Powered by AI
        </h2>
        <p className="mt-6 text-gray-600 font-poppins text-lg">
          Upload X-ray and MRI images to get AI-based diagnosis, view explainable heatmaps, 
          and generate structured radiology reports instantly.
        </p>
        <button className="mt-8 bg-[#45E6A4] hover:bg-[#3bd89a] text-black font-poppins font-semibold px-6 py-3 rounded-lg transition duration-200 ease-in-out">
          Get Started →
        </button>
      </div>
    </section>
  );
}
