# CryptoTranslator - AI实时翻译

一个基于AI的实时语音翻译Web应用，支持中英双语字幕显示。

## 功能特性

- 🎤 **实时语音识别** - 使用Web Speech API进行实时语音转文字
- 🤖 **AI智能翻译** - 集成OpenAI GPT模型进行高质量翻译
- 📱 **响应式设计** - 完美支持桌面和移动设备，特别优化Safari浏览器
- 🎨 **现代化UI** - 美观的渐变背景和毛玻璃效果
- 📝 **双语字幕** - 同时显示原文和翻译文本
- ⚙️ **个性化设置** - 支持字体大小调节和语言选择
- 💾 **PWA支持** - 可安装到手机桌面，支持离线使用
- 🔒 **安全存储** - API密钥安全保存在本地浏览器

## 使用方法

### 1. 设置API密钥
首次使用时，应用会提示输入OpenAI API密钥。密钥将安全保存在浏览器本地存储中。

### 2. 开始翻译
1. 选择输入语言（默认英语）
2. 选择输出语言（默认中文简体）
3. 点击麦克风按钮开始录音
4. 说话时应用会实时识别并翻译
5. 翻译结果以双语字幕形式显示

### 3. 个性化设置
- 使用滑块调节字体大小
- 切换输入/输出语言
- 查看识别准确度

## 快捷键

- `Ctrl + Shift + K` - 重新设置API密钥
- `Ctrl + Shift + C` - 清除翻译历史

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **语音识别**: Web Speech API
- **AI翻译**: OpenAI GPT-3.5-turbo
- **PWA**: Service Worker, Web App Manifest
- **样式**: CSS Grid, Flexbox, CSS变量

## 浏览器支持

- ✅ Chrome/Edge (推荐)
- ✅ Safari (iOS/macOS)
- ✅ Firefox
- ⚠️ 需要HTTPS环境才能使用麦克风功能

## 在线体验

访问 [CryptoTranslator](https://roy2EZ.github.io/CryptoTranslator/) 立即体验！

## 部署到GitHub Pages

1. Fork或下载此项目
2. 在GitHub仓库设置中启用GitHub Pages
3. 选择主分支作为源
4. 访问 `https://roy2EZ.github.io/CryptoTranslator`

## 本地开发

```bash
# 克隆项目
git clone https://github.com/roy2EZ/CryptoTranslator.git

# 进入项目目录
cd CryptoTranslator

# 启动本地服务器（需要HTTPS）
# 可以使用 Live Server 扩展或其他本地服务器
```

## 注意事项

- 需要有效的OpenAI API密钥
- 麦克风功能需要用户授权
- 建议在安静环境中使用以获得最佳识别效果
- 翻译质量取决于语音识别准确度和网络连接

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！