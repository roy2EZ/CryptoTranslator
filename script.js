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
        this.requestApiKey();
    }

    initializeElements() {
        this.micButton = document.getElementById('micButton');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = this.statusIndicator.querySelector('.status-text');
        this.statusDot = this.statusIndicator.querySelector('.status-dot');
        this.confidenceFill = document.getElementById('confidenceFill');
        this.confidenceValue = document.getElementById('confidenceValue');
        this.translationDisplay = document.getElementById('translationDisplay');
        this.inputLanguage = document.getElementById('inputLanguage');
        this.outputLanguage = document.getElementById('outputLanguage');
        this.fontSize = document.getElementById('fontSize');
        this.fontSizeValue = document.getElementById('fontSizeValue');
    }

    requestApiKey() {
        // 安全地请求API密钥
        const savedKey = localStorage.getItem('openai_api_key');
        if (savedKey) {
            this.apiKey = savedKey;
            this.updateStatus('准备就绪', 'ready');
        } else {
            this.showApiKeyModal();
        }
    }

    showApiKeyModal() {
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'api-key-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>设置OpenAI API密钥</h3>
                <p>请输入您的OpenAI API密钥以使用翻译功能：</p>
                <input type="password" id="apiKeyInput" placeholder="sk-..." class="api-key-input">
                <div class="modal-buttons">
                    <button id="saveApiKey" class="save-btn">保存</button>
                    <button id="cancelApiKey" class="cancel-btn">取消</button>
                </div>
                <p class="api-key-note">密钥将安全保存在您的浏览器本地存储中</p>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const input = modal.querySelector('#apiKeyInput');
        const saveBtn = modal.querySelector('#saveApiKey');
        const cancelBtn = modal.querySelector('#cancelApiKey');
        
        input.focus();
        
        const handleSave = () => {
            const key = input.value.trim();
            if (key) {
                this.apiKey = key;
                localStorage.setItem('openai_api_key', key);
                this.updateStatus('准备就绪', 'ready');
                document.body.removeChild(modal);
            } else {
                input.style.borderColor = '#f56565';
                input.placeholder = '请输入有效的API密钥';
            }
        };
        
        const handleCancel = () => {
            this.updateStatus('需要API密钥', 'error');
            document.body.removeChild(modal);
        };
        
        saveBtn.addEventListener('click', handleSave);
        cancelBtn.addEventListener('click', handleCancel);
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSave();
            }
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                handleCancel();
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
        this.recognition.lang = this.inputLanguage.value;
        this.shouldContinueListening = false; // 新增：控制是否持续监听

        this.recognition.onstart = () => {
            this.isRecording = true;
            if (this.shouldContinueListening) {
                this.updateStatus('持续监听中...', 'recording');
                this.micButton.classList.add('continuous-recording');
            } else {
                this.updateStatus('正在监听...', 'recording');
                this.micButton.classList.add('recording');
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
                this.micButton.classList.remove('recording', 'continuous-recording');
            }
        };

        this.recognition.onend = () => {
            this.isRecording = false;
            
            // 如果用户希望持续监听，自动重新开始
            if (this.shouldContinueListening) {
                setTimeout(() => {
                    if (this.shouldContinueListening) {
                        this.restartRecognition();
                    }
                }, 500); // 短暂延迟后重新开始
            } else {
                this.micButton.classList.remove('recording', 'continuous-recording');
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
        if (!this.apiKey) {
            throw new Error('API密钥未设置');
        }

        const targetLang = this.outputLanguage.value;
        const sourceLang = this.inputLanguage.value.split('-')[0]; // 'en-US' -> 'en'
        
        const prompt = `请将以下${sourceLang === 'en' ? '英文' : '中文'}文本翻译成${targetLang === 'zh-CN' ? '中文' : '英文'}，只返回翻译结果，不要添加任何解释：\n\n${text}`;

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
            throw new Error(`API请求失败: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    addSubtitle(original, translated) {
        const subtitleContainer = document.createElement('div');
        subtitleContainer.className = 'subtitle-container';
        
        const originalText = document.createElement('div');
        originalText.className = 'original-text';
        originalText.textContent = original;
        
        const translatedText = document.createElement('div');
        translatedText.className = 'translated-text';
        translatedText.textContent = translated;
        
        subtitleContainer.appendChild(originalText);
        subtitleContainer.appendChild(translatedText);
        
        // 清除示例内容
        if (this.translationDisplay.children.length > 0 && 
            this.translationDisplay.children[0].id === 'originalText') {
            this.translationDisplay.innerHTML = '';
        }
        
        this.translationDisplay.appendChild(subtitleContainer);
        
        // 保持历史记录限制
        this.subtitleHistory.push({ original, translated });
        if (this.subtitleHistory.length > this.maxHistoryLength) {
            this.subtitleHistory.shift();
            if (this.translationDisplay.children.length > this.maxHistoryLength) {
                this.translationDisplay.removeChild(this.translationDisplay.firstChild);
            }
        }
        
        // 滚动到底部
        this.translationDisplay.scrollTop = this.translationDisplay.scrollHeight;
    }

    bindEvents() {
        this.micButton.addEventListener('click', () => {
            if (this.isRecording) {
                this.stopRecording();
            } else {
                this.startRecording();
            }
        });

        this.inputLanguage.addEventListener('change', () => {
            if (this.recognition) {
                this.recognition.lang = this.inputLanguage.value;
            }
        });

        this.fontSize.addEventListener('input', () => {
            const size = this.fontSize.value;
            this.fontSizeValue.textContent = size;
            document.documentElement.style.setProperty('--font-size', `${size}px`);
        });

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

    startRecording() {
        if (!this.recognition) {
            this.updateStatus('语音识别不可用', 'error');
            return;
        }

        if (!this.apiKey) {
            this.requestApiKey();
            return;
        }

        this.shouldContinueListening = true; // 开启持续监听
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('启动录音失败:', error);
            this.updateStatus('启动失败', 'error');
            this.shouldContinueListening = false;
        }
    }

    stopRecording() {
        this.shouldContinueListening = false; // 停止持续监听
        
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
        }
        
        this.isRecording = false;
        this.micButton.classList.remove('recording', 'continuous-recording');
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
        this.statusText.textContent = text;
        this.statusDot.className = `status-dot ${type}`;
    }

    updateConfidence(confidence) {
        const percentage = Math.round(confidence * 100);
        this.confidenceFill.style.width = `${percentage}%`;
        this.confidenceValue.textContent = `${percentage}%`;
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