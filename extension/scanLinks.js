const links = Array.from(document.getElementsByTagName('a'));
const govLinks = links.filter(link => link.href.includes('.gov'));

// Create a list of objects, each containing the link's URL and its text
const linkData = govLinks.map(link => ({
  href: link.href,
  text: link.innerText.trim()
}));

// Send this structured data back to the popup
chrome.runtime.sendMessage({ action: 'scanLinks', links: linkData });
