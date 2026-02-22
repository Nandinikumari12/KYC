// ==================== KYC MANAGEMENT SYSTEM - COMPLETE VERSION ====================
// Author: Advanced KYC System
// Version: 3.0 with Image Upload & Display & FIFO Queue Management
// Lines: 1800+

// ==================== CONSTANTS & CONFIG ====================
const STORAGE_KEY = 'kyc_applications_v3';
const IMAGE_STORAGE_KEY = 'kyc_images';
const QUEUE_KEY = 'kyc_verification_queue';

let imageBase64 = null;
let allApps = [];
let filteredApps = [];
let currentPage = 1;
let itemsPerPage = 10;
let charts = {};
let imageStore = {}; // Store images separately to avoid localStorage size issues

// Queue management variables
let verificationQueue = []; // FIFO queue for pending applications
let processingHistory = []; // Track processed applications with timestamps

// Sample Indian names for demo data
const INDIAN_NAMES = [
    "Aarav Sharma", "Vihaan Patel", "Vivaan Singh", "Ananya Gupta", "Diya Reddy",
    "Aditya Kumar", "Sai Krishna", "Arjun Nair", "Ishita Verma", "Rohan Desai",
    "Priya Menon", "Karthik Iyer", "Neha Joshi", "Rahul Kapoor", "Pooja Malhotra",
    "Amit Shah", "Sneha Pillai", "Vikram Rathore", "Anjali Mehta", "Sanjay Gupta",
    "Deepika Padukone", "Ranveer Singh", "Alia Bhatt", "Shah Rukh Khan", "Salman Khan",
    "Akshay Kumar", "Ajay Devgn", "Hrithik Roshan", "Aishwarya Rai", "Madhuri Dixit",
    "Amir Khan", "Rajkumar Rao", "Kangana Ranaut", "Vidya Balan", "Kareena Kapoor",
    "Saif Ali Khan", "John Abraham", "Abhishek Bachchan", "Jaya Bachchan", "Shilpa Shetty",
    "Suniel Shetty", "Jackie Shroff", "Anil Kapoor", "Sonam Kapoor", "Arjun Kapoor",
    "Janhvi Kapoor", "Khushi Kapoor", "Shanaya Kapoor", "Ishaan Khatter", "Sara Ali Khan"
];

// Sample addresses
const AREAS = [
    'MG Road', 'Brigade Road', 'Church Street', 'Indiranagar', 'Koramangala',
    'Whitefield', 'Electronic City', 'Hebbal', 'Jayanagar', 'Malleswaram',
    'HSR Layout', 'BTM Layout', 'Marathahalli', 'Bellandur', 'Sarjapur'
];

// Generate realistic Aadhaar numbers
function generateAadhaar() {
    let num = '';
    for (let i = 0; i < 12; i++) {
        num += Math.floor(Math.random() * 10);
    }
    return num;
}

// Generate PAN numbers
function generatePAN() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return letters[Math.floor(Math.random() * 26)] +
           letters[Math.floor(Math.random() * 26)] +
           letters[Math.floor(Math.random() * 26)] +
           letters[Math.floor(Math.random() * 26)] +
           letters[Math.floor(Math.random() * 26)] +
           Math.floor(1000 + Math.random() * 9000) +
           letters[Math.floor(Math.random() * 26)];
}

// Generate realistic rejection reasons
const REJECTION_REASONS = [
    "Document is blurry or unclear - please upload clear image",
    "Document expired - upload current document",
    "Name mismatch with provided documents",
    "Invalid document format - upload JPG/PNG only",
    "Document appears to be edited or tampered",
    "Incorrect document type uploaded",
    "Document is not fully visible - show all corners",
    "Signature does not match records",
    "Address proof not accepted - upload utility bill",
    "Photo does not match ID proof",
    "Document is damaged or torn",
    "Selfie doesn't match ID photo",
    "Invalid Aadhaar number - check digits",
    "PAN card is not valid or expired",
    "Document is black and white - upload color copy",
    "Watermark detected on document",
    "Document appears to be a photocopy",
    "Document too old (>5 years)",
    "Information mismatch in application form",
    "Incomplete document - missing required details",
    "Document uploaded is not clear enough",
    "Document has been cropped improperly",
    "Document with flash reflection - retake photo",
    "Document with obstructions - remove obstructions",
    "Document with wrong orientation - upload upright"
];

// Sample document images (base64 placeholders)
const SAMPLE_IMAGES = [
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', // 1x1 transparent pixel
];

// Generate random date within last 90 days
function getRandomDate() {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));
    return date.toISOString();
}

// Generate random date within last 30 days for recent apps
function getRecentDate() {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    return date.toISOString();
}

// Initialize with sample data - 50+ applications with images
function initializeSampleData() {
    const sampleApps = [];
    const sampleImages = {};
    
    // Create 10 approved applications
    for (let i = 0; i < 10; i++) {
        const name = INDIAN_NAMES[Math.floor(Math.random() * INDIAN_NAMES.length)];
        const id = generateId();
        const submittedDate = getRandomDate();
        const area = AREAS[Math.floor(Math.random() * AREAS.length)];
        
        // Add sample image
        sampleImages[id] = SAMPLE_IMAGES[0];
        
        sampleApps.push({
            id: id,
            fullName: name,
            dob: `199${Math.floor(Math.random() * 9)}-0${Math.floor(Math.random() * 8) + 1}-1${Math.floor(Math.random() * 8) + 1}`,
            aadhaar: generateAadhaar(),
            pan: generatePAN(),
            email: name.toLowerCase().replace(' ', '.') + '@gmail.com',
            phone: '9' + Math.floor(100000000 + Math.random() * 900000000),
            address: `${Math.floor(Math.random() * 999) + 1}, ${area}, Bangalore - ${Math.floor(560000 + Math.random() * 1000)}`,
            hasImage: true,
            imageId: id,
            status: 'approved',
            submittedAt: submittedDate,
            lastUpdated: new Date(new Date(submittedDate).getTime() + 86400000).toISOString(),
            queuePosition: null, // No queue position for approved apps
            processingStartTime: new Date(new Date(submittedDate).getTime() + 3600000).toISOString(),
            processingEndTime: new Date(new Date(submittedDate).getTime() + 86400000).toISOString(),
            rejectionReason: null,
            history: [
                {
                    status: 'pending',
                    timestamp: submittedDate,
                    note: 'Application submitted and added to verification queue'
                },
                {
                    status: 'pending',
                    timestamp: new Date(new Date(submittedDate).getTime() + 3600000).toISOString(),
                    note: 'Processing started from queue'
                },
                {
                    status: 'approved',
                    timestamp: new Date(new Date(submittedDate).getTime() + 86400000).toISOString(),
                    note: 'All documents verified successfully. Application approved.'
                }
            ],
            documents: [{
                type: 'idProof',
                uploadedAt: submittedDate,
                fileName: 'aadhaar_card.jpg',
                fileSize: '245 KB'
            }]
        });
    }
    
    // Create 20 pending applications (these will be in queue)
    for (let i = 0; i < 20; i++) {
        const name = INDIAN_NAMES[Math.floor(Math.random() * INDIAN_NAMES.length)];
        const id = generateId();
        const submittedDate = getRecentDate();
        const area = AREAS[Math.floor(Math.random() * AREAS.length)];
        
        // Add sample image
        sampleImages[id] = SAMPLE_IMAGES[0];
        
        sampleApps.push({
            id: id,
            fullName: name,
            dob: `198${Math.floor(Math.random() * 9)}-0${Math.floor(Math.random() * 8) + 1}-1${Math.floor(Math.random() * 8) + 1}`,
            aadhaar: generateAadhaar(),
            pan: generatePAN(),
            email: name.toLowerCase().replace(' ', '_') + '@yahoo.com',
            phone: '8' + Math.floor(100000000 + Math.random() * 900000000),
            address: `Flat ${Math.floor(Math.random() * 999) + 1}, ${area}, Bangalore - ${Math.floor(560000 + Math.random() * 1000)}`,
            hasImage: true,
            imageId: id,
            status: 'pending',
            submittedAt: submittedDate,
            lastUpdated: submittedDate,
            queuePosition: i + 1, // Queue position based on submission order
            processingStartTime: null,
            processingEndTime: null,
            rejectionReason: null,
            history: [
                {
                    status: 'pending',
                    timestamp: submittedDate,
                    note: `Application submitted and added to verification queue at position ${i + 1}`
                }
            ],
            documents: [{
                type: 'idProof',
                uploadedAt: submittedDate,
                fileName: 'pan_card.jpg',
                fileSize: '312 KB'
            }]
        });
        
        // Add to queue
        verificationQueue.push({
            id: id,
            position: i + 1,
            addedAt: submittedDate,
            estimatedWaitTime: (i + 1) * 30 // 30 minutes per application
        });
    }
    
    // Create 20 rejected applications with reasons
    for (let i = 0; i < 20; i++) {
        const name = INDIAN_NAMES[Math.floor(Math.random() * INDIAN_NAMES.length)];
        const id = generateId();
        const submittedDate = getRandomDate();
        const rejectionReason = REJECTION_REASONS[Math.floor(Math.random() * REJECTION_REASONS.length)];
        const rejectionDate = new Date(new Date(submittedDate).getTime() + (Math.floor(Math.random() * 5) + 1) * 86400000);
        const area = AREAS[Math.floor(Math.random() * AREAS.length)];
        
        // Add sample image
        sampleImages[id] = SAMPLE_IMAGES[0];
        
        sampleApps.push({
            id: id,
            fullName: name,
            dob: `197${Math.floor(Math.random() * 9)}-0${Math.floor(Math.random() * 8) + 1}-1${Math.floor(Math.random() * 8) + 1}`,
            aadhaar: generateAadhaar(),
            pan: generatePAN(),
            email: name.toLowerCase().split(' ').join('') + '@hotmail.com',
            phone: '7' + Math.floor(100000000 + Math.random() * 900000000),
            address: `#${Math.floor(Math.random() * 999) + 1}, ${area}, Bangalore - ${Math.floor(560000 + Math.random() * 1000)}`,
            hasImage: true,
            imageId: id,
            status: 'rejected',
            queuePosition: null,
            processingStartTime: new Date(new Date(submittedDate).getTime() + 3600000).toISOString(),
            processingEndTime: rejectionDate.toISOString(),
            rejectionReason: rejectionReason,
            submittedAt: submittedDate,
            lastUpdated: rejectionDate.toISOString(),
            history: [
                {
                    status: 'pending',
                    timestamp: submittedDate,
                    note: 'Application submitted and added to queue'
                },
                {
                    status: 'pending',
                    timestamp: new Date(new Date(submittedDate).getTime() + 3600000).toISOString(),
                    note: 'Processing started from queue'
                },
                {
                    status: 'rejected',
                    timestamp: rejectionDate.toISOString(),
                    note: `Rejected: ${rejectionReason}`
                }
            ],
            documents: [{
                type: 'idProof',
                uploadedAt: submittedDate,
                fileName: 'invalid_document.jpg',
                fileSize: '189 KB'
            }]
        });
    }
    
    // Add 5 extra applications to make 55+
    for (let i = 0; i < 5; i++) {
        const name = INDIAN_NAMES[Math.floor(Math.random() * INDIAN_NAMES.length)];
        const id = generateId();
        const submittedDate = getRecentDate();
        const area = AREAS[Math.floor(Math.random() * AREAS.length)];
        const statuses = ['pending', 'approved', 'rejected'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        sampleImages[id] = SAMPLE_IMAGES[0];
        
        sampleApps.push({
            id: id,
            fullName: name,
            dob: `199${Math.floor(Math.random() * 9)}-0${Math.floor(Math.random() * 8) + 1}-1${Math.floor(Math.random() * 8) + 1}`,
            aadhaar: generateAadhaar(),
            pan: generatePAN(),
            email: name.toLowerCase().replace(' ', '_') + '@outlook.com',
            phone: '6' + Math.floor(100000000 + Math.random() * 900000000),
            address: `Suite ${Math.floor(Math.random() * 999) + 1}, ${area}, Bangalore - ${Math.floor(560000 + Math.random() * 1000)}`,
            hasImage: true,
            imageId: id,
            status: status,
            queuePosition: status === 'pending' ? verificationQueue.length + 1 : null,
            processingStartTime: status !== 'pending' ? new Date(new Date(submittedDate).getTime() + 3600000).toISOString() : null,
            processingEndTime: status !== 'pending' ? new Date(new Date(submittedDate).getTime() + 86400000).toISOString() : null,
            rejectionReason: status === 'rejected' ? REJECTION_REASONS[Math.floor(Math.random() * REJECTION_REASONS.length)] : null,
            submittedAt: submittedDate,
            lastUpdated: submittedDate,
            history: [
                {
                    status: 'pending',
                    timestamp: submittedDate,
                    note: status === 'pending' ? 'Application submitted and added to queue' : 'Application submitted'
                }
            ],
            documents: [{
                type: 'idProof',
                uploadedAt: submittedDate,
                fileName: 'document.jpg',
                fileSize: '278 KB'
            }]
        });
        
        if (status === 'pending') {
            verificationQueue.push({
                id: id,
                position: verificationQueue.length + 1,
                addedAt: submittedDate,
                estimatedWaitTime: (verificationQueue.length + 1) * 30
            });
        }
    }
    
    // Shuffle array
    for (let i = sampleApps.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sampleApps[i], sampleApps[j]] = [sampleApps[j], sampleApps[i]];
    }
    
    return { apps: sampleApps, images: sampleImages };
}

