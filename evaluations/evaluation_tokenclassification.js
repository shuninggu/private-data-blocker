import fs from 'fs'; 

async function callLocalLLM(input, model_name) {
    try {
        const prompt_new = `Classify each word in the sentence based on whether it contains sensitive information.
          If the word is sensitive, assign it a label from the following list:
  
                [
            'name', 'firstname', 'lastname', 'nickname', 'username', 'password', 'email', 'phone', 'mobile', 'age', 'gender', 'birthday', 'birthdate',    // Basic personal information
            'place', 'address', 'street', 'city', 'state', 'country', 'zipcode', 'postcode',    // Address related
            'passport', 'license', 'ssn', 'id', 'idcard','insurance',    // Identity documents
            'account', 'card', 'credit', 'debit', 'bank', 'salary', 'income', 'balance',    // Financial information
            'facebook', 'twitter', 'instagram', 'linkedin', 'wechat', 'whatsapp',    // Social media
            'school', 'company', 'occupation', 'position', 'title', 'department',    // Other personal information
            'health', 'insurance', 'medication', 'diagnosis',    // Medical and health
            'spouse', 'family', 'relative', 'parent', 'child',    // Family information
            'database', 'pin', 'code', 'key', 'token', 'secret'    // Security related
        ]
  
            If the word is not sensitive, assign it the label [NON_SEN_WORD].
            Maintain the original sentence structure without adding or removing words.
            Return the output strictly in valid JSON format as shown below.
  
            The input sentence will be provided after [INPUT]. Classify the words from that sentence.
  
            Example - 
            Input - Kattie's assessment was found on device bearing IMEI: 06-184755-866851-3.
            Output - 
            {
              "Kattie's": "name",
              "assessment": "[NON_SEN_WORD]",
              "was": "[NON_SEN_WORD]",
              "found": "[NON_SEN_WORD]",
              "on": "[NON_SEN_WORD]",
              "device": "[NON_SEN_WORD]",
              "bearing": "[NON_SEN_WORD]",
              "IMEI:": "[NON_SEN_WORD]",
              "06-184755-866851-3": "id"
            }
          
        `
        
        const prompt = `In the following sentence, please convert all mentions of specific names, places, ages, and numbers into a format that represents the type of information they belong to.
        Format requirements:
        1. Always use double quotes for both keys and values: "key": "value"
        2. Keep the rest of the sentence unchanged
        3. Place the key-value pair exactly where the original information appears
        
        you can select the name of key from the following list:[
                    'name', 'firstname', 'lastname', 'nickname', 'username', 'password', 'email', 'phone', 'mobile', 'age', 'gender', 'birthday', 'birthdate',
                    'place', 'address', 'street', 'city', 'state', 'country', 'zipcode', 'postcode',
                    'passport', 'license', 'ssn', 'id', 'idcard','insurance',
                    'account', 'card', 'credit', 'debit', 'bank', 'salary', 'income', 'balance',
                    'facebook', 'twitter', 'instagram', 'linkedin', 'wechat', 'whatsapp',
                    'school', 'company', 'occupation', 'position', 'title', 'department',
                    'health', 'insurance', 'medication', 'diagnosis', 
                    'spouse', 'family', 'relative', 'parent', 'child', 
                    'database', 'pin', 'code', 'key', 'token', 'secret'
                ];
        Here's an Example:
        Input: 'My username is Annie. My password is 659876.'
        Output: 'My "username": "Annie". My "password": "659876".'
        
        Note: Every piece of sensitive information MUST be converted to "key": "value" format with double quotes.
        But do not take specific details from the example into account.
        Don’t output your reasoning process.
        Here's the input:`;
  //  Do not use the example sentence which is provided and do not make changes or additional format to the input text.
                const response = await fetch('http://localhost:11434/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model:model_name, 
                        prompt: `${prompt_new}\n[INPUT] ${input}\n Converted Output:`, // test case: My username is Annie. My password is 659876
                        format: "json",
                        stream: false
                    })
                });
        
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
        
                let data = await response.json();
                return data.response;
            } catch (error) {
                console.error('Error calling local LLM:', error);
                throw error;
            }
        }

        const model_name = process.argv[2];
        const source_file_name = process.argv[3];
        const predicted_file_name = process.argv[4];


        try {
         let resultsArray = []; // Initialize an array to store JSON responses
          const input =  `Kattie could you please share your recomndations about vegetarian diet for 72 old Intersex person with 158centimeters?`
          // const input = `Dear Omer, as per our records, your license 78B5R2MVFAHJ48500 is still registered in our records for access to the educational tools. Please feedback on it's operability.`
          // const input = `A student's assessment was found on device bearing IMEI: 06-184755-866851-3. The document falls under the various topics discussed in our Optimization curriculum. Can you please collect it?`
          let processedResult = await callLocalLLM(input, model_name);
          console.log(`processed result = ${processedResult}`)
          let jsonResult = JSON.parse(processedResult); 
          resultsArray.push(jsonResult);
          console.log(`json result `, jsonResult)
          fs.writeFileSync('token_label_pairs.json', JSON.stringify(resultsArray, null, 2));

          if (!processedResult) throw new Error("callLocalLLM returned undefined");
        } catch (error) {
          console.error("Error processing LLM:", error);

        }

        // Run this file using this command - 'node evaluation_tokenclassification.json llama3.2:latest'