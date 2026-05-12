'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import './styles/Chat.css';

function Chat() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const router = useRouter();

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chat/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Fetch conversations error:', error);
    }
  };

  const fetchMessages = async (otherUserId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/chat/messages/${otherUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    // Get current user ID from token (you might want to store this)
    // eslint-disable-next-line
    fetchConversations();
    
    // Poll for new messages every 3 seconds
    const interval = setInterval(() => {
      if (selectedConversation) {
        fetchMessages(selectedConversation.other_user_id);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedConversation, router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.other_user_id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverId: selectedConversation.other_user_id,
          message: newMessage
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessages([...messages, data.message]);
        setNewMessage('');
        fetchConversations(); // Refresh conversation list
      }
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  return (
    <div className="chat-page">
      <nav className="top-navbar">
        <div className="nav-brand">The Grandview</div>
        <div className="nav-links">
          <span onClick={() => router.push('/dashboard')}>Dashboard</span>
          <span className="active">Messages</span>

          <span onClick={handleLogout} className="logout-btn">Logout</span>
        </div>
      </nav>

      <div className="chat-container">
        <div className="chat-sidebar">
          <h2>Messages</h2>
          <div className="conversations-list">
            {conversations.length === 0 ? (
              <div className="no-conversations">
                <p>No conversations yet</p>
                <p className="hint">Start chatting when you find a match!</p>
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                  onClick={() => handleSelectConversation(conv)}
                >
                  <div className="conversation-avatar">
                    {conv.other_user_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="conversation-info">
                    <h4>{conv.other_user_name}</h4>
                    <p className="last-message">{conv.last_message || 'No messages yet'}</p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="unread-badge">{conv.unread_count}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="chat-main">
          {selectedConversation ? (
            <>
              <div className="chat-header">
                <div className="chat-user-info">
                  <div className="chat-avatar">
                    {selectedConversation.other_user_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3>{selectedConversation.other_user_name}</h3>
                    <p className="user-email">{selectedConversation.other_user_email}</p>
                  </div>
                </div>
              </div>

              <div className="messages-container">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`message ${msg.sender_id === currentUserId ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">
                      <p>{msg.message}</p>
                      <span className="message-time">
                        {new Date(msg.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="message-input"
                />
                <button type="submit" className="send-btn">
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;
