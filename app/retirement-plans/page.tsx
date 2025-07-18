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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { firestoreDB } from '@/lib/database';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Target, TrendingUp, Shield, Calculator, PiggyBank } from 'lucide-react';

export default function RetirementPlansPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(60);
  const [currentIncome, setCurrentIncome] = useState(100000);
  const [expectedExpenses, setExpectedExpenses] = useState(80000);
  const [currentSavings, setCurrentSavings] = useState(500000);
  const [inflationRate, setInflationRate] = useState(6);
  const [expectedReturn, setExpectedReturn] = useState(10);
  const [retirementPlan, setRetirementPlan] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    calculateRetirementPlan();
  }, [currentAge, retirementAge, currentIncome, expectedExpenses, currentSavings, inflationRate, expectedReturn]);

  const calculateRetirementPlan = () => {
    const yearsToRetirement = retirementAge - currentAge;
    const yearsInRetirement = 85 - retirementAge; // Assuming life expectancy of 85

    // Calculate future value of current savings
    const futureCurrentSavings = currentSavings * Math.pow(1 + expectedReturn / 100, yearsToRetirement);

    // Calculate retirement corpus needed
    const monthlyExpensesAtRetirement = expectedExpenses * Math.pow(1 + inflationRate / 100, yearsToRetirement);
    const annualExpensesAtRetirement = monthlyExpensesAtRetirement * 12;
    
    // Using 4% withdrawal rule adjusted for inflation
    const corpusNeeded = annualExpensesAtRetirement * 25;

    // Calculate additional corpus needed
    const additionalCorpusNeeded = Math.max(0, corpusNeeded - futureCurrentSavings);

    // Calculate monthly SIP needed
    const monthlyRate = expectedReturn / 100 / 12;
    const totalMonths = yearsToRetirement * 12;
    const monthlySIPNeeded = additionalCorpusNeeded / (((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate));

    const plan = {
      currentAge,
      retirementAge,
      yearsToRetirement,
      yearsInRetirement,
      currentIncome,
      expectedExpenses,
      currentSavings,
      futureCurrentSavings,
      corpusNeeded,
      additionalCorpusNeeded,
      monthlySIPNeeded: Math.max(0, monthlySIPNeeded),
      monthlyExpensesAtRetirement,
      annualExpensesAtRetirement,
      inflationRate,
      expectedReturn,
    };

    setRetirementPlan(plan);

    // Generate chart data
    const years = [];
    let cumulativeAmount = currentSavings;
    
    for (let year = 0; year <= yearsToRetirement; year++) {
      const age = currentAge + year;
      const yearlyInvestment = monthlySIPNeeded * 12;
      
      if (year > 0) {
        cumulativeAmount = (cumulativeAmount + yearlyInvestment) * (1 + expectedReturn / 100);
      }
      
      years.push({
        age,
        year,
        corpus: Math.round(cumulativeAmount),
        target: Math.round(corpusNeeded),
      });
    }
    
    setChartData(years);
  };

  const saveRetirementPlan = async () => {
    if (!user || !retirementPlan) return;

    setSaving(true);
    try {
      await firestoreDB.saveTaxOptimization(user.uid, {
        type: 'retirement',
        ...retirementPlan,
        calculatedAt: new Date(),
      });

      toast({
        title: 'Retirement plan saved!',
        description: 'Your retirement strategy has been saved to your profile.',
      });
    } catch (error) {
      toast({
        title: 'Error saving plan',
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
          <h1 className="text-3xl font-bold text-[#2b2731] mb-2">Retirement Planner</h1>
          <p className="text-[#2b2731] opacity-80">
            Plan your retirement with precision and secure your golden years
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <Card className="bg-[#c2dedb] border-[#2f8c8c]">
            <CardHeader>
              <CardTitle className="text-[#2b2731] flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Planning Parameters
              </CardTitle>
              <CardDescription className="text-[#2b2731] opacity-70">
                Enter your current financial details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="currentAge" className="text-[#2b2731] mb-2 block">
                  Current Age: {currentAge} years
                </Label>
                <Slider
                  value={[currentAge]}
                  onValueChange={(value) => setCurrentAge(value[0])}
                  max={60}
                  min={18}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="retirementAge" className="text-[#2b2731] mb-2 block">
                  Retirement Age: {retirementAge} years
                </Label>
                <Slider
                  value={[retirementAge]}
                  onValueChange={(value) => setRetirementAge(value[0])}
                  max={70}
                  min={50}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="currentIncome" className="text-[#2b2731] mb-2 block">
                  Current Monthly Income (₹)
                </Label>
                <Input
                  id="currentIncome"
                  type="number"
                  value={currentIncome}
                  onChange={(e) => setCurrentIncome(parseInt(e.target.value) || 0)}
                  className="bg-white border-[#2f8c8c] text-[#2b2731]"
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="expectedExpenses" className="text-[#2b2731] mb-2 block">
                  Expected Monthly Expenses in Retirement (₹)
                </Label>
                <Input
                  id="expectedExpenses"
                  type="number"
                  value={expectedExpenses}
                  onChange={(e) => setExpectedExpenses(parseInt(e.target.value) || 0)}
                  className="bg-white border-[#2f8c8c] text-[#2b2731]"
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="currentSavings" className="text-[#2b2731] mb-2 block">
                  Current Savings/Investments (₹)
                </Label>
                <Input
                  id="currentSavings"
                  type="number"
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(parseInt(e.target.value) || 0)}
                  className="bg-white border-[#2f8c8c] text-[#2b2731]"
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="inflationRate" className="text-[#2b2731] mb-2 block">
                  Expected Inflation Rate: {inflationRate}%
                </Label>
                <Slider
                  value={[inflationRate]}
                  onValueChange={(value) => setInflationRate(value[0])}
                  max={10}
                  min={3}
                  step={0.5}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="expectedReturn" className="text-[#2b2731] mb-2 block">
                  Expected Return: {expectedReturn}%
                </Label>
                <Slider
                  value={[expectedReturn]}
                  onValueChange={(value) => setExpectedReturn(value[0])}
                  max={15}
                  min={6}
                  step={0.5}
                  className="mt-2"
                />
              </div>

              <Button
                onClick={saveRetirementPlan}
                className="w-full bg-[#81dbe0] hover:bg-[#4e7e93] text-[#2b2731]"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Retirement Plan'}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="bg-[#c2dedb] border-[#2f8c8c]">
            <CardHeader>
              <CardTitle className="text-[#2b2731] flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Retirement Goal
              </CardTitle>
              <CardDescription className="text-[#2b2731] opacity-70">
                Your retirement corpus requirement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {retirementPlan && (
                <div className="space-y-4">
                  <div className="text-center p-6 bg-[#81dbe0] rounded-lg">
                    <h3 className="text-3xl font-bold text-[#2b2731] mb-2">
                      ₹{(retirementPlan.corpusNeeded / 10000000).toFixed(1)}Cr
                    </h3>
                    <p className="text-[#2b2731] opacity-80">Retirement Corpus Needed</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-[#2f8c8c]">
                      <p className="text-sm text-[#2b2731] opacity-70">Years to Retirement</p>
                      <p className="text-xl font-bold text-[#2b2731]">{retirementPlan.yearsToRetirement}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-[#2f8c8c]">
                      <p className="text-sm text-[#2b2731] opacity-70">Monthly SIP Needed</p>
                      <p className="text-xl font-bold text-[#2b2731]">₹{Math.round(retirementPlan.monthlySIPNeeded).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-[#2f8c8c]">
                    <p className="text-sm text-[#2b2731] opacity-70">Monthly Expenses at Retirement</p>
                    <p className="text-xl font-bold text-[#2b2731]">₹{Math.round(retirementPlan.monthlyExpensesAtRetirement).toLocaleString()}</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-[#2f8c8c]">
                    <p className="text-sm text-[#2b2731] opacity-70">Future Value of Current Savings</p>
                    <p className="text-xl font-bold text-[#2b2731]">₹{Math.round(retirementPlan.futureCurrentSavings).toLocaleString()}</p>
                  </div>

                  <div className="bg-green-100 p-4 rounded-lg border border-green-300">
                    <p className="text-sm text-green-800">Additional Corpus Needed</p>
                    <p className="text-xl font-bold text-green-800">₹{Math.round(retirementPlan.additionalCorpusNeeded).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Retirement Tips */}
          <Card className="bg-[#c2dedb] border-[#2f8c8c]">
            <CardHeader>
              <CardTitle className="text-[#2b2731] flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Senior Citizen Benefits
              </CardTitle>
              <CardDescription className="text-[#2b2731] opacity-70">
                Special advantages for seniors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-[#81dbe0] rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-[#2b2731]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2b2731]">Higher Tax Exemption</h4>
                    <p className="text-sm text-[#2b2731] opacity-70">
                      Income up to ₹3L is tax-free for seniors (60-80 years)
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-[#81dbe0] rounded-full flex items-center justify-center flex-shrink-0">
                    <PiggyBank className="w-4 h-4 text-[#2b2731]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2b2731]">Senior Citizen FD Rates</h4>
                    <p className="text-sm text-[#2b2731] opacity-70">
                      Extra 0.5% interest on fixed deposits
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-[#81dbe0] rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-[#2b2731]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2b2731]">Health Insurance Deduction</h4>
                    <p className="text-sm text-[#2b2731] opacity-70">
                      Up to ₹50,000 deduction under Section 80D
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-[#81dbe0] rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-[#2b2731]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2b2731]">Pension Schemes</h4>
                    <p className="text-sm text-[#2b2731] opacity-70">
                      Access to government and private pension plans
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Growth Chart */}
        <Card className="bg-[#c2dedb] border-[#2f8c8c] mt-8">
          <CardHeader>
            <CardTitle className="text-[#2b2731]">Retirement Corpus Growth</CardTitle>
            <CardDescription className="text-[#2b2731] opacity-70">
              How your investments will grow over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age" />
                <YAxis tickFormatter={(value) => `₹${(value / 10000000).toFixed(1)}Cr`} />
                <Tooltip formatter={(value) => [`₹${(value as number).toLocaleString()}`, '']} />
                <Line type="monotone" dataKey="corpus" stroke="#81dbe0" strokeWidth={3} name="Your Corpus" />
                <Line type="monotone" dataKey="target" stroke="#4e7e93" strokeWidth={2} strokeDasharray="5 5" name="Target Corpus" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}