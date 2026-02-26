(function() {
  // Prevent injecting multiple times
  if (window.__GovNavInjected) return;
  window.__GovNavInjected = true;

  // --- Utils ---
  function isGovDomain() {
    const hostname = location.hostname || '';
    const govPatterns = ['.gov.', '.gov', '.gov.in', '.nic.in', '.govt'];
    return govPatterns.some(p => hostname.includes(p));
  }

  // --- UI Creation ---
  function createMiniHelper() {
    if (document.getElementById('govnav-mini-helper')) return;
    const div = document.createElement('div');
    div.id = 'govnav-mini-helper';
    div.style.cssText = `position:fixed; left:12px; bottom:20px; z-index:2147483647; padding:8px; background:rgba(255,255,255,0.95); border:1px solid rgba(0,0,0,0.08); border-radius:10px; box-shadow:0 6px 18px rgba(0,0,0,0.12); font-family:Arial, sans-serif; font-size:13px; cursor:pointer;`;
    div.innerHTML = '<strong>GovNav</strong><div style="font-size:12px;margin-top:6px">Click to open helper</div>';
    div.addEventListener('click', () => window.dispatchEvent(new CustomEvent('govnav-open-widget')));
    document.documentElement.appendChild(div);
  }

  function createWidget() {
    if (document.getElementById('govnav-widget-root')) {
      window.__GovNavWidget.show();
      return;
    }
    const container = document.createElement('div');
    container.id = 'govnav-widget-root';
    document.documentElement.appendChild(container);
    const iframe = document.createElement('iframe');
    iframe.id = 'govnav-iframe';
    iframe.style.cssText = `position:fixed; right:20px; bottom:20px; width:360px; height:520px; z-index:2147483647; border:0; border-radius:12px; box-shadow:0 6px 18px rgba(0,0,0,0.25);`;
    container.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write('<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial, sans-serif;margin:0; background:#f0f4f8;} .wrap{padding:12px}</style></head><body><div class="wrap" id="wrap"></div></body></html>');
    doc.close();
    return { iframe, doc };
  }

  // --- Main Widget Logic ---
  function initializeWidget(iframe, doc) {
    const L = {
      en: { title:'GovNav Helper', find:'Find Download Links', stepsTitle:'Quick Guide', step1:'Use the chat below to ask questions.', step2:'The AI can guide you step-by-step.', close:'Close' },
      hi: { title:'GovNav सहायता', find:'डाउनलोड लिंक खोजें', stepsTitle:'त्वरित गाइड', step1:'प्रश्न पूछने के लिए चैट का उपयोग करें।', step2:'AI आपको कदम-दर-कदम गाइड करेगा।', close:'बंद' }
    };

    let currentLang = 'en';

    function render() {
      const t = L[currentLang] || L.en;
      const root = doc.getElementById('wrap');
      root.innerHTML = `
        <h3 style="margin:0;padding:0;color:#1a237e;">${t.title}</h3>
        <div style="font-size:13px;margin-top:8px;color:#555;">
          <strong>${t.stepsTitle}</strong>
          <div style="font-size:12px;margin-top:6px;">${t.step1}<br/>${t.step2}</div>
        </div>
        <div id="chat-container" style="margin-top:14px;"></div>
        <button id="close-btn" style="background:#eee;border:1px solid #ccc;width:100%;padding:8px;margin-top:10px;border-radius:6px;cursor:pointer;">${t.close}</button>
      `;
      doc.getElementById('close-btn').onclick = () => window.__GovNavWidget.hide();
      renderChat(doc.getElementById('chat-container'));
    }

    function renderChat(container) {
      container.innerHTML = `
        <strong style="color:#3f51b5;">Ask GovNav AI</strong>
        <div id="chat-messages" style="height:240px;overflow-y:auto;background:#fff;border-radius:6px;padding:8px;margin:8px 0;border:1px solid #ddd;"></div>
        <div style="display:flex;gap:8px;">
          <input id="chat-input" type="text" placeholder="Ask a question..." style="flex:1;padding:8px;border-radius:4px;border:1px solid #ccc"/>
          <button id="chat-send" style="padding:8px 16px;border:none;background:#3f51b5;color:#fff;border-radius:4px;cursor:pointer;">Send</button>
        </div>
      `;

      const chatMessages = doc.getElementById('chat-messages');
      const chatInput = doc.getElementById('chat-input');
      const chatSend = doc.getElementById('chat-send');

      chatSend.onclick = async () => {
        const question = chatInput.value.trim();
        if (!question) return;
        chatMessages.innerHTML += `<div style="margin-bottom:8px;"><b>You:</b> ${question}</div>`;
        chatInput.value = '';
        chatMessages.innerHTML += `<div id="typing-indicator" style="margin-bottom:8px;"><i>GovNav AI is typing...</i></div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
        try {
          const res = await fetch('http://localhost:3001/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: question })
          });
          const data = await res.json();
          const reply = data.reply || 'No response.';
          doc.getElementById('typing-indicator').remove();
          chatMessages.innerHTML += `<div style="margin-bottom:8px;"><b>GovNav AI:</b> ${reply}</div>`;
          // Check for navigation commands
          handleNavigation(reply);
        } catch(e) {
          doc.getElementById('typing-indicator').remove();
          chatMessages.innerHTML += `<div style="color:red;margin-bottom:8px;"><b>Error:</b> Could not connect to AI.</div>`;
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
      };
    }

    window.__GovNavWidget = {
      setLanguage: (l) => { currentLang = l; render(); },
      show: () => iframe.style.display = 'block',
      hide: () => iframe.style.display = 'none',
      render
    };

    render();
  }

  // --- Navigation Logic ---
  function handleNavigation(text) {
    const navRegex = /highlight and click on the button "(.*?)"/i;
    const match = text.match(navRegex);
    if (match && match[1]) {
      navigateTo(match[1]);
    }
  }

  function navigateTo(targetText) {
    const elements = Array.from(document.querySelectorAll('a, button, input[type="submit"]'));
    const targetElement = elements.find(el => (el.textContent || el.innerText || el.value).trim().toLowerCase() === targetText.toLowerCase());

    if (targetElement) {
      targetElement.style.transition = 'all 0.3s ease-in-out';
      targetElement.style.outline = '4px solid #ffeb3b'; // Bright yellow highlight
      targetElement.style.transform = 'scale(1.05)';
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Add a visual cue
      const pulse = document.createElement('div');
      pulse.style.cssText = `position:absolute; left:${targetElement.offsetLeft}px; top:${targetElement.offsetTop}px; width:${targetElement.offsetWidth}px; height:${targetElement.offsetHeight}px; background:#ffeb3b; border-radius:inherit; z-index: -1; animation: pulse-animation 1.5s infinite;`;
      targetElement.style.position = 'relative';
      targetElement.appendChild(pulse);

      const keyframes = `
        @keyframes pulse-animation {
          0% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.1); opacity: 0.3; }
          100% { transform: scale(1); opacity: 0.7; }
        }
      `;
      const styleSheet = document.createElement("style");
      styleSheet.type = "text/css";
      styleSheet.innerText = keyframes;
      document.head.appendChild(styleSheet);


      // Remove the highlight after a delay
      setTimeout(() => {
        targetElement.style.outline = '';
        targetElement.style.transform = '';
        pulse.remove();
      }, 8000);
    }
  }

  // --- Initialization ---
  if (isGovDomain()) {
    createMiniHelper();
    window.addEventListener('govnav-open-widget', () => {
      const { iframe, doc } = createWidget();
      initializeWidget(iframe, doc);
    });
  }
})();
