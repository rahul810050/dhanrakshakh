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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { firestoreDB } from '@/lib/database';
import { Shield, Calculator, TrendingUp, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface TaxSavingOption {
  id: string;
  section: string;
  name: string;
  maxLimit: number;
  currentInvestment: number;
  suggestedInvestment: number;
  taxSaving: number;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export default function TaxOptimizerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [annualIncome, setAnnualIncome] = useState(1200000);
  const [taxRegime, setTaxRegime] = useState('old');
  const [deductions, setDeductions] = useState({
    section80C: 0,
    section80D: 0,
    section24B: 0,
    nps: 0,
  });
  const [taxSavingOptions, setTaxSavingOptions] = useState<TaxSavingOption[]>([]);
  const [totalTaxSaving, setTotalTaxSaving] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    calculateTaxOptimization();
  }, [annualIncome, taxRegime, deductions]);

  const calculateTaxOptimization = () => {
    const options: TaxSavingOption[] = [
      {
        id: '1',
        section: '80C',
        name: 'ELSS Mutual Funds',
        maxLimit: 150000,
        currentInvestment: deductions.section80C,
        suggestedInvestment: Math.min(150000, Math.max(0, 150000 - deductions.section80C)),
        taxSaving: 0,
        description: 'Tax-saving mutual funds with potential for high returns',
        priority: 'high',
      },
      {
        id: '2',
        section: '80D',
        name: 'Health Insurance Premium',
        maxLimit: 25000,
        currentInvestment: deductions.section80D,
        suggestedInvestment: Math.min(25000, Math.max(0, 25000 - deductions.section80D)),
        taxSaving: 0,
        description: 'Health insurance premiums for self and family',
        priority: 'high',
      },
      {
        id: '3',
        section: '24B',
        name: 'Home Loan Interest',
        maxLimit: 200000,
        currentInvestment: deductions.section24B,
        suggestedInvestment: Math.min(200000, Math.max(0, 200000 - deductions.section24B)),
        taxSaving: 0,
        description: 'Interest on home loan for self-occupied property',
        priority: 'medium',
      },
      {
        id: '4',
        section: '80CCD(1B)',
        name: 'NPS (National Pension System)',
        maxLimit: 50000,
        currentInvestment: deductions.nps,
        suggestedInvestment: Math.min(50000, Math.max(0, 50000 - deductions.nps)),
        taxSaving: 0,
        description: 'Additional deduction for NPS investment',
        priority: 'medium',
      },
    ];

    // Calculate tax saving for each option
    const taxRate = getTaxRate(annualIncome);
    let totalSaving = 0;

    options.forEach(option => {
      option.taxSaving = option.suggestedInvestment * taxRate;
      totalSaving += option.taxSaving;
    });

    setTaxSavingOptions(options);
    setTotalTaxSaving(totalSaving);
  };

  const getTaxRate = (income: number): number => {
    if (taxRegime === 'new') {
      if (income <= 300000) return 0;
      if (income <= 600000) return 0.05;
      if (income <= 900000) return 0.1;
      if (income <= 1200000) return 0.15;
      if (income <= 1500000) return 0.2;
      return 0.3;
    } else {
      if (income <= 250000) return 0;
      if (income <= 500000) return 0.05;
      if (income <= 1000000) return 0.2;
      return 0.3;
    }
  };

  const saveTaxOptimization = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const optimization = {
        annualIncome,
        taxRegime,
        deductions,
        taxSavingOptions,
        totalTaxSaving,
        calculatedAt: new Date(),
      };

      await firestoreDB.saveTaxOptimization(user.uid, optimization);

      toast({
        title: 'Tax optimization saved!',
        description: 'Your tax planning strategy has been saved to your profile.',
      });
    } catch (error) {
      toast({
        title: 'Error saving optimization',
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
          <h1 className="text-3xl font-bold text-[#2b2731] mb-2">Tax Optimizer</h1>
          <p className="text-[#2b2731] opacity-80">
            Maximize your tax savings with intelligent planning strategies
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <Card className="bg-[#c2dedb] border-[#2f8c8c]">
            <CardHeader>
              <CardTitle className="text-[#2b2731] flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Tax Details
              </CardTitle>
              <CardDescription className="text-[#2b2731] opacity-70">
                Enter your income and current investments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="annualIncome" className="text-[#2b2731] mb-2 block">
                  Annual Income (₹)
                </Label>
                <Input
                  id="annualIncome"
                  type="number"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(parseInt(e.target.value) || 0)}
                  className="bg-white border-[#2f8c8c] text-[#2b2731]"
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="taxRegime" className="text-[#2b2731] mb-2 block">
                  Tax Regime
                </Label>
                <Select value={taxRegime} onValueChange={setTaxRegime}>
                  <SelectTrigger className="bg-white border-[#2f8c8c] text-[#2b2731]">
                    <SelectValue placeholder="Select tax regime" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="old">Old Tax Regime</SelectItem>
                    <SelectItem value="new">New Tax Regime</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="section80C" className="text-[#2b2731] mb-2 block">
                  Current 80C Investments (₹)
                </Label>
                <Input
                  id="section80C"
                  type="number"
                  value={deductions.section80C}
                  onChange={(e) => setDeductions({...deductions, section80C: parseInt(e.target.value) || 0})}
                  className="bg-white border-[#2f8c8c] text-[#2b2731]"
                  min="0"
                  max="150000"
                />
              </div>

              <div>
                <Label htmlFor="section80D" className="text-[#2b2731] mb-2 block">
                  Health Insurance Premium (₹)
                </Label>
                <Input
                  id="section80D"
                  type="number"
                  value={deductions.section80D}
                  onChange={(e) => setDeductions({...deductions, section80D: parseInt(e.target.value) || 0})}
                  className="bg-white border-[#2f8c8c] text-[#2b2731]"
                  min="0"
                  max="25000"
                />
              </div>

              <div>
                <Label htmlFor="section24B" className="text-[#2b2731] mb-2 block">
                  Home Loan Interest (₹)
                </Label>
                <Input
                  id="section24B"
                  type="number"
                  value={deductions.section24B}
                  onChange={(e) => setDeductions({...deductions, section24B: parseInt(e.target.value) || 0})}
                  className="bg-white border-[#2f8c8c] text-[#2b2731]"
                  min="0"
                  max="200000"
                />
              </div>

              <div>
                <Label htmlFor="nps" className="text-[#2b2731] mb-2 block">
                  NPS Investment (₹)
                </Label>
                <Input
                  id="nps"
                  type="number"
                  value={deductions.nps}
                  onChange={(e) => setDeductions({...deductions, nps: parseInt(e.target.value) || 0})}
                  className="bg-white border-[#2f8c8c] text-[#2b2731]"
                  min="0"
                  max="50000"
                />
              </div>

              <Button
                onClick={saveTaxOptimization}
                className="w-full bg-[#81dbe0] hover:bg-[#4e7e93] text-[#2b2731]"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Tax Plan'}
              </Button>
            </CardContent>
          </Card>

          {/* Tax Saving Summary */}
          <Card className="bg-[#c2dedb] border-[#2f8c8c]">
            <CardHeader>
              <CardTitle className="text-[#2b2731] flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Tax Saving Summary
              </CardTitle>
              <CardDescription className="text-[#2b2731] opacity-70">
                Your potential tax savings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center p-6 bg-[#81dbe0] rounded-lg">
                  <h3 className="text-2xl font-bold text-[#2b2731] mb-2">
                    ₹{totalTaxSaving.toLocaleString()}
                  </h3>
                  <p className="text-[#2b2731] opacity-80">Total Tax Savings</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-[#2f8c8c]">
                    <span className="text-[#2b2731] opacity-70">Annual Income</span>
                    <span className="font-semibold text-[#2b2731]">₹{annualIncome.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-[#2f8c8c]">
                    <span className="text-[#2b2731] opacity-70">Tax Regime</span>
                    <span className="font-semibold text-[#2b2731]">
                      {taxRegime === 'old' ? 'Old Regime' : 'New Regime'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-[#2f8c8c]">
                    <span className="text-[#2b2731] opacity-70">Current Tax Rate</span>
                    <span className="font-semibold text-[#2b2731]">
                      {(getTaxRate(annualIncome) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">Tax Saving Tip</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Invest in ELSS funds for the highest tax savings and potential returns. 
                    These investments have a 3-year lock-in period but offer dual benefits of tax saving and wealth creation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Optimization Recommendations */}
          <Card className="bg-[#c2dedb] border-[#2f8c8c]">
            <CardHeader>
              <CardTitle className="text-[#2b2731] flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Recommendations
              </CardTitle>
              <CardDescription className="text-[#2b2731] opacity-70">
                Optimize your tax savings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {taxSavingOptions.map((option) => (
                  <div key={option.id} className="bg-white p-4 rounded-lg border border-[#2f8c8c]">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-[#2b2731]">{option.name}</h3>
                      <span className="text-xs bg-[#81dbe0] text-[#2b2731] px-2 py-1 rounded">
                        {option.section}
                      </span>
                    </div>
                    <p className="text-sm text-[#2b2731] opacity-70 mb-3">{option.description}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#2b2731] opacity-70">Suggested Investment:</span>
                        <span className="font-semibold text-[#2b2731]">
                          ₹{option.suggestedInvestment.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#2b2731] opacity-70">Tax Saving:</span>
                        <span className="font-semibold text-green-600">
                          ₹{option.taxSaving.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#2b2731] opacity-70">Max Limit:</span>
                        <span className="text-[#2b2731]">₹{option.maxLimit.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tax Planning Tips */}
        <Card className="bg-[#c2dedb] border-[#2f8c8c] mt-8">
          <CardHeader>
            <CardTitle className="text-[#2b2731] flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Tax Planning Tips
            </CardTitle>
            <CardDescription className="text-[#2b2731] opacity-70">
              Expert advice for effective tax planning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border border-[#2f8c8c]">
                <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
                <h3 className="font-semibold text-[#2b2731] mb-2">Start Early</h3>
                <p className="text-sm text-[#2b2731] opacity-70">
                  Begin tax planning at the start of the financial year to maximize benefits and avoid last-minute rush.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-[#2f8c8c]">
                <TrendingUp className="w-8 h-8 text-[#4e7e93] mb-3" />
                <h3 className="font-semibold text-[#2b2731] mb-2">Diversify Investments</h3>
                <p className="text-sm text-[#2b2731] opacity-70">
                  Spread your 80C investments across ELSS, EPF, PPF, and NSC for optimal risk-return balance.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-[#2f8c8c]">
                <AlertCircle className="w-8 h-8 text-orange-600 mb-3" />
                <h3 className="font-semibold text-[#2b2731] mb-2">Review Annually</h3>
                <p className="text-sm text-[#2b2731] opacity-70">
                  Review and adjust your tax planning strategy annually based on income changes and new regulations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}