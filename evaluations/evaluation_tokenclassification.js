import fs from 'fs'; 

async function loadSourceTexts(source_file_name) {
  const data = fs.readFileSync(source_file_name, 'utf-8'); // Read the file synchronously
  return JSON.parse(data); // Parse the JSON data
}

async function processBatch(batch, startIndex, model_name) {
    const formattedResults = [];
    let sum =0
  
    for (let i = 0; i < batch.length; i++) {
      const input = batch[i];
      let processedResult = null;
    //   const promptStart = performance.now();
      let promptDiff =0
     
      try {
          processedResult = await callLocalLLM(input, model_name);
        //   const promptEnd = performance.now();
        //   promptDiff = (promptEnd - promptStart) / 1000;
          // promptDiff = promptDiff.toFixed(2)
          if(processedResult) {
            let jsonResult = JSON.parse(processedResult); 
            formattedResults.push(jsonResult);
          }
          
        //   console.log(`Prompt ${i} processing time ${promptDiff} seconds`);
        //   sum = sum + promptDiff
        } catch (error) {
          console.error(`Error processing sentence at index ${startIndex + i}:`, error);
        }

    }
    // console.log(`Prompt processing time for batch = ${sum}`)
    return formattedResults
  }

  async function processSourceTexts(model_name, source_file_name, predicted_file_name) {
      console.log("processSourceTexts() called")
      const sourceTexts = await loadSourceTexts(source_file_name);
      const batchSize = 10;
      const predicted_labels_file_name = predicted_file_name;
    //   let averageTime = 0;
    //   let runningSumTime =0;
      let allResults = []; // Start with an empty results array
    
      const processTextsStart = performance.now();
      for (let start = 0; start < sourceTexts.length; start += batchSize) {
        const end = Math.min(start + batchSize, sourceTexts.length);
        const batch = sourceTexts.slice(start, end);
    
        // Process the batch and append results to the file
        const batchResults = await processBatch(batch, start, model_name);
        // runningSumTime = runningSumTime + time;
        allResults.push(...batchResults);
        // runningSumTime = runningSumTime + timeSum;
        fs.writeFileSync(predicted_labels_file_name, JSON.stringify(allResults, null, 2));
        console.log(`Batch ${start} to ${end - 1} processed and saved successfully.`);
      }
    //   averageTime = sourceTexts.length>0 ? runningSumTime/(sourceTexts.length) : 0;
    //   console.log(`Average time ${averageTime}`)
    //   const processTextsEnd = performance.now();
    //   const processDiff = (processTextsEnd - processTextsStart) / 1000;
    //   console.log(`All Texts processing time ${processDiff.toFixed(2)} seconds`);
  
    //   const finalData = JSON.parse(fs.readFileSync(predicted_labels_file_name, 'utf8'));
    //   const updatedData = {
    //       results: finalData, // Keep existing results
    //       averageTimePerPromptSeconds: averageTime.toFixed(2),
    //       processingTimeSeconds: processDiff.toFixed(2),
    //   };
  
    //   fs.writeFileSync(predicted_labels_file_name, JSON.stringify(updatedData, null, 2));
  
      console.log('All results processed and saved successfully.');
    
      
    }
  

async function callLocalLLM(input, model_name) {
    try {
        const prompt_new = `Classify each word in the sentence based on whether it contains sensitive information.
          If the word is sensitive, assign it a label from the following list:
  
                [
            'name', 'firstname', 'lastname', 'nickname', 'username', 'password', 'email', 'phone', 'mobile', 'age', 'gender', 'birthday', 'birthdate',    // Basic personal information
            'place', 'address', 'street', 'city', 'state',  'country', 'zipcode', 'postcode', 'latitude', 'longitude'   // Address related
            'passport', 'license', 'ssn', 'id', 'idcard','insurance', 'businessname'   // Identity documents
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
  
            The input sentence will be provided after [INPUT]. Classify the words from that sentence. Ensure you do not miss any word from the sentence followed by [INPUT].
  
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


        processSourceTexts(model_name, source_file_name, predicted_file_name).catch(console.error);

        // Run this file using this command - 'node evaluation_tokenclassification.json llama3.2:latest'