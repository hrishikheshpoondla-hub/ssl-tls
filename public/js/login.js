'use strict';

const form          = document.getElementById('login-form');
const submitBtn     = document.getElementById('submit-btn');
const messageBox    = document.getElementById('message-box');
const emailError    = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className   = `message-box ${type}`;
}

function clearErrors() {
  emailError.textContent    = '';
  passwordError.textContent = '';
  messageBox.className      = 'message-box hidden';
}

function validateForm(email, password) {
  let valid = true;

  if (!email) {
    emailError.textContent = 'Email is required.';
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailError.textContent = 'Enter a valid email address.';
    valid = false;
  }

  if (!password) {
    passwordError.textContent = 'Password is required.';
    valid = false;
  }

  return valid;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const email    = form.email.value.trim();
  const password = form.password.value;

  if (!validateForm(email, password)) return;

  submitBtn.disabled    = true;
  submitBtn.textContent = 'Logging in…';

  try {
    const res  = await fetch('/api/login', {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body:        JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      showMessage('Login successful! Redirecting…', 'success');
      setTimeout(() => { window.location.href = data.redirect || '/dashboard.html'; }, 700);
    } else {
      showMessage(data.error || 'Login failed.', 'error');
    }
  } catch (err) {
    showMessage('Network error. Please try again.', 'error');
  } finally {
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Login';
  }
});
