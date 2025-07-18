'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/navbar';
import Loading from '@/components/layout/loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ExpenseChart from '@/components/charts/expense-chart';
import { realtimeDB, fiMoneyAPI } from '@/lib/database';
import { 
  Upload, 
  Calculator, 
  TrendingUp, 
  Shield, 
  Users, 
  Brain, 
  FileText, 
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      // Load user profile and expenses
      const loadUserData = async () => {
        try {
          const profileData = await fiMoneyAPI.getProfile(user.uid);
          setProfile(profileData);

          // Listen for real-time expense updates
          const unsubscribe = realtimeDB.onUserExpensesChange(user.uid, (expensesData) => {
            setExpenses(expensesData);
            setLoadingData(false);
          });

          return unsubscribe;
        } catch (error) {
          console.error('Error loading user data:', error);
          setLoadingData(false);
        }
      };

      loadUserData();
    }
  }, [user]);

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Loading />;
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const thisMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date || expense.timestamp);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  }).reduce((sum, expense) => sum + (expense.amount || 0), 0);

  // Group expenses by category for chart
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Other';
    acc[category] = (acc[category] || 0) + (expense.amount || 0);
    return acc;
  }, {});

  const chartData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    category,
    amount: amount as number,
    color: '#81dbe0',
  }));

  const quickActions = [
    {
      title: 'Upload Receipt',
      description: 'Scan and track new expenses',
      icon: Upload,
      href: '/receipt-upload',
      color: 'bg-[#81dbe0]',
    },
    {
      title: 'SIP Calculator',
      description: 'Calculate investment returns',
      icon: Calculator,
      href: '/sip-calculator',
      color: 'bg-[#4e7e93]',
    },
    {
      title: 'Financial Advisor',
      description: 'Get AI-powered advice',
      icon: Brain,
      href: '/financial-advisor',
      color: 'bg-[#2f8c8c]',
    },
    {
      title: 'Tax Optimizer',
      description: 'Maximize your savings',
      icon: Shield,
      href: '/tax-optimizer',
      color: 'bg-[#c2dedb]',
    },
  ];

  return (
    <div className="min-h-screen bg-[#e5e7eb]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2b2731] mb-2">
            Welcome back, {user.displayName?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-[#2b2731] opacity-80">
            Here's your financial overview for today
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#c2dedb] border-[#2f8c8c]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#2b2731]">Total Balance</CardTitle>
              <IndianRupee className="h-4 w-4 text-[#4e7e93]" />
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-[#2b2731]">
                  ₹{profile?.balance?.toLocaleString() || '0'}
                </div>
              )}
              <p className="text-xs text-[#2b2731] opacity-70">
                <ArrowUpRight className="h-3 w-3 inline mr-1" />
                +2.5% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#c2dedb] border-[#2f8c8c]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#2b2731]">This Month</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-[#2b2731]">
                  -₹{thisMonthExpenses.toLocaleString()}
                </div>
              )}
              <p className="text-xs text-[#2b2731] opacity-70">
                Monthly expenses
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#c2dedb] border-[#2f8c8c]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#2b2731]">Investments</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-[#2b2731]">
                  ₹{profile?.investments?.toLocaleString() || '0'}
                </div>
              )}
              <p className="text-xs text-[#2b2731] opacity-70">
                <ArrowUpRight className="h-3 w-3 inline mr-1" />
                +5.2% portfolio growth
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#c2dedb] border-[#2f8c8c]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#2b2731]">Receipts</CardTitle>
              <FileText className="h-4 w-4 text-[#4e7e93]" />
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold text-[#2b2731]">
                  {expenses.length}
                </div>
              )}
              <p className="text-xs text-[#2b2731] opacity-70">
                Total scanned receipts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[#2b2731] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className="bg-[#c2dedb] border-[#2f8c8c] hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-[#2b2731] mb-2">{action.title}</h3>
                    <p className="text-sm text-[#2b2731] opacity-70">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-[#c2dedb] border-[#2f8c8c]">
            <CardHeader>
              <CardTitle className="text-[#2b2731]">Expense Breakdown</CardTitle>
              <CardDescription className="text-[#2b2731] opacity-70">
                Your spending by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <Skeleton className="h-[300px] w-full" />
              ) : chartData.length > 0 ? (
                <ExpenseChart data={chartData} type="pie" />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-[#2b2731] opacity-70">
                  No expenses recorded yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#c2dedb] border-[#2f8c8c]">
            <CardHeader>
              <CardTitle className="text-[#2b2731]">Recent Activity</CardTitle>
              <CardDescription className="text-[#2b2731] opacity-70">
                Your latest transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {expenses.slice(0, 5).map((expense, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#81dbe0] rounded-full flex items-center justify-center">
                          <span className="text-[#2b2731] text-xs font-medium">
                            {expense.category?.[0] || 'E'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-[#2b2731]">{expense.vendor || 'Unknown'}</p>
                          <p className="text-sm text-[#2b2731] opacity-70">{expense.category || 'Other'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-[#2b2731]">-₹{expense.amount}</p>
                        <p className="text-sm text-[#2b2731] opacity-70">
                          {new Date(expense.date || expense.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <div className="text-center py-8 text-[#2b2731] opacity-70">
                      No recent transactions
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}