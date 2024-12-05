// popup.js

document.addEventListener('DOMContentLoaded', function() {
    const replaceBtn = document.getElementById('replaceBtn');
    const confirmBtn = document.getElementById('confirmBtn');
    const restoreBtn = document.getElementById('restoreBtn');
    const status = document.getElementById('status');

    function showStatus(message, isError = false) {
        status.textContent = message;
        status.style.display = 'block';
        status.style.backgroundColor = isError ? '#ffebee' : '#e8f5e9';
        status.style.color = isError ? '#c62828' : '#2e7d32';
        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }

    replaceBtn.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "replace"}, function(response) {
                if (response && response.success) {
                    showStatus('Private data replaced');
                } else {
                    showStatus('No active input field found', true);
                }
            });
        });
    });

    confirmBtn.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "confirm"}, function(response) {
                if (response && response.success) {
                    showStatus('Input confirmed');
                } else {
                    showStatus('No active input field found', true);
                }
            });
        });
    });

    restoreBtn.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "restore"}, function(response) {
                if (response && response.success) {
                    showStatus('Original value restored');
                } else {
                    showStatus('No stored value to restore', true);
                }
            });
        });
    });

    // Add copy button functionality
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const textToCopy = document.getElementById(targetId).textContent;
            
            navigator.clipboard.writeText(textToCopy).then(() => {
                // Optional: Show feedback that text was copied
                button.style.backgroundColor = '#4CAF50';
                setTimeout(() => {
                    button.style.backgroundColor = '';
                }, 500);
            }).catch(err => {
                console.error('Failed to copy text:', err);
            });
        });
    });
});

