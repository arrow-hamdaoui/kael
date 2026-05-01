// Kael Designer - Main Application Logic

document.addEventListener('DOMContentLoaded', () => {

    // Load custom portfolio cases from LocalStorage
    const portfolioGrid = document.getElementById('portfolio-grid');
    const viewMoreBtn = document.getElementById('view-more-btn');
    const viewMoreContainer = document.getElementById('view-more-container');
    const INITIAL_LIMIT = 6;

    if (portfolioGrid) {
        const customCases = JSON.parse(localStorage.getItem('kael_portfolio') || '[]');
        customCases.forEach(c => {
            const card = document.createElement('div');
            card.className = 'portfolio-card';
            card.setAttribute('data-category', c.category);
            const tagMap = {
                'crowns': 'Precision Case',
                'veneers': 'Smile Design',
                'all-on-x': 'Full Arch',
                'implant': 'Implant Prosthetics'
            };
            const catDisplay = {
                'crowns': 'Crowns & Bridges',
                'veneers': 'Veneers',
                'all-on-x': 'All-on-X',
                'implant': 'Implant'
            };
            card.innerHTML = `
                <div class="card-img-wrapper">
                    <span class="card-tag">${tagMap[c.category] || 'Precision Case'}</span>
                    <img src="${c.imageAfter || c.imageBefore || c.imageExocad || c.image}" alt="${c.title}">
                    <div class="card-overlay">
                        <div class="hover-stats">
                            <div class="stat-item"><span>Design</span><strong>3D</strong></div>
                            <div class="stat-item"><span>Quality</span><strong>HQ</strong></div>
                            <div class="stat-item"><span>Type</span><strong>Pro</strong></div>
                        </div>
                        <span class="view-btn"><i class="fa-solid fa-eye"></i> View Case Details</span>
                    </div>
                </div>
                <div class="card-content">
                    <span class="card-category">${catDisplay[c.category] || c.category}</span>
                    <h4 style="margin: 0.5rem 0; font-family: 'Outfit', sans-serif;">${c.title}</h4>
                    <p class="card-meta">${c.info}</p>
                </div>
            `;

            const viewBtn = card.querySelector('.view-btn');
            if (viewBtn) {
                viewBtn.addEventListener('click', () => {
                    openCaseModal(c);
                });
            }
            // Insert at the beginning so newer cases show first
            portfolioGrid.insertBefore(card, portfolioGrid.firstChild);
        });

        // Pagination Logic
        const allCards = Array.from(document.querySelectorAll('.portfolio-card'));

        function updatePortfolioDisplay(showAll = false) {
            allCards.forEach((card, index) => {
                if (showAll || index < INITIAL_LIMIT) {
                    card.style.display = 'block';
                    card.classList.remove('hidden-case');
                } else {
                    card.style.display = 'none';
                    card.classList.add('hidden-case');
                }
            });

            if (allCards.length > INITIAL_LIMIT && !showAll) {
                viewMoreContainer.style.display = 'block';
            } else {
                viewMoreContainer.style.display = 'none';
            }
        }

        updatePortfolioDisplay();

        if (viewMoreBtn) {
            viewMoreBtn.addEventListener('click', () => {
                updatePortfolioDisplay(true);
            });
        }

        // 1. Portfolio Filtering
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');

                if (filterValue === 'all') {
                    updatePortfolioDisplay();
                } else {
                    viewMoreContainer.style.display = 'none';
                    allCards.forEach(card => {
                        if (card.getAttribute('data-category') === filterValue) {
                            card.style.display = 'block';
                        } else {
                            card.style.display = 'none';
                        }
                    });
                }
            });
        });
    }

    // 2. Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                navbar.style.padding = '0.75rem 0';
            } else {
                navbar.style.boxShadow = 'none';
                navbar.style.padding = '1rem 0';
            }
        }
    });

    // 3. Smooth Scrolling for Navigation Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

});

