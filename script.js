import { syllabusData } from "./data.js"

// State variables
let currentView = "login"
let selectedTopic = null
let timerInterval = null
let timeLeft = 15 * 60 // 15 minutes in seconds
let userAnswers = {}
let currentQuizQuestions = []
let userEmail = null
let chatHistory = [] // To store chat messages for context

// --- START: AI Configuration ---
// WARNING: Storing API keys directly in client-side code is insecure.
// This should be handled by a backend proxy in a real application.
const API_KEY = "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" // User provided key
// IMPORTANT: Replace with the actual API endpoint URL for 'deekseep' or your provider
// Using OpenRouter as a placeholder for OpenAI-compatible APIs
const API_URL = "https://openrouter.ai/api/v1/chat/completions"
const AI_MODEL = "mistralai/mistral-7b-instruct:free" // Example model, adjust if needed
// --- END: AI Configuration ---

// Simulated database for users (in a real app, this would be in a secure database)
// This is just for demonstration - in production, use a real database like Supabase
const usersDB = [
  { email: "admin@autonoma.edu.pe", password: "admin123", name: "Administrador" },
  { email: "estudiante@autonoma.edu.pe", password: "estudiante123", name: "Estudiante Demo" },
]

// DOM Elements
const views = document.querySelectorAll(".view")
const loginView = document.getElementById("login-view")
const registerView = document.getElementById("register-view")
const topicSelectionView = document.getElementById("topic-selection-view")
const chatView = document.getElementById("chat-view")
const quizView = document.getElementById("quiz-view")
const resultsView = document.getElementById("results-view")

const emailInput = document.getElementById("email-input")
const passwordInput = document.getElementById("password-input")
const loginButton = document.getElementById("login-button")
const registerLinkButton = document.getElementById("register-link")
const loginError = document.getElementById("login-error")
const logoutButton = document.getElementById("logout-button")
const userEmailDisplay = document.getElementById("user-email-display")
const userNameDisplay = document.getElementById("user-name-display")

// Register form elements
const registerForm = document.getElementById("register-form")
const registerNameInput = document.getElementById("register-name-input")
const registerEmailInput = document.getElementById("register-email-input")
const registerPasswordInput = document.getElementById("register-password-input")
const registerConfirmPasswordInput = document.getElementById("register-confirm-password-input")
const registerButton = document.getElementById("register-button")
const registerError = document.getElementById("register-error")
const loginLinkButton = document.getElementById("login-link")

const topicList = document.getElementById("topic-list")
const chatTopicTitle = document.getElementById("chat-topic-title")
const chatTopicContext = document.getElementById("chat-topic-context") // Span for topic in intro message
const topicSummary = document.getElementById("topic-summary") // Still used for initial display
const startQuizButton = document.getElementById("start-quiz-button")
const chatBackButton = document.getElementById("chat-back-button")
// Chat specific elements
const chatMessages = document.getElementById("chat-messages")
const chatInput = document.getElementById("chat-input")
const sendChatButton = document.getElementById("send-chat-button")
const chatLoading = document.getElementById("chat-loading")
const chatError = document.getElementById("chat-error")

const quizTopicTitle = document.getElementById("quiz-topic-title")
const timerDisplay = document.getElementById("timer")
const quizForm = document.getElementById("quiz-form")
const submitQuizButton = document.getElementById("submit-quiz-button")
const quizMessage = document.getElementById("quiz-message")

const resultsTopicTitle = document.getElementById("results-topic-title")
const scoreDisplay = document.getElementById("score")
const resultsDetails = document.getElementById("results-details")
const recommendations = document.getElementById("recommendations")
const tryAgainButton = document.getElementById("try-again-button")
const resultsBackButton = document.getElementById("results-back-button")

// --- Functions ---

function showView(viewId) {
  views.forEach((view) => {
    view.classList.remove("active")
  })
  const activeView = document.getElementById(viewId)
  if (activeView) {
    activeView.classList.add("active")
    currentView = viewId
  } else {
    console.error("View not found:", viewId)
    // Fallback to login view if requested view doesn't exist
    document.getElementById("login-view").classList.add("active")
    currentView = "login"
  }
  // Scroll to top when changing views
  window.scrollTo(0, 0)
}

