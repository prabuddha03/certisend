import { Outlet } from 'react-router-dom';
import { Navbar } from './navbar';

export function Layout() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-zinc-800 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-zinc-400">
            © {new Date().getFullYear()} CertiSend. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}