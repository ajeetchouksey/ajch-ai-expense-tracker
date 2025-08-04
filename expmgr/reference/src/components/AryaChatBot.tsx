import { useState, useRef, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { UserSettings, ChatMessage, ChatSession } from '@/lib/types';
import { 
  Robot, 
  User, 
  Send, 
  MessageCircle, 
  Sparkle, 
  TrendUp, 
  Target, 
  Wallet, 
  Calculator,
  Lightbulb,
  X,
  Minimize2,
  Maximize2
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface AryaChatBotProps {
  userSettings: UserSettings;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onClose?: () => void;
}

export function AryaChatBot({ 
  userSettings, 
  isMinimized = false, 
  onToggleMinimize, 
  onClose 
}: AryaChatBotProps) {
  const [sessions, setSessions] = useKV('chatSessions', [] as ChatSession[]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get current session
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when not minimized
  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  // Create new session if none exists
  useEffect(() => {
    if (sessions.length === 0 || !currentSessionId) {
      startNewSession();
    }
  }, [sessions.length, currentSessionId]);

  const startNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Hi! I'm Aarya, your personal financial assistant. I'm here to help you with:

💰 **Expense Analysis** - Understanding your spending patterns
🎯 **Goal Planning** - Setting and tracking financial goals  
📊 **Budget Optimization** - Making the most of your money
💡 **Smart Recommendations** - Personalized financial advice
📱 **App Guidance** - Navigating all the features

What would you like to explore today?`,
          timestamp: new Date().toISOString(),
          suggestions: [
            'Analyze my spending habits',
            'Help me create a budget',
            'Set up a savings goal',
            'Review my financial health'
          ]
        }
      ],
      isActive: true
    };

    setSessions(prev => [...prev, newSession]);
    setCurrentSessionId(newSession.id);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message
    setSessions(prev => 
      prev.map(session => 
        session.id === currentSessionId 
          ? { 
              ...session, 
              messages: [...session.messages, userMessage],
              title: session.messages.length === 1 ? inputMessage.trim().slice(0, 30) + '...' : session.title
            }
          : session
      )
    );

    setInputMessage('');
    setIsTyping(true);

    try {
      // Generate AI response
      const prompt = spark.llmPrompt`
        You are Aarya, a helpful and friendly personal financial assistant. The user is asking: "${inputMessage}"
        
        Context: You're integrated into a comprehensive expense management app with features like:
        - Transaction tracking and categorization
        - Budget management and goal setting
        - AI-powered insights and recommendations
        - Bill negotiation assistance
        - Investment tracking and debt management
        
        User settings: Currency: ${userSettings.currency}, Country: ${userSettings.country}
        
        Provide a helpful, concise response (2-3 paragraphs max) that:
        1. Directly addresses their question
        2. Offers specific, actionable advice
        3. Mentions relevant app features when appropriate
        4. Maintains a friendly, encouraging tone
        5. Includes practical tips or next steps
        
        If they're asking about app features, guide them to the specific tabs/sections.
        If they want financial advice, provide personalized suggestions.
        Keep responses conversational and avoid being overly technical.
      `;
      
      const response = await spark.llm(prompt);
      
      // Generate contextual suggestions
      const suggestionsPrompt = spark.llmPrompt`
        Based on this conversation about "${inputMessage}", suggest 3 short follow-up questions or actions (max 4-5 words each) that would be helpful for personal finance management.
        Return only the suggestions, one per line, no numbers or bullets.
      `;
      
      const suggestionsResponse = await spark.llm(suggestionsPrompt);
      const suggestions = suggestionsResponse.split('\n').filter(s => s.trim()).slice(0, 3);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        suggestions: suggestions.length > 0 ? suggestions : undefined
      };

      // Add assistant response
      setSessions(prev => 
        prev.map(session => 
          session.id === currentSessionId 
            ? { ...session, messages: [...session.messages, assistantMessage] }
            : session
        )
      );

    } catch (error) {
      toast.error('Failed to get response. Please try again.');
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment, or feel free to explore the app's features directly!",
        timestamp: new Date().toISOString()
      };

      setSessions(prev => 
        prev.map(session => 
          session.id === currentSessionId 
            ? { ...session, messages: [...session.messages, errorMessage] }
            : session
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggleMinimize}
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-primary to-secondary hover:shadow-xl transition-all duration-200"
        >
          <div className="relative">
            <Robot className="h-6 w-6 text-white" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
          </div>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-96 h-[600px] shadow-2xl border-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Header */}
        <CardHeader className="pb-3 bg-gradient-to-r from-primary to-secondary text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Robot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Aarya Assistant</h3>
                <p className="text-xs text-white/80">Your Financial Guide</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMinimize}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="p-0 flex flex-col h-[calc(600px-140px)]">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 mt-1">
                      <Robot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      'max-w-[80%] p-3 rounded-lg',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    )}
                  >
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                    
                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-medium opacity-80">Quick actions:</div>
                        <div className="flex flex-wrap gap-1">
                          {message.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="h-4 w-4 text-accent-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                    <Robot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t bg-background">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Aarya anything about your finances..."
                disabled={isTyping}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                size="sm"
                className="px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Floating Chat Button Component
export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [userSettings] = useKV('userSettings', { currency: 'USD', country: 'US' } as UserSettings);

  const handleToggle = () => {
    if (isOpen) {
      setIsMinimized(!isMinimized);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={handleToggle}
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-primary to-secondary hover:shadow-xl transition-all duration-200 group"
        >
          <div className="relative">
            <Robot className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
          </div>
        </Button>
        
        {/* Tooltip */}
        <div className="absolute bottom-16 right-0 bg-background border rounded-lg p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          <div className="flex items-center gap-2 text-sm">
            <Sparkle className="h-4 w-4 text-primary" />
            <span>Chat with Aarya</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AryaChatBot
      userSettings={userSettings}
      isMinimized={isMinimized}
      onToggleMinimize={handleToggle}
      onClose={handleClose}
    />
  );
}