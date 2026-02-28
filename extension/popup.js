document.addEventListener('DOMContentLoaded', () => {
  const openWidgetBtn = document.getElementById('openWidget');
  const langSelect = document.getElementById('lang');
  const micBtn = document.getElementById('micBtn');
  const userInput = document.getElementById('userInput');
  const chatDiv = document.getElementById('chat');

  // Quick Action Buttons
  const downloadAadhaarBtn = document.getElementById('downloadAadhaar');
  const downloadLLRBtn = document.getElementById('downloadLLR');
  const downloadLicenseBtn = document.getElementById('downloadLicense');
  const scanLinksBtn = document.getElementById('scanLinks');

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
      recognition.lang = langSelect.value === 'hi' ? 'hi-IN' : 'en-US';
      recognition.start();
    };

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      userInput.value = speechResult;
      micBtn.textContent = '🎤';
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
    micBtn.style.display = 'none';
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

  const createMessage = (sender, message, isHtml = false) => {
    const messageDiv = document.createElement('div');
    const senderStrong = document.createElement('strong');
    senderStrong.textContent = `${sender}: `;
    messageDiv.appendChild(senderStrong);

    if (isHtml) {
      const sanitizedHtml = DOMPurify.sanitize(marked.parse(message));
      const messageSpan = document.createElement('span');
      messageSpan.innerHTML = sanitizedHtml;
      messageDiv.appendChild(messageSpan);
    } else {
      const messageText = document.createTextNode(message);
      messageDiv.appendChild(messageText);
    }

    chatDiv.appendChild(messageDiv);
    chatDiv.scrollTop = chatDiv.scrollHeight;
  };

  const sendMessage = async (message) => {
    createMessage('You', message);
    const typingDiv = document.createElement('div');
    typingDiv.innerHTML = '<i>GovBot is typing...</i>';
    chatDiv.appendChild(typingDiv);

    try {
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      chatDiv.removeChild(typingDiv);

      if (!res.ok) {
        const errorData = await res.json();
        createMessage('Error', `Could not connect to AI: ${errorData.error || res.statusText}`);
        return;
      }

      const data = await res.json();
      createMessage('GovBot', data.reply || 'No response.', true);
    } catch (e) {
      chatDiv.removeChild(typingDiv);
      createMessage('Error', 'An unexpected error occurred.');
      console.error('Fetch error:', e);
    }
  }

  document.getElementById('sendBtn').onclick = async () => {
    const input = userInput.value.trim();
    if (!input) return;
    userInput.value = '';
    sendMessage(input)
  };

  downloadAadhaarBtn.addEventListener('click', () => {
    sendMessage('How to download Aadhaar card?');
  });

  downloadLLRBtn.addEventListener('click', () => {
    window.open('https://sarathi.parivahan.gov.in/sarathiservice/printlearerslicence.do', '_blank');
  });

  downloadLicenseBtn.addEventListener('click', () => {
    sendMessage('how to download driving license');
  });

  scanLinksBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['scanLinks.js']
    });
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scanLinks') {
      let linksList = '';
      if (request.links.length > 0) {
        linksList = request.links.map(link => `<li><a href="${link}" target="_blank">${link}</a></li>`).join('');
      } else {
        linksList = 'No government links found on this page.';
      }
      createMessage('GovBot', `<ul>${linksList}</ul>`, true);
    }
  });
});
