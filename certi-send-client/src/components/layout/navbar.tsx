import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  UserCircle, 
  Settings, 
  LogOut, 
  Home, 
  LayoutDashboard, 
  Award, 
  CheckCircle,
  Menu,
  X,
  Compass
} from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Explore', path: '/events', icon: Compass },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, requiresAuth: true },
    { label: 'Create Event', path: '/events/create', icon: Award, requiresAuth: true },
    { label: 'Verify', path: '/verify', icon: CheckCircle },
  ];

  return (
    <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl z-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-pink-500">
              CertiSend
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              (!item.requiresAuth || user) && (
                <Link 
                  key={item.path}
                  to={item.path} 
                  className="flex items-center text-zinc-300 hover:text-white px-3 py-2 z-50"
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Link>
              )
            ))}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="z-50">
                    <UserCircle className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-50">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-zinc-500">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/signup">
                <Button className="z-50">Sign Up</Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="z-50"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 z-50">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                (!item.requiresAuth || user) && (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center text-zinc-300 hover:text-white px-3 py-2 z-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                )
              ))}
              
              {!user && (
                <div className="mt-4">
                  <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full z-50">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}