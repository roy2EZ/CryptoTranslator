# CryptoTranslator - AI实时翻译 / AI Real-time Translation

一个基于AI的实时语音翻译Web应用，支持中英双语字幕显示。

An AI-powered real-time voice translation web application with bilingual subtitle display.

## 功能特性 / Features

- 🎤 **实时语音识别 / Real-time Speech Recognition** - 使用Web Speech API进行实时语音转文字 / Real-time speech-to-text using Web Speech API
- 🤖 **AI智能翻译 / AI Smart Translation** - 集成OpenAI GPT模型进行高质量翻译 / High-quality translation powered by OpenAI GPT models
- 📱 **响应式设计 / Responsive Design** - 完美支持桌面和移动设备，特别优化Safari浏览器 / Perfect support for desktop and mobile devices, specially optimized for Safari
- 🎨 **现代化UI / Modern UI** - 美观的渐变背景和毛玻璃效果 / Beautiful gradient backgrounds and glassmorphism effects
- 📝 **双语字幕 / Bilingual Subtitles** - 同时显示原文和翻译文本 / Display both original and translated text simultaneously
- ⚙️ **个性化设置 / Customizable Settings** - 支持字体大小调节和语言选择 / Support for font size adjustment and language selection
- 💾 **PWA支持 / PWA Support** - 可安装到手机桌面，支持离线使用 / Installable on mobile home screen with offline support
- 🔒 **安全存储 / Secure Storage** - API密钥安全保存在本地浏览器 / API keys securely stored in local browser storage

## 使用方法 / How to Use

### 1. 设置API密钥 / Set up API Key
首次使用时，应用会提示输入OpenAI API密钥。密钥将安全保存在浏览器本地存储中。

On first use, the app will prompt you to enter your OpenAI API key. The key will be securely stored in your browser's local storage.

### 2. 开始翻译 / Start Translation
1. 选择输入语言（默认英语） / Select input language (default: English)
2. 选择输出语言（默认中文简体） / Select output language (default: Simplified Chinese)
3. 点击麦克风按钮开始录音 / Click the microphone button to start recording
4. 说话时应用会实时识别并翻译 / Speak and the app will recognize and translate in real-time
5. 翻译结果以双语字幕形式显示 / Translation results are displayed as bilingual subtitles

### 3. 个性化设置 / Personalization
- 使用滑块调节字体大小 / Use slider to adjust font size
- 切换输入/输出语言 / Switch input/output languages
- 查看识别准确度 / View recognition accuracy

## 快捷键 / Keyboard Shortcuts

- `Ctrl + Shift + K` - 重新设置API密钥 / Reset API key
- `Ctrl + Shift + C` - 清除翻译历史 / Clear translation history

## 技术栈 / Tech Stack

- **前端 / Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **语音识别 / Speech Recognition**: Web Speech API
- **AI翻译 / AI Translation**: OpenAI GPT-3.5-turbo
- **PWA**: Service Worker, Web App Manifest
- **样式 / Styling**: CSS Grid, Flexbox, CSS Variables

## 浏览器支持 / Browser Support

- ✅ Chrome/Edge (推荐 / Recommended)
- ✅ Safari (iOS/macOS)
- ✅ Firefox
- ⚠️ 需要HTTPS环境才能使用麦克风功能 / HTTPS environment required for microphone functionality

## 在线体验 / Live Demo

访问 [CryptoTranslator](https://roy2EZ.github.io/CryptoTranslator/) 立即体验！

Visit [CryptoTranslator](https://roy2EZ.github.io/CryptoTranslator/) for instant experience!

## 部署到GitHub Pages / Deploy to GitHub Pages

1. Fork或下载此项目 / Fork or download this project
2. 在GitHub仓库设置中启用GitHub Pages / Enable GitHub Pages in repository settings
3. 选择主分支作为源 / Select main branch as source
4. 访问 `https://roy2EZ.github.io/CryptoTranslator` / Visit `https://roy2EZ.github.io/CryptoTranslator`

## 本地开发 / Local Development

```bash
# 克隆项目 / Clone the project
git clone https://github.com/roy2EZ/CryptoTranslator.git

# 进入项目目录 / Enter project directory
cd CryptoTranslator

# 启动本地服务器（需要HTTPS）/ Start local server (HTTPS required)
# 可以使用 Live Server 扩展或其他本地服务器 / Use Live Server extension or other local servers
```

## 注意事项 / Important Notes

- 需要有效的OpenAI API密钥 / Valid OpenAI API key required
- 麦克风功能需要用户授权 / Microphone functionality requires user permission
- 建议在安静环境中使用以获得最佳识别效果 / Recommended to use in quiet environment for best recognition results
- 翻译质量取决于语音识别准确度和网络连接 / Translation quality depends on speech recognition accuracy and network connection

## 许可证 / License

MIT License

## 贡献 / Contributing

欢迎提交Issue和Pull Request！

Issues and Pull Requests are welcome!