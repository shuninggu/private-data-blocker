let activeElement = null;
let originalValue = null;
let selectedText = '';

// 创建并注入面板
function createPanel() {
    const panel = document.createElement('div');
    panel.id = 'extension-panel';
    
    const styles = `
        <style>
            #extension-panel * {
                font-family: Arial, sans-serif !important;  /* 为所有子元素设置字体 */
            }

            #extension-panel {
                position: fixed !important;
                top: 20px !important;
                right: 20px !important;
                width: 300px !important;
                background: white !important;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2) !important;
                border-radius: 8px !important;
                z-index: 9999 !important;
                padding: 15px !important;
            }

            #extension-panel .title {
                font-size: 20px !important;
                font-weight: bold !important;
                margin-bottom: 15px !important;
                color: #000 !important;
                letter-spacing: -0.5px !important;  /* 调整字间距 */
                text-align: center !important;  /* 添加居中对齐 */
            }

            #extension-panel button {
                width: 100% !important;
                padding: 10px !important;
                margin: 5px 0 !important;
                border: none !important;
                border-radius: 4px !important;
                font-size: 20px !important;
                cursor: pointer !important;
            }

            #extension-panel #replaceBtn {
                background-color: #77b55a !important;
                color: white !important;
            }

            #extension-panel #restoreBtn {
                background-color: #4a90e2 !important;
                color: white !important;
            }

            #extension-panel .section-header {
                background: #f0f0f0 !important;
                padding: 10px !important;
                border-radius: 4px !important;
                margin-top: 15px !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                font-size: 20px !important;
            }

            #extension-panel .copy-btn {
                padding: 2px 8px !important;
                font-size: 20px !important;
                background: white !important;
                border: 1px solid #ccc !important;
                border-radius: 3px !important;
                color: #333 !important;
                width: auto !important;
                min-width: 45px !important;
                margin: 0 !important;
            }

            #extension-panel #capturedText,
            #extension-panel #ReplacedText {
                margin-top: 3px !important;
                padding: 4px !important;
                border: 1px solid #ccc !important;
                border-radius: 4px !important;
                min-height: 25px !important;
                max-height: 100px !important;  /* 添加最大高度 */
                overflow-y: auto !important;   /* 添加垂直滚动条 */
                background: white !important;
                color: #333 !important;
                font-size: 14px !important;
                line-height: 1.3 !important;
                word-wrap: break-word !important;  /* 确保长单词会换行 */
                white-space: pre-wrap !important;  /* 保留换行和空格 */
            }

            /* 自定义滚动条样式（可选） */
            #extension-panel #capturedText::-webkit-scrollbar,
            #extension-panel #ReplacedText::-webkit-scrollbar {
                width: 8px !important;
            }

            #extension-panel #capturedText::-webkit-scrollbar-track,
            #extension-panel #ReplacedText::-webkit-scrollbar-track {
                background: #f1f1f1 !important;
                border-radius: 4px !important;
            }

            #extension-panel #capturedText::-webkit-scrollbar-thumb,
            #extension-panel #ReplacedText::-webkit-scrollbar-thumb {
                background: #888 !important;
                border-radius: 4px !important;
            }

            #extension-panel #capturedText::-webkit-scrollbar-thumb:hover,
            #extension-panel #ReplacedText::-webkit-scrollbar-thumb:hover {
                background: #555 !important;
            }
        </style>
    `;
    
    panel.innerHTML = styles + `
        <div class="title">Private Data Blocker</div>
        <div class="button-container">
            <button id="replaceBtn">Replace Private Data</button>
            <button id="restoreBtn">Restore Original Value</button>
            <div class="section-header">
                <span>Input</span>
                <button id="copyInputBtn" class="copy-btn">Copy</button>
            </div>
            <div id="capturedText"></div>
            <div class="section-header">
                <span>Output</span>
                <button id="copyOutputBtn" class="copy-btn">Copy</button>
            </div>
            <div id="ReplacedText"></div>
        </div>
    `;
    
    document.body.appendChild(panel);
    setupEventListeners(panel);
    setupCopyButtons(panel);
    return panel;
}

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function setupEventListeners(panel) {
    const replaceBtn = panel.querySelector('#replaceBtn');
    const restoreBtn = panel.querySelector('#restoreBtn');
    const capturedText = panel.querySelector('#capturedText');
    const replacedText = panel.querySelector('#ReplacedText');

    replaceBtn.addEventListener('click', () => {
        if (activeElement) {
            const currentValue = activeElement.value;
            console.log('Current input value:', currentValue);
            
            // 发送数据到本地服务器
            fetch('http://localhost:3001/save-input', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: currentValue,
                    timestamp: new Date().toISOString()
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                //     使用 formattedResult
                //     const formattedResult = data.formattedResult;
                //     console.log('Formatted result:', formattedResult);
                    
                //     // 更新 UI，将 formattedResult 显在 id="ReplacedText" 的框内
                //     const replacedTextElement = document.getElementById('ReplacedText');
                //     replacedTextElement.textContent = formattedResult; // 更新文本内容


                    // 使用 ReplacedResult
                    const ReplacedResult = data.ReplacedResult;
                    console.log('Formatted result:', ReplacedResult);
                    
                    // 更新 UI，将 ReplacedResult 显示在 id="ReplacedText" 的框内
                    const replacedTextElement = document.getElementById('ReplacedText');
                    replacedTextElement.textContent = ReplacedResult; // 更新文本内容
                } else {
                    console.error('Error:', data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
            
            // 显示原始文本
            capturedText.textContent = currentValue;

            // originalValue = currentValue;
            // activeElement.value = '[PRIVATE_DATA]';
        } else {
            capturedText.textContent = 'No input field selected';
            replacedText.textContent = 'No input field selected';
        }
    });

    restoreBtn.addEventListener('click', () => {
        if (selectedText) {
            // 将选中的文本显示在 input 框中
            capturedText.textContent = selectedText;
            
            // ���送选中的文本到后端服务器
            fetch('http://localhost:3001/save-selected', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    selectedText: selectedText,
                    timestamp: new Date().toISOString()
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Selected text processed successfully');
                    // 在 ReplacedText 框中显示还原后的文本
                    replacedText.textContent = data.restoredText;
                } else {
                    console.error('Error:', data.message);
                    replacedText.textContent = 'Error processing text';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                replacedText.textContent = 'Error connecting to server';
            });
            
            // 可选：清空选中的文本
            selectedText = '';
        } else {
            capturedText.textContent = 'No text selected';
            replacedText.textContent = 'No text selected';
        }
    });
}

function makeDraggable(panel) {
    const header = document.createElement('div');
    header.style.cssText = 'padding: 10px; cursor: move; background: white; border-radius: 8px 8px 0 0;';
    // header.textContent = 'Private Data Blocker';
    panel.insertBefore(header, panel.firstChild);

    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    header.addEventListener('mousedown', dragStart);

    function dragStart(e) {
        initialX = e.clientX - panel.offsetLeft;
        initialY = e.clientY - panel.offsetTop;
        isDragging = true;

        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            panel.style.left = currentX + 'px';
            panel.style.top = currentY + 'px';
        }
    }

    function dragEnd() {
        isDragging = false;
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', dragEnd);
    }
}

// 听输入的焦点
document.addEventListener('focus', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        activeElement = e.target;
        if (!originalValue) {
            originalValue = activeElement.value;
        }
    }
}, true);

// 初始化：创建面板并其可拖动
const panel = createPanel();
makeDraggable(panel);

// 添加新的复制按钮功能
function setupCopyButtons(panel) {
    const copyInputBtn = panel.querySelector('#copyInputBtn');
    const copyOutputBtn = panel.querySelector('#copyOutputBtn');
    const capturedText = panel.querySelector('#capturedText');
    const replacedText = panel.querySelector('#ReplacedText');

    copyInputBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(capturedText.textContent)
            .then(() => {
                // 可选：添加复制成功的视觉反馈
                copyInputBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyInputBtn.textContent = 'Copy';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    });

    copyOutputBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(replacedText.textContent)
            .then(() => {
                // 可选：添加复制成功的视觉反馈
                copyOutputBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyOutputBtn.textContent = 'Copy';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    });
}

// 添加文本选择事件监听器
document.addEventListener('mouseup', function() {
    const selection = window.getSelection();
    selectedText = selection.toString().trim();
});