// Global Modal Functions
function openLoginModal() {
    // If already authenticated, skip modal and go straight to admin
    if (localStorage.getItem('kael_admin_auth') === 'true') {
        window.location.href = 'admin.html';
        return;
    }
    const modal = document.getElementById('login-modal');
    modal.classList.add('active');
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    modal.classList.remove('active');
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('login-modal');
    if (event.target === modal) {
        closeLoginModal();
    }
}

function handleLogin() {
    const password = document.getElementById('login-password').value;
    const errorMsg = document.getElementById('login-error');

    if (password === 'kael722') {
        localStorage.setItem('kael_admin_auth', 'true');
        window.location.href = 'admin.html';
    } else {
        errorMsg.style.display = 'block';
    }
}

// Case Modal
function openCaseModal(caseData) {
    let modal = document.getElementById('full-case-modal');
    if (!modal) {
        // Create modal if it doesn't exist
        modal = document.createElement('div');
        modal.id = 'full-case-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    // Close modal when clicking outside
    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });

    const beforeImg = caseData.imageBefore ? `
        <div style="position: relative; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.05);">
            <div style="position: absolute; top: 15px; left: 15px; background: rgba(15, 23, 42, 0.8); color: white; padding: 6px 16px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.1);">Before</div>
            <img src="${caseData.imageBefore}" style="width:100%; height:100%; object-fit:cover; display:block;">
        </div>` : '';
    const afterImg = caseData.imageAfter ? `
        <div style="position: relative; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 209, 255, 0.2); border: 2px solid #00D1FF;">
            <div style="position: absolute; top: 15px; left: 15px; background: #00D1FF; color: #0f172a; padding: 6px 16px; border-radius: 20px; font-size: 0.8rem; font-weight: 800; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">After</div>
            <img src="${caseData.imageAfter}" style="width:100%; height:100%; object-fit:cover; display:block;">
        </div>` : '';
    const exocadImg = caseData.imageExocad ? `
        <div style="grid-column: 1 / -1; margin-top: 2rem; border-radius: 24px; overflow: hidden; background: #020617; position: relative; border: 1px solid rgba(0, 209, 255, 0.15); box-shadow: 0 20px 40px rgba(0,0,0,0.6); min-height: 200px;">
            <div style="position: absolute; top: 20px; left: 20px; background: rgba(255,255,255,0.05); color: #00D1FF; padding: 8px 20px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; backdrop-filter: blur(10px); z-index: 2; border: 1px solid rgba(0, 209, 255, 0.2);"><i class="fa-solid fa-cube"></i> Exocad CAD Design</div>
            <img src="${caseData.imageExocad}" style="width:100%; max-height:500px; object-fit:contain; display:block; opacity: 0.9;">
        </div>` : '';

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 1000px; width: 95%; max-height: 90vh; overflow-y: auto; padding: 0; border-radius: 28px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8); background: #0f172a;">
            
            <div style="position: sticky; top: 0; z-index: 10; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(16px); padding: 2rem 3rem; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span style="font-size: 0.8rem; font-weight: 800; color: #00D1FF; text-transform: uppercase; letter-spacing: 1.5px;">${caseData.category}</span>
                    <h3 style="margin: 0.4rem 0 0; font-size: 2rem; font-weight: 800; font-family: 'Outfit', sans-serif; color: #ffffff;">${caseData.title}</h3>
                </div>
                <button onclick="document.getElementById('full-case-modal').classList.remove('active')" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; width: 44px; height: 44px; cursor: pointer; color: #94a3b8; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; transition: all 0.3s;" onmouseover="this.style.background='#ef4444'; this.style.color='#fff'; this.style.borderColor='#ef4444';" onmouseout="this.style.background='rgba(255,255,255,0.05)'; this.style.color='#94a3b8'; this.style.borderColor='rgba(255,255,255,0.1)';"><i class="fa-solid fa-xmark"></i></button>
            </div>
            
            <div style="padding: 3rem;">
                <div style="background: rgba(255,255,255,0.02); padding: 2rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 3rem; border-left: 4px solid #00D1FF;">
                    <h4 style="margin: 0 0 0.8rem; font-size: 0.95rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;"><i class="fa-solid fa-list-check" style="color: #00D1FF;"></i> Clinical & Technical Details</h4>
                    <p style="margin: 0; font-size: 1.1rem; color: #e2e8f0; line-height: 1.7;">${caseData.info}</p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem;">
                    ${beforeImg}
                    ${afterImg}
                    ${exocadImg}
                </div>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

