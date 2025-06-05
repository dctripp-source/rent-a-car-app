// app/dashboard/layout.tsx
'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Car, 
  Users, 
  Home, 
  LogOut, 
  Menu,
  X,
  Settings,
  FileText
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Refresh dashboard kada se vratite na dashboard stranicu
    if (pathname === '/dashboard') {
      // Trigger refresh
      window.dispatchEvent(new Event('dashboard-refresh'));
    }
  }, [pathname]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Čekajte da se auth state učita
        if (loading) return;
        
        console.log('Auth check - User:', user?.email);
        
        if (!user) {
          console.log('No user found, redirecting to login');
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };

    checkAuth();
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/calendar', label: 'Kalendar', icon: Calendar },
    { href: '/dashboard/vehicles', label: 'Vozila', icon: Car },
    { href: '/dashboard/clients', label: 'Klijenti', icon: Users },
    
    { href: '/dashboard/contracts', label: 'Ugovori', icon: FileText }, // Dodano ako nije postojalo
  { href: '/dashboard/settings', label: 'Podešavanja', icon: Settings }, // NOVO
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Promijenjena boja u #03346E */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#03346E] shadow-lg transform transition-transform md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-blue-800">
          <h1 className="text-xl font-bold text-white">Novera Rent</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-6 py-3 text-white hover:bg-blue-800 transition-colors ${
                  isActive ? 'bg-blue-800 border-r-4 border-blue-400' : ''
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-6">
          <div className="border-t border-blue-800 pt-4">
            <p className="text-sm text-gray-300 mb-3">{user.email}</p>
            <button
              onClick={handleLogout}
              className="flex items-center text-white hover:text-gray-300 transition-colors"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Odjavi se
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="md:ml-64">
        {/* Mobile header - Promijenjena boja */}
        <header className="bg-[#03346E] shadow-sm md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-white"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-white">Novera Rent</h1>
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}