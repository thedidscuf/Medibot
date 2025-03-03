export class ChatHistoryService {
  constructor() {
    this.STORAGE_KEY = 'medibot_chat_history';
    this.chatHistory = this.loadChatHistory();
  }

  loadChatHistory() {
    const history = localStorage.getItem(this.STORAGE_KEY);
    return history ? JSON.parse(history) : [];
  }

  saveChatToHistory(chatMessages) {
    const timestamp = new Date().toISOString();
    const chatEntry = {
      id: Date.now(),
      timestamp: timestamp,
      messages: Array.from(chatMessages).map(msg => ({
        text: msg.textContent.trim(),
        type: msg.classList.contains('user-message') ? 'user' : 'bot'
      }))
    };

    this.chatHistory.push(chatEntry);
    
    // Limit history to last 10 chats
    if (this.chatHistory.length > 10) {
      this.chatHistory.shift();
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.chatHistory));
    return chatEntry;
  }

  getChatHistory() {
    return this.chatHistory;
  }

  clearChatHistory() {
    this.chatHistory = [];
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // New method to delete a specific chat from history
  deleteChat(chatId) {
    this.chatHistory = this.chatHistory.filter(chat => chat.id !== chatId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.chatHistory));
  }
}