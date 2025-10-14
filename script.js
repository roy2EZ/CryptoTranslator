class CryptoTranslator {
    constructor() {
        this.recognition = null;
        this.isRecording = false;
        this.isContinuous = false;
        this.apiKey = '';
        this.subtitleHistory = [];
        this.maxHistoryLength = 10;
        
        this.initializeElements();
        this.initializeSpeechRecognition();
        this.bindEvents();
        this.requestApiKey();
    }

    initializeElements() {
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.continuousBtn = document.getElementById('continuousBtn');
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
        // 创建API密钥设置模态框
        const modal = document.createElement('div');
        modal.className = 'api-key-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>🔑 设置OpenAI API密钥</h3>
                <p>请输入您的OpenAI API密钥以使用高质量翻译功能：</p>
                <input type="password" id="apiKeyInput" placeholder="sk-proj-..." class="api-key-input">
                <div class="modal-buttons">
                    <button id="saveApiKey" class="save-btn">保存密钥</button>
                    <button id="useGoogle" class="google-btn">使用Google翻译</button>
                </div>
                <div class="api-key-help">
                    <details>
                        <summary>如何获取API密钥？</summary>
                        <ol>
                            <li>访问 <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI API Keys</a></li>
                            <li>登录您的OpenAI账号</li>
                            <li>点击"Create new secret key"</li>
                            <li>复制生成的密钥（以sk-开头）</li>
                        </ol>
                    </details>
                </div>
                <div class="api-key-note">
                    <small>🔒 您的API密钥将安全地存储在本地浏览器中，不会上传到服务器</small>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const apiKeyInput = modal.querySelector('#apiKeyInput');
        const saveBtn = modal.querySelector('#saveApiKey');
        const googleBtn = modal.querySelector('#useGoogle');
        
        apiKeyInput.focus();
        
        saveBtn.addEventListener('click', () => {
            const apiKey = apiKeyInput.value.trim();
            if (apiKey && apiKey.startsWith('sk-')) {
                this.apiKey = apiKey;
                localStorage.setItem('openai_api_key', apiKey);
                localStorage.setItem('translation_provider', 'openai');
                document.body.removeChild(modal);
                this.updateStatus('OpenAI已就绪', 'ready');
            } else {
                apiKeyInput.style.borderColor = '#f56565';
                alert('请输入有效的OpenAI API密钥（以sk-开头）');
            }
        });
        
        googleBtn.addEventListener('click', () => {
            localStorage.setItem('translation_provider', 'google');
            document.body.removeChild(modal);
            this.updateStatus('Google翻译已就绪', 'ready');
        });
        
        // 按Enter键保存
        apiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveBtn.click();
            }
        });
        
        // 点击模态框外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                googleBtn.click();
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
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => {
                this.startRecording();
            });
        }

        if (this.stopBtn) {
            this.stopBtn.addEventListener('click', () => {
                this.stopRecording();
            });
        }

        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => {
                this.clearHistory();
            });
        }

        if (this.continuousBtn) {
            this.continuousBtn.addEventListener('click', () => {
                this.toggleContinuousMode();
            });
        }

        if (this.sourceLanguage) {
            this.sourceLanguage.addEventListener('change', () => {
                if (this.recognition) {
                    this.recognition.lang = this.sourceLanguage.value === 'auto' ? 'zh-CN' : this.sourceLanguage.value;
                }
            });
        }

        if (this.fontSizeSlider && this.fontSizeValue) {
            this.fontSizeSlider.addEventListener('input', () => {
                const size = this.fontSizeSlider.value;
                this.fontSizeValue.textContent = `${size}px`;
                document.documentElement.style.setProperty('--font-size', `${size}px`);
            });
        }

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

    toggleContinuousMode() {
        this.isContinuous = !this.isContinuous;
        
        if (this.continuousBtn) {
            this.continuousBtn.classList.toggle('active', this.isContinuous);
            
            const btnText = this.continuousBtn.querySelector('.btn-text');
            if (btnText) {
                if (this.isContinuous) {
                    btnText.textContent = '停止监听';
                    this.startRecording();
                } else {
                    btnText.textContent = '持续监听';
                    this.stopRecording();
                }
            }
        }
    }

    startRecording() {
        if (!this.recognition) {
            this.updateStatus('语音识别不可用', 'error');
            return;
        }

        this.isRecording = true;
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
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
            this.startBtn.disabled = false;
            this.stopBtn.disabled = true;
            this.listeningIndicator.classList.remove('active');
        }
    }

    stopRecording() {
        this.shouldContinueListening = false; // 停止持续监听
        
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
        }
        
        this.isRecording = false;
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
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
        if (this.statusText) {
            this.statusText.textContent = text;
        }
        if (this.listeningIndicator) {
            this.listeningIndicator.className = `listening-indicator ${type === 'recording' ? 'active' : ''}`;
        }
    }

    clearHistory() {
        this.subtitleHistory = [];
        this.translationDisplay.innerHTML = `
            <div class="subtitle-container">
                <div class="original-text">历史记录已清除</div>
                <div class="translated-text">History cleared</div>
            </div>
        `;
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new CryptoTranslator();
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