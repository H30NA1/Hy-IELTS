// User Data Management Module
class IELTSUserData {
    constructor() {
        this.currentUser = null;
    }

    // Set current user
    setCurrentUser(userName) {
        this.currentUser = userName;
        console.log('Current user set to:', this.currentUser);
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Get user's test history
    async getUserTests(userName = null) {
        const user = userName || this.currentUser;
        if (!user) {
            throw new Error('No user specified');
        }

        try {
            const response = await fetch(`/api/user/${encodeURIComponent(user)}/tests`);
            if (!response.ok) {
                throw new Error(`Failed to fetch tests: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching user tests:', error);
            throw error;
        }
    }

    // Get specific test data
    async getTestData(userName, timestamp) {
        try {
            const response = await fetch(`/api/user/${encodeURIComponent(userName)}/test/${timestamp}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch test data: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching test data:', error);
            throw error;
        }
    }

    // Get user's PDF files
    async getUserPDFs(userName = null) {
        const user = userName || this.currentUser;
        if (!user) {
            throw new Error('No user specified');
        }

        try {
            const response = await fetch(`/api/user/${encodeURIComponent(user)}/pdfs`);
            if (!response.ok) {
                throw new Error(`Failed to fetch PDFs: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching user PDFs:', error);
            throw error;
        }
    }

    // Download PDF
    downloadPDF(userName, timestamp) {
        const url = `/api/user/${encodeURIComponent(userName)}/pdf/${timestamp}`;
        const link = document.createElement('a');
        link.href = url;
        link.download = `IELTS_Test_Results_${timestamp}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Show user history modal
    async showUserHistory() {
        if (!this.currentUser) {
            alert('No user logged in');
            return;
        }

        try {
            const [testsData, pdfsData] = await Promise.all([
                this.getUserTests(),
                this.getUserPDFs()
            ]);

            this.displayUserHistory(testsData.tests, pdfsData.pdfs);
        } catch (error) {
            console.error('Error loading user history:', error);
            alert('Failed to load user history');
        }
    }

    // Display user history in modal
    displayUserHistory(tests, pdfs) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'user-history-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>📊 Test History for ${this.currentUser}</h2>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="history-section">
                        <h3>📝 Test Results</h3>
                        <div id="tests-list">
                            ${tests.length === 0 ? '<p>No tests found</p>' : ''}
                        </div>
                    </div>
                    <div class="history-section">
                        <h3>📄 PDF Reports</h3>
                        <div id="pdfs-list">
                            ${pdfs.length === 0 ? '<p>No PDFs found</p>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Populate tests list
        const testsList = document.getElementById('tests-list');
        tests.forEach(test => {
            const testElement = document.createElement('div');
            testElement.className = 'test-item';
            testElement.innerHTML = `
                <div class="test-info">
                    <div class="test-date">${new Date(test.timestamp).toLocaleString()}</div>
                    <div class="test-score">Overall Band: ${test.overallBand}</div>
                    <div class="test-breakdown">
                        Listening: ${test.results.listening.score}/${test.results.listening.total} (Band ${test.results.listening.band}) |
                        Reading: ${test.results.reading.score}/${test.results.reading.total} (Band ${test.results.reading.band}) |
                        Writing: ${test.results.writing.score}/${test.results.writing.total} (Band ${test.results.writing.band}) |
                        Speaking: ${test.results.speaking.score}/${test.results.speaking.total} (Band ${test.results.speaking.band})
                    </div>
                </div>
                <div class="test-actions">
                    <button onclick="userData.viewTestDetails('${test.timestamp}')" class="btn btn-secondary">View Details</button>
                </div>
            `;
            testsList.appendChild(testElement);
        });

        // Populate PDFs list
        const pdfsList = document.getElementById('pdfs-list');
        pdfs.forEach(pdf => {
            const pdfElement = document.createElement('div');
            pdfElement.className = 'pdf-item';
            pdfElement.innerHTML = `
                <div class="pdf-info">
                    <div class="pdf-date">${new Date(pdf.timestamp).toLocaleString()}</div>
                    <div class="pdf-filename">${pdf.fileName}</div>
                </div>
                <div class="pdf-actions">
                    <button onclick="userData.downloadPDF('${this.currentUser}', '${pdf.timestamp}')" class="btn btn-primary">Download</button>
                </div>
            `;
            pdfsList.appendChild(pdfElement);
        });

        // Show modal
        modal.style.display = 'block';
    }

    // View test details
    async viewTestDetails(timestamp) {
        try {
            const testData = await this.getTestData(this.currentUser, timestamp);
            
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'test-details-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>📋 Test Details - ${new Date(timestamp).toLocaleString()}</h2>
                        <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="test-summary">
                            <h3>Overall Results</h3>
                            <div class="results-grid">
                                <div class="result-item">
                                    <span class="result-label">Overall Band Score:</span>
                                    <span class="result-value">${testData.results.overallBand}</span>
                                </div>
                                <div class="result-item">
                                    <span class="result-label">Total Raw Score:</span>
                                    <span class="result-value">${testData.results.totalScore}/${testData.results.totalPossible}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="section-results">
                            <h3>Section Breakdown</h3>
                            <div class="section-grid">
                                <div class="section-item">
                                    <h4>🎧 Listening</h4>
                                    <p>Score: ${testData.results.listening.score}/${testData.results.listening.total}</p>
                                    <p>Band: ${testData.results.listening.band}</p>
                                </div>
                                <div class="section-item">
                                    <h4>📖 Reading</h4>
                                    <p>Score: ${testData.results.reading.score}/${testData.results.reading.total}</p>
                                    <p>Band: ${testData.results.reading.band}</p>
                                </div>
                                <div class="section-item">
                                    <h4>✏️ Writing</h4>
                                    <p>Score: ${testData.results.writing.score}/${testData.results.writing.total}</p>
                                    <p>Band: ${testData.results.writing.band}</p>
                                </div>
                                <div class="section-item">
                                    <h4>🗣️ Speaking</h4>
                                    <p>Score: ${testData.results.speaking.score}/${testData.results.speaking.total}</p>
                                    <p>Band: ${testData.results.speaking.band}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="test-actions">
                            <button onclick="userData.downloadPDF('${this.currentUser}', '${timestamp}')" class="btn btn-primary">Download PDF</button>
                            <button onclick="this.closest('.modal').remove()" class="btn btn-secondary">Close</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            modal.style.display = 'block';
            
        } catch (error) {
            console.error('Error loading test details:', error);
            alert('Failed to load test details');
        }
    }
}

// Make available globally
window.IELTSUserData = IELTSUserData;
