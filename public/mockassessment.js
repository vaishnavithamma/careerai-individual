import { questions } from "./mock-questions.js";

console.log("✅ mockassessment.js loaded");

// Deduplicate questions from the bank
const uniqueMap = new Map();
questions.forEach(q => {
    const norm = q.question.trim().toLowerCase();
    if (!uniqueMap.has(norm)) {
        uniqueMap.set(norm, q);
    }
});
const uniqueQuestionsList = Array.from(uniqueMap.values());

let quizQuestions = [];
let currentQuestion = 0;
let answers = [];
let timeLeft = 10 * 60; // 10 minutes
let timer;
let selectedLanguage = "";

const languageCard = document.getElementById("languageCard");
const languageStartBtn = document.getElementById("languageStartBtn");
const languageCards = document.querySelectorAll(".language-card");

const startBtn = document.getElementById("startBtn");
const instructionCard = document.getElementById("instructionCard");
const questionCard = document.getElementById("questionCard");
const timerBar = document.getElementById("timerBar");
const resultCard = document.getElementById("resultCard");
const submissionReviewCard = document.getElementById("submissionReviewCard");

const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");

const currentQuestionEl = document.getElementById("currentQuestion");
const questionCount = document.getElementById("questionCount");
const progressBar = document.getElementById("progressBar");
const timerEl = document.getElementById("timer");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const restartBtn = document.getElementById("restartBtn");

// Review Screen controls
const reviewGoBackBtn = document.getElementById("reviewGoBackBtn");
const reviewFinalSubmitBtn = document.getElementById("reviewFinalSubmitBtn");
const reviewSummaryContent = document.getElementById("reviewSummaryContent");
const unansweredWarning = document.getElementById("unansweredWarning");

// Shuffle Helper
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Explanation & Tip Lookup Helper
function getExplanationAndTip(question, answer) {
    const qLower = question.toLowerCase();
    
    if (qLower.includes("15 × 12") || qLower.includes("15 * 12")) {
        return {
            exp: "15 multiplied by 12 equals 180. A quick mental trick is: 15 × 10 = 150, and 15 × 2 = 30. Adding them gives 180.",
            tip: "Use split-multiplication techniques to compute mental arithmetic faster."
        };
    }
    if (qLower.includes("25% of 200")) {
        return {
            exp: "25% represents one quarter (1/4) of a whole. 1/4 of 200 is 50.",
            tip: "Memorize fractional equivalents of common percentages (e.g., 25% = 0.25 = 1/4)."
        };
    }
    if (qLower.includes("train travels 60 km")) {
        return {
            exp: "Distance = Speed × Time. Travelling at 60 km/h for 5 hours yields 60 × 5 = 300 km.",
            tip: "Always check the units of speed, distance, and time for consistency."
        };
    }
    if (qLower.includes("square root of 144")) {
        return {
            exp: "The square root of 144 is 12, because 12 multiplied by itself (12 × 12) equals 144.",
            tip: "Memorize the squares of integers from 1 to 20 for rapid calculations."
        };
    }
    if (qLower.includes("styling")) {
        return {
            exp: "CSS (Cascading Style Sheets) is the web standard stylesheet language used to apply layouts, colors, and fonts to HTML documents.",
            tip: "Practice using modern CSS grids and flexbox layouts to structure web elements."
        };
    }
    if (qLower.includes("single-line comments in javascript")) {
        return {
            exp: "Double forward slashes (//) tell the JavaScript engine to ignore the rest of the current line. # is used in Python, and <!-- --> is used in HTML.",
            tip: "Use clear, concise comments to describe the 'why' of complex logic, not just the 'what'."
        };
    }
    if (qLower.includes("declares a variable in javascript")) {
        return {
            exp: "The 'var' keyword historically declares a variable in JS. Modern JS also uses 'let' and 'const' for block-scoped variables.",
            tip: "Prefer using 'const' by default, and 'let' only when you expect variable re-assignment."
        };
    }
    if (qLower.includes("professional email")) {
        return {
            exp: "'Dear Sir/Madam' and 'Thanks & Regards' represent standard polite greetings and closings in professional correspondence.",
            tip: "Keep business communications polite, structured, and free of colloquial slangs."
        };
    }
    if (qLower.includes("html stands for")) {
        return {
            exp: "HTML stands for Hyper Text Markup Language. It provides the core structural blueprint for web browsers to render pages.",
            tip: "Ensure your HTML markup uses semantic elements (e.g. main, article, section) for better accessibility and SEO."
        };
    }
    if (qLower.includes("developed java")) {
        return {
            exp: "Java was originally developed by James Gosling at Sun Microsystems and released in 1995. Sun was later acquired by Oracle.",
            tip: "Learn about Java's write-once-run-anywhere (WORA) philosophy powered by the Java Virtual Machine."
        };
    }
    if (qLower.includes("lifo")) {
        return {
            exp: "A Stack follows the Last-In, First-Out (LIFO) principle, where the last element inserted is the first one removed.",
            tip: "Understand stack push/pop time complexities, which run in O(1) constant time."
        };
    }
    if (qLower.includes("sql command")) {
        return {
            exp: "The SELECT statement is used in Structured Query Language (SQL) to fetch data records from one or more database tables.",
            tip: "Use SELECT with specific column names instead of SELECT * to improve query performance."
        };
    }

    return {
        exp: `The correct answer is "${answer}". It represents the factually accurate and logical solution to the query.`,
        tip: "Review core definitions and practice solving similar conceptual multiple-choice items."
    };
}

