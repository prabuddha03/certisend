import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Phone, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth';
import { toast } from 'react-hot-toast';
import { Navbar } from '@/components/layout/navbar';

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  organization?: string;
}

export function Signup() {
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    organization: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await register(formData);
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    try {
      const redirectUri = `${window.location.origin}/login`;
      const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
      
      if (!apiUrl) {
        throw new Error('API URL is not configured');
      }
      
      const googleAuthUrl = new URL(`${apiUrl}/api/auth/google`);
      googleAuthUrl.searchParams.append('redirect_uri', redirectUri);
      googleAuthUrl.searchParams.append('state', '/dashboard');
      
      window.location.href = googleAuthUrl.toString();
    } catch (error) {
      console.error('Google signup error:', error);
      toast.error('Failed to initiate Google signup. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Create an account</h1>
            <p className="text-zinc-400 mt-2">Start managing your certificates today</p>
          </div>

          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <Input
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  <User className="absolute right-3 top-2.5 h-5 w-5 text-zinc-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Input
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <Mail className="absolute right-3 top-2.5 h-5 w-5 text-zinc-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Input
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                  <Phone className="absolute right-3 top-2.5 h-5 w-5 text-zinc-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Input
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <Lock className="absolute right-3 top-2.5 h-5 w-5 text-zinc-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <Lock className="absolute right-3 top-2.5 h-5 w-5 text-zinc-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Organization (Optional)
                </label>
                <div className="relative">
                  <Input
                    name="organization"
                    placeholder="Your organization"
                    value={formData.organization}
                    onChange={handleChange}
                  />
                  <Building className="absolute right-3 top-2.5 h-5 w-5 text-zinc-500" />
                </div>
              </div>

              <Button className="w-full" disabled={isLoading}>
                <UserPlus className="h-4 w-4 mr-2" />
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-900 px-2 text-zinc-400">
                  Or continue with
                </span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleGoogleSignup}
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign up with Google
            </Button>

            <div className="mt-6 text-center text-sm">
              <p className="text-zinc-400">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}