import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  slug: string;
  brand: string;
  selling_price: number | string;
  discount_percentage: number | string;
  average_rating: number | string;
  images: Array<{ url: string; is_primary?: boolean }>;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  products?: Product[];
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hi there! 👋 I am your ShopNow Shopping Assistant. Ask me anything about products, brands, policies, or returns!',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Grouped Rufus-style suggestions
  const suggestionCategories = [
    {
      title: 'Explore the options',
      icon: '🔍',
      pills: ['Smartphones', 'Laptops', 'Adidas shoes']
    },
    {
      title: 'Try something new',
      icon: '✨',
      pills: ['Sony', 'T-Shirts', 'Puma shoes']
    },
    {
      title: 'Learn before you buy',
      icon: '📖',
      pills: ['How to return order?', 'Customer care email?', 'Standard delivery time?']
    }
  ];

  // Listen for global navbar toggle trigger
  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggle-ai-chat', handleToggle);
    return () => window.removeEventListener('toggle-ai-chat', handleToggle);
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isOpen]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessageId = Date.now().toString();
    const userMessage: Message = {
      id: userMessageId,
      sender: 'user',
      text: text,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const baseUrl = (import.meta as any).env.VITE_API_URL || '';
      
      const chatHistory = messages
        .filter(msg => msg.id !== 'welcome')
        .map(msg => ({
          sender: msg.sender,
          text: msg.text,
        }));

      const res = await fetch(`${baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          chatHistory: chatHistory,
        }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: data.data.reply,
          products: data.data.products || [],
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('Chat API returned success = false');
      }
    } catch (err) {
      console.error('Failed to chat with AI:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Sorry, I am having trouble connecting to the server. Please try again later!',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  return (
    <>
      {/* Floating Toggle Button (Always accessible) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[99] bg-gradient-to-r from-orange-500 to-[#f3a847] text-white p-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center border border-orange-400 hover:shadow-orange-400/20"
        title="Chat with AI Assistant"
      >
        {isOpen ? (
          <svg className="w-7 h-7 animate-in spin-in duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <div className="relative">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          </div>
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[998] transition-opacity duration-300 cursor-pointer"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Sidebar Drawer (Rufus Style) */}
      <div 
        className={`fixed top-0 left-0 h-full w-[400px] max-w-[90vw] bg-white shadow-3xl z-[999] flex flex-col transition-transform duration-300 ease-in-out border-r border-gray-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="bg-[#131921] text-white p-4 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2">
            {messages.length > 1 && (
              <button
                onClick={() => setMessages([{
                  id: 'welcome',
                  sender: 'bot',
                  text: 'Hi there! 👋 I am your ShopNow Shopping Assistant. Ask me anything about products, brands, policies, or returns!',
                }])}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white mr-1 shrink-0"
                title="Go back to suggestions"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            <div className="w-9 h-9 bg-gradient-to-tr from-orange-400 to-amber-300 rounded-xl flex items-center justify-center shadow-inner shrink-0">
              <span className="font-extrabold text-black text-sm">AI</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm leading-tight">ShopNow Assistant</h3>
                <span className="text-[10px] bg-orange-500/20 text-[#febd69] px-1.5 py-0.5 rounded-sm font-semibold uppercase tracking-wider scale-90">beta</span>
              </div>
              <span className="text-[10px] text-green-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse"></span>
                Online & Ready
              </span>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable chat body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-gray-50/50 custom-scrollbar">
          
          {/* Welcome intro block if no messages yet */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-xs whitespace-pre-line leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-orange-500 to-[#f3a847] text-white rounded-tr-none'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>

              {/* Dynamic product suggestions carousel */}
              {msg.products && msg.products.length > 0 && (
                <div className="w-full mt-3 overflow-x-auto flex gap-3 pb-2 pt-1 no-scrollbar scroll-smooth">
                  {msg.products.map((product) => {
                    const primaryImage = product.images?.find(img => img.is_primary)?.url || 
                                         product.images?.[0]?.url || 
                                         '/placeholder.png';
                    return (
                      <div
                        key={product.id}
                        className="min-w-[155px] max-w-[155px] bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
                      >
                        <Link 
                          to={`/product/${product.slug}`} 
                          onClick={() => setIsOpen(false)}
                          className="block h-28 overflow-hidden bg-gray-100 relative group"
                        >
                          <img
                            src={primaryImage.startsWith('http') ? primaryImage : `${(import.meta as any).env.VITE_API_URL || ''}${primaryImage}`}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {Number(product.discount_percentage) > 0 && (
                            <span className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                              {Math.round(Number(product.discount_percentage))}% OFF
                            </span>
                          )}
                        </Link>
                        
                        <div className="p-2.5 flex-1 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider font-semibold text-orange-500 truncate block">
                              {product.brand || 'ShopNow'}
                            </span>
                            <Link
                              to={`/product/${product.slug}`}
                              onClick={() => setIsOpen(false)}
                              className="text-xs font-semibold text-gray-800 line-clamp-2 hover:text-[#f3a847] transition-colors leading-tight min-h-[2rem]"
                            >
                              {product.name}
                            </Link>
                          </div>
                          
                          <div className="mt-2 pt-1 border-t border-gray-50 flex flex-col">
                            <span className="text-[10px] text-gray-400 line-through">
                              ₹{Math.round(Number(product.selling_price) * 1.2)}
                            </span>
                            <span className="text-sm font-bold text-gray-900 leading-none">
                              ₹{product.selling_price}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-center gap-1.5 bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-xs w-fit animate-pulse">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          )}

          {/* Grouped Rufus-Style Suggestions Menu */}
          {messages.length === 1 && !isLoading && (
            <div className="pt-2 space-y-4">
              {suggestionCategories.map((category, idx) => (
                <div key={idx} className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-500 flex items-center gap-1.5 uppercase tracking-wider px-1">
                    <span>{category.icon}</span>
                    <span>{category.title}</span>
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {category.pills.map((pill, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handleSuggestionClick(pill)}
                        className="w-full text-left bg-white hover:bg-orange-50/50 border border-gray-200 hover:border-orange-200 text-gray-700 hover:text-orange-600 text-xs px-3.5 py-2.5 rounded-xl transition-all font-medium active:scale-98 shadow-xs flex items-center justify-between group"
                      >
                        <span>{pill}</span>
                        <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-500 transition-colors transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Form Footer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          className="p-3.5 border-t border-gray-100 bg-white flex gap-2 items-center shrink-0 shadow-inner"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask ShopNow Assistant a question..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#f3a847] focus:border-[#f3a847] text-gray-800 placeholder-gray-400 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={`p-3 bg-gradient-to-r from-orange-500 to-[#f3a847] text-white rounded-xl shadow-md transition-all flex items-center justify-center hover:scale-105 active:scale-95 ${
              (!inputValue.trim() || isLoading) && 'opacity-50 cursor-not-allowed scale-100'
            }`}
          >
            <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </>
  );
}