languageCards.forEach(card => {
    card.onclick = () => {
        languageCards.forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        selectedLanguage = card.dataset.language;
        languageStartBtn.disabled = false;
    };
});

languageStartBtn.onclick = () => {
    languageCard.style.display = "none";
    instructionCard.style.display = "block";
};

startBtn.onclick = () => {
    instructionCard.style.display = "none";
    questionCard.style.display = "block";
    timerBar.style.display = "flex";

    initializeQuiz();
};

function initializeQuiz() {
    // 1. Filter questions by selected language keywords or keep it general
    let pool = [...uniqueQuestionsList];
    const langLower = selectedLanguage.toLowerCase();
    
    // Sort pool to prioritize questions relevant to selected language
    pool.sort((a, b) => {
        const aMatch = a.question.toLowerCase().includes(langLower) || a.options.some(o => o.toLowerCase().includes(langLower));
        const bMatch = b.question.toLowerCase().includes(langLower) || b.options.some(o => o.toLowerCase().includes(langLower));
        return (bMatch ? 1 : 0) - (aMatch ? 1 : 0);
    });

    // 2. Select 10 questions randomly
    const shuffledPool = shuffleArray(pool.slice(0, 20)); // Mix top matching questions
    quizQuestions = shuffledPool.slice(0, 10);
    
    // 3. Shuffle options for each selected question
    quizQuestions.forEach(q => {
        q.shuffledOptions = shuffleArray([...q.options]);
    });

    answers = new Array(quizQuestions.length).fill(null);
    currentQuestion = 0;
    timeLeft = 10 * 60; // 10 minutes

    showQuestion();
    startTimer();
}

function showQuestion() {
    const q = quizQuestions[currentQuestion];

    questionText.innerText = q.question;
    currentQuestionEl.innerText = currentQuestion + 1;
    questionCount.innerText = `${currentQuestion + 1} / ${quizQuestions.length}`;

    // Update progress bar
    progressBar.style.width = ((currentQuestion + 1) / quizQuestions.length) * 100 + "%";

    optionsContainer.innerHTML = "";

    q.shuffledOptions.forEach((option, index) => {
        const optionDiv = document.createElement("div");
        optionDiv.className = "option";

        optionDiv.innerHTML = `
            <label class="option-label">
                <input
                    type="radio"
                    name="answer"
                    value="${index}"
                    ${answers[currentQuestion] === index ? "checked" : ""}
                >
                <span>${option}</span>
            </label>
        `;

        const radio = optionDiv.querySelector("input");
        radio.addEventListener("change", () => {
            answers[currentQuestion] = index;
            // Enable next button or remove warnings
            nextBtn.disabled = false;
        });

        optionsContainer.appendChild(optionDiv);
    });

    // Handle button statuses
    prevBtn.disabled = currentQuestion === 0;
}

nextBtn.onclick = () => {
    // 2. Mandatory Answer Selection check
    if (answers[currentQuestion] === null) {
        alert("Please select an answer before proceeding.");
        return;
    }

    if (currentQuestion < quizQuestions.length - 1) {
        currentQuestion++;
        showQuestion();
    } else {
        // Go to pre-submission review screen
        showSubmissionReview();
    }
};

prevBtn.onclick = () => {
    if (currentQuestion > 0) {
        currentQuestion--;
        showQuestion();
    }
};

// Open pre-submission review screen
submitBtn.onclick = () => {
    showSubmissionReview();
};

function showSubmissionReview() {
    questionCard.style.display = "none";
    timerBar.style.display = "none";
    submissionReviewCard.style.display = "block";

    const total = quizQuestions.length;
    const answered = answers.filter(a => a !== null).length;
    const unanswered = total - answered;

    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    const timeStr = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;

    reviewSummaryContent.innerHTML = `
        <p>📊 <b>Programming Language:</b> ${selectedLanguage}</p>
        <p>📋 <b>Total Questions:</b> ${total}</p>
        <p>✅ <b>Answered Questions:</b> <span style="color:#4ade80; font-weight:bold;">${answered}</span></p>
        <p>❌ <b>Unanswered Questions:</b> <span style="color:${unanswered > 0 ? '#f87171' : 'white'}; font-weight:bold;">${unanswered}</span></p>
        <p>⏱️ <b>Time Remaining:</b> <span style="color:#60a5fa; font-weight:bold;">${timeStr}</span></p>
    `;

    if (unanswered > 0) {
        unansweredWarning.style.display = "block";
    } else {
        unansweredWarning.style.display = "none";
    }
}

