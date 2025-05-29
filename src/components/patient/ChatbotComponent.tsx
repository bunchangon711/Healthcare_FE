import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../../services/GeminiService';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface ChatbotComponentProps {
  onClose: () => void;
}

const ChatbotComponent: React.FC<ChatbotComponentProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'bot',
      content: 'Hello! I am your MedCare virtual assistant. How can I help with your healthcare questions today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;
    if (isRateLimited) {
      setMessages(prevMessages => [...prevMessages, {
        role: 'bot',
        content: 'Please wait a moment before sending another message. Our AI service has rate limits to ensure fair usage for all users.',
        timestamp: new Date()
      }]);
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await GeminiService.getResponse(inputMessage);
      
      // Check if response indicates rate limiting
      if (response.includes('reached the request limit')) {
        setIsRateLimited(true);
        setTimeout(() => setIsRateLimited(false), 60000); // Reset after 1 minute
      }
      
      const botMessage: ChatMessage = {
        role: 'bot',
        content: response,
        timestamp: new Date()
      };

      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'bot',
        content: 'I apologize, but I encountered an error processing your request. Please try again later.',
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      console.error('Chatbot error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h3>MedCare Virtual Assistant</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.role === 'user' ? 'user-message' : 'bot-message'}`}
          >
            <div className="message-content">{message.content}</div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot-message">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        {isRateLimited && (
          <div className="rate-limit-notice">
            AI service rate limited. Please wait a moment before sending another message.
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chatbot-input">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isRateLimited ? "Please wait before sending another message..." : "Ask a healthcare question..."}
          disabled={isLoading || isRateLimited}
        />
        <button 
          onClick={handleSendMessage} 
          disabled={isLoading || inputMessage.trim() === '' || isRateLimited}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatbotComponent;
