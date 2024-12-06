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

// Middleware
app.use(cors());
app.use(bodyParser.json());

app.post('/save-input', async (req, res) => {
    const { input } = req.body;
    
    try {
        // Save only input content to current_value.txt
        fs.writeFileSync('current_value.txt', input);
        
        console.log('Input saved:', input);

        async function callLocalLLM(input) {
            try {
                // const prompt = `In the following sentence, please convert all mentions of specific names, places, ages, and numbers into a format that represents the type of information they belong to.
                // For example, 'Please write a greeting card for Nancy when she is 18.' should be converted to 
                // ' Please write a greeting card for "name": "Nancy" when she is "age": "18"'`;

//                 const prompt = `Please convert all sensitive information in the following sentence into a key-value format, where both keys and values MUST be enclosed in double quotes (""). This includes:
// - names (personal, usernames, company names)
// - places (addresses, cities, locations)
// - ages and dates
// - numbers (IDs, phone numbers, account numbers)
// - any other private information
                const prompt = `In the following sentence, please convert all mentions of specific names, places, ages, and numbers into a format that represents the type of information they belong to.
Format requirements:
1. Always use double quotes for both keys and values: "key": "value"
2. Keep the rest of the sentence unchanged
3. Place the key-value pair exactly where the original information appears

youcan select the name of key from the following list:[
            'name', 'firstname', 'lastname', 'nickname', 'username', 'password', 'email', 'phone', 'mobile', 'age', 'gender', 'birthday', 'birthdate',    // Basic personal information
            'place', 'address', 'street', 'city', 'state', 'country', 'zipcode', 'postcode',    // Address related
            'passport', 'license', 'ssn', 'id', 'idcard','insurance',    // Identity documents
            'account', 'card', 'credit', 'debit', 'bank', 'salary', 'income', 'balance',    // Financial information
            'facebook', 'twitter', 'instagram', 'linkedin', 'wechat', 'whatsapp',    // Social media
            'school', 'company', 'occupation', 'position', 'title', 'department',    // Other personal information
            'health', 'insurance', 'medication', 'diagnosis',    // Medical and health
            'spouse', 'family', 'relative', 'parent', 'child',    // Family information
            'database', 'pin', 'code', 'key', 'token', 'secret'    // Security related
        ];
Here's an Example:
Input: 'Please write a greeting card for Nancy when she is 18 years old and lives in Boston.'
Output: 'Please write a greeting card for "name": "Nancy" when she is "age": "18" years old and lives in "city": "Boston".'

Note: Every piece of sensitive information MUST be converted to "key": "value" format with double quotes.`;

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
        //         const prompt = `Please reformat the following sentence into a structured key-value format where any user privacy-related information, such as username, password, address, birthdate, email, and phone, is represented as key-value pairs. 
        //         For example, 'Please help me write the terminal code to connect to the MySQL database remotely. The database name is anniedb.com. User name is Annie and password is 659876. Select the database and select all users in the users table.' 
        //         should be reformatted to '{
        // "username": "Annie",
        // "password": "659876",
        // "database": "anniedb.com"
        // }'
        // -------
        // The sentence to be reformatted is:`;

        const prompt = `In the following sentence, please convert all mentions of specific names, places, ages, and numbers into a format that represents the type of information they belong to.
Format requirements:
1. Always use double quotes for both keys and values: "key": "value"
2. Keep the rest of the sentence unchanged
3. Place the key-value pair exactly where the original information appears

youcan select the name of key from the following list:[
            'name', 'firstname', 'lastname', 'nickname', 'username', 'password', 'email', 'phone', 'mobile', 'age', 'gender', 'birthday', 'birthdate',    // Basic personal information
            'place', 'address', 'street', 'city', 'state', 'country', 'zipcode', 'postcode',    // Address related
            'passport', 'license', 'ssn', 'id', 'idcard','insurance',    // Identity documents
            'account', 'card', 'credit', 'debit', 'bank', 'salary', 'income', 'balance',    // Financial information
            'facebook', 'twitter', 'instagram', 'linkedin', 'wechat', 'whatsapp',    // Social media
            'school', 'company', 'occupation', 'position', 'title', 'department',    // Other personal information
            'health', 'insurance', 'medication', 'diagnosis',    // Medical and health
            'spouse', 'family', 'relative', 'parent', 'child',    // Family information
            'database', 'pin', 'code', 'key', 'token', 'secret'    // Security related
        ];
Here's an Example:
Input: 'Please write a greeting card for Nancy when she is 18 years old and lives in Boston.'
Output: 'Please write a greeting card for "name": "Nancy" when she is "age": "18" years old and lives in "city": "Boston".'

Note: Every piece of sensitive information MUST be converted to "key": "value" format with double quotes.`;
        
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
    // Call local LLM
    // const processedResult = await callLocalLLM(input);

    // TODO: call OpenAI LLM
    const processedResult = await callOpenAILLM(input)

    // TODO: convert to formatted result
    function convertToFormattedResult(processedResult) {
        try {
            // Create an object to store the extracted key-value pairs
            let formattedObject = {};
            
            // Use regular expression to match all "key": "value" patterns
            const regex = /"([^"]+)":\s*"([^"]+)"/g;
            let match;
            
            // Find all matches
            while ((match = regex.exec(processedResult)) !== null) {
                const [_, key, value] = match;
                formattedObject[key] = value;
            }
            
            // If no matches are found, return null
            if (Object.keys(formattedObject).length === 0) {
                return null;
            }
            
            // Convert the object to a JSON string
            return JSON.stringify(formattedObject, null, 2);
        } catch (error) {
            console.error('Error converting to formatted result:', error);
            return null;
        }
    }
    fs.writeFileSync('processed_result.txt', processedResult);

    // processedResult = 'Please write a greeting card for "name": "billie" when she is "age": "20"';
    const formattedResult = convertToFormattedResult(processedResult);
    console.log(formattedResult);

    // TODO: call OpenAI LLM
    // const formattedResult = await callOpenAILLM(input)

    // Save the result to llm_result.txt
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

        // const sensitiveKeys = ['name', 'address', 'username', 'password', 'database', 'email', 'age', 'birthday', 'phone'];
        const sensitiveKeys = [
            'name', 'firstname', 'lastname', 'nickname', 'username', 'password', 'email', 'phone', 'mobile', 'age', 'gender', 'birthday', 'birthdate',    // Basic personal information
            'place', 'address', 'street', 'city', 'state', 'country', 'zipcode', 'postcode',    // Address related
            'passport', 'license', 'ssn', 'id', 'idcard','insurance',    // Identity documents
            'account', 'card', 'credit', 'debit', 'bank', 'salary', 'income', 'balance',    // Financial information
            'facebook', 'twitter', 'instagram', 'linkedin', 'wechat', 'whatsapp',    // Social media
            'school', 'company', 'occupation', 'position', 'title', 'department',    // Other personal information
            'health', 'insurance', 'medication', 'diagnosis',    // Medical and health
            'spouse', 'family', 'relative', 'parent', 'child',    // Family information
            'database', 'pin', 'code', 'key', 'token', 'secret'    // Security related
        ];
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

    // Get the replaced text
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
// Add a new route to handle selected text
app.post('/save-selected', async (req, res) => {
    const { selectedText, timestamp } = req.body;
    
    try {
        // Save the selected text to a file
        fs.appendFileSync('selected_text.txt', 
            `\n[${timestamp}] Selected Text: ${selectedText}`
        );
        
        console.log('Received selected text:', selectedText);
        
        // Restore privacy information
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
        
        // Read privacy_storage.json
        const privacyData = JSON.parse(fs.readFileSync('privacy_storage.json', 'utf8'));
        console.log('Loaded privacy data:', privacyData);
        
        let restoredText = selectedText;

        // Iterate through each record in privacy_storage.json
        privacyData.forEach(record => {
            const { key, originalValue, replacedValue } = record;
            console.log(`Checking for replaced value: ${replacedValue}`);
            
            // Create a regular expression to match the replaced value
            const regex = new RegExp(`\\b${replacedValue}\\b`, 'g');
            
            // If the replaced value is found, restore it to the original value
            if (restoredText.match(regex)) {
                console.log(`Found match: ${replacedValue} -> ${originalValue}`);
                restoredText = restoredText.replace(regex, originalValue);
            }
        });

        console.log('Restored text:', restoredText);
        return restoredText;

    } catch (error) {
        console.error('Error restoring privacy info:', error);
        return selectedText; // If an error occurs, return the original selected text
    }
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Saving inputs to ${path.resolve('current_value.txt')}`);
});

function generateReplacedText(originalText, formattedResult) {
    try {
        console.log('Original text:', originalText);
        console.log('Formatted result:', formattedResult);

        // Read privacy_storage.json
        const privacyData = JSON.parse(fs.readFileSync('privacy_storage.json', 'utf8'));
        console.log('Privacy data loaded:', privacyData);

        let replacedText = originalText;

        // Parse formattedResult if it's a string
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

        // Iterate through each record in privacy_storage.json
        privacyData.forEach(record => {
            const { key, originalValue, replacedValue } = record;
            console.log(`Processing replacement: ${key} - Original: ${originalValue} - Replace with: ${replacedValue}`);
            
            // Create a regular expression to match the original value
            const regex = new RegExp(`\\b${originalValue}\\b`, 'g');
            
            // Replace sensitive information in the text
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
        return originalText; // If an error occurs, return the original text
    }
}