class CryptoTranslator {
    constructor() {
        this.recognition = null;
        this.isRecording = false;
        this.apiKey = '';
        this.subtitleHistory = [];
        this.maxHistoryLength = 10;
        
        this.initializeElements();
        this.initializeSpeechRecognition();
        this.bindEvents();
    }

    initializeElements() {
        try {
            this.micBtn = document.getElementById('micBtn');
            this.statusText = document.getElementById('statusText');
            this.listeningIndicator = document.getElementById('listeningIndicator');
            this.translationDisplay = document.getElementById('translationDisplay');
            this.sourceLanguage = document.getElementById('sourceLanguage');
            this.targetLanguage = document.getElementById('targetLanguage');
            this.fontSizeSlider = document.getElementById('fontSizeSlider');
            this.fontSizeValue = document.getElementById('fontSizeValue');
            
            // 获取翻译显示元素
            this.originalText = document.getElementById('originalText');
            this.translatedText = document.getElementById('translatedText');
            
            // 获取信息显示元素
            this.inputInfo = document.getElementById('inputInfo');
            this.outputInfo = document.getElementById('outputInfo');
            this.fontSizeInfo = document.getElementById('fontSizeInfo');
        } catch (error) {
            console.error('初始化元素时出错:', error);
        }
    }

    requestApiKey() {
        // 检查是否有保存的OpenAI API密钥
        const savedKey = localStorage.getItem('openai_api_key');
        if (savedKey) {
            this.apiKey = savedKey;
            this.updateStatus('准备就绪', 'ready');
        } else {
            this.showApiKeyModal();
        }
    }