function validateEmail(email) {
  // Simple validation for @autonoma.edu.pe domain
  const re = /^[a-zA-Z0-9._%+-]+@autonoma\.edu\.pe$/
  return re.test(String(email).toLowerCase())
}

function handleLogin() {
  const email = emailInput.value.trim()
  const password = passwordInput.value // Get password
  loginError.textContent = "" // Clear previous errors

  if (!validateEmail(email)) {
    loginError.textContent = "Por favor, usa un correo válido (@autonoma.edu.pe)"
    return
  }

  if (password === "") {
    loginError.textContent = "Por favor, ingresa tu contraseña."
    return
  }

  // Check if user exists in our simulated database
  const user = usersDB.find((u) => u.email === email && u.password === password)

  if (!user) {
    loginError.textContent = "Credenciales incorrectas. Intenta nuevamente."
    return
  }

  userEmail = email
  // Store user session
  localStorage.setItem("userEmail", userEmail)
  localStorage.setItem("userName", user.name)

  userEmailDisplay.textContent = userEmail
  userNameDisplay.textContent = user.name

  loadTopics()
  showView("topic-selection-view")
  passwordInput.value = "" // Clear password field after login
}

// Update the handleRegister function to prevent form submission and add event listener
function handleRegister(event) {
  if (event) event.preventDefault()

  const name = registerNameInput.value.trim()
  const email = registerEmailInput.value.trim()
  const password = registerPasswordInput.value
  const confirmPassword = registerConfirmPasswordInput.value
  registerError.textContent = "" // Clear previous errors

  // Validate inputs
  if (!name) {
    registerError.textContent = "Por favor, ingresa tu nombre completo."
    return
  }

  if (!validateEmail(email)) {
    registerError.textContent = "Por favor, usa un correo válido (@autonoma.edu.pe)"
    return
  }

  if (password.length < 6) {
    registerError.textContent = "La contraseña debe tener al menos 6 caracteres."
    return
  }

  if (password !== confirmPassword) {
    registerError.textContent = "Las contraseñas no coinciden."
    return
  }

  // Check if user already exists
  if (usersDB.some((u) => u.email === email)) {
    registerError.textContent = "Este correo ya está registrado."
    return
  }

  // Add user to our simulated database
  usersDB.push({ email, password, name })

  // Show success message and redirect to login
  alert("¡Registro exitoso! Ahora puedes iniciar sesión.")
  showView("login-view")

  // Clear registration form
  registerNameInput.value = ""
  registerEmailInput.value = ""
  registerPasswordInput.value = ""
  registerConfirmPasswordInput.value = ""
}

// Update the event listener for the register form
if (registerForm) {
  registerForm.addEventListener("submit", handleRegister)
}

if (registerButton) {
  registerButton.addEventListener("click", handleRegister)
}

function handleLogout() {
  userEmail = null
  localStorage.removeItem("userEmail")
  localStorage.removeItem("userName")
  emailInput.value = "" // Clear input fields
  passwordInput.value = ""
  loginError.textContent = "" // Clear errors
  // Reset state if necessary
  selectedTopic = null
  userAnswers = {}
  stopTimer()
  chatHistory = [] // Clear chat history on logout
  showView("login-view")
}

function loadTopics() {
  topicList.innerHTML = "" // Clear previous topics
  syllabusData.topics.forEach((topic) => {
    const button = document.createElement("button")
    button.textContent = topic.title
    button.dataset.topicId = topic.id
    button.addEventListener("click", () => selectTopic(topic.id))
    topicList.appendChild(button)
  })
}