// Go back from review page to quiz questions
reviewGoBackBtn.onclick = () => {
    submissionReviewCard.style.display = "none";
    questionCard.style.display = "block";
    timerBar.style.display = "flex";
    showQuestion();
};

// Final submit assessment
reviewFinalSubmitBtn.onclick = () => {
    finishQuiz();
};

function startTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
        let min = Math.floor(timeLeft / 60);
        let sec = timeLeft % 60;

        timerEl.innerText = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
        timeLeft--;

        if (timeLeft < 0) {
            clearInterval(timer);
            finishQuiz();
        }
    }, 1000);
}

function finishQuiz() {
    clearInterval(timer);

    questionCard.style.display = "none";
    timerBar.style.display = "none";
    submissionReviewCard.style.display = "none";
    resultCard.style.display = "block";

    let score = 0;
    let reviewHtml = "";

    const timeTakenSec = (10 * 60) - timeLeft;
    const timeTakenMinStr = Math.floor(timeTakenSec / 60) + "m " + (timeTakenSec % 60) + "s";

    // Categories score tracking to compute strengths/weaknesses
    const categoryStats = {};

    quizQuestions.forEach((q, i) => {
        const isAnswered = answers[i] !== null;
        const selectedOptionText = isAnswered ? q.shuffledOptions[answers[i]] : null;
        const isCorrect = selectedOptionText === q.answer;

        if (isCorrect) {
            score++;
        }

        const cat = q.category || "General";
        if (!categoryStats[cat]) {
            categoryStats[cat] = { correct: 0, total: 0 };
        }
        categoryStats[cat].total++;
        if (isCorrect) {
            categoryStats[cat].correct++;
        }

        const explanationData = getExplanationAndTip(q.question, q.answer);

        reviewHtml += `
            <div class="review-card ${isCorrect ? 'correct-card' : ''}">
                <h3>Question ${i + 1} [${cat}]</h3>
                <p><b>${q.question}</b></p>
                <p style="color:${isCorrect ? '#10b981' : '#f87171'}; font-weight:bold; margin-top:8px;">
                    Your Answer: ${selectedOptionText || "Not Answered"} ${isCorrect ? '✓' : '✗'}
                </p>
                ${!isCorrect ? `<p style="color:#10b981; font-weight:bold;">Correct Answer: ${q.answer}</p>` : ''}
                
                <div class="review-explanation">
                    <b>Explanation:</b> ${explanationData.exp}
                    <br><br>
                    💡 <b>Learning Tip:</b> ${explanationData.tip}
                </div>
            </div>
        `;
    });

    // Compute Strengths & Weaknesses
    const strengths = [];
    const weakAreas = [];

    Object.entries(categoryStats).forEach(([cat, stats]) => {
        const pct = (stats.correct / stats.total) * 100;
        if (pct >= 70) {
            strengths.push(`${cat} (${pct.toFixed(0)}% accuracy)`);
        } else {
            weakAreas.push(`${cat} (${pct.toFixed(0)}% accuracy)`);
        }
    });

    if (strengths.length === 0) strengths.push("Basic concepts comprehension");
    if (weakAreas.length === 0) weakAreas.push("Advanced speed optimization");

    document.getElementById("scoreText").innerText = `${score} / ${quizQuestions.length}`;

    const analysisHtml = `
        <p>📊 <b>Programming Language:</b> ${selectedLanguage}</p>
        <p>📋 <b>Total Questions:</b> ${quizQuestions.length}</p>
        <p>✅ <b>Correct:</b> ${score}</p>
        <p>❌ <b>Incorrect:</b> ${quizQuestions.length - score}</p>
        <p>📈 <b>Percentage Score:</b> ${((score / quizQuestions.length) * 100).toFixed(1)}%</p>
        <p>⏱️ <b>Time Taken:</b> ${timeTakenMinStr}</p>
        <p>💪 <b>Strengths:</b> ${strengths.join(", ")}</p>
        <p>⚠️ <b>Weak Areas:</b> <span style="color:#f87171;">${weakAreas.join(", ")}</span></p>
    `;

    document.getElementById("analysis").innerHTML = analysisHtml;
    document.getElementById("reviewContainer").innerHTML = reviewHtml;
}

// Restart Assessment
restartBtn.onclick = () => {
    location.reload();
};