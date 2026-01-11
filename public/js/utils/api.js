/**
 * API Utility Module
 * Handles all server communications
 */

const API_BASE = '/api';

export const api = {
    async getTestData() {
        const response = await fetch(`${API_BASE}/test-data`);
        if (!response.ok) throw new Error('Failed to load test data');
        return response.json();
    },

    async submitTest(data) {
        const response = await fetch(`${API_BASE}/submit-test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to submit test');
        return response.json();
    },

    async uploadSpeaking(blob, userName, date) {
        const formData = new FormData();
        // Filename: spearking.mp4
        formData.append('file', blob, 'speaking.mp4');
        formData.append('userName', userName);
        formData.append('date', date);

        const response = await fetch(`${API_BASE}/upload-speaking`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Failed to upload speaking recording');
        return response.json();
    }
};