function selectTopic(topicId) {
  selectedTopic = syllabusData.topics.find((t) => t.id === topicId)
  if (selectedTopic) {
    chatTopicTitle.textContent = selectedTopic.title
    topicSummary.textContent = selectedTopic.summary
    chatTopicContext.textContent = selectedTopic.title // Update context in intro message

    // Reset chat for the new topic
    chatMessages.innerHTML = `
            <div class="message system-message">
                <p>Hola! Soy tu asistente para Metodología de la Investigación. Puedes preguntarme sobre el resumen del tema a continuación o cualquier duda que tengas sobre <strong>${selectedTopic.title}</strong>.</p>
            </div>
            <div class="message system-message">
                <strong>Resumen:</strong>
                <p>${selectedTopic.summary}</p>
            </div>` // Reset messages display
    chatInput.value = "" // Clear input
    chatError.textContent = "" // Clear errors
    chatHistory = [
      // Initialize chat history with system prompt and summary
      {
        role: "system",
        content: `Eres un asistente educativo especializado en Metodología de la Investigación Científica. 
        IMPORTANTE: SOLO debes responder preguntas relacionadas con el tema "${selectedTopic.title}". 
        Si el usuario pregunta sobre cualquier otro tema o solicita información no relacionada con este tema específico, 
        debes responder: "Lo siento, solo puedo responder preguntas relacionadas con ${selectedTopic.title}. 
        Estoy aquí para ayudarte a estudiar este tema específico. ¿Tienes alguna duda sobre ${selectedTopic.title}?".
        Sé claro, conciso y educativo en tus respuestas sobre el tema.`,
      },
      { role: "assistant", content: `Resumen del tema "${selectedTopic.title}": ${selectedTopic.summary}` }, // Add summary as context
    ]
    showView("chat-view")
  } else {
    console.error("Topic not found:", topicId)
    showView("topic-selection-view") // Go back if topic invalid
  }
}

function addMessageToChat(sender, text) {
  const messageDiv = document.createElement("div")
  messageDiv.classList.add("message", sender === "user" ? "user-message" : "ai-message")
  // Basic Markdown-like formatting for bold and lists
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
  text = text.replace(/(\n|^)\* (.*?)/g, "$1<ul><li>$2</li></ul>") // Initial list item
  text = text.replace(/<\/ul>\n<ul>/g, "") // Merge adjacent lists
  // Simple paragraph handling
  text = text
    .split("\n")
    .map((p) => (p.trim() ? `<p>${p}</p>` : ""))
    .join("")
  messageDiv.innerHTML = text // Use innerHTML to render basic HTML like <p>, <strong>, <ul>, <li>
  chatMessages.appendChild(messageDiv)
  // Scroll to the bottom
  chatMessages.scrollTop = chatMessages.scrollHeight

  // Add to chat history for API context (only if not a system message added internally)
  if (sender === "user" || sender === "ai") {
    chatHistory.push({ role: sender === "user" ? "user" : "assistant", content: text })
  }
}

