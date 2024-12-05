const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(bodyParser.json());

app.post('/save-input', (req, res) => {
    const { input } = req.body;
    
    try {
        // 只保存 input 内容到 current_value.txt
        fs.writeFileSync('current_value.txt', input);
        
        console.log('Input saved:', input);
        
        res.json({ 
            success: true, 
            message: 'Input saved successfully'
        });
    } catch (error) {
        console.error('Error saving input:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to save input',
            error: error.message 
        });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Saving inputs to ${path.resolve('current_value.txt')}`);
});