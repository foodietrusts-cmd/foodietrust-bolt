import React, { useState } from 'react';
import { X, Mail, Lock, User, MapPin, ChefHat, Camera, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  promptMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login',
  promptMessage 
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    location: '',
    cuisines: [] as string[],
    spiceLevel: 'medium' as const,
    dietaryRestrictions: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register } = useAuth();

  if (!isOpen) return null;

  const socialProviders = [
    { provider: 'google' as const, name: 'Google', icon: '🔍', color: 'bg-red-500 hover:bg-red-600' },
    { provider: 'meta' as const, name: 'Facebook', icon: '📘', color: 'bg-blue-600 hover:bg-blue-700' },
    { provider: 'apple' as const, name: 'Apple', icon: '🍎', color: 'bg-gray-900 hover:bg-black' }
  ];

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Simulate social login
      await new Promise(resolve => setTimeout(resolve, 1500));
      const success = await login(`user@${provider}.com`, 'social-login');
      if (success) {
        onClose();
      } else {
        setError('Social login failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during social login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let success = false;
      
      if (mode === 'login') {
        success = await login(formData.email, formData.password);
      } else {
        success = await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          location: formData.location,
          preferences: {
            cuisines: formData.cuisines,
            spiceLevel: formData.spiceLevel,
            dietaryRestrictions: formData.dietaryRestrictions
          }
        });
      }

      if (success) {
        onClose();
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const cuisineOptions = ['Indian', 'Chinese', 'Italian', 'Mexican', 'Thai', 'Mediterranean', 'Japanese', 'Korean'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {mode === 'login' ? 'Welcome Back!' : 'Join FoodieTrust'}
                </h2>
                <p className="text-sm text-gray-600">
                  {mode === 'login' ? 'Sign in to share your food experiences' : 'Start sharing authentic food reviews'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Prompt Message */}
          {promptMessage && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <Camera className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-900 mb-1">Join Our Community!</h4>
                  <p className="text-sm text-orange-700">{promptMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <p className="text-center text-sm text-gray-600 mb-3">
              {mode === 'login' ? 'Sign in with:' : 'Quick signup with:'}
            </p>
            {socialProviders.map((provider) => (
              <button
                key={provider.provider}
                onClick={() => handleSocialLogin(provider.provider)}
                disabled={isLoading}
                className={`w-full flex items-center justify-center space-x-3 py-3 px-4 rounded-xl text-white font-semibold transition-all duration-200 ${provider.color} disabled:opacity-50`}
              >
                <span className="text-lg">{provider.icon}</span>
                <span>Continue with {provider.name}</span>
              </button>
            ))}
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter your city"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Favorite Cuisines (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {cuisineOptions.map(cuisine => (
                      <button
                        key={cuisine}
                        type="button"
                        onClick={() => {
                          const newCuisines = formData.cuisines.includes(cuisine)
                            ? formData.cuisines.filter(c => c !== cuisine)
                            : [...formData.cuisines, cuisine];
                          setFormData({ ...formData, cuisines: newCuisines });
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          formData.cuisines.includes(cuisine)
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-orange-50'
                        }`}
                      >
                        {cuisine}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* Community Benefits */}
          {mode === 'register' && (
            <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Star className="w-4 h-4 text-orange-500 mr-2" />
                Join Our Food Community
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Share authentic reviews with photos</li>
                <li>• Help others discover amazing dishes</li>
                <li>• Build your foodie reputation</li>
                <li>• Get personalized recommendations</li>
              </ul>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              {mode === 'login' 
                ? "Don't have an account? Join the community" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};