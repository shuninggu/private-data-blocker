import fs from 'fs'; 

// Fetch the source texts from the saved JSON file
async function loadSourceTexts() {
    const data = fs.readFileSync('source_texts.json', 'utf-8'); // Read the file synchronously
    const sourceTexts = JSON.parse(data); // Parse the JSON data
    return sourceTexts;
  }

async function processSourceTexts() {
    const sourceTexts = await loadSourceTexts();
    
    const formattedResults = [];
    
    console.log("STARTING PROCESSING texts")
    for (let i = 0; i < sourceTexts.length; i++) {
      const input = sourceTexts[i];
  
      // Call the Local LLM for each source_text
      console.log(input)
      const promptStart = performance.now();
      const processedResult = await callLocalLLM(input);
      const promptEnd = performance.now();
      const promptDiff = (promptStart - promptEnd) / 1000;
      console.log(`Prompt ${i} processed in TIME =  ${promptDiff.toFixed(2)} seconds`)
      console.log("--OUTPUT IS --")
      console.log(processedResult)
    //   console.log("--------------------------------------------------")
      // Convert to the desired formatted result
      const formattedResult = convertToFormattedResult(processedResult);
  
      // Push the formatted result to the array
      formattedResults.push(formattedResult);
    }
    const processTextsEnd = performance.now();
    const processDiff = (processTextsEnd - processTextsStart) / 1000;
    console.log(`All Texts processing time ${processDiff.toFixed(2)} seconds`)
  
    // Save the results to 'generated_outputs.json'
    fs.writeFileSync('generated_outputs.json', JSON.stringify(formattedResults, null, 2));
    console.log('generated_outputs.json saved successfully.');
  }

async function callLocalLLM(input) {
    try {

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

Note: Every piece of sensitive information MUST be converted to "key": "value" format with double quotes.

 `;
//  Do not use the example sentence which is provided and do not make changes or additional format to the input text.
                const response = await fetch('http://localhost:11434/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: "llama3.2:latest",  // 或其他你已安装的模型
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
        // let input = "Dear Omer, as per our records, your license 78B5R2MVFAHJ48500 is still registered in our records for access to the educational tools. Please feedback on it's operability."
        
        // const processedResult = await callLocalLLM(input);
        // //get the json format 
        // const formattedResult = convertToFormattedResult(processedResult);
        // console.log(formattedResult)

        processSourceTexts().catch(console.error);

        
            