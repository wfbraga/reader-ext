# Read from Here - Chrome Extension

A Chrome extension that replicates Microsoft Edge's read-aloud feature, allowing you to read webpage text starting from any selected point create as a way to advance my Javascript knowledg.

## 🎯 Project Overview

**Read from Here** is a personal project designed to bring the convenience of text-to-speech functionality to any webpage in Chrome. The extension aims to be as **non-intrusive as possible** while providing a seamless reading experience similar to Microsoft Edge's built-in read-aloud feature.

## ✨ Features

- **📖 Text-to-Speech**: Read webpage content aloud using Web Speech API
- **🎯 Context Menu Integration**: Right-click on any text to start reading from that point
- **⚡ Block Navigation**: Navigate through text blocks with previous/next controls
- **🎛️ Voice Customization**: Choose from available system voices
- **🏃 Speed Control**: Adjust reading speed from 0.5x to 2x
- **🌈 Accessibility Features**: High contrast mode and text highlighting
- **📱 Responsive Overlay**: Non-intrusive control panel that adapts to screen size

## 🚀 Installation

### For Development
1. Clone this repository:
   ```bash
   git clone https://github.com/wfbraga/reader-ext.git
   cd reader-ext
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top right)

4. Click "Load unpacked" and select the project folder

### From Chrome Web Store
*Coming soon - extension is currently in development*

## 📱 Usage

1. **Right-click on any text** on a webpage
2. Select **"Read from here"** from the context menu
3. Use the overlay controls to:
   - ⏸️ **Pause/Resume** reading
   - ⏮️⏭️ **Navigate** between text blocks
   - ⏹️ **Stop** reading completely
   - 🔧 **Customize** voice and speed settings
   - 🌓 **Toggle** high contrast mode
   - ✅ **Enable/disable** text highlighting

## 🛠️ Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Core Technologies**: 
  - Web Speech API for text-to-speech
  - Chrome Extension APIs for context menus and content injection
  - Vanilla JavaScript (no external dependencies)
- **Architecture**:
  - `background.js`: Service worker handling context menus and extension lifecycle
  - `content.js`: Content script for DOM manipulation and speech synthesis
  - `manifest.json`: Extension configuration and permissions

## 🎨 Design Philosophy

The extension follows a **minimalist, non-intrusive design** approach:
- Overlay appears only when needed
- Clean, accessible interface
- Respects user's browsing experience
- Minimal permissions required

## 🤝 Contributing

This is a **personal project**, but **help is welcome**! 

### Areas where contributions are especially appreciated:

- 🎨 **UI/UX Design**: We need designer ideas to improve the visual experience
- ♿ **Accessibility**: Enhancing features for users with disabilities  
- 🐛 **Bug Reports**: Testing across different websites and reporting issues
- 💡 **Feature Suggestions**: Ideas for new functionality
- 🌐 **Internationalization**: Support for different languages

### How to Contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🎨 Designer Ideas Needed!

We're actively looking for **design contributions** to make the extension more user-friendly:

- **Better overlay design** - current UI could be more polished
- **Animation improvements** - smooth transitions and micro-interactions
- **Color scheme options** - themes beyond high contrast mode
- **Mobile-responsive design** - better adaptation for smaller screens
- **Icon design** - current icons could be more distinctive
- **Visual feedback** - better indication of current reading state

## 📋 Roadmap

- [ ] Chrome Web Store publication
- [ ] Voice customization improvements
- [ ] Reading progress indicator
- [ ] Bookmarking read positions
- [ ] Keyboard shortcuts
- [ ] Settings persistence
- [ ] Multiple language support
- [ ] Reading statistics

## ⚡ Performance & Privacy

- **Lightweight**: No external dependencies, minimal resource usage
- **Privacy-first**: No data collection, everything runs locally
- **Secure**: Minimal permissions, follows Chrome security best practices

## 🐛 Known Issues

- Some dynamically loaded content may not be detected immediately
- Complex page layouts might affect text block detection
- Voice availability varies by operating system

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Microsoft Edge's native read-aloud functionality
- Built using Chrome's Web APIs and best practices that I could get
- Thanks to the open-source community for guidance and resources

---

**💡 Have ideas? Found a bug? Want to contribute?** 

Open an issue or submit a pull request - all feedback is appreciated!