// ==================== QUEUE MANAGEMENT FUNCTIONS ====================
function initializeQueue() {
    // Load queue from storage
    const queueData = localStorage.getItem(QUEUE_KEY);
    if (queueData) {
        try {
            verificationQueue = JSON.parse(queueData);
        } catch (e) {
            console.error('Error loading queue:', e);
            rebuildQueue();
        }
    } else {
        rebuildQueue();
    }
    
    // Update queue positions in applications
    updateQueuePositions();
    
    console.log('📊 Queue initialized with', verificationQueue.length, 'pending applications');
}

function rebuildQueue() {
    // Rebuild queue from pending applications
    const pendingApps = allApps.filter(app => app.status === 'pending')
        .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
    
    verificationQueue = pendingApps.map((app, index) => ({
        id: app.id,
        position: index + 1,
        addedAt: app.submittedAt,
        estimatedWaitTime: (index + 1) * 30 // 30 minutes per application
    }));
    
    saveQueue();
}

function updateQueuePositions() {
    // Update queuePosition field in all applications
    allApps.forEach(app => {
        if (app.status === 'pending') {
            const queueItem = verificationQueue.find(q => q.id === app.id);
            app.queuePosition = queueItem ? queueItem.position : null;
        } else {
            app.queuePosition = null;
        }
    });
}

function addToQueue(appId) {
    const app = allApps.find(a => a.id === appId);
    if (!app || app.status !== 'pending') return;
    
    // Check if already in queue
    if (verificationQueue.some(q => q.id === appId)) return;
    
    const newPosition = verificationQueue.length + 1;
    
    verificationQueue.push({
        id: appId,
        position: newPosition,
        addedAt: new Date().toISOString(),
        estimatedWaitTime: newPosition * 30
    });
    
    app.queuePosition = newPosition;
    
    // Add to history
    if (!app.history) app.history = [];
    app.history.push({
        status: 'pending',
        timestamp: new Date().toISOString(),
        note: `Added to verification queue at position ${newPosition}`
    });
    
    saveQueue();
    saveData();
}

function removeFromQueue(appId) {
    const index = verificationQueue.findIndex(q => q.id === appId);
    if (index === -1) return null;
    
    const removed = verificationQueue.splice(index, 1)[0];
    
    // Update positions for remaining queue items
    verificationQueue.forEach((item, idx) => {
        item.position = idx + 1;
        item.estimatedWaitTime = (idx + 1) * 30;
    });
    
    // Update application
    const app = allApps.find(a => a.id === appId);
    if (app) {
        app.queuePosition = null;
    }
    
    saveQueue();
    saveData();
    
    return removed;
}

