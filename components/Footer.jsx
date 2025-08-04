export default function Footer() {
  return (
    <footer className="bg-[#0C1222] text-white py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Left Section */}
        <div>
          <h2 className="text-2xl font-bold text-green-300">clarix</h2>
          <p className="text-gray-300 mt-4 mb-6 max-w-sm leading-relaxed">
            Advanced AI-powered medical imaging analysis platform designed to enhance
            diagnostic accuracy and streamline radiology workflows.
          </p>
          <div className="flex gap-4">
            <button className="bg-white text-gray-500 font-medium py-2 px-4 rounded-md cursor-not-allowed">
              Contact Sales
            </button>
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md">
              Book Demo
            </button>
          </div>
        </div>

        {/* Product Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Product</h3>
          <ul className="space-y-2 text-gray-300">
            <li><a href="#">Features</a></li>
            <li><a href="#">Pricing</a></li>
            <li><a href="#">Documentation</a></li>
            <li><a href="#">API</a></li>
          </ul>
        </div>

        {/* Company Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Company</h3>
          <ul className="space-y-2 text-gray-300">
            <li><a href="#">About</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-700 mt-12 pt-6 text-center text-gray-400 text-sm">
        © 2025 Clarix. All rights reserved. Built for medical professionals.
      </div>
    </footer>
  );
}
