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

        async function callLocalLLM(input) {
            try {
                // const prompt = `Please reformat the following sentence into a structured key-value format where any user privacy-related information, such as username, password, address, birthdate, email, and phone, is represented as key-value pairs. 
                // Note that the numbers may be birthdays, passwords, phone numbers, email addresses, addresses, and other private information.
                // For example, 'Please help me write the terminal code to connect to the MySQL database remotely. The database name is anniedb.com. User name is Annie and password is 659876. Select the database and select all users in the users table.' 
                
                const prompt = `In the following sentence, please convert all mentions of specific names, places, ages, and numbers into a format that represents the type of information they belong to.
                For example, 'Please write a greeting card for Nancy when she is 18.' should be converted to 
                ' Please write a greeting card for "name": "Nancy" when she is "age": "18"'`;

                const response = await fetch('http://localhost:11434/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: "llama2",  // 或其他你已安装的模型
                        prompt: `${prompt}\n${input}\n Converted Output:`, // test case: My username is Annie. My password is 659876
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
    // 调用本地大型语言模型
    const processedResult = await callLocalLLM(input);

    // TODO:convert to formatted result
    function convertToFormattedResult(processedResult) {
        try {
            // 创建一个对象来存储提取的键值对
            let formattedObject = {};
            
            // 使用正则表达式匹配所有 "key": "value" 模式
            const regex = /"([^"]+)":\s*"([^"]+)"/g;
            let match;
            
            // 查找所有匹配项
            while ((match = regex.exec(processedResult)) !== null) {
                const [_, key, value] = match;
                formattedObject[key] = value;
            }
            
            // 如果没有找到匹配项，返回null
            if (Object.keys(formattedObject).length === 0) {
                return null;
            }
            
            // 将对象转换为JSON字符串
            return JSON.stringify(formattedObject, null, 2);
        } catch (error) {
            console.error('Error converting to formatted result:', error);
            return null;
        }
    }

    // processedResult = 'Please write a greeting card for "name": "billie" when she is "age": "20"';
    const formattedResult = convertToFormattedResult(processedResult);
    console.log(formattedResult);

    // // TODO: call LLM
    // const formattedResult = await callOpenAILLM(input)

    // 将结果输出到 llm_result.txt
    fs.writeFileSync('llm_result.txt', formattedResult);
    console.log('LLM result saved:', formattedResult);

    processInput(formattedResult);

    // Function to generate a random string of a given length
    function generateRandomString(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // Function to process the input and replace sensitive information
    function processInput(formattedResult) {
        console.log('Received formattedResult:', formattedResult); // Debug log 1
        
        // Try parsing if formattedResult is a string
        let parsedResult = formattedResult;
        if (typeof formattedResult === 'string') {
            try {
                parsedResult = JSON.parse(formattedResult);
                console.log('Parsed result:', parsedResult); // Debug log 2
            } catch (error) {
                console.error('Error parsing formattedResult:', error);
                return;
            }
        }

        const sensitiveKeys = ['name', 'address', 'username', 'password', 'database', 'email', 'age', 'birthday', 'phone'];
        const records = [];
        let idCounter = 1;

        console.log('Starting to process entries...'); // Debug log 3
        
        for (const [key, value] of Object.entries(parsedResult)) {
            console.log('Processing key:', key, 'value:', value); // Debug log 4
            if (sensitiveKeys.includes(key)) {
                const replacedValue = generateRandomString(value.length);
                console.log('Found sensitive key:', key, 'Replaced with:', replacedValue); // Debug log 5
                records.push({
                    id: idCounter++,
                    key: key,
                    originalValue: value,
                    replacedValue: replacedValue
                });
            }
        }

        console.log('Final records:', records); // Debug log 6

        try {
            fs.writeFileSync('privacy_storage.json', JSON.stringify(records, null, 2));
            console.log('Successfully wrote to privacy_storage.json'); // Debug log 7
        } catch (error) {
            console.error('Error writing to file:', error);
        }
    }

    // 获取替换后的文本
    const ReplacedResult = generateReplacedText(input, formattedResult);
    
    res.json({ 
        success: true, 
        message: 'Input and LLM result saved successfully',
        formattedResult: formattedResult,
        ReplacedResult: ReplacedResult
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

//get replaced text
// 添加新的路由处理选中文本
app.post('/save-selected', async (req, res) => {
    const { selectedText, timestamp } = req.body;
    
    try {
        // 将选中的文本保存到文件
        fs.appendFileSync('selected_text.txt', 
            `\n[${timestamp}] Selected Text: ${selectedText}`
        );
        
        console.log('Received selected text:', selectedText);
        
        // 还原隐私信息
        const restoredText = restorePrivacyInfo(selectedText);
        
        res.json({ 
            success: true, 
            message: 'Selected text processed successfully',
            restoredText: restoredText
        });
    } catch (error) {
        console.error('Error processing selected text:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error processing selected text',
            error: error.message
        });
    }
});

function restorePrivacyInfo(selectedText) {
    try {
        console.log('Processing selected text:', selectedText);
        
        // 读取 privacy_storage.json
        const privacyData = JSON.parse(fs.readFileSync('privacy_storage.json', 'utf8'));
        console.log('Loaded privacy data:', privacyData);
        
        let restoredText = selectedText;

        // 遍历 privacy_storage.json 中的每条记录
        privacyData.forEach(record => {
            const { key, originalValue, replacedValue } = record;
            console.log(`Checking for replaced value: ${replacedValue}`);
            
            // 创建正则表达式来匹配替换后的值
            const regex = new RegExp(`\\b${replacedValue}\\b`, 'g');
            
            // 如果找到替换值，还原为原始值
            if (restoredText.match(regex)) {
                console.log(`Found match: ${replacedValue} -> ${originalValue}`);
                restoredText = restoredText.replace(regex, originalValue);
            }
        });

        console.log('Restored text:', restoredText);
        return restoredText;

    } catch (error) {
        console.error('Error restoring privacy info:', error);
        return selectedText; // 如果出错，返回原始选中文本
    }
}

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Saving inputs to ${path.resolve('current_value.txt')}`);
});

function generateReplacedText(originalText, formattedResult) {
    try {
        console.log('Original text:', originalText);
        console.log('Formatted result:', formattedResult);

        // 读取 privacy_storage.json
        const privacyData = JSON.parse(fs.readFileSync('privacy_storage.json', 'utf8'));
        console.log('Privacy data loaded:', privacyData);

        let replacedText = originalText;

        // 解析 formattedResult 如果它是字符串
        let parsedResult = formattedResult;
        if (typeof formattedResult === 'string') {
            try {
                parsedResult = JSON.parse(formattedResult);
                console.log('Parsed formatted result:', parsedResult);
            } catch (error) {
                console.error('Error parsing formattedResult:', error);
                return originalText;
            }
        }

        // 遍历 privacy_storage.json 中的每条记录
        privacyData.forEach(record => {
            const { key, originalValue, replacedValue } = record;
            console.log(`Processing replacement: ${key} - Original: ${originalValue} - Replace with: ${replacedValue}`);
            
            // 创建一个正则表达式来匹配原始值
            const regex = new RegExp(`\\b${originalValue}\\b`, 'g');
            
            // 替换文本中的敏感信息
            const previousText = replacedText;
            replacedText = replacedText.replace(regex, replacedValue);
            
            if (previousText !== replacedText) {
                console.log(`Replaced "${originalValue}" with "${replacedValue}"`);
            }
        });

        console.log('Final replaced text:', replacedText);
        return replacedText;

    } catch (error) {
        console.error('Error generating replaced text:', error);
        return originalText; // 如果出错，返回原始文本
    }
}