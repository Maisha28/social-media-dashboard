'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string>('');
  const [postsCount, setPostsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const email = localStorage.getItem('userEmail') || 'demo@example.com';
    setUserEmail(email);
    fetchPostsCount();
  }, []);

  const fetchPostsCount = async () => {
    try {
      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      if (error) {
        setPostsCount(12);
      } else {
        setPostsCount(count || 0);
      }
    } catch {
      setPostsCount(12);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊', badge: postsCount > 0 ? `${postsCount} posts` : '' },
    { name: 'Content', path: '/content', icon: '📱', badge: '' },
    { name: 'Compare', path: '/compare', icon: '📈', badge: '' },
    { name: 'Ask AI', path: '/ask-ai', icon: '🤖', badge: '' },
    { name: 'AI Insights', path: '/ai-insights', icon: '💡', badge: 'Live' },
    { name: 'Reports', path: '/reports', icon: '📄', badge: '' },
    { name: 'Predictions', path: '/predictions', icon: '📊', badge: 'Live' },
    { name: 'System Status', path: '/system-status', icon: '⚡', badge: 'New' },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <div className="w-64 bg-white h-screen shadow-lg fixed left-0 top-0 z-50 flex flex-col text-black">

      {/* Top */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-black flex items-center">
          <span className="mr-2">📊</span>
          SocialPulse
        </h1>
        <p className="text-sm text-black mt-1">Real-time Dashboard</p>
      </div>

      {/* Scrollable Middle */}
      <div className="flex-1 overflow-y-auto px-6">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center justify-between p-3 rounded-lg transition-all text-black ${
                isActive(item.path)
                  ? 'bg-indigo-50 border border-indigo-100'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium text-black">{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-black">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Bottom */}
      <div className="p-6 border-t border-gray-200">
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-black">Supabase</span>
            </div>
            {isLoading ? (
              <span className="text-xs text-black">Loading...</span>
            ) : (
              <span className="text-xs font-medium text-black">
                {postsCount} posts
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-black font-bold">
              {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-black truncate">Welcome!</p>
            <p className="text-sm text-black truncate">
              {userEmail}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full mt-4 p-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-black font-medium flex items-center justify-center space-x-2"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
