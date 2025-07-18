'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import Loading from '@/components/layout/loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { firestoreDB } from '@/lib/database';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Calculator, TrendingUp, Target, PiggyBank } from 'lucide-react';

export default function SIPCalculatorPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [monthlyAmount, setMonthlyAmount] = useState(5000);
  const [annualReturn, setAnnualReturn] = useState(12);
  const [investmentPeriod, setInvestmentPeriod] = useState(10);
  const [results, setResults] = useState<any>(null);
  const [yearlyData, setYearlyData] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    calculateSIP();
  }, [monthlyAmount, annualReturn, investmentPeriod]);

  const calculateSIP = () => {
    const monthlyRate = annualReturn / 100 / 12;
    const totalMonths = investmentPeriod * 12;
    const totalInvestment = monthlyAmount * totalMonths;
    
    // Future Value calculation
    const futureValue = monthlyAmount * (((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate));
    const totalReturns = futureValue - totalInvestment;
    
    const calculatedResults = {
      monthlyAmount,
      totalInvestment,
      futureValue: Math.round(futureValue),
      totalReturns: Math.round(totalReturns),
      annualReturn,
      investmentPeriod,
    };

    setResults(calculatedResults);

    // Generate yearly data for chart
    const yearly = [];
    let cumulativeInvestment = 0;
    let cumulativeValue = 0;
    
    for (let year = 1; year <= investmentPeriod; year++) {
      const months = year * 12;
      cumulativeInvestment = monthlyAmount * months;
      cumulativeValue = monthlyAmount * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
      
      yearly.push({
        year,
        investment: Math.round(cumulativeInvestment),
        value: Math.round(cumulativeValue),
        returns: Math.round(cumulativeValue - cumulativeInvestment),
      });
    }
    
    setYearlyData(yearly);
  };

  const saveSIPCalculation = async () => {
    if (!user || !results) return;

    setSaving(true);
    try {
      await firestoreDB.saveSIPCalculation(user.uid, {
        ...results,
        calculatedAt: new Date(),
      });

      toast({
        title: 'SIP calculation saved!',
        description: 'Your investment plan has been saved to your profile.',
      });
    } catch (error) {
      toast({
        title: 'Error saving calculation',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    router.push('/');
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-[#e5e7eb]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2b2731] mb-2">SIP Calculator</h1>
          <p className="text-[#2b2731] opacity-80">
            Calculate your Systematic Investment Plan returns and plan your financial future
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calculator Input */}
          <Card className="bg-[#c2dedb] border-[#2f8c8c]">
            <CardHeader>
              <CardTitle className="text-[#2b2731] flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Investment Parameters
              </CardTitle>
              <CardDescription className="text-[#2b2731] opacity-70">
                Adjust your investment details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="monthlyAmount" className="text-[#2b2731] mb-2 block">
                  Monthly Investment Amount (₹)
                </Label>
                <Input
                  id="monthlyAmount"
                  type="number"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(parseInt(e.target.value) || 0)}
                  className="bg-white border-[#2f8c8c] text-[#2b2731]"
                  min="100"
                  max="1000000"
                />
                <Slider
                  value={[monthlyAmount]}
                  onValueChange={(value) => setMonthlyAmount(value[0])}
                  max={50000}
                  min={100}
                  step={100}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="annualReturn" className="text-[#2b2731] mb-2 block">
                  Expected Annual Return (%)
                </Label>
                <Input
                  id="annualReturn"
                  type="number"
                  value={annualReturn}
                  onChange={(e) => setAnnualReturn(parseFloat(e.target.value) || 0)}
                  className="bg-white border-[#2f8c8c] text-[#2b2731]"
                  min="1"
                  max="30"
                  step="0.1"
                />
                <Slider
                  value={[annualReturn]}
                  onValueChange={(value) => setAnnualReturn(value[0])}
                  max={25}
                  min={1}
                  step={0.5}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="investmentPeriod" className="text-[#2b2731] mb-2 block">
                  Investment Period (Years)
                </Label>
                <Input
                  id="investmentPeriod"
                  type="number"
                  value={investmentPeriod}
                  onChange={(e) => setInvestmentPeriod(parseInt(e.target.value) || 0)}
                  className="bg-white border-[#2f8c8c] text-[#2b2731]"
                  min="1"
                  max="40"
                />
                <Slider
                  value={[investmentPeriod]}
                  onValueChange={(value) => setInvestmentPeriod(value[0])}
                  max={30}
                  min={1}
                  step={1}
                  className="mt-2"
                />
              </div>

              <Button
                onClick={saveSIPCalculation}
                className="w-full bg-[#81dbe0] hover:bg-[#4e7e93] text-[#2b2731]"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save This Plan'}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="bg-[#c2dedb] border-[#2f8c8c]">
            <CardHeader>
              <CardTitle className="text-[#2b2731] flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Investment Results
              </CardTitle>
              <CardDescription className="text-[#2b2731] opacity-70">
                Your projected returns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-[#2f8c8c]">
                    <div>
                      <p className="text-sm text-[#2b2731] opacity-70">Monthly Investment</p>
                      <p className="text-2xl font-bold text-[#2b2731]">₹{results.monthlyAmount.toLocaleString()}</p>
                    </div>
                    <PiggyBank className="w-8 h-8 text-[#4e7e93]" />
                  </div>

                  <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-[#2f8c8c]">
                    <div>
                      <p className="text-sm text-[#2b2731] opacity-70">Total Investment</p>
                      <p className="text-2xl font-bold text-[#2b2731]">₹{results.totalInvestment.toLocaleString()}</p>
                    </div>
                    <Target className="w-8 h-8 text-[#4e7e93]" />
                  </div>

                  <div className="flex justify-between items-center p-4 bg-[#81dbe0] rounded-lg">
                    <div>
                      <p className="text-sm text-[#2b2731] opacity-70">Future Value</p>
                      <p className="text-2xl font-bold text-[#2b2731]">₹{results.futureValue.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-[#2b2731]" />
                  </div>

                  <div className="flex justify-between items-center p-4 bg-green-100 rounded-lg border border-green-300">
                    <div>
                      <p className="text-sm text-green-800">Total Returns</p>
                      <p className="text-2xl font-bold text-green-800">₹{results.totalReturns.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-800">Growth</p>
                      <p className="text-lg font-semibold text-green-800">
                        {((results.totalReturns / results.totalInvestment) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Key Benefits */}
          <Card className="bg-[#c2dedb] border-[#2f8c8c]">
            <CardHeader>
              <CardTitle className="text-[#2b2731]">SIP Benefits</CardTitle>
              <CardDescription className="text-[#2b2731] opacity-70">
                Why SIP is a smart choice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-[#81dbe0] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-[#2b2731] text-xs font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2b2731]">Rupee Cost Averaging</h4>
                    <p className="text-sm text-[#2b2731] opacity-70">
                      Reduces the impact of market volatility by investing regularly
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-[#81dbe0] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-[#2b2731] text-xs font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2b2731]">Compounding Power</h4>
                    <p className="text-sm text-[#2b2731] opacity-70">
                      Your returns generate their own returns over time
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-[#81dbe0] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-[#2b2731] text-xs font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2b2731]">Disciplined Investing</h4>
                    <p className="text-sm text-[#2b2731] opacity-70">
                      Automated investing helps build wealth systematically
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-[#81dbe0] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-[#2b2731] text-xs font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2b2731]">Flexible Amounts</h4>
                    <p className="text-sm text-[#2b2731] opacity-70">
                      Start with as little as ₹100 and increase over time
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <Card className="bg-[#c2dedb] border-[#2f8c8c]">
            <CardHeader>
              <CardTitle className="text-[#2b2731]">Growth Over Time</CardTitle>
              <CardDescription className="text-[#2b2731] opacity-70">
                Investment vs Returns over {investmentPeriod} years
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value) => [`₹${(value as number).toLocaleString()}`, '']} />
                  <Line type="monotone" dataKey="investment" stroke="#4e7e93" strokeWidth={2} name="Investment" />
                  <Line type="monotone" dataKey="value" stroke="#81dbe0" strokeWidth={3} name="Value" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-[#c2dedb] border-[#2f8c8c]">
            <CardHeader>
              <CardTitle className="text-[#2b2731]">Annual Returns</CardTitle>
              <CardDescription className="text-[#2b2731] opacity-70">
                Year-wise return breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value) => [`₹${(value as number).toLocaleString()}`, '']} />
                  <Bar dataKey="returns" fill="#81dbe0" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}