// NEW FUNCTION: Show processing options dialog
function showProcessingOptions(appId) {
    const app = allApps.find(a => a.id === appId);
    if (!app) return;
    
    // Create modal dialog
    const modalHtml = `
        <div id="processingModal" class="modal-overlay">
            <div class="modal glass-effect" style="width: 400px;">
                <div class="modal-header">
                    <h3>Process Application</h3>
                    <button class="modal-close" onclick="closeProcessingModal()">✕</button>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 1rem; font-weight: 600;">Application: ${app.fullName}</p>
                    <p style="margin-bottom: 1.5rem; color: var(--gray-600);">ID: ${app.id}</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <button class="btn btn-primary" onclick="processWithStatus('${app.id}', 'approved')" style="width: 100%; padding: 1rem;">
                            ✅ Approve Application
                        </button>
                        
                        <button class="btn btn-danger" onclick="processWithStatus('${app.id}', 'rejected')" style="width: 100%; padding: 1rem;">
                            ❌ Reject Application
                        </button>
                        
                        <button class="btn btn-outline" onclick="processWithStatus('${app.id}', 'pending')" style="width: 100%; padding: 1rem;">
                            ⏳ Keep in Queue
                        </button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-ghost" onclick="closeProcessingModal()">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    // Add to body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstChild);
}

// NEW FUNCTION: Close processing modal
function closeProcessingModal() {
    const modal = document.getElementById('processingModal');
    if (modal) {
        modal.remove();
    }
}

// UPDATED FUNCTION: Process next in queue with options
function processNextInQueue() {
    if (verificationQueue.length === 0) {
        showToast('No pending applications in queue', 'info');
        return null;
    }
    
    // Get the first item (FIFO)
    const nextItem = verificationQueue[0];
    const app = allApps.find(a => a.id === nextItem.id);
    
    if (!app) {
        // Invalid queue item, remove it
        verificationQueue.shift();
        saveQueue();
        return processNextInQueue();
    }
    
    // Show options dialog
    showProcessingOptions(app.id);
}

// UPDATED FUNCTION: Process with specific status
function processWithStatus(appId, status) {
    const app = allApps.find(a => a.id === appId);
    if (!app) return;
    
    // Remove from queue
    removeFromQueue(appId);
    
    // Record processing start time if not already set
    if (!app.processingStartTime) {
        app.processingStartTime = new Date().toISOString();
    }
    
    if (status === 'rejected') {
        const reason = prompt('Please enter rejection reason:', 'Document verification failed');
        if (reason === null) {
            // User cancelled, add back to queue
            addToQueue(appId);
            closeProcessingModal();
            return;
        }
        app.rejectionReason = reason || 'Document verification failed';
        app.status = 'rejected';
    } else if (status === 'approved') {
        app.rejectionReason = null;
        app.status = 'approved';
    } else {
        // Keep in queue - add back
        addToQueue(appId);
        closeProcessingModal();
        showToast('Application kept in queue', 'info');
        updateQueueDisplay();
        return;
    }
    
    app.lastUpdated = new Date().toISOString();
    app.processingEndTime = new Date().toISOString();
    
    // Add to history
    if (!app.history) app.history = [];
    app.history.push({
        status: 'processing',
        timestamp: app.processingStartTime,
        note: 'Processing started from queue'
    });
    app.history.push({
        status: status,
        timestamp: new Date().toISOString(),
        note: status === 'approved' ? 'Application approved after queue processing' : `Rejected: ${app.rejectionReason}`
    });
    
    // Update queue positions for remaining items
    verificationQueue.forEach((item, idx) => {
        item.position = idx + 1;
        item.estimatedWaitTime = (idx + 1) * 30;
    });
    
    // Update queue positions in all pending apps
    updateQueuePositions();
    
    saveQueue();
    saveData();
    
    // Update UI
    filterApplications();
    renderStatusCards();
    updateAllStats();
    updateQueueDisplay();
    closeProcessingModal();
    
    showToast(`Application ${app.id} processed (${status})`, 'success');
    
    return app;
}

// UPDATED FUNCTION: Process multiple from queue
function processMultipleFromQueue(count = 5) {
    if (verificationQueue.length === 0) {
        showToast('No pending applications in queue', 'info');
        return;
    }
    
    // Process first N items one by one with options
    const toProcess = Math.min(count, verificationQueue.length);
    
    if (toProcess === 0) return;
    
    // Show first one
    const nextItem = verificationQueue[0];
    showProcessingOptions(nextItem.id);
    
    // Note: Rest will be handled sequentially by user
    showToast(`Processing ${toProcess} applications. Please handle each one.`, 'info');
}

// Rest of the queue functions remain same...
function getQueueStats() {
    const now = new Date();
    
    return {
        queueLength: verificationQueue.length,
        oldestInQueue: verificationQueue.length > 0 ? 
            timeAgo(verificationQueue[0].addedAt) : 'No pending',
        estimatedWaitTime: verificationQueue.length * 30, // in minutes
        averageProcessingTime: calculateAverageProcessingTime(),
        processedToday: getProcessedCountToday()
    };
}

function calculateAverageProcessingTime() {
    const processedApps = allApps.filter(app => 
        app.processingStartTime && app.processingEndTime && app.status !== 'pending'
    );
    
    if (processedApps.length === 0) return 0;
    
    const totalTime = processedApps.reduce((sum, app) => {
        const start = new Date(app.processingStartTime);
        const end = new Date(app.processingEndTime);
        return sum + (end - start) / (1000 * 60); // in minutes
    }, 0);
    
    return Math.round(totalTime / processedApps.length);
}

function getProcessedCountToday() {
    const today = new Date().toISOString().split('T')[0];
    return allApps.filter(app => 
        app.lastUpdated && 
        app.lastUpdated.startsWith(today) && 
        app.status !== 'pending'
    ).length;
}

function saveQueue() {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(verificationQueue));
}

function updateQueueDisplay() {
    const queueDisplay = document.getElementById('queueDisplay');
    if (!queueDisplay) return;
    
    const stats = getQueueStats();
    
    let queueHtml = `
        <div class="queue-stats">
            <div class="queue-stat-item">
                <span class="queue-stat-label">Queue Length:</span>
                <span class="queue-stat-value">${stats.queueLength}</span>
            </div>
            <div class="queue-stat-item">
                <span class="queue-stat-label">Oldest in Queue:</span>
                <span class="queue-stat-value">${stats.oldestInQueue}</span>
            </div>
            <div class="queue-stat-item">
                <span class="queue-stat-label">Est. Wait Time:</span>
                <span class="queue-stat-value">${stats.estimatedWaitTime} min</span>
            </div>
            <div class="queue-stat-item">
                <span class="queue-stat-label">Avg. Processing:</span>
                <span class="queue-stat-value">${stats.averageProcessingTime} min</span>
            </div>
            <div class="queue-stat-item">
                <span class="queue-stat-label">Processed Today:</span>
                <span class="queue-stat-value">${stats.processedToday}</span>
            </div>
        </div>
    `;
    
    if (verificationQueue.length > 0) {
        queueHtml += '<div class="queue-list"><h4>Current Queue (FIFO) - Click "Process Next" to handle</h4>';
        verificationQueue.slice(0, 10).forEach((item, index) => {
            const app = allApps.find(a => a.id === item.id);
            queueHtml += `
                <div class="queue-item ${index === 0 ? 'next-item' : ''}">
                    <span class="queue-position">#${item.position}</span>
                    <span class="queue-name">${app ? app.fullName : 'Unknown'}</span>
                    <span class="queue-time">${timeAgo(item.addedAt)}</span>
                    <span class="queue-wait">${item.estimatedWaitTime} min</span>
                </div>
            `;
        });
        if (verificationQueue.length > 10) {
            queueHtml += `<div class="queue-more">+ ${verificationQueue.length - 10} more</div>`;
        }
        queueHtml += '</div>';
    } else {
        queueHtml += '<div class="queue-empty">✨ Queue is empty - no pending applications</div>';
    }
    
    queueDisplay.innerHTML = queueHtml;
}

// ==================== INITIALIZATION ====================
function init() {
    console.log('🚀 Initializing KYC Management System v3.0 with FIFO Queue...');
    console.log('Developer: Advanced KYC System');
    console.log('Date:', new Date().toLocaleString());
    
    // Load from localStorage
    loadData();
    
    // Initialize queue
    initializeQueue();
    
    // If no apps exist or less than 50, initialize with sample data
    if (allApps.length < 50) {
        console.log('📊 Generating sample data with 50+ applications...');
        const sampleData = initializeSampleData();
        allApps = sampleData.apps;
        imageStore = sampleData.images;
        rebuildQueue();
        saveData();
        console.log(`✅ Sample data loaded: ${allApps.length} applications with images`);
    }
    
    // Initialize all components
    initNavigation();
    initForm();
    initUploadArea();
    updateAllStats();
    setupEventListeners();
    setupMobileMenu();
    updateQueueDisplay();
    
    // Initialize charts if Chart.js is available
    if (typeof Chart !== 'undefined') {
        initCharts();
    }
    
    // Start queue monitoring (simulate real-time processing)
    startQueueMonitoring();
    
    console.log('✅ System ready! Total applications:', allApps.length);
    console.log('📸 Images stored:', Object.keys(imageStore).length);
    console.log('🔄 Queue length:', verificationQueue.length);
}

document.addEventListener('DOMContentLoaded', init);

// ==================== QUEUE MONITORING ====================
let queueMonitorInterval = null;

function startQueueMonitoring() {
    // Clear existing interval
    if (queueMonitorInterval) {
        clearInterval(queueMonitorInterval);
    }
    
    // Update queue display every 30 seconds
    queueMonitorInterval = setInterval(() => {
        updateQueueDisplay();
    }, 30000);
}

function stopQueueMonitoring() {
    if (queueMonitorInterval) {
        clearInterval(queueMonitorInterval);
        queueMonitorInterval = null;
    }
}

// ==================== DATA MANAGEMENT ====================
function loadData() {
    try {
        // Load applications
        const appsData = localStorage.getItem(STORAGE_KEY);
        allApps = appsData ? JSON.parse(appsData) : [];
        
        // Load images separately (to avoid localStorage size issues)
        const imagesData = localStorage.getItem(IMAGE_STORAGE_KEY);
        imageStore = imagesData ? JSON.parse(imagesData) : {};
        
        console.log('📂 Loaded from storage:', allApps.length, 'applications,', Object.keys(imageStore).length, 'images');
    } catch (error) {
        console.error('Error loading data:', error);
        allApps = [];
        imageStore = {};
    }
}

function saveData() {
    try {
        // Save applications
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allApps));
        
        // Save images (only store references for sample data)
        localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(imageStore));
        
        console.log('💾 Data saved successfully');
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Error saving data. Local storage might be full.');
    }
}

function generateId() {
    return 'KYC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8).toUpperCase();
}

// ==================== UI UPDATES ====================
function updateAllStats() {
    updateHomeStats();
    updateAdminStats();
    updateRecentApplications();
    renderStatusCards();
    renderAdminTable();
    updateQueueDisplay();
}

function updateHomeStats() {
    const stats = {
        total: allApps.length,
        approved: allApps.filter(a => a.status === 'approved').length,
        pending: allApps.filter(a => a.status === 'pending').length,
        rejected: allApps.filter(a => a.status === 'rejected').length
    };

    // Animate numbers
    animateNumber('stat-total', stats.total);
    animateNumber('stat-approved', stats.approved);
    animateNumber('stat-pending', stats.pending);
    animateNumber('stat-rejected', stats.rejected);
}

function animateNumber(elementId, target) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const current = parseInt(element.textContent) || 0;
    if (current === target) return;
    
    const step = target > current ? 1 : -1;
    const interval = setInterval(() => {
        const newValue = parseInt(element.textContent) + step;
        element.textContent = newValue;
        if (newValue === target) clearInterval(interval);
    }, 20);
}

function updateAdminStats() {
    document.getElementById('admin-total').textContent = allApps.length;
    document.getElementById('admin-approved').textContent = allApps.filter(a => a.status === 'approved').length;
    document.getElementById('admin-pending').textContent = allApps.filter(a => a.status === 'pending').length;
    document.getElementById('admin-rejected').textContent = allApps.filter(a => a.status === 'rejected').length;
}

// ==================== NAVIGATION ====================
function initNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            navigate(section);
        });
    });

    // Handle browser back/forward
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.section) {
            navigate(event.state.section, false);
        }
    });
}

function navigate(section, addToHistory = true) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    const targetSection = document.getElementById(section);
    if (!targetSection) {
        console.error('Section not found:', section);
        return;
    }
    
    targetSection.classList.add('active');
    
    const activeBtn = document.querySelector(`[data-section="${section}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    if (addToHistory) {
        history.pushState({ section }, '', `#${section}`);
    }

    // Close mobile menu
    document.getElementById('mainNav')?.classList.remove('show');

    // Section-specific actions
    switch(section) {
        case 'admin':
            renderAdminTable();
            updateQueueDisplay();
            break;
        case 'status':
            renderStatusCards();
            break;
        case 'analytics':
            if (typeof Chart !== 'undefined') {
                updateAnalytics();
            }
            break;
        case 'home':
            updateHomeStats();
            break;
    }
}

function setupMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const nav = document.getElementById('mainNav');
    
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            nav.classList.toggle('show');
        });
    }
}

// ==================== STATUS LOOKUP ====================
function switchLookupMode(mode) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const input = document.getElementById('lookupInput');
    if (mode === 'aadhaar') {
        input.placeholder = 'Enter 12-digit Aadhaar number';
        input.maxLength = 14;
    } else {
        input.placeholder = 'Enter Application ID (e.g., KYC-123456)';
        input.maxLength = 30;
    }
}

function lookupStatus() {
    const input = document.getElementById('lookupInput').value.trim();
    const activeTab = document.querySelector('.tab-btn.active');
    const mode = activeTab?.textContent.includes('Aadhaar') ? 'aadhaar' : 'id';
    const result = document.getElementById('lookupResult');
    
    if (!input) {
        result.innerHTML = '<div class="lookup-not-found">🔍 Please enter a search term</div>';
        return;
    }

    let app;
    if (mode === 'aadhaar') {
        const aadhaar = input.replace(/\s/g, '');
        app = allApps.find(a => a.aadhaar === aadhaar);
    } else {
        app = allApps.find(a => a.id === input);
    }
    
    if (!app) {
        result.innerHTML = '<div class="lookup-not-found">❌ No application found for the given input</div>';
        return;
    }
    
    const hasImage = app.hasImage || (app.imageId && imageStore[app.imageId]);
    const queueInfo = app.status === 'pending' && app.queuePosition ? 
        `<div class="detail-row" style="background: var(--primary-light);">
            <span class="detail-label">Queue Position</span>
            <span class="detail-value">#${app.queuePosition} (Est. wait: ${app.queuePosition * 30} minutes)</span>
        </div>` : '';
    
    result.innerHTML = `
        <div class="lookup-result-card">
            <div class="lookup-header">
                <h4>Application Found</h4>
                <span class="badge badge-${app.status}">${app.status}</span>
            </div>
            <div class="lookup-details">
                <div class="detail-row">
                    <span class="detail-label">Application ID</span>
                    <span class="detail-value">${app.id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Full Name</span>
                    <span class="detail-value">${app.fullName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Aadhaar Number</span>
                    <span class="detail-value">${maskAadhaar(app.aadhaar)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">PAN Number</span>
                    <span class="detail-value">${app.pan}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">${app.email}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Phone</span>
                    <span class="detail-value">${app.phone}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Submitted On</span>
                    <span class="detail-value">${formatDate(app.submittedAt)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Document</span>
                    <span class="detail-value">${hasImage ? '✅ Uploaded' : '❌ Not uploaded'}</span>
                </div>
                ${queueInfo}
                ${app.rejectionReason ? `
                <div class="detail-row" style="grid-column: span 2; background: #fee2e2; padding: 1rem; border-left: 4px solid #ef4444;">
                    <span class="detail-label">Rejection Reason</span>
                    <span class="detail-value">${app.rejectionReason}</span>
                </div>
                ` : ''}
            </div>
            <div class="lookup-actions">
                <button class="btn btn-primary" onclick="viewDetails('${app.id}')">
                    View Full Details
                </button>
                <button class="btn btn-outline" onclick="document.getElementById('lookupInput').value = ''; document.getElementById('lookupResult').innerHTML = '';">
                    New Search
                </button>
            </div>
        </div>
    `;
}

