// app/auth/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { UserPlus, Mail, Lock, User, Car, CreditCard } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    id_number: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validacija
    if (formData.password !== formData.confirmPassword) {
      setError('Lozinke se ne poklapaju');
      return;
    }

    if (formData.password.length < 6) {
      setError('Lozinka mora imati najmanje 6 karaktera');
      return;
    }

    if (!formData.name.trim()) {
      setError('Ime i prezime su obavezni');
      return;
    }

    if (!formData.id_number.trim()) {
      setError('Broj lične karte je obavezan');
      return;
    }

    setLoading(true);

    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      console.log('Firebase user created:', userCredential.user.uid);

      // Update display name
      await updateProfile(userCredential.user, {
        displayName: formData.name,
      });

      // Get token for API call
      const token = await userCredential.user.getIdToken();
      console.log('Got auth token');

      // Create client in PostgreSQL - PROMJENA: dodao id_number
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          firebase_uid: userCredential.user.uid,
          name: formData.name,
          email: formData.email,
          id_number: formData.id_number,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('API error:', responseData);
        throw new Error(responseData.error || 'Greška pri kreiranju korisnika u bazi podataka');
      }

      console.log('Client created in database:', responseData);

      // Use window.location for full page refresh
      window.location.href = '/dashboard';
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Detaljnije error poruke
      if (error.code === 'auth/email-already-in-use') {
        setError('Email adresa je već u upotrebi');
      } else if (error.code === 'auth/invalid-email') {
        setError('Neispravna email adresa');
      } else if (error.code === 'auth/weak-password') {
        setError('Lozinka je preslaba. Koristite najmanje 6 karaktera');
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Greška pri registraciji. Pokušajte ponovo.');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">RentCar</h1>
          <p className="text-gray-600">Kreirajte svoj nalog</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ime i prezime <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Vaše ime i prezime"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Broj lične karte <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="id_number"
                  value={formData.id_number}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123456789"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email adresa <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="vas@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lozinka <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Najmanje 6 karaktera"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Potvrdite lozinku <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ponovite lozinku"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Kreiram nalog...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Kreiraj nalog
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Već imate nalog?{' '}
              <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                Prijavite se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}