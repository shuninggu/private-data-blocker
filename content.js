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
            <button id="confirmBtn">Confirm Input</button>
            <button id="restoreBtn">Restore Original Value</button>
            <div style="background: #f0f0f0; padding: 10px; border-radius: 4px; margin-top: 15px;">
                Input
            </div>
            <div id="capturedText" style="margin-top: 5px; padding: 10px; border: 1px solid #ccc;"></div>
            <div style="background: #f0f0f0; padding: 10px; border-radius: 4px; margin-top: 15px;">
                Output
            </div>
            <div id="ReplacedText" style="margin-top: 5px; padding: 10px; border: 1px solid #ccc;"></div>
        </div>
    `;
    
    document.body.appendChild(panel);
    setupEventListeners(panel);
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
    const confirmBtn = panel.querySelector('#confirmBtn');
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
                console.log('Success:', data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
            
            // 显示原始文本
            capturedText.textContent = currentValue;
            
            // 使用正则表达式查找隐私信息
            const pattern = /(?:username|password)\s*(?:is|=)\s*"([^"]*)"/gi;
            const matches = Array.from(currentValue.matchAll(pattern));
            
            // 格式化结果并存储原始值
            const result = matches.map(match => ({
                position: match.index,
                attribute: match[0].split(/\s*(?:is|=|:)\s*/)[0].toLowerCase(),
                value: match[1]
            }));
            
            // 保存到本地存储
            localStorage.setItem('privacyData', JSON.stringify(result));
            
            // 创建替换后的版本
            let replacedContent = currentValue;
            const replacedResult = result.map(item => {
                const replacedValue = generateRandomString(item.value.length);
                replacedContent = replacedContent.replace(item.value, replacedValue);
                return {
                    ...item,
                    originalValue: item.value,
                    replacedValue: replacedValue
                };
            });
            
            // 打印替换结果到控制台
            console.log('Original data:', result);
            console.log('Replaced data:', replacedResult);
            
            // 在 ReplacedText 中显示替换后的文本
            replacedText.textContent = replacedContent;
            
            originalValue = currentValue;
            activeElement.value = '[PRIVATE_DATA]';
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
    header.textContent = 'Input Manager';
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