// ==================== STATUS CARDS ====================
function renderStatusCards() {
    const container = document.getElementById('allApplications');
    if (!container) return;
    
    if (allApps.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>No applications submitted yet</p>
                <button class="btn btn-primary" onclick="navigate('apply')">Apply Now</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = allApps.slice(0, 12).map(app => {
        const queueBadge = app.status === 'pending' && app.queuePosition ? 
            `<span class="queue-badge">Queue: #${app.queuePosition}</span>` : '';
        
        return `
        <div class="status-card ${app.status}" onclick="viewDetails('${app.id}')">
            <div class="status-card-header">
                <div>
                    <div class="status-card-name">${app.fullName}</div>
                    <div class="status-card-date">${timeAgo(app.submittedAt)}</div>
                </div>
                <span class="badge badge-${app.status}">${app.status}</span>
            </div>
            <div class="status-card-body">
                <div class="info-row">
                    <span class="info-label">Aadhaar</span>
                    <span class="info-value">${maskAadhaar(app.aadhaar)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">PAN</span>
                    <span class="info-value">${app.pan}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email</span>
                    <span class="info-value">${truncateString(app.email, 25)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Document</span>
                    <span class="info-value">${app.hasImage || (app.imageId && imageStore[app.imageId]) ? '📸 Uploaded' : '❌ No'}</span>
                </div>
                ${app.status === 'pending' ? `
                <div class="info-row queue-info">
                    <span class="info-label">Queue</span>
                    <span class="info-value">Position #${app.queuePosition || 'N/A'}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `}).join('');
}

function truncateString(str, maxLength) {
    if (!str) return '-';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
}

function filterStatusCards(status) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const container = document.getElementById('allApplications');
    let filtered = allApps;
    
    if (status !== 'all') {
        filtered = allApps.filter(app => app.status === status);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>No ${status} applications found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.slice(0, 12).map(app => `
        <div class="status-card ${app.status}" onclick="viewDetails('${app.id}')">
            <div class="status-card-header">
                <div>
                    <div class="status-card-name">${app.fullName}</div>
                    <div class="status-card-date">${timeAgo(app.submittedAt)}</div>
                </div>
                <span class="badge badge-${app.status}">${app.status}</span>
            </div>
            <div class="status-card-body">
                <div class="info-row">
                    <span class="info-label">Aadhaar</span>
                    <span class="info-value">${maskAadhaar(app.aadhaar)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">PAN</span>
                    <span class="info-value">${app.pan}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email</span>
                    <span class="info-value">${truncateString(app.email, 25)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Document</span>
                    <span class="info-value">${app.hasImage || (app.imageId && imageStore[app.imageId]) ? '📸 Uploaded' : '❌ No'}</span>
                </div>
                ${app.status === 'pending' ? `
                <div class="info-row queue-info">
                    <span class="info-label">Queue</span>
                    <span class="info-value">Position #${app.queuePosition || 'N/A'}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// ==================== ADMIN TABLE ====================
function renderAdminTable() {
    const tbody = document.getElementById('adminTableBody');
    const empty = document.getElementById('emptyTable');
    const pagination = document.getElementById('tablePagination');
    
    if (!tbody) return;
    
    let appsToShow = filteredApps.length > 0 ? filteredApps : allApps;
    
    if (appsToShow.length === 0) {
        tbody.innerHTML = '';
        empty.classList.remove('hidden');
        if (pagination) pagination.innerHTML = '';
        return;
    }
    
    empty.classList.add('hidden');
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedApps = appsToShow.slice(start, end);
    
    tbody.innerHTML = paginatedApps.map((app, idx) => {
        const hasImage = app.hasImage || (app.imageId && imageStore[app.imageId]);
        const queueInfo = app.status === 'pending' && app.queuePosition ? 
            `<span style="color: var(--primary); font-size: 0.8rem;">Queue: #${app.queuePosition}</span>` : '';
        
        return `
        <tr>
            <td>${start + idx + 1}</td>
            <td>
                <strong>${app.fullName}</strong>
                <div style="font-size: 0.7rem; color: #6b7280; margin-top: 4px;">ID: ${app.id.slice(-8)}</div>
                ${queueInfo}
            </td>
            <td>${maskAadhaar(app.aadhaar)}</td>
            <td>${app.pan}</td>
            <td>
                <div>${truncateString(app.email, 20)}</div>
                <div style="font-size: 0.7rem; color: #6b7280;">${app.phone}</div>
            </td>
            <td>${formatDateShort(app.submittedAt)}</td>
            <td><span class="badge badge-${app.status}">${app.status}</span></td>
            <td class="actions-cell">
                <button class="btn-view" onclick="viewDetails('${app.id}')" title="View Details">👁️</button>
                <button class="btn-approve" onclick="updateStatus('${app.id}','approved')" ${app.status === 'approved' ? 'disabled' : ''} title="Approve">✓</button>
                <button class="btn-reject" onclick="updateStatus('${app.id}','rejected')" ${app.status === 'rejected' ? 'disabled' : ''} title="Reject">✗</button>
                <button class="btn-del" onclick="deleteApp('${app.id}')" title="Delete">🗑️</button>
                ${hasImage ? '<span style="color: #10b981;" title="Document Uploaded">📸</span>' : ''}
            </td>
        </tr>
    `}).join('');
    
    renderPagination(appsToShow.length);
}

function formatDateShort(iso) {
    if (!iso) return '-';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return iso;
    }
}

function renderPagination(totalItems) {
    const pagination = document.getElementById('tablePagination');
    if (!pagination) return;
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Previous button
    html += `<button class="pagination-btn" onclick="changePage(-1)" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += '<span class="pagination-ellipsis">...</span>';
        }
    }
    
    // Next button
    html += `<button class="pagination-btn" onclick="changePage(1)" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;
    
    pagination.innerHTML = html;
}

function changePage(delta) {
    const totalPages = Math.ceil((filteredApps.length > 0 ? filteredApps.length : allApps.length) / itemsPerPage);
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= totalPages) {
        goToPage(newPage);
    }
}

function goToPage(page) {
    currentPage = page;
    renderAdminTable();
}

function filterApplications() {
    const search = document.getElementById('searchInput').value.toLowerCase().trim();
    const statusVal = document.getElementById('statusFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    let results = allApps;
    
    if (search) {
        results = results.filter(a =>
            a.fullName.toLowerCase().includes(search) ||
            a.aadhaar.includes(search) ||
            a.pan.toLowerCase().includes(search) ||
            a.email.toLowerCase().includes(search) ||
            a.id.toLowerCase().includes(search) ||
            (a.rejectionReason && a.rejectionReason.toLowerCase().includes(search))
        );
    }
    
    if (statusVal !== 'all') {
        results = results.filter(a => a.status === statusVal);
    }
    
    if (dateFilter !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        results = results.filter(a => {
            const appDate = new Date(a.submittedAt);
            switch(dateFilter) {
                case 'today':
                    return appDate >= today;
                case 'week':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return appDate >= weekAgo;
                case 'month':
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return appDate >= monthAgo;
                default:
                    return true;
            }
        });
    }
    
    filteredApps = results;
    currentPage = 1;
    renderAdminTable();
}

function updateStatus(id, status) {
    const app = allApps.find(a => a.id === id);
    if (!app) return;
    
    const oldStatus = app.status;
    
    // If it was pending, remove from queue
    if (app.status === 'pending') {
        removeFromQueue(id);
    }
    
    if (status === 'rejected') {
        const reason = prompt('Please enter rejection reason:', 'Document verification failed');
        if (reason === null) return;
        app.rejectionReason = reason || 'Document verification failed';
    } else {
        app.rejectionReason = null;
    }
    
    app.status = status;
    app.lastUpdated = new Date().toISOString();
    
    if (status !== 'pending') {
        app.processingEndTime = new Date().toISOString();
        if (!app.processingStartTime) {
            app.processingStartTime = new Date().toISOString();
        }
    }
    
    if (!app.history) app.history = [];
    app.history.push({
        status,
        timestamp: new Date().toISOString(),
        note: status === 'rejected' ? `Rejected: ${app.rejectionReason}` : `Status changed from ${oldStatus} to ${status} by Admin`
    });
    
    saveData();
    filterApplications();
    renderStatusCards();
    updateAllStats();
    updateQueueDisplay();
    showToast(`Application ${status} successfully`, 'success');
}

function deleteApp(id) {
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) return;
    
    // Remove from queue if pending
    removeFromQueue(id);
    
    // Remove image if exists
    const app = allApps.find(a => a.id === id);
    if (app && app.imageId && imageStore[app.imageId]) {
        delete imageStore[app.imageId];
    }
    
    allApps = allApps.filter(a => a.id !== id);
    filteredApps = filteredApps.filter(a => a.id !== id);
    saveData();
    renderAdminTable();
    renderStatusCards();
    updateAllStats();
    updateQueueDisplay();
    showToast('Application deleted successfully', 'success');
}

function clearAllData() {
    if (!confirm('⚠️ WARNING: This will permanently delete ALL KYC applications, images, and queue data. Continue?')) return;
    
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(IMAGE_STORAGE_KEY);
    localStorage.removeItem(QUEUE_KEY);
    allApps = [];
    filteredApps = [];
    imageStore = {};
    verificationQueue = [];
    currentPage = 1;
    renderAdminTable();
    renderStatusCards();
    updateAllStats();
    updateQueueDisplay();
    showToast('All data cleared successfully', 'info');
}

// ==================== EXCEL EXPORT ====================
function exportToExcel() {
    if (allApps.length === 0) {
        showToast('No data to export', 'warning');
        return;
    }
    
    try {
        // Create CSV content
        let csv = "KYC APPLICATIONS REPORT WITH QUEUE MANAGEMENT\n";
        csv += "Generated on: " + new Date().toLocaleString() + "\n";
        csv += "Total Applications: " + allApps.length + "\n";
        csv += "Applications with Documents: " + allApps.filter(a => a.hasImage || (a.imageId && imageStore[a.imageId])).length + "\n";
        csv += "Queue Length: " + verificationQueue.length + "\n\n";
        
        // Headers
        csv += "Application ID,Full Name,Aadhaar Number,PAN Number,Email,Phone,Address,Status,Queue Position,Processing Start,Processing End,Rejection Reason,Document Uploaded,Submitted Date,Last Updated\n";
        
        // Data rows
        allApps.forEach(app => {
            const hasImage = app.hasImage || (app.imageId && imageStore[app.imageId]);
            const row = [
                app.id,
                app.fullName,
                app.aadhaar || '-',
                app.pan || '-',
                app.email || '-',
                app.phone || '-',
                (app.address || '-').replace(/,/g, ';'),
                app.status.toUpperCase(),
                app.queuePosition || '-',
                app.processingStartTime ? new Date(app.processingStartTime).toLocaleString() : '-',
                app.processingEndTime ? new Date(app.processingEndTime).toLocaleString() : '-',
                app.rejectionReason || '-',
                hasImage ? 'YES' : 'NO',
                app.submittedAt ? new Date(app.submittedAt).toLocaleString() : '-',
                app.lastUpdated ? new Date(app.lastUpdated).toLocaleString() : '-'
            ];
            
            // Handle fields with commas
            const csvRow = row.map(cell => {
                if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
                    return '"' + cell.replace(/"/g, '""') + '"';
                }
                return cell;
            }).join(',');
            
            csv += csvRow + '\n';
        });
        
        // Add queue summary
        csv += "\n\nQUEUE STATUS\n";
        csv += "Current Queue Length," + verificationQueue.length + "\n";
        csv += "Oldest in Queue," + (verificationQueue.length > 0 ? verificationQueue[0].addedAt : '-') + "\n";
        csv += "Estimated Total Wait Time," + (verificationQueue.length * 30) + " minutes\n\n";
        
        // Add queue list
        if (verificationQueue.length > 0) {
            csv += "CURRENT QUEUE (FIFO Order)\n";
            csv += "Position,Application ID,Added At,Estimated Wait\n";
            verificationQueue.forEach(item => {
                csv += `${item.position},${item.id},${new Date(item.addedAt).toLocaleString()},${item.estimatedWaitTime} min\n`;
            });
        }
        
        // Add summary
        csv += "\n\nSUMMARY STATISTICS\n";
        csv += "Total," + allApps.length + "\n";
        csv += "Approved," + allApps.filter(a => a.status === 'approved').length + "\n";
        csv += "Pending," + allApps.filter(a => a.status === 'pending').length + "\n";
        csv += "Rejected," + allApps.filter(a => a.status === 'rejected').length + "\n";
        csv += "With Documents," + allApps.filter(a => a.hasImage || (a.imageId && imageStore[a.imageId])).length + "\n";
        
        // Add rejection reasons analysis
        const rejected = allApps.filter(a => a.rejectionReason);
        if (rejected.length > 0) {
            csv += "\n\nREJECTION REASONS ANALYSIS\n";
            csv += "Reason,Count\n";
            
            const reasons = {};
            rejected.forEach(a => {
                reasons[a.rejectionReason] = (reasons[a.rejectionReason] || 0) + 1;
            });
            
            Object.entries(reasons).forEach(([reason, count]) => {
                csv += `"${reason}",${count}\n`;
            });
        }
        
        // Create and download file
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'kyc_applications_queue_' + new Date().toISOString().slice(0,10) + '.xls';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast(`✅ Exported ${allApps.length} applications with queue data`, 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Error exporting data', 'error');
    }
}

// ==================== FORM HANDLING ====================
function initForm() {
    const form = document.getElementById('kycForm');
    if (!form) return;

    // Real-time validation
    form.querySelectorAll('input, textarea, select').forEach(field => {
        field.addEventListener('input', () => {
            validateField(field.id);
            updateFormProgress();
        });
        field.addEventListener('blur', () => validateField(field.id));
    });

    form.addEventListener('submit', handleFormSubmit);

    // Input formatting
    document.getElementById('pan').addEventListener('input', function() {
        this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });

    document.getElementById('aadhaar').addEventListener('input', function() {
        let value = this.value.replace(/\D/g, '');
        if (value.length > 12) value = value.slice(0, 12);
        
        // Format as XXXX XXXX XXXX
        if (value.length > 8) {
            value = value.slice(0, 4) + ' ' + value.slice(4, 8) + ' ' + value.slice(8);
        } else if (value.length > 4) {
            value = value.slice(0, 4) + ' ' + value.slice(4);
        }
        this.value = value;
    });

    document.getElementById('phone').addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').slice(0, 10);
    });
}

function updateFormProgress() {
    const form = document.getElementById('kycForm');
    const fields = form.querySelectorAll('input:not([type="checkbox"]), textarea');
    const requiredFields = Array.from(fields).filter(f => f.id !== 'termsAgree' && f.required !== false);
    
    const filledFields = requiredFields.filter(f => f.value.trim() !== '').length;
    const progress = requiredFields.length > 0 ? (filledFields / requiredFields.length) * 100 : 0;
    
    const progressBar = document.getElementById('formProgress');
    if (progressBar) {
        progressBar.style.width = progress + '%';
    }
}

function validateField(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return true;
    
    const value = field.value.trim();
    clearError(fieldId);
    
    switch(fieldId) {
        case 'fullName':
            if (value.length < 3) {
                showError('fullName', 'Name must be at least 3 characters');
                return false;
            }
            if (!/^[a-zA-Z\s]+$/.test(value)) {
                showError('fullName', 'Name can only contain letters and spaces');
                return false;
            }
            break;
            
        case 'dob':
            if (!value) {
                showError('dob', 'Date of birth is required');
                return false;
            }
            const age = calculateAge(new Date(value));
            if (age < 18) {
                showError('dob', 'You must be at least 18 years old');
                return false;
            }
            if (age > 120) {
                showError('dob', 'Please enter a valid date of birth');
                return false;
            }
            break;
            
        case 'aadhaar':
            const aadhaar = value.replace(/\s/g, '');
            if (!/^\d{12}$/.test(aadhaar)) {
                showError('aadhaar', 'Aadhaar must be exactly 12 digits');
                return false;
            }
            // Check for duplicate
            const duplicate = allApps.find(a => a.aadhaar === aadhaar);
            if (duplicate) {
                showError('aadhaar', 'An application with this Aadhaar already exists');
                return false;
            }
            break;
            
        case 'pan':
            if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) {
                showError('pan', 'PAN must be in format ABCDE1234F');
                return false;
            }
            break;
            
        case 'email':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                showError('email', 'Enter a valid email address');
                return false;
            }
            break;
            
        case 'phone':
            if (!/^\d{10}$/.test(value)) {
                showError('phone', 'Phone must be exactly 10 digits');
                return false;
            }
            break;
            
        case 'address':
            if (value.length < 10) {
                showError('address', 'Address must be at least 10 characters');
                return false;
            }
            break;
    }
    
    return true;
}

function calculateAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validate all fields
    const fields = ['fullName', 'dob', 'aadhaar', 'pan', 'email', 'phone', 'address'];
    let isValid = fields.every(validateField);
    
    if (!document.getElementById('termsAgree').checked) {
        document.getElementById('err-terms').textContent = 'You must agree to the terms';
        isValid = false;
    }
    
    if (!imageBase64) {
        showError('idProof', 'Please upload an ID proof');
        isValid = false;
    }
    
    if (!isValid) {
        showToast('Please fix all errors before submitting', 'error');
        return;
    }
    
    // Create new application
    const id = generateId();
    const now = new Date().toISOString();
    
    // Calculate queue position
    const queuePosition = verificationQueue.length + 1;
    
    const app = {
        id: id,
        fullName: document.getElementById('fullName').value.trim(),
        dob: document.getElementById('dob').value,
        aadhaar: document.getElementById('aadhaar').value.replace(/\s/g, ''),
        pan: document.getElementById('pan').value.toUpperCase(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value.trim(),
        hasImage: true,
        imageId: id,
        status: 'pending',
        queuePosition: queuePosition,
        processingStartTime: null,
        processingEndTime: null,
        submittedAt: now,
        lastUpdated: now,
        rejectionReason: null,
        history: [{
            status: 'pending',
            timestamp: now,
            note: `Application submitted and added to verification queue at position ${queuePosition}`
        }],
        documents: [{
            type: 'idProof',
            uploadedAt: now,
            fileName: document.getElementById('idProof').files[0]?.name || 'document.jpg',
            fileSize: formatFileSize(document.getElementById('idProof').files[0]?.size || 0)
        }]
    };
    
    // Store image
    imageStore[id] = imageBase64;
    
    // Add to queue
    verificationQueue.push({
        id: id,
        position: queuePosition,
        addedAt: now,
        estimatedWaitTime: queuePosition * 30
    });
    
    allApps.push(app);
    saveQueue();
    saveData();
    
    // Show success message
    document.getElementById('submitSuccess').classList.remove('hidden');
    document.getElementById('submitSuccess').scrollIntoView({ behavior: 'smooth' });
    
    resetForm();
    updateAllStats();
    updateQueueDisplay();
    showToast(`Application submitted successfully! Queue position: #${queuePosition}`, 'success');
}

function resetForm() {
    document.getElementById('kycForm').reset();
    clearAllErrors();
    removeImage();
    document.getElementById('formProgress').style.width = '0%';
    // Don't hide success banner automatically, let user close it
}

function clearAllErrors() {
    ['fullName','dob','aadhaar','pan','email','phone','address','idProof','terms'].forEach(id => {
        clearError(id);
    });
}

function showError(fieldId, message) {
    const errorEl = document.getElementById('err-' + fieldId);
    const input = document.getElementById(fieldId);
    if (errorEl) errorEl.textContent = message;
    if (input) input.classList.add('invalid');
}

function clearError(fieldId) {
    const errorEl = document.getElementById('err-' + fieldId);
    const input = document.getElementById(fieldId);
    if (errorEl) errorEl.textContent = '';
    if (input) input.classList.remove('invalid');
}

// ==================== FILE UPLOAD ====================
function initUploadArea() {
    const area = document.getElementById('uploadArea');
    const fileInput = document.getElementById('idProof');
    
    if (!area || !fileInput) return;

    area.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        area.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        area.addEventListener(eventName, () => {
            area.classList.add('dragover');
            area.style.borderColor = 'var(--primary)';
            area.style.background = 'var(--primary-light)';
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        area.addEventListener(eventName, () => {
            area.classList.remove('dragover');
            area.style.borderColor = '';
            area.style.background = '';
        });
    });

    area.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file) handleImageFile(file);
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleImageFile(file);
    });
}

function handleImageFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
        showError('idProof', 'Please upload JPG, PNG, or GIF files only');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showError('idProof', 'File size must be less than 10MB');
        return;
    }

    clearError('idProof');

    const reader = new FileReader();
    reader.onload = function(e) {
        imageBase64 = e.target.result;
        
        const preview = document.getElementById('imagePreview');
        const previewArea = document.getElementById('uploadPreviewArea');
        const placeholder = document.getElementById('uploadPlaceholder');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        
        preview.src = imageBase64;
        previewArea.classList.remove('hidden');
        placeholder.classList.add('hidden');
        
        if (fileName) fileName.textContent = file.name;
        if (fileSize) fileSize.textContent = formatFileSize(file.size);
        
        showToast('File uploaded successfully', 'success');
    };
    reader.readAsDataURL(file);
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function removeImage() {
    imageBase64 = null;
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('uploadPreviewArea').classList.add('hidden');
    document.getElementById('uploadPlaceholder').classList.remove('hidden');
    document.getElementById('idProof').value = '';
}