    showApiKeyModal() {
        // 使用现有的API密钥模态框
        const modal = document.getElementById('apiKeyModal');
        if (!modal) {
            console.error('API密钥模态框未找到');
            return;
        }
        
        modal.style.display = 'flex';
        
        const apiKeyInput = document.getElementById('apiKeyInput');
        const saveBtn = document.getElementById('saveApiKey');
        const googleBtn = document.getElementById('useGoogle');
        
        if (apiKeyInput) {
            apiKeyInput.focus();
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const apiKey = apiKeyInput.value.trim();
                if (apiKey && apiKey.startsWith('sk-')) {
                    this.apiKey = apiKey;
                    localStorage.setItem('openai_api_key', apiKey);
                    localStorage.setItem('translation_provider', 'openai');
                    modal.style.display = 'none';
                    this.updateStatus('OpenAI已就绪', 'ready');
                } else {
                    apiKeyInput.style.borderColor = '#f56565';
                    alert('请输入有效的OpenAI API密钥（以sk-开头）');
                }
            });
        }
        
        if (googleBtn) {
            googleBtn.addEventListener('click', () => {
                localStorage.setItem('translation_provider', 'google');
                modal.style.display = 'none';
                this.updateStatus('Google翻译已就绪', 'ready');
            });
        }
        
        // 按Enter键保存
        if (apiKeyInput) {
            apiKeyInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveBtn.click();
                }
            });
        }
        
        // 点击模态框外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                if (googleBtn) {
                    googleBtn.click();
                }
            }
        });
    }

    initializeSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.updateStatus('浏览器不支持语音识别', 'error');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.sourceLanguage.value;
        this.shouldContinueListening = false; // 新增：控制是否持续监听

        this.recognition.onstart = () => {
            this.isRecording = true;
            this.listeningIndicator.classList.add('active');
            if (this.shouldContinueListening) {
                this.updateStatus('持续监听中...', 'recording');
            } else {
                this.updateStatus('正在监听...', 'recording');
            }
        };

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i].transcript;
                const confidence = event.results[i].confidence;

                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                    this.updateConfidence(confidence);
                } else {
                    interimTranscript += transcript;
                }
            }

            if (finalTranscript) {
                this.processTranscript(finalTranscript);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            
            // 如果是网络错误或其他可恢复错误，且用户希望持续监听，则重新启动
            if (this.shouldContinueListening && 
                (event.error === 'network' || event.error === 'audio-capture' || event.error === 'no-speech')) {
                setTimeout(() => {
                    if (this.shouldContinueListening) {
                        this.restartRecognition();
                    }
                }, 1000);
            } else {
                this.updateStatus(`识别错误: ${event.error}`, 'error');
                this.shouldContinueListening = false;
                this.isRecording = false;
                this.listeningIndicator.classList.remove('active');
                this.startBtn.disabled = false;
                this.stopBtn.disabled = true;
            }
        };

        this.recognition.onend = () => {
            this.isRecording = false;
            this.listeningIndicator.classList.remove('active');
            
            // 如果用户希望持续监听，自动重新开始
            if (this.shouldContinueListening) {
                setTimeout(() => {
                    if (this.shouldContinueListening) {
                        this.restartRecognition();
                    }
                }, 500); // 短暂延迟后重新开始
            } else {
                this.startBtn.disabled = false;
                this.stopBtn.disabled = true;
                this.updateStatus('准备就绪', 'ready');
            }
        };
    }

    async processTranscript(text) {
        this.updateStatus('正在翻译...', 'processing');
        
        try {
            const translation = await this.translateText(text);
            this.addSubtitle(text, translation);
            this.updateStatus('翻译完成', 'ready');
        } catch (error) {
            console.error('翻译错误:', error);
            this.updateStatus('翻译失败', 'error');
            this.addSubtitle(text, '翻译失败');
        }
    }

    async translateText(text) {
        const targetLang = this.targetLanguage.value;
        const sourceLang = this.sourceLanguage.value.split('-')[0]; // 'en-US' -> 'en'
        const provider = localStorage.getItem('translation_provider') || 'google';
        
        if (provider === 'openai' && this.apiKey) {
            return await this.translateWithOpenAI(text, sourceLang, targetLang);
        } else {
            return await this.translateWithGoogle(text, sourceLang, targetLang);
        }
    }
    
    async translateWithOpenAI(text, sourceLang, targetLang) {
        const targetLanguageName = targetLang === 'zh-CN' ? '中文' : 'English';
        const sourceLanguageName = sourceLang === 'en' ? 'English' : '中文';
        
        const prompt = `请将以下${sourceLanguageName}文本翻译成${targetLanguageName}，只返回翻译结果，不要添加任何解释或标点符号：\n\n${text}`;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 200,
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API请求失败: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.warn('OpenAI翻译失败，切换到Google翻译:', error);
            return await this.translateWithGoogle(text, sourceLang, targetLang);
        }
    }
    
    async translateWithGoogle(text, sourceLang, targetLang) {
        // 使用Google Translate免费API
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Google翻译请求失败: ${response.status}`);
            }
            
            const data = await response.json();
            // Google Translate API返回的数据结构：[["翻译结果", "原文", null, null, 3]]
            return data[0][0][0];
        } catch (error) {
            console.warn('Google翻译失败，使用备用方案:', error);
            return this.fallbackTranslate(text, sourceLang, targetLang);
        }
    }
    
    fallbackTranslate(text, sourceLang, targetLang) {
        // 简单的备用翻译逻辑
        if (sourceLang === 'en' && targetLang === 'zh-CN') {
            return `[翻译] ${text}`;
        } else if (sourceLang === 'zh' && targetLang === 'en') {
            return `[Translation] ${text}`;
        }
        return `[${targetLang}] ${text}`;
    }

    addSubtitle(original, translated) {
        // 直接更新现有的文本元素
        if (this.originalText && this.translatedText) {
            // 添加淡出效果
            this.originalText.style.opacity = '0.5';
            this.translatedText.style.opacity = '0.5';
            
            setTimeout(() => {
                this.originalText.textContent = original;
                this.translatedText.textContent = translated;
                
                // 添加淡入效果
                this.originalText.style.transition = 'opacity 0.3s ease';
                this.translatedText.style.transition = 'opacity 0.3s ease';
                this.originalText.style.opacity = '1';
                this.translatedText.style.opacity = '1';
            }, 150);
        }
    }

    bindEvents() {
        if (this.micBtn) {
            this.micBtn.addEventListener('click', () => {
                this.toggleRecording();
            });
        }

        if (this.sourceLanguage) {
            this.sourceLanguage.addEventListener('change', () => {
                if (this.recognition) {
                    this.recognition.lang = this.sourceLanguage.value === 'auto' ? 'zh-CN' : this.sourceLanguage.value;
                }
                // 更新显示信息
                this.updateDisplayInfo();
            });
        }

        if (this.targetLanguage) {
            this.targetLanguage.addEventListener('change', () => {
                // 更新显示信息
                this.updateDisplayInfo();
            });
        }

        if (this.fontSizeSlider && this.fontSizeValue) {
            this.fontSizeSlider.addEventListener('input', () => {
                const size = this.fontSizeSlider.value;
                this.fontSizeValue.textContent = `${size}px`;
                document.documentElement.style.setProperty('--font-size', `${size}px`);
                // 更新显示信息
                this.updateDisplayInfo();
            });
        }

        // 初始化显示信息
        this.updateDisplayInfo();

        // 清除API密钥的快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'K') {
                localStorage.removeItem('openai_api_key');
                this.apiKey = '';
                this.showApiKeyModal();
            }
        });

        // 清除历史记录的快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                this.clearHistory();
            }
        });
    }



    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    startRecording() {
        if (!this.recognition) {
            this.updateStatus('语音识别不可用', 'error');
            return;
        }

        this.isRecording = true;
        this.micBtn.classList.add('recording');
        this.listeningIndicator.classList.add('active');
        this.shouldContinueListening = true; // 开启持续监听
        this.updateStatus('正在录音...', 'recording');
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('启动录音失败:', error);
            this.updateStatus('启动失败', 'error');
            this.shouldContinueListening = false;
            this.isRecording = false;
            this.micBtn.classList.remove('recording');
            this.listeningIndicator.classList.remove('active');
        }
    }

    stopRecording() {
        this.shouldContinueListening = false; // 停止持续监听
        
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
        }
        
        this.isRecording = false;
        this.micBtn.classList.remove('recording');
        this.listeningIndicator.classList.remove('active');
        this.updateStatus('准备就绪', 'ready');
    }

    restartRecognition() {
        if (!this.shouldContinueListening) return;
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('重新启动识别失败:', error);
            // 如果启动失败，稍后再试
            setTimeout(() => {
                if (this.shouldContinueListening) {
                    this.restartRecognition();
                }
            }, 2000);
        }
    }

    updateStatus(text, type) {
        try {
            if (this.statusText) {
                this.statusText.textContent = text;
            }
            if (this.listeningIndicator) {
                this.listeningIndicator.className = `listening-indicator ${type === 'recording' ? 'active' : ''}`;
            }
        } catch (error) {
            console.error('更新状态时出错:', error);
        }
    }

    clearHistory() {
        this.subtitleHistory = [];
        if (this.originalText) {
            this.originalText.textContent = '点击开始按钮开始语音识别...';
        }
        if (this.translatedText) {
            this.translatedText.textContent = 'Click start button to begin voice recognition...';
        }
        this.updateStatus('历史记录已清除', 'ready');
    }

    updateDisplayInfo() {
        try {
            // 更新输入语言显示
            if (this.inputInfo && this.sourceLanguage) {
                const sourceValue = this.sourceLanguage.value;
                const sourceText = this.sourceLanguage.options[this.sourceLanguage.selectedIndex].text;
                this.inputInfo.textContent = sourceText;
            }

            // 更新输出语言显示
            if (this.outputInfo && this.targetLanguage) {
                const targetText = this.targetLanguage.options[this.targetLanguage.selectedIndex].text;
                this.outputInfo.textContent = targetText;
            }

            // 更新字体大小显示
            if (this.fontSizeInfo && this.fontSizeSlider) {
                this.fontSizeInfo.textContent = `${this.fontSizeSlider.value}px`;
            }
        } catch (error) {
            console.error('更新显示信息时出错:', error);
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const translator = new CryptoTranslator();
    translator.requestApiKey();
});

// PWA支持
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}