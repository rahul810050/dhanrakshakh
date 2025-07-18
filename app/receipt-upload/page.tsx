'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import Navbar from '@/components/layout/navbar';
import Loading from '@/components/layout/loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { realtimeDB, firestoreDB } from '@/lib/database';
import { Upload, Camera, FileText, Check, X } from 'lucide-react';

export default function ReceiptUploadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [manualEntry, setManualEntry] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    vendor: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    paymentMethod: '',
  });

  const categories = [
    'Food & Dining',
    'Groceries',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Other',
  ];

  const paymentMethods = [
    'Cash',
    'Credit Card',
    'Debit Card',
    'UPI',
    'Net Banking',
    'Wallet',
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      processReceipt(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  const processReceipt = async (file: File) => {
    setUploading(true);
  
    try {
      const formData = new FormData();
      formData.append('file', file);
  
      // Step 1: Send to OCR
      const ocrRes = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });
      const ocrData = await ocrRes.json();
      const text = ocrData.text;
  
      // Step 2: Extract from raw OCR text
      const vendor = extractVendor(text);
      const amount = extractAmount(text);
      const date = extractDate(text);
      const description = 'Auto-filled from receipt';
      const paymentMethod = 'UPI'; // or guess from text
  
      // Step 3: Extract category via keyword matching
      let category = extractCategory(text);
  
      // Step 4: If no match → ask Gemini
      if (!category) {
        const geminiRes = await fetch('/api/gemini-category', {
          method: 'POST',
          body: JSON.stringify({ text }),
          headers: { 'Content-Type': 'application/json' },
        });
        const { suggestedCategory } = await geminiRes.json();
        category = suggestedCategory || 'Other';
      }
  
      const extracted = {
        vendor,
        amount,
        date,
        category,
        description,
        paymentMethod,
      };
  
      setExtractedData(extracted);
      setFormData(extracted);
  
      toast({
        title: 'Receipt processed successfully!',
        description: 'Please verify the extracted information.',
      });
    } catch (error) {
      toast({
        title: 'Error processing receipt',
        description: 'Please try again or enter manually.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };
  
  function extractAmount(text: string) {
    const match = text.match(/(?:Rs\.?|₹)\s?(\d+(\.\d{1,2})?)/i);
    return match ? match[1] : '';
  }
  
  function extractDate(text: string) {
    const match = text.match(/\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/);
    if (match) {
      const [d, m, y] = match[0].split(/[\/\-.]/);
      const yyyy = y.length === 2 ? `20${y}` : y;
      return new Date(`${yyyy}-${m}-${d}`).toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  }
  
  function extractVendor(text: string) {
    const lines = text.split('\n');
    return lines.length ? lines[0].trim() : 'Unknown Vendor';
  }
  
  function extractCategory(text: string) {
    const categories = {
      'Food & Dining': ['restaurant', 'cafe', 'meal', 'food', 'dining'],
      Groceries: ['grocery', 'supermarket', 'mart', 'kirana'],
      Transportation: ['uber', 'ola', 'taxi', 'fuel', 'petrol', 'bus', 'train'],
      Shopping: ['shopping', 'amazon', 'flipkart', 'store', 'purchase'],
      Entertainment: ['movie', 'netflix', 'pvr', 'bookmyshow'],
      'Bills & Utilities': ['electricity', 'water', 'bill', 'recharge'],
      Healthcare: ['pharmacy', 'doctor', 'hospital', 'clinic', 'medic'],
      Education: ['school', 'tuition', 'university', 'course'],
      Travel: ['flight', 'airline', 'hotel', 'booking.com'],
      Other: [],
    };
  
    const lower = text.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(word => lower.includes(word))) {
        return category;
      }
    }
    return '';
  }
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      setUploading(true);
      
      const expense = {
        vendor: formData.vendor,
        amount: parseFloat(formData.amount),
        date: formData.date,
        category: formData.category,
        description: formData.description,
        paymentMethod: formData.paymentMethod,
        source: uploadedFile ? 'receipt' : 'manual',
        fileName: uploadedFile?.name || null,
      };

      // Save to both Realtime Database and Firestore
      await Promise.all([
        realtimeDB.addExpense(user.uid, expense),
        firestoreDB.addExpense(user.uid, expense),
      ]);

      toast({
        title: 'Expense added successfully!',
        description: 'Your expense has been recorded and categorized.',
      });

      // Reset form
      setFormData({
        vendor: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: '',
        description: '',
        paymentMethod: '',
      });
      setUploadedFile(null);
      setExtractedData(null);
      setManualEntry(false);

    } catch (error) {
      toast({
        title: 'Error saving expense',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
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
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2b2731] mb-2">Upload Receipt</h1>
          <p className="text-[#2b2731] opacity-80">
            Scan your receipts or enter expenses manually
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="bg-[#c2dedb] border-[#2f8c8c]">
            <CardHeader>
              <CardTitle className="text-[#2b2731]">Upload Receipt</CardTitle>
              <CardDescription className="text-[#2b2731] opacity-70">
                Drag and drop your receipt or click to browse
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!uploadedFile ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-[#81dbe0] bg-[#81dbe0]/10'
                      : 'border-[#2f8c8c] hover:border-[#81dbe0] hover:bg-[#81dbe0]/5'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 text-[#4e7e93] mx-auto mb-4" />
                  <p className="text-[#2b2731] font-medium mb-2">
                    {isDragActive ? 'Drop your receipt here' : 'Upload receipt image or PDF'}
                  </p>
                  <p className="text-[#2b2731] opacity-70 text-sm">
                    Supports JPEG, PNG, PDF files up to 10MB
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#81dbe0] rounded-full flex items-center justify-center mx-auto mb-4">
                    {uploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2b2731]" />
                    ) : (
                      <Check className="w-8 h-8 text-[#2b2731]" />
                    )}
                  </div>
                  <p className="text-[#2b2731] font-medium mb-2">
                    {uploading ? 'Processing receipt...' : 'Receipt uploaded successfully!'}
                  </p>
                  <p className="text-[#2b2731] opacity-70 text-sm mb-4">
                    {uploadedFile.name}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUploadedFile(null);
                      setExtractedData(null);
                    }}
                    className="text-[#2b2731] border-[#2f8c8c]"
                  >
                    Upload Different File
                  </Button>
                </div>
              )}

              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => setManualEntry(true)}
                  className="text-[#2b2731] border-[#2f8c8c]"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Enter Manually Instead
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Form Section */}
          <Card className="bg-[#c2dedb] border-[#2f8c8c]">
            <CardHeader>
              <CardTitle className="text-[#2b2731]">Expense Details</CardTitle>
              <CardDescription className="text-[#2b2731] opacity-70">
                {extractedData ? 'Verify and edit the extracted information' : 'Enter expense details manually'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="vendor" className="text-[#2b2731]">Vendor/Store</Label>
                  <Input
                    id="vendor"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    placeholder="Enter store name"
                    className="bg-white border-[#2f8c8c] text-[#2b2731]"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="amount" className="text-[#2b2731]">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="bg-white border-[#2f8c8c] text-[#2b2731]"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="date" className="text-[#2b2731]">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="bg-white border-[#2f8c8c] text-[#2b2731]"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-[#2b2731]">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className="bg-white border-[#2f8c8c] text-[#2b2731]">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="paymentMethod" className="text-[#2b2731]">Payment Method</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                    <SelectTrigger className="bg-white border-[#2f8c8c] text-[#2b2731]">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description" className="text-[#2b2731]">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Additional notes about this expense"
                    className="bg-white border-[#2f8c8c] text-[#2b2731]"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#81dbe0] hover:bg-[#4e7e93] text-[#2b2731]"
                  disabled={uploading}
                >
                  {uploading ? 'Saving...' : 'Save Expense'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}