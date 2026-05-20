// Canvas Particles Background
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let particles = [];
const particleCount = 100;

function initCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Particle {
    constructor() {
        this.init();
    }

    init() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.color = `rgba(${Math.random() * 100 + 100}, ${Math.random() * 200 + 55}, 255, 0.5)`;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createParticles() {
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
            let dx = particles[i].x - particles[j].x;
            let dy = particles[i].y - particles[j].y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
                ctx.strokeStyle = `rgba(0, 210, 255, ${1 - distance/100})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animate);
}

// Modal Logic
function openModal(id) {
    const modal = document.getElementById(id);
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.querySelector('.modal').classList.add('active');
    }, 10);
}

function hideModal(id) {
    const modal = document.getElementById(id);
    const modalContent = modal.querySelector('.modal');
    if (modalContent) modalContent.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function closeModal(event, id) {
    if (event.target.id === id) {
        hideModal(id);
    }
}

// Data Management (LocalStorage Fallback)
const getPendingUsers = () => JSON.parse(localStorage.getItem('pendingUsers') || '[]');
const getApprovedUsers = () => JSON.parse(localStorage.getItem('approvedUsers') || '[]');
const getRejectedUsers = () => JSON.parse(localStorage.getItem('rejectedUsers') || '[]');

const savePendingUsers = (users) => localStorage.setItem('pendingUsers', JSON.stringify(users));
const saveApprovedUsers = (users) => localStorage.setItem('approvedUsers', JSON.stringify(users));
const saveRejectedUsers = (users) => localStorage.setItem('rejectedUsers', JSON.stringify(users));

// Registration Logic
document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;

    const pending = getPendingUsers();
    if (pending.find(u => u.email === email) || getApprovedUsers().find(u => u.email === email)) {
        alert('Este correo ya está registrado o en espera.');
        return;
    }

    pending.push({ name, email, date: new Date().toLocaleDateString() });
    savePendingUsers(pending);

    alert('¡Solicitud enviada! El administrador te asignará un usuario pronto.');
    hideModal('register-modal');
    e.target.reset();
});

// Admin Logic
function verifyAdmin() {
    const pass = document.getElementById('admin-pass-input').value;
    if (pass === '123') {
        document.getElementById('admin-login-section').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        switchTab('pending');
    } else {
        alert('Contraseña de administrador incorrecta.');
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.querySelector(`.tab-btn[onclick*="${tabName}"]`);
    if (targetBtn) targetBtn.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    document.getElementById(`tab-${tabName}`).style.display = 'block';

    if (tabName === 'pending') renderPendingUsers();
    if (tabName === 'approved') renderApprovedUsers();
    if (tabName === 'rejected') renderRejectedUsers();
}

function renderPendingUsers() {
    const list = document.getElementById('pending-users-list');
    const pending = getPendingUsers();

    if (pending.length === 0) {
        list.innerHTML = '<p style="padding: 20px; color: var(--text-dim);">No hay solicitudes pendientes.</p>';
        return;
    }

    list.innerHTML = pending.map(user => `
        <div class="admin-user-row">
            <div class="user-info-text">
                <h4>${user.name}</h4>
                <div class="user-details">
                    <span class="email-tag">${user.email}</span>
                    <span class="date-tag">${user.date}</span>
                </div>
            </div>
            <div class="admin-actions">
                <button class="approve-btn" onclick="autoApproveUser('${user.email}')">Aprobar</button>
                <button class="reject-btn" onclick="rejectUser('${user.email}')">Rechazar</button>
            </div>
        </div>
    `).join('');
}

function renderApprovedUsers() {
    const list = document.getElementById('approved-users-list');
    const approved = getApprovedUsers();

    if (approved.length === 0) {
        list.innerHTML = '<p style="padding: 20px; color: var(--text-dim);">No hay estudiantes inscritos.</p>';
        return;
    }

    list.innerHTML = approved.map(user => `
        <div class="admin-user-row">
            <div class="user-info-text">
                <h4>${user.name} <span class="username-badge">@${user.username}</span></h4>
                <div class="user-credentials">
                    <span class="cred-badge">Pass: <strong>${user.password}</strong></span>
                    <span class="email-badge">${user.email}</span>
                </div>
            </div>
            <button class="delete-btn" onclick="deleteUser('${user.email}', 'approved')">Eliminar</button>
        </div>
    `).join('');
}

function renderRejectedUsers() {
    const list = document.getElementById('rejected-users-list');
    const rejected = getRejectedUsers();

    if (rejected.length === 0) {
        list.innerHTML = '<p style="padding: 20px; color: var(--text-dim);">No hay solicitudes rechazadas.</p>';
        return;
    }

    list.innerHTML = rejected.map(user => `
        <div class="admin-user-row">
            <div class="user-info-text">
                <h4>${user.name}</h4>
                <p>${user.email} - Rechazado el ${user.date}</p>
            </div>
            <button class="delete-btn" onclick="deleteUser('${user.email}', 'rejected')">Borrar Récord</button>
        </div>
    `).join('');
}

function rejectUser(email) {
    if (!confirm('¿Estás seguro de rechazar esta solicitud?')) return;
    const pending = getPendingUsers();
    const rejected = getRejectedUsers();
    const userIndex = pending.findIndex(u => u.email === email);
    if (userIndex > -1) {
        const user = pending[userIndex];
        user.date = new Date().toLocaleDateString();
        rejected.push(user);
        pending.splice(userIndex, 1);
        savePendingUsers(pending);
        saveRejectedUsers(rejected);
        renderPendingUsers();
    }
}

function deleteUser(email, type) {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    if (type === 'approved') {
        const users = getApprovedUsers();
        saveApprovedUsers(users.filter(u => u.email !== email));
        renderApprovedUsers();
    } else {
        const users = getRejectedUsers();
        saveRejectedUsers(users.filter(u => u.email !== email));
        renderRejectedUsers();
    }
}

function autoApproveUser(email) {
    const pending = getPendingUsers();
    const approved = getApprovedUsers();
    const userIndex = pending.findIndex(u => u.email === email);
    
    if (userIndex > -1) {
        const user = pending[userIndex];
        
        // Generar credenciales automáticas
        const autoUsername = user.name.toLowerCase().replace(/\s+/g, '') + Math.floor(100 + Math.random() * 899);
        const autoPassword = Math.random().toString(36).slice(-8);
        
        // Guardar en la lista de aprobados
        approved.push({ ...user, username: autoUsername, password: autoPassword });
        pending.splice(userIndex, 1);
        
        savePendingUsers(pending);
        saveApprovedUsers(approved);
        
        // Preparar el correo
        const subject = encodeURIComponent("¡Has sido aceptado en Aura AI!");
        const body = encodeURIComponent(
            `Hola ${user.name},\n\n` +
            `¡Felicidades! Has sido aceptado en la plataforma de cursos Aura AI.\n\n` +
            `Tus credenciales de acceso son:\n` +
            `Usuario: ${autoUsername}\n` +
            `Contraseña: ${autoPassword}\n\n` +
            `Puedes iniciar sesión ahora para comenzar tus cursos.\n\n` +
            `Saludos,\nEquipo de Aura AI`
        );
        
        // Abrir el correo (Usando un link temporal para mejor compatibilidad)
        const mailtoUrl = `mailto:${user.email}?subject=${subject}&body=${body}`;
        const tempLink = document.createElement('a');
        tempLink.href = mailtoUrl;
        tempLink.click();
        
        // Alerta de confirmación después de intentar abrir el correo
        alert(`¡Estudiante Aprobado!\n\nUsuario: ${autoUsername}\nContraseña: ${autoPassword}\n\nSe ha intentado abrir tu aplicación de correo.`);
        
        renderPendingUsers();
    }
}

// Login Logic
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const userOrEmail = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;

    const approved = getApprovedUsers();
    const user = approved.find(u => (u.username === userOrEmail || u.email === userOrEmail) && u.password === pass);

    if (user) {
        alert(`¡Bienvenido de nuevo, ${user.name}!`);
        hideModal('login-modal');
        showDashboard(user);
    } else {
        alert('Credenciales incorrectas o cuenta no aprobada aún.');
    }
});

function showDashboard(user) {
    document.getElementById('hero-section').style.display = 'none';
    document.querySelector('nav').style.display = 'none';
    document.getElementById('student-dashboard').style.display = 'block';
    
    // Se eliminó la sección de perfil
    window.currentUser = user;
}

function logout() {
    document.getElementById('student-dashboard').style.display = 'none';
    document.getElementById('hero-section').style.display = 'flex';
    document.querySelector('nav').style.display = 'flex';
    window.currentUser = null;
}



// Course Navigation
function switchCourseTab(event, tabName, courseId) {
    const wrapper = document.getElementById(`course-${courseId}`);
    wrapper.querySelectorAll('.course-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    wrapper.querySelectorAll('.course-section').forEach(s => s.style.display = 'none');
    document.getElementById(`${courseId}-${tabName}`).style.display = 'block';
}

function showCourse(courseId) {
    document.querySelectorAll('.side-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`nav-${courseId}`).classList.add('active');
    document.querySelectorAll('.course-wrapper').forEach(w => w.style.display = 'none');
    document.getElementById(`course-${courseId}`).style.display = 'block';
}


// Regresion Lineal Quiz Logic
const regresionQuestions = [
    {
        q: "¿Cuál es el objetivo principal de la Regresión Lineal?",
        options: ["Predecir categorías", "Predecir un valor numérico continuo", "Agrupar datos similares", "Clasificar imágenes"],
        correct: 1
    },
    {
        q: "En la ecuación y = mx + b, ¿qué representa la 'm'?",
        options: ["El punto de corte con el eje Y", "La variable independiente", "La pendiente de la línea", "El error cuadrático"],
        correct: 2
    },
    {
        q: "¿Qué método se utiliza comúnmente para encontrar la mejor línea de ajuste?",
        options: ["Descenso de Gradiente", "Mínimos Cuadrados Ordinarios", "K-Means", "Árboles de Decisión"],
        correct: 1
    },
    {
        q: "Si el coeficiente de correlación es r = 1, esto indica:",
        options: ["No hay relación", "Relación lineal negativa perfecta", "Relación lineal positiva perfecta", "Relación no lineal"],
        correct: 2
    },
    {
        q: "¿Qué sucede si agregamos datos atípicos (outliers) a un modelo de regresión lineal?",
        options: ["No afectan al modelo", "Pueden sesgar significativamente la línea de ajuste", "Hacen que el modelo sea más preciso", "El modelo los ignora automáticamente"],
        correct: 1
    }
];

let currentRegIndex = 0;
let regScore = 0;
let canAnswerReg = true;

function startRegresionQuiz() {
    currentRegIndex = 0;
    regScore = 0;
    document.getElementById('regresion-quiz-container').style.display = 'none';
    document.getElementById('regresion-quiz-result').style.display = 'none';
    document.getElementById('regresion-quiz-active').style.display = 'block';
    renderRegresionQuestion();
}

function renderRegresionQuestion() {
    canAnswerReg = true;
    const question = regresionQuestions[currentRegIndex];
    document.getElementById('reg-q-text').innerText = question.q;
    document.getElementById('reg-q-progress').innerText = `Pregunta ${currentRegIndex + 1} de ${regresionQuestions.length}`;
    document.getElementById('reg-next-btn').style.display = 'none';
    
    const optionsContainer = document.getElementById('reg-q-options');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt';
        btn.innerText = opt;
        btn.onclick = () => checkRegresionAnswer(index, btn);
        optionsContainer.appendChild(btn);
    });
}

function checkRegresionAnswer(selectedIndex, btn) {
    if (!canAnswerReg) return;
    canAnswerReg = false;
    
    const question = regresionQuestions[currentRegIndex];
    const options = document.querySelectorAll('#reg-q-options .quiz-opt');
    
    if (selectedIndex === question.correct) {
        btn.classList.add('correct');
        regScore++;
    } else {
        btn.classList.add('wrong');
        options[question.correct].classList.add('correct');
    }
    
    document.getElementById('reg-next-btn').style.display = 'block';
    if (currentRegIndex === regresionQuestions.length - 1) {
        document.getElementById('reg-next-btn').innerText = 'Finalizar';
    } else {
        document.getElementById('reg-next-btn').innerText = 'Siguiente';
    }
}

function nextRegresionQuestion() {
    currentRegIndex++;
    if (currentRegIndex < regresionQuestions.length) {
        renderRegresionQuestion();
    } else {
        showRegresionResult();
    }
}

function showRegresionResult() {
    document.getElementById('regresion-quiz-active').style.display = 'none';
    document.getElementById('regresion-quiz-result').style.display = 'block';
    
    const resultIcon = document.getElementById('reg-result-icon');
    const resultTitle = document.getElementById('reg-result-title');
    const resultText = document.getElementById('reg-result-text');
    
    const percentage = (regScore / regresionQuestions.length) * 100;
    
    if (percentage >= 80) {
        resultIcon.innerText = '🏆';
        resultTitle.innerText = '¡Felicidades, Experto!';
        resultText.innerText = `Has aprobado con un ${percentage}%. Has demostrado un dominio excelente de la Regresión Lineal.`;
    } else if (percentage >= 60) {
        resultIcon.innerText = '⭐';
        resultTitle.innerText = '¡Buen Trabajo!';
        resultText.innerText = `Has obtenido un ${percentage}%. Estás por buen camino, pero podrías repasar algunos conceptos.`;
    } else {
        resultIcon.innerText = '📚';
        resultTitle.innerText = 'Sigue Practicando';
        resultText.innerText = `Has obtenido un ${percentage}%. Te recomendamos repasar la teoría y volver a intentarlo.`;
    }
}

function resetRegresionQuiz() {
    document.getElementById('regresion-quiz-result').style.display = 'none';
    document.getElementById('regresion-quiz-container').style.display = 'block';
}


// Algoritmo Genético Quiz Logic
const geneticoQuizzes = {
    basico: {
        title: "Nivel Básico: Conceptos Iniciales",
        questions: [
            {
                q: "¿En qué teoría biológica se basan los Algoritmos Genéticos?",
                options: ["Lamarckismo", "Teoría de la Evolución de Darwin", "Leyes de Mendel", "Teoría Celular"],
                correct: 1
            },
            {
                q: "¿Qué representa un 'individuo' en un Algoritmo Genético?",
                options: ["Un usuario del sistema", "Una posible solución al problema", "Un error en el código", "Una base de datos"],
                correct: 1
            },
            {
                q: "¿Qué es la 'Función de Aptitud' (Fitness Function)?",
                options: ["Una medida de velocidad", "Una función que evalúa qué tan buena es una solución", "El número de generaciones", "Un tipo de mutación"],
                correct: 1
            }
        ]
    },
    intermedio: {
        title: "Nivel Intermedio: Operadores Evolutivos",
        questions: [
            {
                q: "¿Cuál es el propósito principal de la 'Mutación'?",
                options: ["Eliminar soluciones", "Mantener la diversidad y evitar óptimos locales", "Acelerar el proceso", "Combinar dos padres"],
                correct: 1
            },
            {
                q: "¿En qué consiste el proceso de 'Cruzamiento' (Crossover)?",
                options: ["Eliminar los peores individuos", "Mezclar información de dos padres para crear hijos", "Cambiar un bit aleatorio", "Reiniciar la población"],
                correct: 1
            },
            {
                q: "¿Qué es la 'Convergencia' en un Algoritmo Genético?",
                options: ["Cuando la población se vuelve uniforme y deja de mejorar", "Cuando el programa falla", "El inicio de la evolución", "Un tipo de selección"],
                correct: 0
            }
        ]
    },
    final: {
        title: "Examen Final: Maestría en AG",
        questions: [
            {
                q: "¿Cuál es el orden típico de una generación en un AG?",
                options: ["Mutación -> Selección -> Cruzamiento", "Evaluación -> Selección -> Cruzamiento -> Mutación", "Selección -> Mutación -> Evaluación", "Cruzamiento -> Evaluación -> Mutación"],
                correct: 1
            },
            {
                q: "¿Qué es el 'Elitismo' en este contexto?",
                options: ["Eliminar a los mejores", "Pasar los mejores individuos directamente a la siguiente generación", "Solo usar un individuo", "Un error de programación"],
                correct: 1
            },
            {
                q: "¿Para qué tipo de problemas son ideales los Algoritmos Genéticos?",
                options: ["Cálculos matemáticos simples", "Optimización y búsqueda en espacios complejos", "Almacenamiento de archivos", "Edición de texto"],
                correct: 1
            }
        ]
    }
};

let currentGenLevel = '';
let currentGenIndex = 0;
let genScore = 0;
let canAnswerGen = true;

function startGeneticoQuiz(level) {
    currentGenLevel = level;
    currentGenIndex = 0;
    genScore = 0;
    document.getElementById('genetico-grid').style.display = 'none';
    document.getElementById('genetico-quiz-result').style.display = 'none';
    document.getElementById('genetico-quiz-active').style.display = 'block';
    
    document.getElementById('gen-quiz-title').innerText = geneticoQuizzes[level].title;
    renderGeneticoQuestion();
}

function renderGeneticoQuestion() {
    canAnswerGen = true;
    const levelData = geneticoQuizzes[currentGenLevel];
    const question = levelData.questions[currentGenIndex];
    
    document.getElementById('gen-q-text').innerText = question.q;
    document.getElementById('gen-q-progress').innerText = `Pregunta ${currentGenIndex + 1} de ${levelData.questions.length}`;
    document.getElementById('gen-next-btn').style.display = 'none';
    
    const optionsContainer = document.getElementById('gen-q-options');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt';
        btn.innerText = opt;
        btn.onclick = () => checkGeneticoAnswer(index, btn);
        optionsContainer.appendChild(btn);
    });
}

function checkGeneticoAnswer(selectedIndex, btn) {
    if (!canAnswerGen) return;
    canAnswerGen = false;
    
    const question = geneticoQuizzes[currentGenLevel].questions[currentGenIndex];
    const options = document.querySelectorAll('#gen-q-options .quiz-opt');
    
    if (selectedIndex === question.correct) {
        btn.classList.add('correct');
        genScore++;
    } else {
        btn.classList.add('wrong');
        options[question.correct].classList.add('correct');
    }
    
    document.getElementById('gen-next-btn').style.display = 'block';
    if (currentGenIndex === geneticoQuizzes[currentGenLevel].questions.length - 1) {
        document.getElementById('gen-next-btn').innerText = 'Finalizar';
    } else {
        document.getElementById('gen-next-btn').innerText = 'Siguiente';
    }
}

function nextGeneticoQuestion() {
    currentGenIndex++;
    if (currentGenIndex < geneticoQuizzes[currentGenLevel].questions.length) {
        renderGeneticoQuestion();
    } else {
        showGeneticoResult();
    }
}

function showGeneticoResult() {
    document.getElementById('genetico-quiz-active').style.display = 'none';
    document.getElementById('genetico-quiz-result').style.display = 'block';
    
    const resultIcon = document.getElementById('gen-result-icon');
    const resultTitle = document.getElementById('gen-result-title');
    const resultText = document.getElementById('gen-result-text');
    
    const total = geneticoQuizzes[currentGenLevel].questions.length;
    const percentage = (genScore / total) * 100;
    
    if (percentage >= 80) {
        resultIcon.innerText = '🧬';
        resultTitle.innerText = '¡ADN de Maestro!';
        resultText.innerText = `Has obtenido un ${percentage}% (${genScore}/${total}). Tu comprensión de la evolución artificial es asombrosa.`;
    } else if (percentage >= 60) {
        resultIcon.innerText = '🌱';
        resultTitle.innerText = 'Evolución Positiva';
        resultText.innerText = `Has obtenido un ${percentage}% (${genScore}/${total}). Vas por buen camino en tu proceso evolutivo.`;
    } else {
        resultIcon.innerText = '🔬';
        resultTitle.innerText = 'Mutación Necesaria';
        resultText.innerText = `Has obtenido un ${percentage}% (${genScore}/${total}). Necesitas repasar los conceptos para mejorar tu fitness.`;
    }
}

function resetGeneticoQuiz() {
    document.getElementById('genetico-quiz-result').style.display = 'none';
    document.getElementById('genetico-grid').style.display = 'grid';
}


// Redes Neuronales Quiz Logic
const redesQuizzes = {
    parcial: [
        {
            q: "¿Cuál es la unidad básica de procesamiento en una red neuronal?",
            options: ["Caparazón", "Neurona", "Bit", "Nodo de red"],
            correct: 1
        },
        {
            q: "En una red neuronal, ¿qué componente decide si una neurona debe activarse o no?",
            options: ["El peso", "El sesgo (bias)", "La función de activación", "La capa de entrada"],
            correct: 2
        },
        {
            q: "¿Cómo se llaman las capas que están entre la entrada y la salida?",
            options: ["Capas invisibles", "Capas intermedias", "Capas ocultas", "Capas de proceso"],
            correct: 2
        },
        {
            q: "¿Qué representan los 'pesos' en las conexiones entre neuronas?",
            options: ["La importancia de esa conexión", "La velocidad de los datos", "El tamaño de la neurona", "La memoria disponible"],
            correct: 0
        },
        {
            q: "¿Cuál es el propósito del 'sesgo' (bias) en una neurona?",
            options: ["Aumentar la velocidad", "Permitir que la función de activación se mueva hacia la izquierda o derecha", "Bloquear datos incorrectos", "Guardar resultados"],
            correct: 1
        }
    ],
    final: [
        {
            q: "¿Qué algoritmo se utiliza comúnmente para entrenar redes neuronales ajustando los pesos según el error?",
            options: ["Regresión Simple", "Backpropagation", "Selección Natural", "Búsqueda Binaria"],
            correct: 1
        },
        {
            q: "¿Qué función de activación es famosa por resolver el problema de desvanecimiento del gradiente?",
            options: ["Sigmoide", "Tangente Hiperbólica", "ReLU", "Lineal"],
            correct: 2
        },
        {
            q: "¿Cuál de estos es un ejemplo de 'Visión Artificial'?",
            options: ["Traducción de texto", "Reconocimiento de rostros", "Predicción del clima", "Generación de música"],
            correct: 1
        },
        {
            q: "¿Qué significan las siglas LLM en el contexto de IA moderna?",
            options: ["Low Level Model", "Large Language Model", "Logical Learning Machine", "Linked Layer Matrix"],
            correct: 1
        },
        {
            q: "¿En qué consiste el 'Deep Learning'?",
            options: ["En usar solo una capa de gran tamaño", "En usar redes con múltiples capas ocultas", "En aprender sin usar datos", "En simular una sola neurona muy potente"],
            correct: 1
        }
    ]
};

let currentRedesQuiz = [];
let currentRedesIndex = 0;
let redesScore = 0;
let canAnswerRedes = true;

function startRedesQuiz(level) {
    currentRedesQuiz = redesQuizzes[level];
    currentRedesIndex = 0;
    redesScore = 0;
    
    document.getElementById('redes-quiz-title').innerText = level === 'parcial' ? 'Examen Parcial: Fundamentos' : 'Examen Final: Certificación';
    document.getElementById('redes-quiz-container').style.display = 'none';
    document.getElementById('redes-quiz-result').style.display = 'none';
    document.getElementById('redes-quiz-active').style.display = 'block';
    renderRedesQuestion();
}

function renderRedesQuestion() {
    canAnswerRedes = true;
    const question = currentRedesQuiz[currentRedesIndex];
    document.getElementById('redes-q-text').innerText = question.q;
    document.getElementById('redes-q-progress').innerText = `Pregunta ${currentRedesIndex + 1} de ${currentRedesQuiz.length}`;
    document.getElementById('redes-next-btn').style.display = 'none';
    
    const optionsContainer = document.getElementById('redes-q-options');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt';
        btn.innerText = opt;
        btn.onclick = () => checkRedesAnswer(index, btn);
        optionsContainer.appendChild(btn);
    });
}

function checkRedesAnswer(selectedIndex, btn) {
    if (!canAnswerRedes) return;
    canAnswerRedes = false;
    
    const question = currentRedesQuiz[currentRedesIndex];
    const options = document.querySelectorAll('#redes-q-options .quiz-opt');
    
    if (selectedIndex === question.correct) {
        btn.classList.add('correct');
        redesScore++;
    } else {
        btn.classList.add('wrong');
        options[question.correct].classList.add('correct');
    }
    
    document.getElementById('redes-next-btn').style.display = 'block';
    if (currentRedesIndex === currentRedesQuiz.length - 1) {
        document.getElementById('redes-next-btn').innerText = 'Finalizar';
    } else {
        document.getElementById('redes-next-btn').innerText = 'Siguiente';
    }
}

function nextRedesQuestion() {
    currentRedesIndex++;
    if (currentRedesIndex < currentRedesQuiz.length) {
        renderRedesQuestion();
    } else {
        showRedesResult();
    }
}

function showRedesResult() {
    document.getElementById('redes-quiz-active').style.display = 'none';
    document.getElementById('redes-quiz-result').style.display = 'block';
    
    const resultIcon = document.getElementById('redes-result-icon');
    const resultTitle = document.getElementById('redes-result-title');
    const resultText = document.getElementById('redes-result-text');
    
    const percentage = (redesScore / currentRedesQuiz.length) * 100;
    
    if (percentage >= 80) {
        resultIcon.innerText = '🧠';
        resultTitle.innerText = '¡Cerebro Artificial Activado!';
        resultText.innerText = `Has obtenido un ${percentage}%. Eres oficialmente un experto en Redes Neuronales.`;
    } else if (percentage >= 60) {
        resultIcon.innerText = '⚡';
        resultTitle.innerText = 'Sinapsis Exitosa';
        resultText.innerText = `Has obtenido un ${percentage}%. Tienes una base sólida, sigue profundizando en el Deep Learning.`;
    } else {
        resultIcon.innerText = '🔋';
        resultTitle.innerText = 'Cargando Conocimiento';
        resultText.innerText = `Has obtenido un ${percentage}%. Te recomendamos repasar las capas y funciones de activación.`;
    }
}

function resetRedesQuiz() {
    document.getElementById('redes-quiz-result').style.display = 'none';
    document.getElementById('redes-quiz-active').style.display = 'none';
    document.getElementById('redes-quiz-container').style.display = 'grid';
}

// Initialization
window.addEventListener('resize', initCanvas);
initCanvas();
createParticles();
animate();

document.getElementById('admin-btn').addEventListener('click', () => openModal('admin-modal'));
