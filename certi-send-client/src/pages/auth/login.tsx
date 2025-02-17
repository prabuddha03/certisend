import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth';
import { toast } from 'react-hot-toast';
import { Navbar } from '@/components/layout/navbar';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Check for Google OAuth token in URL
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const redirectTo = searchParams.get('redirect') || '/dashboard';
    
    if (token) {
      loginWithGoogle(token, redirectTo);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      toast.error('Google login failed');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location, loginWithGoogle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      await login(email, password, redirectTo);
      toast.success('Login successful!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
      if (!apiUrl) {
        throw new Error('API URL is not configured');
      }

      // Use frontend URL for redirect_uri
      const redirectUri = `${window.location.origin}/login`;
      const searchParams = new URLSearchParams(window.location.search);
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      
      console.log('Frontend URL:', window.location.origin);
      console.log('API URL:', apiUrl);
      console.log('Redirect URI:', redirectUri);
      
      const googleAuthUrl = new URL(`${apiUrl}/api/auth/google`);
      googleAuthUrl.searchParams.append('redirect_uri', redirectUri);
      googleAuthUrl.searchParams.append('state', redirectTo);
      
      console.log('Final URL:', googleAuthUrl.toString());
      window.location.href = googleAuthUrl.toString();
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Failed to initiate Google login. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Welcome back</h1>
            <p className="text-zinc-400 mt-2">Sign in to your account to continue</p>
          </div>

          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Input 
                    placeholder="name@example.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                  <Mail className="absolute right-3 top-2.5 h-5 w-5 text-zinc-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Input 
                    placeholder="Enter your password" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                  <Lock className="absolute right-3 top-2.5 h-5 w-5 text-zinc-500" />
                </div>
              </div>

              <Button className="w-full" disabled={isLoading}>
                <LogIn className="h-4 w-4 mr-2" />
                {isLoading ? 'Signing in...' : 'Sign In'}
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
              onClick={handleGoogleLogin}
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
              Sign in with Google
            </Button>

            <div className="mt-6 text-center text-sm">
              <p className="text-zinc-400">
                Don't have an account?{' '}
                <Link to="/signup" className="text-indigo-400 hover:text-indigo-300">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}