# Copilot Instructions for AI Coding Agents

## Project Overview
This project is a Chrome extension designed to read the text content of the current webpage. The goal is to leverage native Chrome Extension APIs for robust, secure, and idiomatic implementation, following Google's standards for extension development and security.

## Architecture & Key Components
- **Manifest File**: Defines permissions, background scripts, content scripts, and extension metadata. Follow Chrome's manifest v3 conventions.
- **Content Script**: Injected into web pages to access and extract visible text. Use DOM APIs and avoid unnecessary privileges.
- **Background Service Worker**: Handles extension lifecycle, messaging, and permissions. Use event-driven patterns.
- **Popup/UI**: Minimal UI for user interaction (if needed). Keep UI logic separate from content extraction logic.

## Security & Best Practices
- **Permissions**: Request only essential permissions (e.g., `activeTab`, `scripting`). Avoid broad host permissions.
- **Messaging**: Use Chrome's `runtime.sendMessage` and `runtime.onMessage` for communication between background, popup, and content scripts.
- **Isolation**: Never expose privileged APIs to the webpage context. Use content scripts for DOM access, background for privileged actions.
- **Sanitization**: Always sanitize and validate data extracted from the DOM before processing or displaying.
- **Manifest v3**: Use service workers, not persistent background pages.

## Developer Workflow
- **Build**: No build step required for vanilla JS/TS. For frameworks, use `npm run build` and output to `dist/`.
- **Test**: Manual testing via Chrome's extension loader. Automated tests (if present) should be run with `npm test`.
- **Debug**: Use Chrome DevTools for content scripts and background service worker. Reload extension after code changes.

## Project Conventions
- **File Structure**:
  - `manifest.json`: Extension manifest
  - `src/content.js` or `src/content.ts`: Content script for text extraction
  - `src/background.js` or `src/background.ts`: Background service worker
  - `src/popup.js` or `src/popup.ts`: Popup logic (if present)
  - `src/popup.html`: Popup UI (if present)
- **Coding Style**: Use idiomatic, clean JavaScript/TypeScript. Prefer async/await for asynchronous operations. Follow Chrome's recommended patterns.
- **External Libraries**: Minimize dependencies. Use only well-maintained, security-reviewed packages if necessary.

## Example: Extracting Text from Webpage
```js
// src/content.js
const text = document.body.innerText;
chrome.runtime.sendMessage({ type: 'PAGE_TEXT', text });
```

## References
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/)

---
**AI agents:** Always prefer native Chrome APIs, comply with Google's security standards, and keep code modular and maintainable. When in doubt, reference the official documentation above.
