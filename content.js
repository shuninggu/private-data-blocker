let activeElement = null;
let originalValue = null;

// 创建并注入面板
function createPanel() {
    const panel = document.createElement('div');
    panel.id = 'extension-panel';
    panel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 300px;
        background: white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        border-radius: 8px;
        z-index: 9999;
        padding: 15px;
    `;
    
    panel.innerHTML = `
        <div class="button-container">
            <button id="replaceBtn">Replace Private Data</button>
            <button id="restoreBtn">Restore Original Value</button>
            <div style="background: #f0f0f0; padding: 10px; border-radius: 4px; margin-top: 15px; display: flex; justify-content: space-between; align-items: center;">
                <span>Input</span>
                <button id="copyInputBtn" style="padding: 2px 8px; font-size: 12px;">Copy</button>
            </div>
            <div id="capturedText" style="margin-top: 5px; padding: 10px; border: 1px solid #ccc;"></div>
            <div style="background: #f0f0f0; padding: 10px; border-radius: 4px; margin-top: 15px; display: flex; justify-content: space-between; align-items: center;">
                <span>Output</span>
                <button id="copyOutputBtn" style="padding: 2px 8px; font-size: 12px;">Copy</button>
            </div>
            <div id="ReplacedText" style="margin-top: 5px; padding: 10px; border: 1px solid #ccc;"></div>
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
                    
                //     // 更新 UI，将 formattedResult 显示在 id="ReplacedText" 的框内
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
        if (activeElement) {
            const currentValue = activeElement.value;
            console.log('Current input value:', currentValue);
            
            // 显示当前输入框的文本
            capturedText.textContent = currentValue;
            
            // 从本地存储中获取替换数据
            const storedData = JSON.parse(localStorage.getItem('privacyData'));
            console.log('Stored data:', storedData); // 调试用
            
            // 创建替换后的版本
            let restoredContent = replacedText.textContent; // 使用当前 replacedText 的内容
            
            // 遍历存储的数据，将 replacedValue 替换回 originalValue
            storedData.forEach(item => {
                const pattern = new RegExp(`"${item.replacedValue}"`, 'g');
                restoredContent = restoredContent.replace(pattern, `"${item.value}"`);
            });
            
            // 在 ReplacedText 中显示恢复后的文本
            replacedText.textContent = restoredContent;
            
        } else {
            capturedText.textContent = 'No input field selected';
            replacedText.textContent = 'No input field selected';
        }
    });
}

function makeDraggable(panel) {
    const header = document.createElement('div');
    header.style.cssText = 'padding: 10px; cursor: move; background: #f0f0f0; border-radius: 8px 8px 0 0;';
    header.textContent = 'Private Data Blocker';
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

// 听输入框的焦点
document.addEventListener('focus', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        activeElement = e.target;
        if (!originalValue) {
            originalValue = activeElement.value;
        }
    }
}, true);

// 初始化：创建面板并使其可拖动
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
