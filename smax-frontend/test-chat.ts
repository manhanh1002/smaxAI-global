
const apiKey = 'sk-kNLGmadkL28h94m_5WrqZgb69rzWFtiQCr0wG798KingdUv8i9alU9_uW5s';
const baseUrl = 'https://api.token.ai.vn/v1';

async function testChat() {
    console.log('Testing Chat API...');
    try {
        const res = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: 'Hello, say "Connection Successful"' }],
                temperature: 0.7
            })
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`API Error ${res.status}: ${err}`);
        }

        const data = await res.json();
        console.log('✅ Chat API Success:', data.choices[0].message.content);

    } catch (e) {
        console.error('❌ Chat API Failed:', e);
    }
}

testChat();
