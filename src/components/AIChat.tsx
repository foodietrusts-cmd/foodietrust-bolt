import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, Sparkles, ChefHat } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { ChatMessage, Dish } from '../types/types';

interface AIChatProps {
  dishes: Dish[];
  onDishRecommend?: (dish: Dish) => void;
}

export const AIChat: React.FC<AIChatProps> = ({ dishes, onDishRecommend }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm your FoodieTrust AI assistant. I can help you discover amazing dishes, get personalized recommendations, and answer any food-related questions. What are you craving today?",
      timestamp: new Date().toISOString(),
      suggestions: ['Show me trending dishes', 'I want something spicy', 'Recommend desserts', 'Find vegetarian options']
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = (userMessage: string): ChatMessage => {
    const lowerMessage = userMessage.toLowerCase();
    let response = '';
    let suggestions: string[] = [];
    let dishRecommendations: Dish[] = [];

    // Analyze user intent and generate appropriate response
    if (lowerMessage.includes('trending') || lowerMessage.includes('popular')) {
      const trendingDishes = dishes.filter(dish => dish.tags.includes('Trending')).slice(0, 3);
      dishRecommendations = trendingDishes;
      response = `Here are the hottest trending dishes right now! These are what food lovers are talking about most:`;
      suggestions = ['Tell me more about these', 'Show me hidden gems', 'What about desserts?'];
    } else if (lowerMessage.includes('spicy') || lowerMessage.includes('hot')) {
      const spicyDishes = dishes.filter(dish => 
        dish.description.toLowerCase().includes('spicy') || 
        dish.name.toLowerCase().includes('spicy') ||
        dish.cuisine === 'Indian' || dish.cuisine === 'Thai'
      ).slice(0, 3);
      dishRecommendations = spicyDishes;
      response = `🌶️ Perfect! Here are some amazing spicy dishes that will give you the heat you're looking for:`;
      suggestions = ['Something milder please', 'Show me more Indian food', 'What about Thai cuisine?'];
    } else if (lowerMessage.includes('dessert') || lowerMessage.includes('sweet')) {
      const desserts = dishes.filter(dish => dish.category === 'Dessert').slice(0, 3);
      dishRecommendations = desserts;
      response = `🍰 Sweet tooth calling? Here are some incredible desserts that will satisfy your cravings:`;
      suggestions = ['Show me chocolate options', 'Something lighter', 'Ice cream recommendations'];
    } else if (lowerMessage.includes('vegetarian') || lowerMessage.includes('veg')) {
      const vegDishes = dishes.filter(dish => 
        dish.description.toLowerCase().includes('vegetarian') ||
        dish.tags.includes('Vegetarian') ||
        !dish.description.toLowerCase().includes('chicken') &&
        !dish.description.toLowerCase().includes('meat') &&
        !dish.description.toLowerCase().includes('fish')
      ).slice(0, 3);
      dishRecommendations = vegDishes;
      response = `🥗 Great choice! Here are some fantastic vegetarian dishes that are both delicious and satisfying:`;
      suggestions = ['Show me vegan options', 'Something protein-rich', 'Indian vegetarian'];
    } else if (lowerMessage.includes('budget') || lowerMessage.includes('cheap') || lowerMessage.includes('affordable')) {
      const budgetDishes = dishes.filter(dish => dish.price <= 200).slice(0, 3);
      dishRecommendations = budgetDishes;
      response = `💰 Budget-friendly doesn't mean compromising on taste! Here are some amazing affordable dishes:`;
      suggestions = ['Show me street food', 'Under ₹150 options', 'Best value meals'];
    } else if (user && (lowerMessage.includes('recommend') || lowerMessage.includes('suggest'))) {
      // Personalized recommendations based on user preferences
      const personalizedDishes = dishes.filter(dish => 
        user.preferences.cuisines.length === 0 || user.preferences.cuisines.includes(dish.cuisine)
      ).slice(0, 3);
      dishRecommendations = personalizedDishes;
      response = `✨ Based on your preferences for ${user.preferences.cuisines.join(', ')} cuisine and ${user.preferences.spiceLevel} spice level, here are my top picks for you:`;
      suggestions = ['Something different', 'More like these', 'Show me new cuisines'];
    } else {
      // General response
      response = `I'd love to help you find the perfect dish! Could you tell me more about what you're looking for? Are you in the mood for something specific?`;
      suggestions = ['Show me trending dishes', 'I want something spicy', 'Recommend based on my taste', 'Find nearby restaurants'];
    }

    return {
      id: Date.now().toString(),
      type: 'ai',
      content: response,
      timestamp: new Date().toISOString(),
      suggestions,
      dishRecommendations
    };
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse = generateAIResponse(message);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-40">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">FoodieTrust AI</h3>
              <p className="text-xs opacity-90">Your personal food guide</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${message.type === 'user' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-900'} rounded-2xl p-3`}>
              <div className="flex items-start space-x-2">
                {message.type === 'ai' && (
                  <Bot className="w-4 h-4 mt-1 text-purple-500" />
                )}
                <div className="flex-1">
                  <p className="text-sm">{message.content}</p>
                  
                  {/* Dish Recommendations */}
                  {message.dishRecommendations && message.dishRecommendations.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.dishRecommendations.map((dish) => (
                        <div
                          key={dish.id}
                          className="bg-white rounded-lg p-2 border border-gray-200 cursor-pointer hover:border-orange-300 transition-colors"
                          onClick={() => onDishRecommend?.(dish)}
                        >
                          <div className="flex items-center space-x-2">
                            <img src={dish.image} alt={dish.name} className="w-8 h-8 rounded object-cover" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">{dish.name}</p>
                              <p className="text-xs text-gray-600">₹{dish.price} • {dish.averageRating}⭐</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-full transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl p-3 flex items-center space-x-2">
              <Bot className="w-4 h-4 text-purple-500" />
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
            placeholder="Ask me about food..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim()}
            className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full flex items-center justify-center hover:shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};