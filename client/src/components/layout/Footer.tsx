import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-2xl font-bold text-white tracking-tight">NexCart</span>

          <nav className="flex items-center gap-6 text-sm">
            <Link to="/" className="hover:text-white transition-colors">About</Link>
            <Link to="/" className="hover:text-white transition-colors">Contact</Link>
            <Link to="/" className="hover:text-white transition-colors">Privacy Policy</Link>
          </nav>

          <p className="text-sm">&copy; {new Date().getFullYear()} NexCart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
