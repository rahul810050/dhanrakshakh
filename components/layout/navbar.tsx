'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { useAuth } from '@/lib/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Home, 
  Upload, 
  Calculator, 
  TrendingUp,
  PiggyBank,
  FileText
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Receipt Upload', href: '/receipt-upload', icon: Upload },
  { name: 'SIP Calculator', href: '/sip-calculator', icon: Calculator },
  { name: 'Financial Advisor', href: '/financial-advisor', icon: TrendingUp },
  { name: 'Retirement Plans', href: '/retirement-plans', icon: PiggyBank },
  { name: 'Tax Optimizer', href: '/tax-optimizer', icon: FileText },
];

// Mock user data - replace with your actual auth context


interface NavLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ href, icon: Icon, children, onClick }) => (
  <Link
    href={href}
    onClick={onClick}
    className="group relative flex flex-col items-center justify-center z-10"
  >
    <div className="relative w-12 h-12 bg-gradient-to-br from-[#4e7e93] to-[#26566b] text-white rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ease-out group-hover:scale-110 group-hover:shadow-xl group-hover:from-[#5a8ea5] group-hover:to-[#2f6b82] group-active:scale-105 z-20">
      <Icon className="w-5 h-5" />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>

    {/* Tooltip below icon */}
    <div className="absolute top-14 bg-[#2b2731] text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100 -translate-y-2 group-hover:translate-y-0 ease-out z-30 whitespace-nowrap pointer-events-none">
      {children}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 bg-[#2b2731] rotate-45" />
    </div>
  </Link>
);



export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  

  if (!user) return null;

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-xl border-b border-[#2f8c8c]/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-[#81dbe0] to-[#2f8c8c] rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                  <span className="text-[#2b2731] font-bold text-lg">DR</span>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[#2b2731] font-bold text-2xl tracking-tight">DhanRakshak</span>
                <span className="text-[#4e7e93] text-xs font-medium -mt-1">Financial Guardian</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-12 z-0">
            {navigation.map((item) => (
              <NavLink key={item.name} href={item.href} icon={item.icon}>
                {item.name}
              </NavLink>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-12 w-12 rounded-2xl p-0 hover:bg-gray-100/80 transition-all duration-200">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-[#81dbe0] to-[#2f8c8c] text-[#2b2731] font-semibold">
                      {user.displayName?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 mr-4" align="end">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-[#2b2731]">{user.displayName}</p>
                  <p className="text-xs text-[#4e7e93] mt-1">{user.email}</p>
                </div>
                <DropdownMenuItem 
                  // onClick={handleProfileClick}
                  className="flex items-center space-x-3 py-3 hover:bg-[#81dbe0]/10 cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#4e7e93]" />
                  <span className="text-[#2b2731]">Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={logout} 
                  className="flex items-center space-x-3 py-3 text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button  
              variant="ghost"
              className="lg:hidden h-12 w-12 rounded-2xl hover:bg-[#81dbe0]/20 transition-all duration-200"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="w-6 h-6 text-[#2b2731]" />
              ) : (
                <Menu className="w-6 h-6 text-[#2b2731]" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-md border-t border-[#2f8c8c]/20 shadow-lg">
          <div className="px-6 py-6 space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-4 p-4 rounded-2xl text-[#2b2731] hover:bg-gradient-to-r hover:from-[#81dbe0]/20 hover:to-transparent hover:text-[#26566b] transition-all duration-300 group"
                onClick={() => setIsOpen(false)}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#4e7e93] to-[#26566b] text-white rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-semibold text-base">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}