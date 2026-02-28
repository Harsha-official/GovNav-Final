const links = Array.from(document.getElementsByTagName('a'));
const govLinks = links.filter(link => link.href.includes('.gov'));
const linkList = govLinks.map(link => link.href);

chrome.runtime.sendMessage({ action: 'scanLinks', links: linkList });
