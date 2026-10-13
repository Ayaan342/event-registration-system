const form = document.getElementById("registration-form");
const selectedEventInput = document.getElementById("selected-event");
const studentNameInput = document.getElementById("student-name");
const registrationNumberInput = document.getElementById("registration-number");
const emailInput = document.getElementById("email");
const departmentInput = document.getElementById("department");
const yearInput = document.getElementById("year");
const formMessage = document.getElementById("form-message");
const recentRegistrations = document.getElementById("recent-registrations");
const submitButton = form.querySelector("button[type='submit']");

document.querySelectorAll(".register-button").forEach((button) => {
  button.addEventListener("click", () => {
    selectedEventInput.value = button.dataset.event;
    clearMessage();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    form.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });

    window.setTimeout(() => studentNameInput.focus(), reduceMotion ? 0 : 450);
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const registration = {
    event_name: selectedEventInput.value.trim(),
    student_name: studentNameInput.value.trim(),
    registration_number: registrationNumberInput.value.trim(),
    email: emailInput.value.trim(),
    department: departmentInput.value,
    year_of_study: yearInput.value
  };

  const error = validateRegistration(registration);
  if (error) {
    showMessage(error, "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  try {
    const response = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registration)
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Registration could not be completed.");
    }

    const registeredEvent = registration.event_name;
    form.reset();
    showMessage(`Successfully registered for ${registeredEvent}!`, "success");
    await loadRegistrations();
  } catch (error) {
    showMessage(error.message || "Unable to connect to the server.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Registration";
  }
});

form.addEventListener("input", clearErrorMessage);
form.addEventListener("change", clearErrorMessage);

function validateRegistration(registration) {
  if (!registration.event_name) {
    return "Please select an event before submitting the form.";
  }

  const fields = [
    registration.student_name,
    registration.registration_number,
    registration.email,
    registration.department,
    registration.year_of_study
  ];

  if (fields.some((field) => !field)) {
    return "Please fill in all registration fields.";
  }

  const basicEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicEmailPattern.test(registration.email)) {
    return "Please enter a valid email address.";
  }

  return "";
}

function showMessage(message, type) {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
}

function clearMessage() {
  formMessage.textContent = "";
  formMessage.className = "form-message";
}

function clearErrorMessage() {
  if (formMessage.classList.contains("error")) {
    clearMessage();
  }
}

async function loadRegistrations() {
  try {
    const response = await fetch("/registrations");
    if (!response.ok) {
      throw new Error("Unable to load registrations.");
    }

    const registrations = await response.json();
    renderRegistrations(registrations);
  } catch {
    recentRegistrations.innerHTML = '<p class="empty-state">Unable to load recent registrations. Please try again later.</p>';
  }
}

function renderRegistrations(registrations) {
  recentRegistrations.replaceChildren();

  if (registrations.length === 0) {
    recentRegistrations.innerHTML = '<p class="empty-state">No registrations yet. Choose an event to get started.</p>';
    return;
  }

  registrations.forEach((registration) => {
    const item = document.createElement("article");
    item.className = "registration-item";

    item.append(
      createRegistrationField("Student Name", registration.student_name),
      createRegistrationField("Registration Number", registration.registration_number),
      createRegistrationField("Event Name", registration.event_name)
    );

    recentRegistrations.appendChild(item);
  });
}

function createRegistrationField(label, value) {
  const field = document.createElement("span");
  const heading = document.createElement("strong");
  heading.textContent = label;
  field.append(heading, document.createTextNode(value));
  return field;
}

loadRegistrations();
