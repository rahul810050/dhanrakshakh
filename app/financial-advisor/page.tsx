'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import Loading from '@/components/layout/loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { fiMoneyAPI, firestoreDB } from '@/lib/database';
import { 
  Brain, 
  MessageCircle, 
  TrendingUp, 
  AlertCircle, 
  Target, 
  PieChart, 
  Send,
  Bot,
  User
} from 'lucide-react';

interface AIRecommendation {
  id: string;
  type: 'investment' | 'savings' | 'debt' | 'insurance' | 'tax';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  estimatedImpact: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export default function FinancialAdvisorPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserProfile();
      generateRecommendations();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const profile = await fiMoneyAPI.getProfile(user!.uid);
      setUserProfile(profile);
      setLoadingProfile(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      setLoadingProfile(false);
    }
  };

  const generateRecommendations = async () => {
    // Mock AI-generated recommendations based on user profile
    const mockRecommendations: AIRecommendation[] = [
      {
        id: '1',
        type: 'investment',
        title: 'Increase SIP Investment',
        description: 'Based on your current income and expenses, you can increase your SIP by ₹2,000 monthly.',
        priority: 'high',
        action: 'Invest in diversified equity mutual funds',
        estimatedImpact: '₹4.8L additional corpus in 10 years',
      },
      {
        id: '2',
        type: 'savings',
        title: 'Emergency Fund Top-up',
        description: 'Your emergency fund should be 6 months of expenses. Current fund covers only 3 months.',
        priority: 'high',
        action: 'Save ₹1,500 monthly in liquid funds',
        estimatedImpact: 'Complete emergency fund in 12 months',
      },
      {
        id: '3',
        type: 'tax',
        title: 'Tax Saving Opportunity',
        description: 'You can save ₹15,000 in taxes by investing in ELSS funds under Section 80C.',
        priority: 'medium',
        action: 'Invest ₹50,000 in ELSS funds',
        estimatedImpact: 'Save ₹15,000 in taxes',
      },
      {
        id: '4',
        type: 'insurance',
        title: 'Life Insurance Review',
        description: 'Your current life insurance coverage is insufficient for your family size.',
        priority: 'medium',
        action: 'Increase term insurance to ₹50L',
        estimatedImpact: 'Adequate family protection',
      },
    ];

    setRecommendations(mockRecommendations);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    // Validate message length
    if (newMessage.length > 500) {
      toast({
        title: 'Message too long',
        description: 'Please keep your question under 500 characters.',
        variant: 'destructive',
      });
      return;
    }
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: newMessage,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    try {
      // Get AI response
      const responseContent = await generateAIResponse(newMessage);
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: responseContent,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'I apologize, but I\'m currently experiencing technical difficulties. Please try again in a few minutes.',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateAIResponse = async (userMessage: string): string => {
    try {
      const response = await fetch('/api/financial-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle both success and fallback responses
      if (data.response) {
        return data.response;
      }
      
      return 'Sorry, I could not process your request at the moment. Please try again later.';
    } catch (error) {
      console.error('Error calling financial advisor API:', error);
      
      // Provide helpful fallback based on the question
      const lowerMessage = userMessage.toLowerCase();
      
      if (lowerMessage.includes('investment')) {
        return `I'm currently experiencing high demand. Here's quick investment advice:

For beginners:
• Start SIP in diversified mutual funds (₹1000-5000/month)
• Build emergency fund (6 months expenses)
• Consider ELSS for tax saving
• Stay invested long-term for best results

Please try your question again in a few minutes for detailed advice!`;
      }
      
      if (lowerMessage.includes('tax')) {
        return `I'm currently busy, but here's quick tax-saving info:

Section 80C options (₹1.5L limit):
• ELSS mutual funds (best returns)
• PPF (safe, long-term)
• EPF contributions

Additional: Health insurance (80D), NPS (80CCD1B)

Try asking again in a few minutes for personalized advice!`;
      }
      
      return `I'm experiencing high demand right now. Please try again in a few minutes.

I can help with:
• Investment strategies
• Tax planning  
• Retirement planning
• Expense management
• SIP calculations

Try asking a specific question about any of these topics!`;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'investment': return <TrendingUp className="w-4 h-4" />;
      case 'savings': return <PieChart className="w-4 h-4" />;
      case 'debt': return <AlertCircle className="w-4 h-4" />;
      case 'insurance': return <Target className="w-4 h-4" />;
      case 'tax': return <Brain className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
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
          <h1 className="text-3xl font-bold text-[#2b2731] mb-2">AI Financial Advisor</h1>
          <p className="text-[#2b2731] opacity-80">
            Get personalized financial advice powered by AI and your financial data
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <Card className="bg-[#c2dedb] border-[#2f8c8c]">
            <CardHeader>
              <CardTitle className="text-[#2b2731] flex items-center">
                <User className="w-5 h-5 mr-2" />
                Financial Profile
              </CardTitle>
              <CardDescription className="text-[#2b2731] opacity-70">
                Your current financial snapshot
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProfile ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[#2b2731] opacity-70">Balance</span>
                    <span className="font-semibold text-[#2b2731]">₹{userProfile?.balance?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#2b2731] opacity-70">Monthly Income</span>
                    <span className="font-semibold text-[#2b2731]">₹{userProfile?.income?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#2b2731] opacity-70">Investments</span>
                    <span className="font-semibold text-[#2b2731]">₹{userProfile?.investments?.toLocaleString()}</span>
                  </div>
                  <div className="pt-4 border-t border-[#2f8c8c]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#2b2731] opacity-70">Risk Profile</span>
                      <Badge className="bg-[#81dbe0] text-[#2b2731]">Moderate</Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-[#c2dedb] border-[#2f8c8c]">
              <CardHeader>
                <CardTitle className="text-[#2b2731] flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  AI Recommendations
                </CardTitle>
                <CardDescription className="text-[#2b2731] opacity-70">
                  Personalized advice based on your financial profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="bg-white p-4 rounded-lg border border-[#2f8c8c]">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(rec.type)}
                          <h3 className="font-semibold text-[#2b2731]">{rec.title}</h3>
                        </div>
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-[#2b2731] opacity-80 mb-3">{rec.description}</p>
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                          <span className="text-[#2b2731] font-medium text-sm">Action:</span>
                          <span className="text-[#2b2731] text-sm">{rec.action}</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-[#2b2731] font-medium text-sm">Impact:</span>
                          <span className="text-[#2b2731] text-sm">{rec.estimatedImpact}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Chat */}
            <Card className="bg-[#c2dedb] border-[#2f8c8c]">
              <CardHeader>
                <CardTitle className="text-[#2b2731] flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chat with AI Advisor
                </CardTitle>
                <CardDescription className="text-[#2b2731] opacity-70">
                  Ask questions about your finances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 overflow-y-auto mb-4 p-4 bg-white rounded-lg border border-[#2f8c8c]">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-[#2b2731] opacity-70 py-8">
                      <Bot className="w-12 h-12 mx-auto mb-4 text-[#4e7e93]" />
                      <p className="mb-2">Hi! I'm your AI Financial Advisor.</p>
                      <p className="text-sm">Ask me anything about investments, savings, or financial planning!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.map((message) => (
                        <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-lg ${
                            message.type === 'user' 
                              ? 'bg-[#81dbe0] text-[#2b2731]' 
                              : 'bg-[#4e7e93] text-white'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-[#4e7e93] text-white p-3 rounded-lg">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me about investments, taxes, retirement... (max 500 chars)"
                    className="bg-white border-[#2f8c8c] text-[#2b2731]"
                    maxLength={500}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    className="bg-[#81dbe0] hover:bg-[#4e7e93] text-[#2b2731]"
                    disabled={!newMessage.trim() || isTyping}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-xs text-[#2b2731] opacity-60 mt-1">
                  {newMessage.length}/500 characters
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}