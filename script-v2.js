document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and tab contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}Tab`).classList.add('active');
        });
    });
    
    // Help section toggle
    const helpBtn = document.getElementById('helpBtn');
    const helpSection = document.getElementById('helpSection');
    
    helpBtn.addEventListener('click', () => {
        helpSection.style.display = helpSection.style.display === 'none' || helpSection.style.display === '' ? 'block' : 'none';
    });
    
    // Clear button functionality
    const clearBtn = document.getElementById('clearBtn');
    const questionInput = document.getElementById('questionInput');
    
    clearBtn.addEventListener('click', () => {
        questionInput.value = '';
        document.getElementById('resultCard').style.display = 'none';
    });
    
    // Convert button functionality
    const convertBtn = document.getElementById('convertBtn');
    const outputText = document.getElementById('outputText');
    const resultCard = document.getElementById('resultCard');
    const previewContainer = document.getElementById('previewContainer');
    
    convertBtn.addEventListener('click', () => {
        const input = questionInput.value.trim();
        if (!input) {
            showNotification('Silakan masukkan soal terlebih dahulu', 'error');
            return;
        }
        
        const aikenFormat = convertToAiken(input);
        outputText.value = aikenFormat;
        
        // Generate preview
        generatePreview(aikenFormat);
        
        resultCard.style.display = 'block';
        
        // Scroll to results
        resultCard.scrollIntoView({ behavior: 'smooth' });
    });
    
    // File upload
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const loadingUpload = document.getElementById('loadingUpload');
    
    dropzone.addEventListener('click', () => {
        fileInput.click();
    });
    
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#4361ee';
    });
    
    dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = '#ddd';
    });
    
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#ddd';
        
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            handleFile(fileInput.files[0]);
        }
    });
    
    function handleFile(file) {
        const allowedTypes = ['text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
        
        if (!allowedTypes.includes(file.type)) {
            showNotification('Format file tidak didukung. Gunakan .txt atau .docx', 'error');
            return;
        }
        
        loadingUpload.style.display = 'block';
        
        // For demo, we'll just use a simple text file reader
        // In a real app, you would need proper DOCX parsing
        const reader = new FileReader();
        
        reader.onload = function(e) {
            loadingUpload.style.display = 'none';
            
            // Set the content to the textarea for .txt files
            if (file.type === 'text/plain') {
                questionInput.value = e.target.result;
                // Switch to the manual tab and trigger conversion
                tabs[0].click();
                convertBtn.click();
            } else {
                // For DOCX (in a real app, this would require proper parsing)
                showNotification('File DOCX terdeteksi. Dalam demo ini, hanya file .txt yang dapat diproses sepenuhnya', 'error');
            }
        };
        
        reader.onerror = function() {
            loadingUpload.style.display = 'none';
            showNotification('Error membaca file', 'error');
        };
        
        if (file.type === 'text/plain') {
            reader.readAsText(file);
        } else {
            // Simulate processing for non-text files
            setTimeout(() => {
                loadingUpload.style.display = 'none';
                showNotification('File DOCX terdeteksi. Dalam demo ini, hanya file .txt yang dapat diproses sepenuhnya', 'error');
            }, 1500);
        }
    }
    
    // Copy button functionality
    const copyBtn = document.getElementById('copyBtn');
    
    copyBtn.addEventListener('click', () => {
        outputText.select();
        document.execCommand('copy');
        showNotification('Berhasil menyalin ke clipboard!');
    });
    
    // Download button functionality
    const downloadBtn = document.getElementById('downloadBtn');
    
    downloadBtn.addEventListener('click', () => {
        const blob = new Blob([outputText.value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'soal_aiken.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('File berhasil diunduh!');
    });
    
    // Notification system
    function showNotification(message, type = 'success') {
        const notification = document.getElementById('successNotification');
        const notificationText = document.getElementById('notificationText');
        
        notification.className = `notification ${type}`;
        notificationText.textContent = message;
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Convert to Aiken format
    function convertToAiken(input) {
        let questions = [];
        let lines = input.split('\n');
        
        let currentQuestion = '';
        let currentOptions = [];
        let correctAnswer = '';
        let collectingQuestion = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines if not collecting a question
            if (line === '' && !collectingQuestion) {
                continue;
            }
            
            // Start of a new question (usually starts with a number or just text)
            if (!collectingQuestion && !line.match(/^[A-Za-z][.)]\s/) && !line.toLowerCase().startsWith('jawaban:') && !line.toLowerCase().startsWith('answer:')) {
                // Remove any numbering (1., 2., etc.)
                currentQuestion = line.replace(/^\d+[.)]\s*/, '');
                collectingQuestion = true;
                currentOptions = [];
                correctAnswer = '';
                continue;
            }
            
            // Collecting options - modified to accept both uppercase and lowercase letters
            if (collectingQuestion) {
                const optionMatch = line.match(/^([A-Za-z])[.)]\s+(.+)$/);
                if (optionMatch) {
                    // Store option letter (converted to uppercase) and text
                    currentOptions.push({
                        letter: optionMatch[1].toUpperCase(),
                        text: optionMatch[2]
                    });
                    continue;
                }
                
                // Check for answer line - modified to accept both uppercase and lowercase
                const answerMatch = line.match(/^(ANS|jawaban|answer):?\s*([A-Za-z])[.)]*\s*$/i);
                if (answerMatch) {
                    correctAnswer = answerMatch[2].toUpperCase();
                }
                
                // End of question (empty line or answer line)
                if (line === '' || answerMatch || i === lines.length - 1) {
                    // If we have a question, options, and correct answer, add to questions array
                    if (currentQuestion && currentOptions.length > 0 && correctAnswer) {
                        questions.push({
                            question: currentQuestion,
                            options: currentOptions,
                            answer: correctAnswer
                        });
                    }
                    
                    collectingQuestion = false;
                    
                    // If there was an answer but no empty line after
                    if (answerMatch && i < lines.length - 1 && lines[i+1].trim() !== '') {
                        // Don't skip the next line as it might be a new question
                        i--;
                    }
                }
            }
        }
        
        // Format questions into Aiken format
        return questions.map(q => {
            let aikenQuestion = q.question + '\n';
            q.options.forEach(opt => {
                aikenQuestion += opt.letter + '. ' + opt.text + '\n';
            });
            aikenQuestion += 'ANSWER: ' + q.answer;
            return aikenQuestion;
        }).join('\n\n');
    }
    
    // Generate preview of questions
    function generatePreview(aikenText) {
        previewContainer.innerHTML = '';
        
        // Split the Aiken formatted text into individual questions
        const questionBlocks = aikenText.split('\n\n');
        
        questionBlocks.forEach((block, index) => {
            const lines = block.split('\n');
            if (lines.length < 2) return;
            
            // Create question container
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-preview';
            
            // Question text
            const questionTextElem = document.createElement('div');
            questionTextElem.className = 'question-text';
            questionTextElem.textContent = `${index + 1}. ${lines[0]}`;
            questionDiv.appendChild(questionTextElem);
            
            // Options
            let answerLine = '';
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                
                if (line.startsWith('ANSWER:')) {
                    answerLine = line;
                    continue;
                }
                
                const optionElem = document.createElement('div');
                optionElem.className = 'option';
                
                // Check if this option is the correct answer
                const optionLetter = line.substring(0, 1);
                const isCorrect = answerLine.includes(optionLetter);
                
                if (isCorrect) {
                    optionElem.classList.add('correct');
                }
                
                optionElem.textContent = line;
                questionDiv.appendChild(optionElem);
            }
            
            // Add to preview container
            previewContainer.appendChild(questionDiv);
        });
    }
});