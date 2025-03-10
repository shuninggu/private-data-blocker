import fs from 'fs'; 

// Fetch the source texts from the saved JSON file
// async function loadSourceTexts() {
//     const data = fs.readFileSync('source_texts.json', 'utf-8'); // Read the file synchronously
//     const sourceTexts = JSON.parse(data); // Parse the JSON data
//     return sourceTexts;
//   }

// async function processSourceTexts() {
//     const sourceTexts = await loadSourceTexts();
    
//     const formattedResults = [];
//     const processTextsStart = performance.now();
//     console.log("STARTING PROCESSING texts")
//     for (let i = 0; i < sourceTexts.length; i++) {
//       const input = sourceTexts[i];
  
//       // Call the Local LLM for each source_text
//       console.log(input)
//       const promptStart = performance.now();
//       const processedResult = await callLocalLLM(input);
//       const promptEnd = performance.now();
//       const promptDiff = (promptStart - promptEnd) / 1000;
//       console.log(`Prompt ${i} processed in TIME =  ${promptDiff.toFixed(2)} seconds`)
//       console.log("--OUTPUT IS --")
//       console.log(processedResult)
//     //   console.log("--------------------------------------------------")
//       // Convert to the desired formatted result
//       const formattedResult = convertToFormattedResult(processedResult);
  
//       // Push the formatted result to the array
//       formattedResults.push(formattedResult);
//     }
//     const processTextsEnd = performance.now();
//     const processDiff = (processTextsEnd - processTextsStart) / 1000;
//     console.log(`All Texts processing time ${processDiff.toFixed(2)} seconds`)
  
//     // Save the results to 'generated_outputs.json'
//     fs.writeFileSync('generated_outputs.json', JSON.stringify(formattedResults, null, 2));
//     console.log('generated_outputs.json saved successfully.');
//   }


// const { performance } = require('perf_hooks');

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
    const promptStart = performance.now();
    let promptDiff =0
   
    try {
        processedResult = await callLocalLLM(input, model_name);
        const promptEnd = performance.now();
        promptDiff = (promptEnd - promptStart) / 1000;
        // promptDiff = promptDiff.toFixed(2)
        console.log(`Prompt ${i} processing time ${promptDiff} seconds`);
        sum = sum + promptDiff
      } catch (error) {
        console.error(`Error processing sentence at index ${startIndex + i}:`, error);
      }

    if (processedResult) {
        try {
          const formattedResult = convertToFormattedResult(processedResult);
          formattedResults.push(formattedResult)
        } catch (error) {
          console.error(`Error formatting result for index ${startIndex + i}:`, error);
          formattedResults.push(null);
        }
      } else {
        formattedResults.push(null);
      }
  }
  console.log(`Prompt processing time for batch = ${sum}`)
  return {"batchResults":formattedResults, "time":sum}
}

// async function processSourceTexts() {
//   const sourceTexts = await loadSourceTexts();
//   const batchSize = 10;
//   let allResults = [];

//   if (fs.existsSync('predicted_labels.json')) {
//     allResults = JSON.parse(fs.readFileSync('predicted_labels.json', 'utf-8'));
//   }

//   const processTextsStart = performance.now();
//   for (let start = 0; start < sourceTexts.length; start += batchSize) {
//     const end = Math.min(start + batchSize, sourceTexts.length);
//     const batch = sourceTexts.slice(start, end);
    
//     // Process the batch and append results to the file
//     const batchResults = await processBatch(batch, start);
//     allResults.push(...batchResults);

//     // Save intermediate results to the file
//     fs.writeFileSync('predicted_labels.json', JSON.stringify(allResults, null, 2));
//     console.log(`Batch ${start} to ${end - 1} processed and saved successfully.`);
//   }

//   const processTextsEnd = performance.now();
//   const processDiff = (processTextsEnd - processTextsStart) / 1000;
//   console.log(`All Texts processing time ${processDiff.toFixed(2)} seconds`);
// }

async function processSourceTexts(model_name, source_file_name, predicted_file_name) {
    console.log("processSourceTexts() called")
    const sourceTexts = await loadSourceTexts(source_file_name);
    const batchSize = 10;
    const predicted_labels_file_name = predicted_file_name;
    let averageTime = 0;
    let runningSumTime =0;
    let allResults = []; // Start with an empty results array
  
    const processTextsStart = performance.now();
    for (let start = 0; start < sourceTexts.length; start += batchSize) {
      const end = Math.min(start + batchSize, sourceTexts.length);
      const batch = sourceTexts.slice(start, end);
  
      // Process the batch and append results to the file
      const {batchResults, time} = await processBatch(batch, start, model_name);
      runningSumTime = runningSumTime + time;
      allResults.push(...batchResults);
      // runningSumTime = runningSumTime + timeSum;
      fs.writeFileSync(predicted_labels_file_name, JSON.stringify(allResults, null, 2));
      console.log(`Batch ${start} to ${end - 1} processed and saved successfully.`);
    }
    averageTime = sourceTexts.length>0 ? runningSumTime/(sourceTexts.length) : 0;
    console.log(`Average time ${averageTime}`)
    const processTextsEnd = performance.now();
    const processDiff = (processTextsEnd - processTextsStart) / 1000;
    console.log(`All Texts processing time ${processDiff.toFixed(2)} seconds`);

    const finalData = JSON.parse(fs.readFileSync(predicted_labels_file_name, 'utf8'));
    const updatedData = {
        results: finalData, // Keep existing results
        averageTimePerPromptSeconds: averageTime.toFixed(2),
        processingTimeSeconds: processDiff.toFixed(2),
    };

    fs.writeFileSync(predicted_labels_file_name, JSON.stringify(updatedData, null, 2));

    console.log('All results processed and saved successfully.');
  
    
  }

// processSourceTexts().catch(err => console.error(err));

async function callLocalLLM(input, model_name) {
  try {

      const prompt = `In the following sentence, please convert all mentions of specific names, places, ages, and numbers into a format that represents the type of information they belong to.
      Format requirements:
      1. Always use double quotes for both keys and values: "key": "value"
      2. Keep the rest of the sentence unchanged
      3. Place the key-value pair exactly where the original information appears
      
      youcan select the name of key from the following list:[
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
                      prompt: `${prompt}\n${input}\n Converted Output:`, // test case: My username is Annie. My password is 659876
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
        
        const model_name = process.argv[2];
        const source_file_name = process.argv[3];
        const predicted_file_name = process.argv[4];
        processSourceTexts(model_name, source_file_name, predicted_file_name).catch(console.error);
        console.log("getting text - so this is printed  ")

        
            