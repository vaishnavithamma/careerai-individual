import { questions } from "./mock-questions.js";


console.log("✅ mockassessment.js loaded");
console.log("Questions:", questions);
// Only first 30 questions
const quizQuestions = questions.slice(0, 30);

let currentQuestion = 0;
let answers = new Array(quizQuestions.length).fill(null);
let timeLeft = 30 * 60;
let timer;

const languageCard = document.getElementById("languageCard");
const languageStartBtn = document.getElementById("languageStartBtn");
const languageCards = document.querySelectorAll(".language-card");
let selectedLanguage = "";

const startBtn = document.getElementById("startBtn");
const instructionCard = document.getElementById("instructionCard");
const questionCard = document.getElementById("questionCard");
const timerBar = document.getElementById("timerBar");
const resultCard = document.getElementById("resultCard");

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

    showQuestion();
    startTimer();
};

function showQuestion() {

    const q = quizQuestions[currentQuestion];

    questionText.innerText = q.question;

    currentQuestionEl.innerText = currentQuestion + 1;
    questionCount.innerText = `${currentQuestion + 1} / ${quizQuestions.length}`;

    progressBar.style.width =
        ((currentQuestion + 1) / quizQuestions.length) * 100 + "%";

    optionsContainer.innerHTML = "";

    q.options.forEach((option, index) => {

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
        });

        optionsContainer.appendChild(optionDiv);

    });

}

nextBtn.onclick = () => {

    if (currentQuestion < quizQuestions.length - 1) {

        currentQuestion++;
        showQuestion();

    } else {

        finishQuiz();

    }

};

prevBtn.onclick = () => {

    if (currentQuestion > 0) {

        currentQuestion--;
        showQuestion();

    }

};

// Submit Assessment
submitBtn.onclick = () => {

    if (confirm("Are you sure you want to submit the assessment?")) {
        finishQuiz();
    }

};

function startTimer() {

    timer = setInterval(() => {

        let min = Math.floor(timeLeft / 60);
        let sec = timeLeft % 60;

        timerEl.innerText =
            `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;

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
    resultCard.style.display = "block";

    let score = 0;
    let analysis = "";
    let review = "";

    quizQuestions.forEach((q, i) => {

        const selectedAnswer =
            answers[i] !== null ? q.options[answers[i]] : null;

        if (selectedAnswer === q.answer) {

            score++;

        } else {

            review += `
            <div class="review">
                <h3>Question ${i + 1}</h3>
                <p><b>${q.question}</b></p>
                <p class="wrong">Your Answer: ${selectedAnswer || "Not Answered"}</p>
                <p class="correct">Correct Answer: ${q.answer}</p>
            </div>`;
        }

    });

    document.getElementById("scoreText").innerText =
        `${score} / ${quizQuestions.length}`;

    analysis = `
        <p><b>Total Questions:</b> ${quizQuestions.length}</p>
        <p><b>Correct:</b> ${score}</p>
        <p><b>Wrong:</b> ${quizQuestions.length - score}</p>
        <p><b>Percentage:</b> ${((score / quizQuestions.length) * 100).toFixed(1)}%</p>
    `;

    document.getElementById("analysis").innerHTML = analysis;

    document.getElementById("reviewContainer").innerHTML =
        review || "<h3 style='color:lightgreen'>🎉 Excellent! All answers are correct.</h3>";

}

// Restart Assessment
restartBtn.onclick = () => {
    location.reload();
};