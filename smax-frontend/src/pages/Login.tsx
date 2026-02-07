import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Card, Button } from '../components/common';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const login = useStore((state) => state.login);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign Up
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || email.split('@')[0],
            },
          },
        });

        if (authError) throw authError;

        if (data.user) {
          setMessage('Account created! Logging you in...');
          // Auto login after sign up if session is established
          if (data.session) {
             await login(email);
             navigate('/dashboard');
          } else {
             // Email confirmation required case
             setMessage('Please check your email to confirm your account.');
             setIsLoading(false);
             return;
          }
        }
      } else {
        // Sign In
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        if (data.user) {
          await login(email);
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let errorMessage = err.message || 'Authentication failed';
      if (errorMessage === 'Failed to fetch') {
        errorMessage = 'Connection failed. Please check your Vercel environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).';
      }
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src="/logo.png" alt="Smax AI" className="h-16 w-auto object-contain" />
          </div>
        </div>
        
        <Card className="p-8 shadow-card rounded-xl border border-gray-100 bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center mb-6">
               <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(false); setError(''); }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${!isSignUp ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(true); setError(''); }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${isSignUp ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Create Account
                  </button>
               </div>
            </div>

            <div className="space-y-4">
                {isSignUp && (
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="John Doe"
                    />
                    <div className="absolute left-3 top-2.5 text-gray-400">
                        <span className="text-xs">👤</span>
                    </div>
                  </div>
                </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="you@company.com"
                        required
                    />
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="••••••••"
                        required
                        minLength={6}
                    />
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
            </div>

            {error && (
              <div className="p-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="p-3 flex items-start gap-2 text-sm text-green-600 bg-green-50 rounded-md border border-green-100">
                <span>{message}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base shadow-lg hover:shadow-xl transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing in...'}
                </>
              ) : (
                <span className="flex items-center gap-2">
                  {isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
            
            <div className="text-center text-xs text-gray-500">
                By continuing, you agree to our Terms of Service and Privacy Policy.
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