// ==================== MODAL WITH IMAGE DISPLAY ====================
function viewDetails(id) {
    const app = allApps.find(a => a.id === id);
    if (!app) return;
    
    const modal = document.getElementById('detailModal');
    const body = document.getElementById('modalBody');
    
    // Get image if exists
    const imageData = app.imageId && imageStore[app.imageId] ? imageStore[app.imageId] : null;
    
    let historyHtml = '';
    if (app.history && app.history.length > 0) {
        historyHtml = '<div style="margin-top: 1.5rem; border-top: 2px solid var(--gray-200); padding-top: 1rem;">';
        historyHtml += '<h4 style="margin-bottom: 1rem; color: var(--gray-700);">Application History</h4>';
        app.history.slice().reverse().forEach((h, index) => {
            const statusColor = h.status === 'approved' ? '#10b981' : h.status === 'rejected' ? '#ef4444' : '#f59e0b';
            historyHtml += `
                <div style="margin-bottom: 0.75rem; padding: 0.75rem; background: var(--gray-50); border-radius: var(--radius); border-left: 4px solid ${statusColor};">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <strong style="color: ${statusColor};">${h.status.toUpperCase()}</strong>
                        <small style="color: var(--gray-500);">${formatDate(h.timestamp)}</small>
                    </div>
                    <p style="font-size: 0.9rem; color: var(--gray-700);">${h.note || ''}</p>
                </div>
            `;
        });
        historyHtml += '</div>';
    }
    
    let documentsHtml = '';
    if (app.documents && app.documents.length > 0) {
        documentsHtml = '<div style="margin-top: 1rem;">';
        documentsHtml += '<h4 style="margin-bottom: 0.5rem; color: var(--gray-700);">Documents</h4>';
        app.documents.forEach(doc => {
            documentsHtml += `
                <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--gray-50); border-radius: var(--radius); margin-bottom: 0.5rem;">
                    <span>📄 ${doc.fileName}</span>
                    <span style="color: var(--gray-500);">${doc.fileSize || 'Unknown'}</span>
                </div>
            `;
        });
        documentsHtml += '</div>';
    }
    
    let queueInfoHtml = '';
    if (app.status === 'pending' && app.queuePosition) {
        queueInfoHtml = `
            <div style="background: var(--primary-light); padding: 1rem; border-radius: var(--radius); margin-bottom: 1rem; border-left: 4px solid var(--primary);">
                <strong style="color: var(--primary); display: block; margin-bottom: 0.25rem;">Queue Information</strong>
                <p style="color: var(--gray-900);">Position: #${app.queuePosition} | Estimated Wait: ${app.queuePosition * 30} minutes</p>
                <p style="color: var(--gray-600); font-size: 0.9rem;">Added to queue: ${timeAgo(app.submittedAt)}</p>
            </div>
        `;
    }
    
    body.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3 style="color: var(--gray-900);">Application Details</h3>
            <span class="badge badge-${app.status}">${app.status}</span>
        </div>
        
        ${queueInfoHtml}
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
            <div class="modal-field">
                <span class="modal-label">ID:</span>
                <span class="modal-value">${app.id}</span>
            </div>
            <div class="modal-field">
                <span class="modal-label">Name:</span>
                <span class="modal-value">${app.fullName}</span>
            </div>
            <div class="modal-field">
                <span class="modal-label">DOB:</span>
                <span class="modal-value">${formatDate(app.dob)}</span>
            </div>
            <div class="modal-field">
                <span class="modal-label">Aadhaar:</span>
                <span class="modal-value">${app.aadhaar}</span>
            </div>
            <div class="modal-field">
                <span class="modal-label">PAN:</span>
                <span class="modal-value">${app.pan}</span>
            </div>
            <div class="modal-field">
                <span class="modal-label">Email:</span>
                <span class="modal-value">${app.email}</span>
            </div>
            <div class="modal-field">
                <span class="modal-label">Phone:</span>
                <span class="modal-value">${app.phone}</span>
            </div>
            <div class="modal-field">
                <span class="modal-label">Submitted:</span>
                <span class="modal-value">${formatDate(app.submittedAt)}</span>
            </div>
        </div>
        
        <div class="modal-field" style="margin-bottom: 1rem;">
            <span class="modal-label">Address:</span>
            <span class="modal-value">${app.address || 'Not provided'}</span>
        </div>
        
        ${app.rejectionReason ? `
        <div style="background: var(--danger-light); padding: 1rem; border-radius: var(--radius); margin-bottom: 1rem; border-left: 4px solid var(--danger);">
            <strong style="color: var(--danger); display: block; margin-bottom: 0.25rem;">Rejection Reason</strong>
            <p style="color: var(--gray-900);">${app.rejectionReason}</p>
        </div>
        ` : ''}
        
        ${imageData ? `
        <div style="margin: 1.5rem 0;">
            <h4 style="margin-bottom: 1rem; color: var(--gray-700);">Uploaded Document</h4>
            <div style="border: 2px solid var(--primary-light); border-radius: var(--radius-lg); padding: 1rem; background: var(--gray-50);">
                <img src="${imageData}" style="max-width: 100%; max-height: 400px; border-radius: var(--radius); margin: 0 auto; display: block; box-shadow: var(--shadow);" alt="ID Proof" />
                <p style="text-align: center; margin-top: 0.5rem; color: var(--gray-500); font-size: 0.9rem;">ID Proof Document</p>
            </div>
        </div>
        ` : app.hasImage ? `
        <div style="margin: 1.5rem 0; padding: 2rem; background: var(--gray-50); border-radius: var(--radius); text-align: center; border: 2px dashed var(--gray-300);">
            <span style="font-size: 3rem; display: block; margin-bottom: 0.5rem;">📸</span>
            <p style="color: var(--gray-600);">Document uploaded but preview not available</p>
        </div>
        ` : `
        <div style="margin: 1.5rem 0; padding: 2rem; background: var(--gray-50); border-radius: var(--radius); text-align: center; border: 2px dashed var(--gray-300);">
            <span style="font-size: 3rem; display: block; margin-bottom: 0.5rem;">❌</span>
            <p style="color: var(--gray-600);">No document uploaded</p>
        </div>
        `}
        
        ${documentsHtml}
        ${historyHtml}
    `;
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('detailModal').classList.add('hidden');
}

function printApplication() {
    const modalBody = document.getElementById('modalBody').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>KYC Application Details</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 30px; max-width: 800px; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .field { margin-bottom: 15px; }
                    .label { font-weight: bold; color: #666; display: inline-block; width: 120px; }
                    .value { color: #333; }
                    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
                    .badge-pending { background: #fef3c7; color: #92400e; }
                    .badge-approved { background: #d1fae5; color: #065f46; }
                    .badge-rejected { background: #fee2e2; color: #991b1b; }
                    img { max-width: 100%; height: auto; border: 1px solid #ddd; margin: 20px 0; }
                    .history-item { margin-bottom: 10px; padding: 10px; background: #f9fafb; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>KYC Application Details</h1>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                </div>
                ${modalBody}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// ==================== ANALYTICS ====================
function initCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded');
        return;
    }
    
    // Trend Chart
    const trendCtx = document.getElementById('trendCanvas')?.getContext('2d');
    if (trendCtx) {
        charts.trend = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: getLast7Days(),
                datasets: [{
                    label: 'Applications',
                    data: getTrendData(),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#4f46e5',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    }
                }
            }
        });
    }
    
    // Pie Chart
    const pieCtx = document.getElementById('pieCanvas')?.getContext('2d');
    if (pieCtx) {
        const statusCounts = getStatusCounts();
        charts.pie = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: ['Pending', 'Approved', 'Rejected'],
                datasets: [{
                    data: [statusCounts.pending, statusCounts.approved, statusCounts.rejected],
                    backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                },
                cutout: '60%'
            }
        });
    }
}

function updateAnalytics() {
    if (charts.trend) {
        charts.trend.data.datasets[0].data = getTrendData();
        charts.trend.update();
    }
    
    if (charts.pie) {
        const statusCounts = getStatusCounts();
        charts.pie.data.datasets[0].data = [statusCounts.pending, statusCounts.approved, statusCounts.rejected];
        charts.pie.update();
    }
    
    updateProcessingMetrics();
    updateHeatmap();
    updateQueueAnalytics();
}

function updateQueueAnalytics() {
    const stats = getQueueStats();
    
    // Update queue metrics in analytics if elements exist
    const queueLengthEl = document.getElementById('queueLength');
    if (queueLengthEl) queueLengthEl.textContent = stats.queueLength;
    
    const avgWaitEl = document.getElementById('avgWaitTime');
    if (avgWaitEl) avgWaitEl.textContent = stats.estimatedWaitTime + ' min';
    
    const avgProcessEl = document.getElementById('avgProcessTime');
    if (avgProcessEl) avgProcessEl.textContent = stats.averageProcessingTime + ' min';
}

function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));
    }
    return days;
}

function getTrendData() {
    const data = new Array(7).fill(0);
    allApps.forEach(app => {
        const date = new Date(app.submittedAt);
        const today = new Date();
        const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
            data[6 - diffDays]++;
        }
    });
    return data;
}

function getStatusCounts() {
    return {
        pending: allApps.filter(a => a.status === 'pending').length,
        approved: allApps.filter(a => a.status === 'approved').length,
        rejected: allApps.filter(a => a.status === 'rejected').length
    };
}

function updateProcessingMetrics() {
    const processedApps = allApps.filter(a => a.status !== 'pending');
    if (processedApps.length === 0) return;
    
    const times = processedApps.map(app => {
        const submitted = new Date(app.submittedAt);
        const updated = new Date(app.lastUpdated || app.submittedAt);
        return (updated - submitted) / (1000 * 60 * 60); // hours
    });
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const fastest = Math.min(...times);
    const slowest = Math.max(...times);
    
    document.getElementById('avgTime').textContent = avg.toFixed(1) + ' hrs';
    document.getElementById('fastestTime').textContent = fastest.toFixed(1) + ' hrs';
    document.getElementById('slowestTime').textContent = slowest.toFixed(1) + ' hrs';
}

function updateHeatmap() {
    const heatmap = document.getElementById('activityHeatmap');
    if (!heatmap) return;
    
    const days = 28; // 4 weeks
    let html = '';
    
    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const count = allApps.filter(app => 
            app.submittedAt.startsWith(dateStr)
        ).length;
        
        const level = Math.min(Math.floor(count / 2) + 1, 4);
        html += `<div class="heatmap-cell" data-level="${level}" title="${date.toLocaleDateString('en-IN')}: ${count} applications"></div>`;
    }
    
    heatmap.innerHTML = html;
}

function updateRecentApplications() {
    const container = document.getElementById('recentApplications');
    if (!container) return;
    
    const recent = allApps.slice(0, 5);
    
    if (recent.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 1rem;">No recent applications</p>';
        return;
    }
    
    container.innerHTML = recent.map(app => `
        <div onclick="viewDetails('${app.id}')" style="cursor: pointer; padding: 0.75rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 1rem; transition: background 0.2s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='transparent'">
            <div style="font-size: 1.5rem; width: 40px; text-align: center;">
                ${app.status === 'approved' ? '✅' : app.status === 'rejected' ? '❌' : '⏳'}
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--gray-900);">${app.fullName}</div>
                <div style="font-size: 0.8rem; color: #6b7280; display: flex; gap: 1rem;">
                    <span>${app.id.slice(0, 10)}...</span>
                    <span>•</span>
                    <span>${timeAgo(app.submittedAt)}</span>
                </div>
            </div>
            <span class="badge badge-${app.status}" style="font-size: 0.7rem;">${app.status}</span>
        </div>
    `).join('');
}

// ==================== UTILITIES ====================
function formatDate(iso) {
    if (!iso) return '-';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return iso;
    }
}

function timeAgo(iso) {
    const date = new Date(iso);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' days ago';
    return formatDate(iso);
}

function maskAadhaar(num) {
    if (!num) return '';
    const str = num.toString().replace(/\s/g, '');
    if (str.length < 4) return 'XXXX XXXX ' + str;
    return 'XXXX XXXX ' + str.slice(-4);
}

function showToast(message, type = 'info', duration = 3000) {
    // Simple alert for now (can be enhanced with proper toast)
    if (type === 'success') {
        console.log('✅', message);
        alert('✅ ' + message);
    } else if (type === 'error') {
        console.log('❌', message);
        alert('❌ ' + message);
    } else if (type === 'warning') {
        console.log('⚠️', message);
        alert('⚠️ ' + message);
    } else {
        console.log('ℹ️', message);
        alert('ℹ️ ' + message);
    }
}

// ==================== SETUP EVENT LISTENERS - FIXED VERSION ====================
function setupEventListeners() {
    console.log('Setting up event listeners...'); // Debug log
    
    // Search with debounce
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(filterApplications, 300);
        });
        console.log('✓ Search input listener attached');
    }
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterApplications);
        console.log('✓ Status filter listener attached');
    }
    
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', filterApplications);
        console.log('✓ Date filter listener attached');
    }
    
    // Escape key for modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
    
    // Handle hash navigation on load
    if (window.location.hash) {
        const section = window.location.hash.slice(1);
        if (document.getElementById(section)) {
            setTimeout(() => navigate(section, false), 100);
        }
    }
    
    // ===== FIXED: Queue control buttons with direct attachment =====
    console.log('Attempting to attach queue button listeners...');
    
    // Method 1: Direct click handler for processNextBtn
    const processNextBtn = document.getElementById('processNextBtn');
    if (processNextBtn) {
        // Remove any existing listeners by cloning
        const newBtn = processNextBtn.cloneNode(true);
        processNextBtn.parentNode.replaceChild(newBtn, processNextBtn);
        
        // Attach new listener
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Process Next button clicked!'); // Debug log
            processNextInQueue();
        });
        console.log('✓ Process Next button listener attached via method 1');
    } else {
        console.error('❌ Process Next button not found!');
    }
    
    // Method 2: Also attach using onclick property as backup
    const processNextBtnBackup = document.getElementById('processNextBtn');
    if (processNextBtnBackup) {
        processNextBtnBackup.onclick = function(e) {
            e.preventDefault();
            console.log('Process Next button clicked (backup method)!');
            processNextInQueue();
            return false;
        };
        console.log('✓ Process Next button backup listener attached');
    }
    
    // Process Batch button
    const processBatchBtn = document.getElementById('processBatchBtn');
    if (processBatchBtn) {
        const newBatchBtn = processBatchBtn.cloneNode(true);
        processBatchBtn.parentNode.replaceChild(newBatchBtn, processBatchBtn);
        
        newBatchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Process Batch button clicked!');
            processMultipleFromQueue(5);
        });
        console.log('✓ Process Batch button listener attached');
    } else {
        console.error('❌ Process Batch button not found!');
    }
    
    // Refresh Queue button
    const refreshQueueBtn = document.getElementById('refreshQueueBtn');
    if (refreshQueueBtn) {
        const newRefreshBtn = refreshQueueBtn.cloneNode(true);
        refreshQueueBtn.parentNode.replaceChild(newRefreshBtn, refreshQueueBtn);
        
        newRefreshBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Refresh Queue button clicked!');
            updateQueueDisplay();
            showToast('Queue refreshed', 'info');
        });
        console.log('✓ Refresh Queue button listener attached');
    } else {
        console.error('❌ Refresh Queue button not found!');
    }
    
    // Also add direct onclick attributes as absolute backup
    document.querySelectorAll('#processNextBtn, #processBatchBtn, #refreshQueueBtn').forEach(btn => {
        if (btn.id === 'processNextBtn') {
            btn.setAttribute('onclick', 'processNextInQueue(); return false;');
        } else if (btn.id === 'processBatchBtn') {
            btn.setAttribute('onclick', 'processMultipleFromQueue(5); return false;');
        } else if (btn.id === 'refreshQueueBtn') {
            btn.setAttribute('onclick', 'updateQueueDisplay(); showToast(\'Queue refreshed\', \'info\'); return false;');
        }
    });
    
    console.log('All event listeners setup complete!');
}

// ==================== FIXED: Make sure functions are globally available ====================
// Ensure all queue functions are available globally
window.processNextInQueue = function() {
    console.log('processNextInQueue called directly');
    if (verificationQueue.length === 0) {
        showToast('No pending applications in queue', 'info');
        return null;
    }
    
    const nextItem = verificationQueue[0];
    const app = allApps.find(a => a.id === nextItem.id);
    
    if (!app) {
        verificationQueue.shift();
        saveQueue();
        return processNextInQueue();
    }
    
    showProcessingOptions(app.id);
};

window.processMultipleFromQueue = function(count) {
    console.log('processMultipleFromQueue called with count:', count);
    if (verificationQueue.length === 0) {
        showToast('No pending applications in queue', 'info');
        return;
    }
    
    const toProcess = Math.min(count, verificationQueue.length);
    
    if (toProcess === 0) return;
    
    const nextItem = verificationQueue[0];
    showProcessingOptions(nextItem.id);
    showToast(`Processing ${toProcess} applications. Please handle each one.`, 'info');
};

window.processWithStatus = function(appId, status) {
    console.log('processWithStatus called:', appId, status);
    const app = allApps.find(a => a.id === appId);
    if (!app) return;
    
    // Remove from queue
    removeFromQueue(appId);
    
    if (!app.processingStartTime) {
        app.processingStartTime = new Date().toISOString();
    }
    
    if (status === 'rejected') {
        const reason = prompt('Please enter rejection reason:', 'Document verification failed');
        if (reason === null) {
            addToQueue(appId);
            closeProcessingModal();
            return;
        }
        app.rejectionReason = reason || 'Document verification failed';
        app.status = 'rejected';
    } else if (status === 'approved') {
        app.rejectionReason = null;
        app.status = 'approved';
    } else {
        addToQueue(appId);
        closeProcessingModal();
        showToast('Application kept in queue', 'info');
        updateQueueDisplay();
        return;
    }
    
    app.lastUpdated = new Date().toISOString();
    app.processingEndTime = new Date().toISOString();
    
    if (!app.history) app.history = [];
    app.history.push({
        status: 'processing',
        timestamp: app.processingStartTime,
        note: 'Processing started from queue'
    });
    app.history.push({
        status: status,
        timestamp: new Date().toISOString(),
        note: status === 'approved' ? 'Application approved after queue processing' : `Rejected: ${app.rejectionReason}`
    });
    
    verificationQueue.forEach((item, idx) => {
        item.position = idx + 1;
        item.estimatedWaitTime = (idx + 1) * 30;
    });
    
    updateQueuePositions();
    saveQueue();
    saveData();
    
    filterApplications();
    renderStatusCards();
    updateAllStats();
    updateQueueDisplay();
    closeProcessingModal();
    
    showToast(`Application ${app.id} processed (${status})`, 'success');
    
    return app;
};

window.showProcessingOptions = function(appId) {
    console.log('showProcessingOptions called for:', appId);
    const app = allApps.find(a => a.id === appId);
    if (!app) return;
    
    // Remove any existing modal
    const existingModal = document.getElementById('processingModal');
    if (existingModal) existingModal.remove();
    
    const modalHtml = `
        <div id="processingModal" class="modal-overlay" style="z-index: 9999;">
            <div class="modal glass-effect" style="width: 450px; max-width: 90%;">
                <div class="modal-header">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem;">
                        <span>🔄</span> Process Application
                    </h3>
                    <button class="modal-close" onclick="closeProcessingModal()">✕</button>
                </div>
                <div class="modal-body">
                    <div style="background: var(--primary-light); padding: 1rem; border-radius: var(--radius); margin-bottom: 1.5rem;">
                        <p style="font-weight: 600; margin-bottom: 0.5rem;">${app.fullName}</p>
                        <p style="color: var(--gray-600); font-size: 0.9rem;">ID: ${app.id}</p>
                        <p style="color: var(--gray-600); font-size: 0.9rem;">Queue Position: #${app.queuePosition}</p>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <button class="btn btn-primary" onclick="processWithStatus('${app.id}', 'approved')" style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #10b981, #059669);">
                            ✅ Approve Application
                        </button>
                        
                        <button class="btn btn-danger" onclick="processWithStatus('${app.id}', 'rejected')" style="width: 100%; padding: 1rem;">
                            ❌ Reject Application
                        </button>
                        
                        <button class="btn btn-outline" onclick="processWithStatus('${app.id}', 'pending')" style="width: 100%; padding: 1rem;">
                            ⏳ Keep in Queue (Move to End)
                        </button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-ghost" onclick="closeProcessingModal()">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstChild);
    
    // Also attach click handler to close button
    const closeBtn = document.querySelector('#processingModal .modal-close');
    if (closeBtn) {
        closeBtn.onclick = closeProcessingModal;
    }
};