async function sendMessageToAI() {
  const userText = chatInput.value.trim()
  if (!userText || !selectedTopic) return

  addMessageToChat("user", userText)
  chatInput.value = "" // Clear input field
  chatLoading.style.display = "block" // Show loading indicator
  chatError.textContent = "" // Clear previous errors
  sendChatButton.disabled = true // Disable button while waiting
  chatInput.disabled = true

  try {
    // Prepare messages in the format expected by the API
    // Send only the most recent messages to keep context manageable if needed
    const messagesToSend = [...chatHistory] // Send the whole history for now

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
        // Add any other headers required by your specific API provider
        // e.g., 'HTTP-Referer': 'YOUR_SITE_URL', 'X-Title': 'YOUR_APP_TITLE' for OpenRouter identification
      },
      body: JSON.stringify({
        model: AI_MODEL, // Specify the model if required by the endpoint
        messages: messagesToSend,
        // Add other parameters like temperature, max_tokens if needed
        temperature: 0.7,
        max_tokens: 800,
      }),
    })

    chatLoading.style.display = "none" // Hide loading indicator

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) // Try to parse error
      console.error("API Error Response:", errorData)
      throw new Error(`Error ${response.status}: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()

    // Extract the response text - structure might vary based on API
    const aiText = data.choices?.[0]?.message?.content?.trim()

    if (aiText) {
      addMessageToChat("ai", aiText)
    } else {
      console.error("Invalid response structure:", data)
      throw new Error("No se recibió una respuesta válida del asistente.")
    }
  } catch (error) {
    console.error("Error sending message to AI:", error)
    chatLoading.style.display = "none"
    chatError.textContent = `Error al contactar al asistente: ${error.message}. Inténtalo de nuevo.`
  } finally {
    sendChatButton.disabled = false // Re-enable button
    chatInput.disabled = false
    chatInput.focus()
  }
}

function startQuiz() {
  if (!selectedTopic) return

  // Select 10 random questions if more are available, otherwise use all
  const allQuestions = selectedTopic.questions
  currentQuizQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 10)

  quizTopicTitle.textContent = `Quiz: ${selectedTopic.title}`
  quizForm.innerHTML = "" // Clear previous form
  userAnswers = {} // Reset answers
  quizMessage.textContent = "" // Clear any previous messages

  currentQuizQuestions.forEach((q, index) => {
    const questionBlock = document.createElement("div")
    questionBlock.classList.add("question-block")

    const questionText = document.createElement("p")
    questionText.textContent = `${index + 1}. ${q.question}`
    questionBlock.appendChild(questionText)

    q.options.forEach((option, optionIndex) => {
      const label = document.createElement("label")
      const radio = document.createElement("input")
      radio.type = "radio"
      radio.name = `question-${index}`
      radio.value = optionIndex
      radio.id = `q${index}_opt${optionIndex}`
      // Add event listener to store answer immediately
      radio.addEventListener("change", () => {
        userAnswers[index] = Number.parseInt(radio.value, 10)
        console.log("Answer stored:", userAnswers)
      })

      label.appendChild(radio)
      label.appendChild(document.createTextNode(` ${option}`)) // Add space before option text
      questionBlock.appendChild(label)
    })
    quizForm.appendChild(questionBlock)
  })

  timeLeft = 15 * 60 // Reset timer to 15 minutes
  startTimer()
  showView("quiz-view")
}

function startTimer() {
  stopTimer() // Clear any existing timer
  timerInterval = setInterval(() => {
    timeLeft--
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    // Corrected the template literal and seconds formatting
    timerDisplay.textContent = `Tiempo restante: ${minutes}:${seconds < 10 ? "0" + seconds : seconds}`

    if (timeLeft <= 0) {
      stopTimer()
      alert("¡Tiempo agotado!")
      submitQuiz(true) // Auto-submit when time runs out
    }
  }, 1000)
}

function stopTimer() {
  clearInterval(timerInterval)
  timerInterval = null
}

// Function to handle quiz submission (can be called by button or timer)
function submitQuiz(timeExpired = false) {
  stopTimer()

  let score = 0
  let unansweredQuestions = false
  resultsDetails.innerHTML = "" // Clear previous results

  // Check if all questions are answered if time hasn't expired
  if (!timeExpired) {
    for (let i = 0; i < currentQuizQuestions.length; i++) {
      if (userAnswers[i] === undefined) {
        unansweredQuestions = true
        break
      }
    }
  }

  if (unansweredQuestions) {
    quizMessage.textContent = "Por favor, responde todas las preguntas antes de finalizar."
    // Optionally restart timer if needed, or just leave it stopped
    // startTimer(); // Example: restart timer if you want to give them more time after warning
    return // Stop submission
  }

  quizMessage.textContent = "" // Clear message if all answered or time expired

  currentQuizQuestions.forEach((q, index) => {
    const userAnswerIndex = userAnswers[index]
    const correctAnswerIndex = q.correctAnswerIndex
    const isCorrect = userAnswerIndex === correctAnswerIndex

    if (isCorrect) {
      score++
    }

    // Display detailed result for each question
    const resultItem = document.createElement("div")
    resultItem.classList.add("result-item")
    resultItem.classList.add(isCorrect ? "correct" : "incorrect")

    const questionP = document.createElement("p")
    questionP.innerHTML = `<strong>Pregunta ${index + 1}:</strong> ${q.question}`
    resultItem.appendChild(questionP)

    const yourAnswerP = document.createElement("p")
    const userAnswerText = userAnswerIndex !== undefined ? q.options[userAnswerIndex] : "No respondida"
    yourAnswerP.innerHTML = `Tu respuesta: ${userAnswerText}`
    resultItem.appendChild(yourAnswerP)

    if (!isCorrect) {
      const correctAnswerP = document.createElement("p")
      correctAnswerP.innerHTML = `Respuesta correcta: ${q.options[correctAnswerIndex]}`
      resultItem.appendChild(correctAnswerP)
    }

    resultsDetails.appendChild(resultItem)
  })

  const finalScore = `${score} / ${currentQuizQuestions.length}`
  scoreDisplay.textContent = finalScore
  resultsTopicTitle.textContent = `Resultados: ${selectedTopic.title}`

  // Generate recommendations based on score
  let recommendationText = ""
  const percentage = (score / currentQuizQuestions.length) * 100
  if (percentage >= 80) {
    recommendationText = "¡Excelente trabajo! Has demostrado un buen dominio del tema."
  } else if (percentage >= 50) {
    recommendationText = "Buen intento. Repasa los puntos donde tuviste errores para reforzar tu conocimiento."
  } else {
    recommendationText =
      "Parece que necesitas repasar más a fondo este tema. Revisa el resumen y tus respuestas incorrectas."
  }
  recommendations.textContent = recommendationText

  showView("results-view")
}

// --- Event Listeners ---

// Login and Register navigation
if (registerLinkButton) {
  registerLinkButton.addEventListener("click", () => showView("register-view"))
}

if (loginLinkButton) {
  loginLinkButton.addEventListener("click", () => showView("login-view"))
}

// Login form
if (loginButton) {
  loginButton.addEventListener("click", handleLogin)
}

// Register form
if (registerForm) {
  registerForm.addEventListener("submit", handleRegister)
}

if (registerButton) {
  registerButton.addEventListener("click", handleRegister)
}

// Allow login on Enter key press in email or password input
if (emailInput) {
  emailInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      handleLogin()
    }
  })
}

if (passwordInput) {
  passwordInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      handleLogin()
    }
  })
}

if (logoutButton) {
  logoutButton.addEventListener("click", handleLogout)
}

if (chatBackButton) {
  chatBackButton.addEventListener("click", () => {
    selectedTopic = null // Clear selected topic when going back
    chatHistory = [] // Clear chat history
    showView("topic-selection-view")
  })
}

// Chat send button listener
if (sendChatButton) {
  sendChatButton.addEventListener("click", sendMessageToAI)
}

// Allow sending chat message on Enter key press in textarea (Shift+Enter for new line)
if (chatInput) {
  chatInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault() // Prevent default Enter behavior (new line)
      sendMessageToAI()
    }
  })
}

if (startQuizButton) {
  startQuizButton.addEventListener("click", startQuiz)
}

if (submitQuizButton) {
  submitQuizButton.addEventListener("click", () => submitQuiz(false)) // Submit via button
}

if (resultsBackButton) {
  resultsBackButton.addEventListener("click", () => {
    selectedTopic = null // Clear selected topic
    userAnswers = {} // Reset answers
    showView("topic-selection-view")
  })
}

if (tryAgainButton) {
  tryAgainButton.addEventListener("click", () => {
    // Go back to the chat view for the same topic to restart the process
    if (selectedTopic) {
      chatTopicTitle.textContent = selectedTopic.title
      topicSummary.textContent = selectedTopic.summary
      userAnswers = {} // Reset answers
      showView("chat-view")
    } else {
      // Fallback if selectedTopic is somehow lost
      showView("topic-selection-view")
    }
  })
}

// --- Initialization ---

function initializeApp() {
  // Check for existing session
  const savedEmail = localStorage.getItem("userEmail")
  const savedName = localStorage.getItem("userName")

  if (savedEmail && validateEmail(savedEmail)) {
    userEmail = savedEmail
    userEmailDisplay.textContent = userEmail

    if (userNameDisplay && savedName) {
      userNameDisplay.textContent = savedName
    }

    loadTopics()
    showView("topic-selection-view") // Start at topic selection if logged in
  } else {
    showView("login-view")
  }
}

// Start the application
document.addEventListener("DOMContentLoaded", initializeApp)
