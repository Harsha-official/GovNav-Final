document.addEventListener('DOMContentLoaded', () => {
  const openWidgetBtn = document.getElementById('openWidget');
  const langSelect = document.getElementById('lang');

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
    const input = document.getElementById('userInput').value.trim();
    if (!input) return;
    const chatDiv = document.getElementById('chat');
    chatDiv.innerHTML += `<div><b>You:</b> ${input}</div>`;
    document.getElementById('userInput').value = '';
    chatDiv.innerHTML += `<div><i>GovBot is typing...</i></div>`;
    try {
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      chatDiv.innerHTML += `<div><b>GovBot:</b> ${data.reply || 'No response.'}</div>`;
    } catch (e) {
      chatDiv.innerHTML += `<div style="color:red"><b>Error:</b> Could not connect to AI.</div>`;
    }
    chatDiv.scrollTop = chatDiv.scrollHeight;
  };
});
