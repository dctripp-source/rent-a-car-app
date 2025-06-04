'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { LogIn, Mail, Lock, Car } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      console.log('Login successful:', userCredential.user.email);
      
      // Dodajte malu pauzu da bi se token postavio
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Koristite window.location umjesto router.push za potpuni refresh
      window.location.href = '/dashboard';
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Detaljnije error poruke
      if (error.code === 'auth/user-not-found') {
        setError('Korisnik sa ovom email adresom ne postoji');
      } else if (error.code === 'auth/wrong-password') {
        setError('Pogrešna lozinka');
      } else if (error.code === 'auth/invalid-email') {
        setError('Neispravna email adresa');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Previše pokušaja. Pokušajte ponovo kasnije');
      } else if (error.code === 'auth/invalid-credential') {
        setError('Neispravni podaci za prijavu. Provjerite email i lozinku.');
      } else {
        setError('Greška: ' + (error.message || 'Neispravni podaci za prijavu'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        {/* Logo i naslov */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Car className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Novera Rent
          </h1>
          <p className="text-gray-600">
            Prijavite se na svoj nalog
          </p>
        </div>

        {/* Forma */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error poruka */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Email polje */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email adresa
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="vas@email.com"
                />
              </div>
            </div>

            {/* Password polje */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Lozinka
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Zapamti me i Zaboravljena lozinka */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Zapamti me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Zaboravili ste lozinku?
                </a>
              </div>
            </div>

            {/* Submit dugme */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Prijavljivanje...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Prijavite se
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          {/* <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ili</span>
              </div>
            </div>
          </div> */}

          {/* Link za registraciju */}
          {/* <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">
              Nemate nalog?{' '}
              <Link 
                href="/auth/register" 
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Registrujte se
              </Link>
            </span>
          </div> */}
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-xs text-gray-500">
          © 2025 Novera Rent. Sva prava zadržana | Made by <a href='https://qodevision.com' rel="_noopener" target='_blank'>QODE VISION</a>
        </p>
      </div>
    </div>
  );
}