import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch'; // Ensure you have node-fetch installed
import dotenv from 'dotenv';

dotenv.config();

// const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const fs = require('fs');
// const path = require('path');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(bodyParser.json());

app.post('/save-input', async (req, res) => {
    const { input } = req.body;
    
    try {
        // 只保存 input 内容到 current_value.txt
        fs.writeFileSync('current_value.txt', input);
        
        console.log('Input saved:', input);
        
        // 定义调用本地大型语言模型的函数
        // async function callLocalLLM(input, prompt) {
        //     // 这里是调用本地大型语言模型的逻辑
        //     // 返回格式化的结果
        //     return `username = "Annie" password is "659876"`; // 示例返回值
        // }

        async function callLocalLLM(input) {
            try {
                const prompt = `Please reformat the following sentence into a structured key-value format where any user privacy-related information, such as username, password, address, birthdate, email, and phone, is represented as key-value pairs. 
                For example, 'Please help me write the terminal code to connect to the MySQL database remotely. The database name is anniedb.com. User name is Annie and password is 659876. Select the database and select all users in the users table.' 
                should be reformatted to '{
"username": "Annie",
"password": "659876",
"database": "anniedb.com"
}'
-------
The sentence to be reformatted is:`;
                const response = await fetch('http://localhost:11434/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: "llama2",  // 或其他你已安装的模型
                        // prompt: `what's 1+1`,
                        prompt: `${prompt}\n${input}\nFormatted Output:`, // test case: My username is Annie. My password is 659876
                        stream: false
                    })
                });
        
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
        
                const data = await response.json();
                return data.response;
            } catch (error) {
                console.error('Error calling local LLM:', error);
                throw error;
            }
        }

        async function callOpenAILLM(input) {
            try {
                const prompt = `Please reformat the following sentence into a structured key-value format where any user privacy-related information, such as username, password, address, birthdate, email, and phone, is represented as key-value pairs. 
                For example, 'Please help me write the terminal code to connect to the MySQL database remotely. The database name is anniedb.com. User name is Annie and password is 659876. Select the database and select all users in the users table.' 
                should be reformatted to '{
        "username": "Annie",
        "password": "659876",
        "database": "anniedb.com"
        }'
        -------
        The sentence to be reformatted is:`;
        
            // const input = `My username is Annie. My password is 121212`;
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "gpt-3.5-turbo",
                        messages: [
                            {
                                role: "system",
                                content: "You are a helpful assistant that formats text into JSON key-value pairs."
                            },
                            {
                                role: "user",
                                content: `${prompt}\n${input}\nFormatted Output:`
                            }
                        ],
                        temperature: 0.7,
                        max_tokens: 150
                    })
                });
        
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
        
                const data = await response.json();
                return data.choices[0].message.content.trim();
            } catch (error) {
                console.error('Error calling OpenAI API:', error);
                throw error;
            }
        }
    // // 调用本地大型语言模型
    // const prompt = `Please reformat the following sentence into a structured key-value format. For example, 'My username is Annie. My password is 659876' should be reformatted to 'username = "Annie" password = "659876"'. Apply this transformation to:`;
    // const formattedResult = await callLocalLLM(input, prompt);

    const formattedResult = await callOpenAILLM(input)

    // 将结果输出到 llm_result.txt
    fs.writeFileSync('llm_result.txt', formattedResult);
    console.log('LLM result saved:', formattedResult);

    // 修改响应，包含 formattedResult
    res.json({ 
        success: true, 
        message: 'Input and LLM result saved successfully',
        formattedResult: formattedResult  // 添加这一行
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