// ==========================================================================
// Smart Case Submission Tool Logic
// ==========================================================================

let currentStep = 1;
const totalSteps = 5;
let uploadedFiles = [];

function changeStep(direction) {
    // Validate current step before moving forward
    if (direction === 1 && !validateStep(currentStep)) {
        return;
    }

    // Hide current step
    document.getElementById(`step-${currentStep}`).classList.remove('active');

    // Update step counter
    currentStep += direction;

    // Show new step
    document.getElementById(`step-${currentStep}`).classList.add('active');

    // Update Sidebar Indicators
    updateStepIndicators();

    // Update Buttons
    updateNavigationButtons();

    // Populate review summary if we're on the final step
    if (currentStep === 5) {
        populateReviewSummary();
    }
}

function updateStepIndicators() {
    const items = document.querySelectorAll('.step-item');
    items.forEach(item => {
        const stepNum = parseInt(item.getAttribute('data-step'));
        item.classList.remove('active', 'completed');

        if (stepNum === currentStep) {
            item.classList.add('active');
        } else if (stepNum < currentStep) {
            item.classList.add('completed');
        }
    });
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');

    if (currentStep === 1) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'inline-block';
    }

    if (currentStep === totalSteps) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-block';
    } else {
        nextBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
    }
}

function validateStep(step) {
    // Basic validation, mainly to ensure something is checked/filled
    // Returning true always for demo, but score will show incompleteness
    return true;
}

// Event Listeners for Auto Case Score
document.addEventListener('DOMContentLoaded', () => {
    const scoreInputs = document.querySelectorAll('.score-input');
    scoreInputs.forEach(input => {
        input.addEventListener('change', calculateScore);
        input.addEventListener('input', calculateScore);
    });

    // File upload handling
    const fileUpload = document.getElementById('file-upload');
    if (fileUpload) {
        fileUpload.addEventListener('change', handleFileUpload);
    }
});

