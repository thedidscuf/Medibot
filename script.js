import { AIService } from './ai-service.js';
import { FileUploadService } from './file-upload-service.js';
import { ChatHistoryService } from './chat-history-service.js';

class MediBotApp {
  constructor() {
    this.aiService = new AIService();
    this.fileUploadService = new FileUploadService();
    this.chatHistoryService = new ChatHistoryService();
    this.initializeDOM();
    this.bindEvents();
    this.addWelcomeMessage();  
  }

  initializeDOM() {
    this.input = document.querySelector('.chat-input input[type="text"]');
    this.sendButton = document.querySelector('.chat-input button');
    this.chatMessages = document.querySelector('.chat-messages');
    this.fileInput = document.querySelector('.file-upload input[type="file"]');
    this.fileUploadLabel = document.querySelector('.file-upload');
    this.uploadedFilesContainer = document.querySelector('.uploaded-files');
    this.newChatBtn = document.querySelector('.new-chat-btn');
    this.chatHistoryBtn = document.querySelector('.chat-history-btn');
    this.chatHistoryModal = document.querySelector('.chat-history-modal');
    this.chatHistoryList = document.querySelector('.chat-history-list');
    this.closeHistoryBtn = document.querySelector('.close-history-btn');
  }

  bindEvents() {
    this.fileUploadLabel.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.fileUploadService.handleFileUpload(e, this.uploadedFilesContainer));
    
    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });

    // New chat button
    this.newChatBtn.addEventListener('click', () => this.startNewChat());

    // Chat history events
    this.chatHistoryBtn.addEventListener('click', () => this.showChatHistory());
    this.closeHistoryBtn.addEventListener('click', () => this.hideChatHistory());
  }

  startNewChat() {
    // Save current chat to history before clearing
    if (this.chatMessages.children.length > 0) {
      this.chatHistoryService.saveChatToHistory(this.chatMessages.children);
    }

    // Clear chat messages
    this.chatMessages.innerHTML = '';
    
    // Reset AI service conversation history
    this.aiService.conversationHistory = [
      {
        role: 'system', 
        content: 'Eres un asistente médico virtual llamado MediBot. Proporciona respuestas precisas y amables sobre temas de salud. Sé empático, claro y conciso. Si no estás seguro de algo, admítelo honestamente.'
      }
    ];

    // Add welcome message
    this.addWelcomeMessage();
  }

  showChatHistory() {
    const history = this.chatHistoryService.getChatHistory();
    
    // Clear previous history
    this.chatHistoryList.innerHTML = '';

    // Populate history list
    history.reverse().forEach((chat, index) => {
      const chatItem = document.createElement('div');
      chatItem.classList.add('chat-history-item');
      
      const date = new Date(chat.timestamp);
      chatItem.innerHTML = `
        <div class="chat-history-header">
          <span class="chat-date">${date.toLocaleString()}</span>
          <div class="chat-actions">
            <button class="view-chat-btn" data-index="${history.length - 1 - index}">Ver Chat</button>
            <button class="delete-chat-btn" data-id="${chat.id}">Eliminar</button>
          </div>
        </div>
      `;

      // Add click event to view chat
      chatItem.querySelector('.view-chat-btn').addEventListener('click', (e) => {
        const chatIndex = e.target.dataset.index;
        this.viewHistoricChat(history[chatIndex]);
      });

      // Add click event to delete chat
      chatItem.querySelector('.delete-chat-btn').addEventListener('click', (e) => {
        const chatId = parseInt(e.target.dataset.id);
        this.deleteChatFromHistory(chatId);
      });

      this.chatHistoryList.appendChild(chatItem);
    });

    this.chatHistoryModal.style.display = 'flex';
  }

  deleteChatFromHistory(chatId) {
    // Remove chat from history
    this.chatHistoryService.deleteChat(chatId);
    
    // Refresh the history view
    this.showChatHistory();
  }

  viewHistoricChat(chat) {
    // Clear current chat
    this.chatMessages.innerHTML = '';

    // Populate chat with historic messages
    chat.messages.forEach(msg => {
      const messageEl = document.createElement('div');
      messageEl.classList.add(msg.type === 'user' ? 'user-message' : 'bot-message');
      
      if (msg.type === 'bot') {
        messageEl.innerHTML = `
          <div class="message-icons">
            <svg class="medical-cross" viewBox="0 0 24 24">
              <path d="M12 2L12 22M2 12L22 12" stroke="#3498db" stroke-width="3"/>
            </svg>
            <svg class="digital-heart" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#e74c3c"/>
            </svg>
          </div>
          <p>${msg.text}</p>
        `;
      } else {
        messageEl.innerHTML = `<p>${msg.text}</p>`;
      }

      this.chatMessages.appendChild(messageEl);
    });

    // Hide history modal
    this.hideChatHistory();

    // Scroll to bottom
    this.scrollToBottom();
  }

  hideChatHistory() {
    this.chatHistoryModal.style.display = 'none';
  }

  async sendMessage() {
    const messageText = this.input.value.trim();
    if (!messageText) return;

    this.sendButton.disabled = true;
    this.input.disabled = true;

    try {
      this.addMessage(messageText, 'user-message');
      const loadingMessageEl = this.addLoadingMessage();

      // Aumentar timeout a 45 segundos y manejar la respuesta directamente
      const botResponse = await this.aiService.getResponse(messageText);
      
      if (loadingMessageEl?.parentNode) {
        loadingMessageEl.remove();
      }

      if (botResponse) {
        this.addMessage(botResponse, 'bot-message');
      }

    } catch (error) {
      console.error('Error en chat:', error);
      this.addMessage('Lo siento, hubo un problema técnico. Por favor, intenta de nuevo.', 'bot-message');
    } finally {
      this.sendButton.disabled = false;
      this.input.disabled = false;
      this.input.value = '';
      this.input.focus();
      this.scrollToBottom();
    }
  }

  addLoadingMessage() {
    const loadingMessageEl = document.createElement('div');
    loadingMessageEl.classList.add('bot-message', 'loading-message');
    loadingMessageEl.innerHTML = `
      <div class="message-icons">
        <svg class="medical-cross" viewBox="0 0 24 24">
          <path d="M12 2L12 22M2 12L22 12" stroke="#3498db" stroke-width="3"/>
        </svg>
        <svg class="digital-heart" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#e74c3c"/>
        </svg>
      </div>
      <p>
        <span class="typing-loader">Pensando</span>
        <span class="typing-dots">...</span>
      </p>
    `;
    
    this.chatMessages.appendChild(loadingMessageEl);
    this.scrollToBottom();
    
    return loadingMessageEl;
  }

  addMessage(text, messageClass) {
    const messageEl = document.createElement('div');
    messageEl.classList.add(messageClass);
    
    if (messageClass === 'bot-message') {
      messageEl.innerHTML = `
        <div class="message-icons">
          <svg class="medical-cross" viewBox="0 0 24 24">
            <path d="M12 2L12 22M2 12L22 12" stroke="#3498db" stroke-width="3"/>
          </svg>
          <svg class="digital-heart" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#e74c3c"/>
          </svg>
        </div>
        <div class="message-content">${text}</div>
      `;
    } else {
      messageEl.innerHTML = `<p>${text}</p>`;
    }

    this.chatMessages.appendChild(messageEl);
    this.scrollToBottom();
  }

  scrollToBottom() {
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  addWelcomeMessage() {
    const welcomeMessage = `¡Bienvenido a MediBot! 👋 Soy tu asistente médico virtual. Estoy aquí para ayudarte con cualquier pregunta de salud que tengas. ¿En qué puedo ayudarte hoy?`;
    this.addMessage(welcomeMessage, 'bot-message');
  }
}

document.addEventListener('DOMContentLoaded', () => new MediBotApp());