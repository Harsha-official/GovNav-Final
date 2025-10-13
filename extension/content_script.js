(function(){
  // Prevent injecting multiple times
  if(window.__GovNavInjected) return;
  window.__GovNavInjected = true;

  // Only run on government domains (extra safety)
  try{
    const hostname = location.hostname || '';
    const govPatterns = ['.gov.', '.gov', '.gov.in', '.nic.in', '.govt'];
    if(!govPatterns.some(p => hostname.includes(p))) {
      // do not inject on non-gov pages
      return;
    }
  }catch(e){}

  // Create a compact floating helper (in case popup isn't used)
  const helperId = 'govnav-mini-helper';
  if(document.getElementById(helperId)) return;
  const div = document.createElement('div');
  div.id = helperId;
  div.style.position='fixed';
  div.style.left='12px';
  div.style.bottom='20px';
  div.style.zIndex=2147483647;
  div.style.padding='8px';
  div.style.background='rgba(255,255,255,0.95)';
  div.style.border='1px solid rgba(0,0,0,0.08)';
  div.style.borderRadius='10px';
  div.style.boxShadow='0 6px 18px rgba(0,0,0,0.12)';
  div.style.fontFamily='Arial, sans-serif';
  div.style.fontSize='13px';
  div.innerHTML = '<strong>GovNav</strong><div style="font-size:12px;margin-top:6px">Click to open download helper</div>';
  div.addEventListener('click', () => {
    // simulate clicking popup action to create widget
    const evt = new CustomEvent('govnav-open-widget');
    window.dispatchEvent(evt);
  });
  document.documentElement.appendChild(div);

  // Listener to create full widget (same code as popup inject)
  window.addEventListener('govnav-open-widget', ()=>{
    if(window.__GovNavWidget && window.__GovNavWidget.show){
      window.__GovNavWidget.show();
      return;
    }
    // create widget iframe
    const container = document.createElement('div');
    container.id = 'govnav-widget-root';
    document.documentElement.appendChild(container);
    const iframe = document.createElement('iframe');
    iframe.id = 'govnav-iframe';
    iframe.style.position='fixed';
    iframe.style.right='20px';
    iframe.style.bottom='20px';
    iframe.style.width='360px';
    iframe.style.height='460px';
    iframe.style.zIndex=2147483647;
    iframe.style.border='0';
    iframe.style.borderRadius='12px';
    iframe.style.boxShadow='0 6px 18px rgba(0,0,0,0.25)';
    container.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write('<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial, sans-serif;margin:0} .wrap{padding:12px} button{padding:8px;margin-top:8px;width:100%}</style></head><body><div class="wrap" id="wrap"></div></body></html>');
    doc.close();

    // implement minimal localized UI here
    const L = {
      en: { title:'GovNav — Download helper', find:'Find download links', scan:'Scan links', stepsTitle:'Steps to download', step1:'1. Look for "Downloads" / "Forms" / "Apply".', step2:'2. Click application or PDF.', step3:'3. Use browser Download to save PDF.', step4:'4. Follow page instructions.' , close:'Close'},
      hi: { title:'GovNav — डाउनलोड सहायता', find:'डाउनलोड लिंक खोजें', scan:'लिंक स्कैन करें', stepsTitle:'डाउनलोड के कदम', step1:'1. "Downloads" / "Forms" खोजें।', step2:'2. आवेदन या PDF क्लिक करें।', step3:'3. ब्राउज़र से PDF सहेजें।', step4:'4. निर्देशों का पालन करें।', close:'बंद'},
      ta: { title:'GovNav — பதிவிறக்கம் உதவி', find:'பதிவிறக்க இணைப்புகள் தேடு', scan:'இணைப்புகளை ஸ்கேன் செய்', stepsTitle:'பதிவிறக்கம் படிகள்', step1:'1. "Downloads" / "Forms" பகுதியை தேடு.', step2:'2. விண்ணப்பம்/ PDF அழுத்து.', step3:'3. உலாவியில் சேமி.', step4:'4. வழிமுறைகளை பின்பற்று.', close:'மூடு'}
    };

    function render(lang='en'){
      const root = doc.getElementById('wrap');
      const t = L[lang] || L.en;
      root.innerHTML = '<h3 style="margin:0;padding:0">'+t.title+'</h3>';
      const btnFind = doc.createElement('button');
      btnFind.textContent = t.find;
      btnFind.addEventListener('click', () => { scanLinks(); });
      root.appendChild(btnFind);
      const btnScan = doc.createElement('button');
      btnScan.textContent = t.scan;
      btnScan.addEventListener('click', () => { scanLinks(true); });
      root.appendChild(btnScan);
      const steps = doc.createElement('div');
      steps.style.marginTop='10px';
      steps.innerHTML = '<strong>'+t.stepsTitle+'</strong><div style="font-size:13px;margin-top:6px">'+t.step1+'<br/>'+t.step2+'<br/>'+t.step3+'<br/>'+t.step4+'</div>';
      root.appendChild(steps);
      const close = doc.createElement('button');
      close.textContent = t.close;
      close.style.background='#eee';
      close.addEventListener('click', ()=>{ iframe.style.display='none'; });
      root.appendChild(close);

      // --- AI Chat UI ---
      const chatBox = doc.createElement('div');
      chatBox.style.marginTop = '14px';
      chatBox.innerHTML = `
        <strong>Ask GovNav AI</strong>
        <div id="chat-messages" style="height:120px;overflow:auto;background:#f9f9f9;border-radius:6px;padding:6px;margin-bottom:6px"></div>
        <input id="chat-input" type="text" placeholder="Type your question..." style="width:80%;padding:6px;border-radius:4px;border:1px solid #ccc"/>
        <button id="chat-send" style="padding:6px 12px;margin-left:4px">Send</button>
      `;
      root.appendChild(chatBox);

      const chatMessages = doc.getElementById('chat-messages');
      const chatInput = doc.getElementById('chat-input');
      const chatSend = doc.getElementById('chat-send');

      chatSend.onclick = async () => {
        const question = chatInput.value.trim();
        if (!question) return;
        chatMessages.innerHTML += `<div><b>You:</b> ${question}</div>`;
        chatInput.value = '';
        chatMessages.innerHTML += `<div><i>GovNav AI is typing...</i></div>`;
        try {
          const res = await fetch('http://localhost:3001/api/chat', {
            method: 'POST',
            headers: { 'Content-Type':'application/json' },
            body: JSON.stringify({ message: question })
          });
          const data = await res.json();
          const reply = data.reply || 'No response.'; // <-- FIXED LINE
          chatMessages.innerHTML += `<div><b>GovNav AI:</b> ${reply}</div>`;
        } catch(e) {
          chatMessages.innerHTML += `<div style="color:red"><b>Error:</b> Could not connect to AI.</div>`;
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
      };
    }

    function render(lang='hi'){
      const root = doc.getElementById('wrap');
      const t = L[lang] || L.hi;
      root.innerHTML = '<h3 style="margin:0;padding:0">'+t.title+'</h3>';
      const btnFind = doc.createElement('button');
      btnFind.textContent = t.find;
      btnFind.addEventListener('click', () => { scanLinks(); });
      root.appendChild(btnFind);
      const btnScan = doc.createElement('button');
      btnScan.textContent = t.scan;
      btnScan.addEventListener('click', () => { scanLinks(true); });
      root.appendChild(btnScan);
      const steps = doc.createElement('div');
      steps.style.marginTop='10px';
      steps.innerHTML = '<strong>'+t.stepsTitle+'</strong><div style="font-size:13px;margin-top:6px">'+t.step1+'<br/>'+t.step2+'<br/>'+t.step3+'<br/>'+t.step4+'</div>';
      root.appendChild(steps);
      const close = doc.createElement('button');
      close.textContent = t.close;
      close.style.background='#eee';
      close.addEventListener('click', ()=>{ iframe.style.display='none'; });
      root.appendChild(close);
    }


    function scanLinks(highlightOnly){
      const texts = ['download','downloads','form','forms','application','apply','pdf','LLR','license','licence','learner'];
      const anchors = Array.from(document.querySelectorAll('a'));
      const found = [];
      anchors.forEach(a=>{
        const txt = (a.innerText || a.textContent || '').toLowerCase();
        const href = (a.href || '').toLowerCase();
        for(const key of texts){
          if(txt.includes(key) || href.includes(key)){
            found.push({text:a.innerText || a.textContent, href: a.href, node: a});
            break;
          }
        }
      });
      const root = doc.getElementById('wrap');
      const heading = doc.createElement('div');
      heading.style.marginTop='10px';
      heading.innerHTML = '<strong>Found links ('+found.length+')</strong>';
      root.appendChild(heading);
      if(found.length===0){
        const p = doc.createElement('div');
        p.style.marginTop='8px';
        p.textContent = 'No obvious download links found. Try Ctrl+F for "download", "form", "PDF".';
        root.appendChild(p);
        return;
      }
      const list = doc.createElement('div');
      list.style.marginTop='8px';
      found.slice(0,15).forEach(item=>{
        const b = doc.createElement('button');
        b.style.textAlign='left';
        b.style.whiteSpace='normal';
        b.textContent = (item.text || item.href).trim();
        b.addEventListener('click', ()=>{
          window.open(item.href, '_blank');
        });
        list.appendChild(b);
      });
      root.appendChild(list);
      // highlight found links on original page
      found.forEach((f,i)=>{
        try{
          f.node.style.outline = '3px solid #ff9800';
          setTimeout(()=>{ f.node.style.outline=''; }, 10000);
        }catch(e){}
      });
    }

    // expose api
    window.__GovNavWidget = {
      setLanguage: (l)=> render(l),
      show: ()=> iframe.style.display='block',
      hide: ()=> iframe.style.display='none',
      scanLinks
    };
    render('en');

    window.__GovNavWidget = {
      setLanguage: (l)=> render(l),
      show: ()=> iframe.style.display='block',
      hide: ()=> iframe.style.display='none',
      scanLinks
    };
    render('hi')
  });

})();