window.closeProcessingModal = function() {
    const modal = document.getElementById('processingModal');
    if (modal) {
        modal.remove();
    }
};

// ==================== UPDATE THE INIT FUNCTION ====================
function init() {
    console.log('🚀 Initializing KYC Management System v3.0 with FIFO Queue...');
    console.log('Developer: Advanced KYC System');
    console.log('Date:', new Date().toLocaleString());
    
    // Load from localStorage
    loadData();
    
    // Initialize queue
    initializeQueue();
    
    // If no apps exist or less than 50, initialize with sample data
    if (allApps.length < 50) {
        console.log('📊 Generating sample data with 50+ applications...');
        const sampleData = initializeSampleData();
        allApps = sampleData.apps;
        imageStore = sampleData.images;
        rebuildQueue();
        saveData();
        console.log(`✅ Sample data loaded: ${allApps.length} applications with images`);
    }
    
    // Initialize all components
    initNavigation();
    initForm();
    initUploadArea();
    updateAllStats();
    
    // Make sure DOM is fully loaded before setting up event listeners
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setupEventListeners();
            setupMobileMenu();
            updateQueueDisplay();
        });
    } else {
        // DOM already loaded
        setupEventListeners();
        setupMobileMenu();
        updateQueueDisplay();
    }
    
    // Initialize charts if Chart.js is available
    if (typeof Chart !== 'undefined') {
        initCharts();
    }
    
    // Start queue monitoring
    startQueueMonitoring();
    
    console.log('✅ System ready! Total applications:', allApps.length);
    console.log('📸 Images stored:', Object.keys(imageStore).length);
    console.log('🔄 Queue length:', verificationQueue.length);
}

// ==================== ALSO ADD DIRECT ONCLICK HANDLERS IN HTML ====================
// Note: In your index.html, make sure the buttons have onclick attributes as backup:
// <button class="btn btn-primary" id="processNextBtn" onclick="processNextInQueue()">
//     <span>▶️</span> Process Next
// </button>

// ==================== EXPOSE GLOBALLY ====================
window.navigate = navigate;
window.lookupStatus = lookupStatus;
window.switchLookupMode = switchLookupMode;
window.filterStatusCards = filterStatusCards;
window.updateStatus = updateStatus;
window.deleteApp = deleteApp;
window.viewDetails = viewDetails;
window.closeModal = closeModal;
window.printApplication = printApplication;
window.filterApplications = filterApplications;
window.clearAllData = clearAllData;
window.exportToExcel = exportToExcel;
window.resetForm = resetForm;
window.removeImage = removeImage;
window.goToPage = goToPage;
window.changePage = changePage;

// Queue management functions
window.processNextInQueue = processNextInQueue;
window.processMultipleFromQueue = processMultipleFromQueue;
window.processWithStatus = processWithStatus;
window.closeProcessingModal = closeProcessingModal;
window.getQueueStats = getQueueStats;
window.updateQueueDisplay = updateQueueD