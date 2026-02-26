document.addEventListener('DOMContentLoaded', () => {
  const openWidgetBtn = document.getElementById('openWidget');
  const langSelect = document.getElementById('lang');
  const micBtn = document.getElementById('micBtn');
  const userInput = document.getElementById('userInput');

  // Speech Recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US'; // Default language
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    micBtn.onclick = () => {
      micBtn.textContent = '...';
      recognition.lang = langSelect.value === 'hi' ? 'hi-IN' : 'en-US'; // Adjust for Hindi
      recognition.start();
    };

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      userInput.value = speechResult;
      micBtn.textContent = '🎤';
      // Automatically send the message
      document.getElementById('sendBtn').click();
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      micBtn.textContent = '🎤';
    };

    recognition.onend = () => {
      micBtn.textContent = '🎤';
    };
  } else {
    micBtn.style.display = 'none'; // Hide if not supported
    console.warn('Speech Recognition not supported in this browser.');
  }

  openWidgetBtn.addEventListener('click', async () => {
    try {
      const lang = langSelect.value;
      await chrome.storage.local.set({ govnavLang: lang });

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content_script.js']
      });

      window.close();
    } catch (err) {
      console.error('GovNav popup error:', err);
    }
  });

  document.getElementById('sendBtn').onclick = async () => {
    const input = userInput.value.trim();
    if (!input) return;
    const chatDiv = document.getElementById('chat');
    chatDiv.innerHTML += `<div><b>You:</b> ${input}</div>`;
    userInput.value = '';
    chatDiv.innerHTML += `<div><i>GovBot is typing...</i></div>`;
    try {
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      const lastTypingMessage = chatDiv.querySelector('div:last-child');
      if (lastTypingMessage && lastTypingMessage.textContent === 'GovBot is typing...') {
        lastTypingMessage.remove();
      }
      chatDiv.innerHTML += `<div><b>GovBot:</b> ${data.reply || 'No response.'}</div>`;
    } catch (e) {
      const lastTypingMessage = chatDiv.querySelector('div:last-child');
      if (lastTypingMessage && lastTypingMessage.textContent === 'GovBot is typing...') {
        lastTypingMessage.remove();
      }
      chatDiv.innerHTML += `<div style="color:red"><b>Error:</b> Could not connect to AI.</div>`;
    }
    chatDiv.scrollTop = chatDiv.scrollHeight;
  };
});