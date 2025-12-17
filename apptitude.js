// frontend/app.js
// const API_BASE = 'http://localhost:4000';
const API_BASE = "https://resume-quiz-b.vercel.app/";


// -------------------------------
// Helper Functions
// -------------------------------

// Format AI Text
function formatAIText(text) {
  if (!text) return "";
  return text
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

// Escape HTML for safety
function escapeHtml(str) {
  if (!str) return '';
  return str.replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

// Convert escaped text back to normal
function unescapeHtml(str) {
  if (!str) return '';
  return str.replaceAll('&quot;', '"').replaceAll('&#39;', "'");
}



// -------------------------------
// Generate Quiz
// -------------------------------

document.getElementById('generateBtn').addEventListener('click', async () => {
  const topics = Array.from(document.querySelectorAll('#topics input:checked')).map(i => i.value);
  const difficulty = document.getElementById('difficulty').value;
  const perTopic = parseInt(document.getElementById('perTopic').value, 10);

  if (!topics.length) {
    alert('Please select at least one topic.');
    return;
  }

  document.getElementById('loader').style.display = 'block';
  document.getElementById('quizArea').style.display = 'none';
  document.getElementById('submitBtn').disabled = true;
  document.getElementById('result').textContent = '';

  try {
    const resp = await fetch(API_BASE + '/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topics, difficulty, perTopic })
    });

    const data = await resp.json();
    if (!data.ok) throw new Error(data.error || 'Generation failed');

    renderQuestions(data.questions);

  } catch (err) {
    console.error(err);
    alert('Error generating questions: ' + err.message);
  } finally {
    document.getElementById('loader').style.display = 'none';
    document.getElementById('submitBtn').disabled = false;
  }
});



// -------------------------------
// Render Questions
// -------------------------------

function renderQuestions(questions) {
  const container = document.getElementById('questionsContainer');
  container.innerHTML = '';

  questions.forEach((q, idx) => {
    const div = document.createElement('div');
    div.className = 'question-card';
    div.dataset.answer = q.answer;

    const header = document.createElement('div');
    header.className = 'question-header';
    header.innerHTML = `
      <span class="q-number">${idx + 1}.</span>
      <span class="q-topic">[${q.topic}]</span>
      <span class="q-text">${formatAIText(q.question)}</span>
    `;
    div.appendChild(header);

    const opts = document.createElement('div');
    opts.className = 'options-box';

    q.options.forEach(opt => {
      const label = document.createElement('label');
      label.className = 'option-item';
      label.innerHTML = `
        <input type="radio" name="q${idx}" value="${escapeHtml(opt)}">
        <span>${formatAIText(opt)}</span>
      `;
      opts.appendChild(label);
    });

    div.appendChild(opts);

    const expl = document.createElement('div');
    expl.className = 'explain';
    expl.style.display = 'none';
    expl.innerHTML = `
      <strong>Explanation:</strong><br>
      ${formatAIText(q.explain || 'No explanation available')}
    `;
    div.appendChild(expl);

    container.appendChild(div);
  });

  document.getElementById('quizArea').style.display = 'block';
}



// -------------------------------
// Submit Quiz
// -------------------------------

document.getElementById('submitBtn').addEventListener('click', async () => {
  const qs = Array.from(document.querySelectorAll('.question-card'));
  let correct = 0;

  qs.forEach(q => {
    const selected = q.querySelector('input[type=radio]:checked');
    const userAns = selected ? unescapeHtml(selected.value) : null;
    const correctAns = q.dataset.answer.trim();

    const labels = q.querySelectorAll('label');

    labels.forEach(lbl => {
      const input = lbl.querySelector('input');
      const val = unescapeHtml(input.value);

      if (val.trim() === correctAns) {
        lbl.style.background = "#16a34a";  // green
      }

      if (input.checked && val !== correctAns) {
        lbl.style.background = "#dc2626";  // red
      }
    });

    if (userAns && userAns.trim() === correctAns) {
      correct++;
    }

    const expl = q.querySelector('.explain');
    if (expl) expl.style.display = 'block';
  });

  document.getElementById('result').textContent =
    `Your score: ${correct} / ${qs.length}`;

  // Update streak after submitting
  await updateStreak();
  loadStreak();
});



// -------------------------------
// Update Streak (Fixed)
// -------------------------------

async function updateStreak() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  try {
    await fetch(API_BASE + "/update-streak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
  } catch (err) {
    console.error("Streak update failed", err);
  }
}



// -------------------------------
// Load Streak
// -------------------------------

async function loadStreak() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  try {
    const res = await fetch(API_BASE + "/get-streak?userId=" + userId);
    const data = await res.json();

    if (data.ok) {
      document.getElementById("streakBox").innerText =
        `🔥 Streak: ${data.currentStreak} | 🏆 Best: ${data.bestStreak}`;
    }
  } catch (err) {
    console.error("Failed to load streak");
  }
}


// Load streak on page open
document.addEventListener("DOMContentLoaded", loadStreak);
