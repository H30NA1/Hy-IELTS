const fetch = require('node-fetch');

async function testPDFGeneration() {
    try {
        console.log('Testing PDF generation...');
        
        const testData = {
            userName: 'TestUser',
            results: {
                listening: { score: 2, band: 0 },
                reading: { score: 0, band: 0 },
                writing: { score: 0, band: 0 },
                speaking: { score: 0, band: 0 },
                overallBand: 0,
                totalRawScore: 2
            },
            answers: {
                listening: { q1: 'B', q2: 'B' },
                reading: {},
                writing: {},
                speaking: {}
            },
            testData: {
                sections: [
                    {
                        id: 'listening',
                        parts: [
                            {
                                questions: [
                                    { id: 'q1', correctAnswer: 'B' },
                                    { id: 'q2', correctAnswer: 'B' }
                                ]
                            }
                        ]
                    }
                ]
            },
            timestamp: new Date().toISOString()
        };
        
        const response = await fetch('http://localhost:8111/api/generate-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        if (response.ok) {
            console.log('PDF generation successful!');
            console.log('Response headers:', response.headers.raw());
        } else {
            console.log('PDF generation failed:', response.status, response.statusText);
            const errorText = await response.text();
            console.log('Error response:', errorText);
        }
        
    } catch (error) {
        console.error('Error testing PDF generation:', error);
    }
}

testPDFGeneration();
