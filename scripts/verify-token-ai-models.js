
const apiKey = 'sk-kNLGmadkL28h94m_5WrqZgb69rzWFtiQCr0wG798KingdUv8i9alU9_uW5s';
const baseUrl = 'https://api.token.ai.vn/v1';

async function verifyModels() {
    console.log('Fetching available models...');
    try {
        const res = await fetch(`${baseUrl}/models`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (!res.ok) {
            console.error(`Failed to fetch models: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.error('Response:', text);
            return;
        }

        const data = await res.json();
        console.log('Models fetched successfully.');
        const modelIds = data.data.map(m => m.id);
        console.log('Available models:', modelIds);

        // Test with a different model if available
        const testModel = modelIds.find(m => m !== 'gpt-4o-mini' && (m.includes('gpt-4') || m.includes('gpt-3.5')));
        
        if (testModel) {
            console.log(`\nTesting chat completion with model: ${testModel}`);
            const chatRes = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: testModel,
                    messages: [{ role: 'user', content: 'Hello, verify you are working with ' + testModel }],
                    temperature: 0.7
                })
            });

            if (!chatRes.ok) {
                 const err = await chatRes.text();
                 console.error(`Chat failed with ${testModel}:`, err);
            } else {
                 const chatData = await chatRes.json();
                 console.log(`✅ Success with ${testModel}:`, chatData.choices[0].message.content);
            }
        } else {
            console.log('No suitable alternative model found to test.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

verifyModels();
