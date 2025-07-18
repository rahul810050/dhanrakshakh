'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, TrendingUp, Calculator, Brain, Users, FileText } from 'lucide-react';
import Loading from '@/components/layout/loading';

export default function HomePage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (loading) {
    return <Loading />;
  }

  if (user) {
    return <Loading />;
  }

  const features = [
    {
      icon: FileText,
      title: 'Smart Receipt Scanning',
      description: 'AI-powered OCR to automatically extract and categorize expenses from receipts',
    },
    {
      icon: Brain,
      title: 'AI Financial Advisor',
      description: 'Personalized investment advice and financial planning recommendations',
    },
    {
      icon: Calculator,
      title: 'SIP Calculator',
      description: 'Calculate returns on systematic investment plans with detailed projections',
    },
    {
      icon: Shield,
      title: 'Tax Optimization',
      description: 'Maximize your tax savings with intelligent planning strategies',
    },
    {
      icon: TrendingUp,
      title: 'Real-time Insights',
      description: 'Live financial analytics and spending pattern recognition',
    },
    {
      icon: Users,
      title: 'Family Planning',
      description: 'Retirement planning and financial education for all ages',
    },
  ];

  return (
    <div className="min-h-screen bg-[#e5e7eb]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-[#2f8c8c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-[#81dbe0] rounded-full flex items-center justify-center">
                <span className="text-[#2b2731] font-bold text-lg">DR</span>
              </div>
              <span className="text-[#2b2731] font-bold text-2xl">DhanRakshak</span>
            </div>
            <Button
              onClick={signInWithGoogle}
              className="bg-[#81dbe0] hover:bg-[#4e7e93] text-[#2b2731] font-medium transition-colors duration-200"
            >
              Sign In with Google
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-[#2b2731] mb-6">
            Your AI-Powered
            <span className="text-[#4e7e93] block">Financial Guardian</span>
          </h1>
          <p className="text-xl text-[#2b2731] mb-8 max-w-3xl mx-auto">
            DhanRakshak combines cutting-edge AI with comprehensive financial tools to help you make smarter money decisions,
            optimize your investments, and secure your financial future.
          </p>
          <Button
            onClick={signInWithGoogle}
            size="lg"
            className="bg-[#81dbe0] hover:bg-[#4e7e93] text-[#2b2731] font-semibold text-lg px-8 py-3 transition-colors duration-200"
          >
            Start Your Financial Journey
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-[#2b2731] text-center mb-12">
            Comprehensive Financial Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-[#c2dedb] border-[#2f8c8c] hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <feature.icon className="w-10 h-10 text-[#4e7e93] mb-4" />
                  <CardTitle className="text-[#2b2731]">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-[#2b2731]">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#c2dedb]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#2b2731] mb-6">
            Ready to Take Control of Your Finances?
          </h2>
          <p className="text-lg text-[#2b2731] mb-8">
            Join thousands of users who trust DhanRakshak for their financial planning needs.
          </p>
          <Button
            onClick={signInWithGoogle}
            size="lg"
            className="bg-[#81dbe0] hover:bg-[#4e7e93] text-[#2b2731] font-semibold text-lg px-8 py-3 transition-colors duration-200"
          >
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2b2731] text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-[#81dbe0] rounded-full flex items-center justify-center">
              <span className="text-[#2b2731] font-bold text-sm">DR</span>
            </div>
            <span className="text-white font-bold text-xl">DhanRakshak</span>
          </div>
          <p className="text-gray-300 mb-4">
            Secure, intelligent, and comprehensive financial management for everyone.
          </p>
          <div className="flex justify-center space-x-6 text-sm">
            <a href="#" className="hover:text-[#81dbe0] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#81dbe0] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#81dbe0] transition-colors">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}