function calculateScore() {
    let score = 0;
    const warnings = [];

    // 1. Case Type (20%)
    const caseType = document.querySelector('input[name="case_type"]:checked');
    if (caseType) {
        score += 20;
    } else {
        warnings.push("Missing Case Type");
    }

    // 2. Patient Name (25%) - MANDATORY
    const patientName = document.getElementById('patient_name')?.value.trim();
    if (patientName) {
        score += 25;
    } else {
        warnings.push("Mandatory: Patient Name / Case Label is missing");
    }

    // 3. Tooth Area (10%)
    const toothArea = document.querySelector('input[name="tooth_area"]').value.trim();
    if (toothArea) {
        score += 10;
    } else {
        warnings.push("Missing Tooth/Area selection");
    }

    // 4. Material & Margin (15%)
    const material = document.querySelector('input[name="material"]:checked')?.value;
    const margin = document.querySelector('input[name="margin"]:checked')?.value;
    if (material) score += 7.5;
    if (margin) score += 7.5;
    if (!material || !margin) warnings.push("Missing Material or Margin details");

    // 5. Occlusion Notes (10%)
    const occlusion = document.querySelector('input[name="occlusion"]').value.trim();
    if (occlusion) {
        score += 10;
    } else {
        warnings.push("Add occlusion notes for better precision");
    }

    // 6. Files Uploaded (20%)
    if (uploadedFiles.length > 0) {
        score += 20;
    } else {
        warnings.push("No STL/Scans uploaded");
    }

    // Ensure exact 100% max
    score = Math.floor(score);

    // Update UI
    const scoreCircle = document.getElementById('score-circle');
    const scoreText = document.getElementById('score-text');
    const scoreMessage = document.getElementById('score-message');
    const warningsContainer = document.getElementById('smart-warnings');

    scoreCircle.setAttribute('stroke-dasharray', `${score}, 100`);
    scoreText.textContent = `${score}%`;

    // Color coding
    if (score < 50) {
        scoreCircle.setAttribute('stroke', '#EF4444'); // Red
        scoreMessage.textContent = "Incomplete data may affect precision.";
        scoreMessage.style.color = '#EF4444';
    } else if (score < 85) {
        scoreCircle.setAttribute('stroke', '#F59E0B'); // Orange
        scoreMessage.textContent = "Good, but can be improved.";
        scoreMessage.style.color = '#F59E0B';
    } else {
        scoreCircle.setAttribute('stroke', '#10B981'); // Green
        scoreMessage.textContent = "Perfect! Ready for precision design.";
        scoreMessage.style.color = '#10B981';
    }

    // Update Warnings
    warningsContainer.innerHTML = '';
    if (score < 100) {
        warnings.forEach(warning => {
            const warningEl = document.createElement('div');
            warningEl.className = 'warning-item';
            warningEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>${warning}</span>`;
            warningsContainer.appendChild(warningEl);
        });
    }
}

function handleFileUpload(e) {
    const files = e.target.files;
    const fileListContainer = document.getElementById('file-list');

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = 'file-' + Date.now() + '-' + i;
        
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.id = fileId;
        fileItem.innerHTML = `
            <div style="width: 100%;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.8rem;">
                    <span><i class="fa-solid fa-spinner fa-spin text-accent"></i> Uploading ${file.name}</span>
                    <span id="${fileId}-percent">0%</span>
                </div>
                <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                    <div id="${fileId}-bar" style="width: 0%; height: 100%; background: var(--clr-accent); transition: width 0.3s;"></div>
                </div>
            </div>
        `;
        fileListContainer.appendChild(fileItem);

        // Use the custom Supabase upload function
        // We'll use "guest" as a temporary ID if auth isn't fully linked yet
        const tempClientId = 'guest_client'; 
        const tempCaseId = 'new_case_' + Date.now();

        // 1. Upload to Local Server with Progress Tracking
        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://localhost:5000/upload', true);

        // Track Progress
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const progress = (e.loaded / e.total) * 100;
                const bar = document.getElementById(`${fileId}-bar`);
                const text = document.getElementById(`${fileId}-percent`);
                if (bar) bar.style.width = progress + '%';
                if (text) text.textContent = Math.round(progress) + '%';
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                uploadedFiles.push({ name: file.name, url: data.url, local: true });
                document.getElementById(fileId).innerHTML = `
                    <i class="fa-solid fa-file-circle-check text-accent"></i>
                    <span style="flex: 1; margin-left: 10px;">${file.name}</span>
                    <i class="fa-solid fa-times remove-file" onclick="removeFile(this, '${file.name}')" style="cursor: pointer; color: #ef4444;"></i>
                `;
                calculateScore();
            } else {
                showError();
            }
        };

        xhr.onerror = () => showError();

        function showError() {
            document.getElementById(fileId).innerHTML = `
                <i class="fa-solid fa-exclamation-triangle" style="color: #ef4444;"></i>
                <span style="color: #ef4444;">Failed: ${file.name}</span>
                <i class="fa-solid fa-times remove-file" onclick="this.parentElement.remove()"></i>
            `;
        }

        xhr.send(formData);
    }
}

function removeFile(element, fileName) {
    const fileObj = uploadedFiles.find(f => typeof f === 'object' ? f.name === fileName : f === fileName);
    if (fileObj && fileObj.path) {
        window.storage.ref(fileObj.path).delete().catch(console.error);
    }
    
    uploadedFiles = uploadedFiles.filter(f => typeof f === 'object' ? f.name !== fileName : f !== fileName);
    element.parentElement.remove();

    // Reset file input so same file can be re-selected if needed
    if (uploadedFiles.length === 0) {
        document.getElementById('file-upload').value = '';
    }
    calculateScore();
}

function populateReviewSummary() {
    const summaryContainer = document.getElementById('review-summary');
    summaryContainer.innerHTML = '';

    const patientName = document.getElementById('patient_name')?.value || 'NOT SPECIFIED';
    const caseType = document.querySelector('input[name="case_type"]:checked')?.value || 'Not selected';
    const toothArea = document.querySelector('input[name="tooth_area"]').value || 'Not specified';
    const material = document.querySelector('input[name="material"]:checked')?.value || 'Not selected';
    const margin = document.querySelector('input[name="margin"]:checked')?.value || 'Not selected';
    const priority = document.querySelector('input[name="priority"]:checked')?.value || 'Standard';
    const occlusion = document.querySelector('input[name="occlusion"]')?.value || 'Not specified';
    const instructions = document.querySelector('textarea[name="instructions"]')?.value || 'No special instructions';

    let drName = localStorage.getItem('kael_client_name') || 'Logged In Client';

    const summaryData = [
        { label: 'Patient / Case', value: patientName },
        { label: 'Case Type', value: caseType },
        { label: 'Tooth / Area', value: toothArea },
        { label: 'Material & Margin', value: material + ' — ' + margin },
        { label: 'Occlusion Notes', value: occlusion },
        { label: 'Files Uploaded', value: uploadedFiles.length > 0 ? `${uploadedFiles.length} files` : 'None' },
        { label: 'Priority', value: priority },
        { label: 'Clinical Instructions', value: instructions },
        { label: 'Clinician', value: drName }
    ];

    summaryData.forEach(item => {
        const row = document.createElement('div');
        row.className = 'review-item';
        row.innerHTML = `
            <span class="review-label">${item.label}</span>
            <span class="review-value">${item.value}</span>
        `;
        summaryContainer.appendChild(row);
    });
}

function submitCase() {
    const patientName = document.getElementById('patient_name')?.value.trim();
    if (!patientName) {
        alert("CRITICAL: Patient Name / Case Label is required for all submissions.");
        changeStep(-3); // Go back to details step
        return;
    }

    // Hide form content and show success message
    document.getElementById('review-summary').style.display = 'none';
    document.getElementById('success-message').style.display = 'block';

    // Hide navigation buttons
    document.getElementById('form-navigation').style.display = 'none';

    // Get client info from localStorage
    const clientEmail = localStorage.getItem('kael_client_email');
    let doctorName = localStorage.getItem('kael_client_name') || 'Unknown Doctor';
    let clinicName = 'Registered Clinic';

    if (clientEmail) {
        const clients = JSON.parse(localStorage.getItem('kael_clients') || '[]');
        const client = clients.find(c => c.email === clientEmail);
        if (client) {
            doctorName = client.name;
            clinicName = client.clinic;
        }
    }

    // Save to LocalStorage for Admin Dashboard
    const newCase = {
        id: '#KD-' + Math.floor(Math.random() * 9000 + 1000),
        patient: patientName,
        doctor: doctorName,
        clinic: clinicName,
        type: document.querySelector('input[name="case_type"]:checked')?.value || 'Unknown',
        tooth: document.querySelector('input[name="tooth_area"]').value || 'N/A',
        priority: document.querySelector('input[name="priority"]:checked')?.value || 'Standard',
        status: 'Received',
        date: new Date().toISOString(),
        files: uploadedFiles,
        clientEmail: clientEmail
    };

    let existingCases = JSON.parse(localStorage.getItem('kael_cases') || '[]');
    existingCases.unshift(newCase);
    if (typeof kael_saveCases === 'function') {
        kael_saveCases(existingCases);
    } else {
        localStorage.setItem('kael_cases', JSON.stringify(existingCases));
    }
}

function resetForm() {
    // Reset JS state
    currentStep = 1;
    uploadedFiles = [];

    // Reset Form Elements
    document.getElementById('smart-case-form').reset();
    document.getElementById('file-list').innerHTML = '';

    // Reset UI
    document.getElementById('review-summary').style.display = 'block';
    document.getElementById('success-message').style.display = 'none';
    document.getElementById('form-navigation').style.display = 'flex';

    // Reset Steps
    const steps = document.querySelectorAll('.form-step');
    steps.forEach(step => step.classList.remove('active'));
    document.getElementById('step-1').classList.add('active');

    updateStepIndicators();
    updateNavigationButtons();
    calculateScore();
}
