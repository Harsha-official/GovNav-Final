GovNav - Chrome extension
=========================

What it does
- When you visit government websites (domains matching *.gov, *.gov.in, *.nic.in), GovNav injects a small floating helper.
- Clicking the helper opens a compact assistant (iframe) that:
  - Shows general steps to download application forms or LLR (learner/license-related PDFs).
  - Scans the page for likely download links (looks for link text/href containing 'download', 'form', 'pdf', 'LLR', 'license', etc.).
  - Highlights found links and lets you open them in a new tab.
  - Supports multiple languages (English, Hindi, Tamil) through the popup.

Files included
- manifest.json
- popup.html
- content_script.js
- styles.css
- icons/ (3 placeholder PNG icons)
- README.md

How to load (developer mode)
## upload your extention Document.......
1. Open Chrome -> chrome://extensions
2. Toggle 'Developer mode' ON.
3. Click 'Load unpacked' and select the unzipped 'GovNav' folder.
4. Visit a government site (e.g., https://www.example.gov.in) and click the floating GovNav helper.

Notes and limitations
- This is a general-purpose helper. Government websites vary widely; some downloads are behind logins or hidden behind JavaScript — GovNav attempts to find obvious links but cannot bypass authentication.
- You can modify languages or add more localization by editing the strings in the popup.html and content_script.js files.

