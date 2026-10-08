'use strict';

const form           = document.getElementById('register-form');
const submitBtn      = document.getElementById('submit-btn');
const messageBox     = document.getElementById('message-box');
const usernameError  = document.getElementById('username-error');
const emailError     = document.getElementById('email-error');
const passwordError  = document.getElementById('password-error');
const confirmError   = document.getElementById('confirm-error');

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className   = `message-box ${type}`;
}

function clearErrors() {
  usernameError.textContent = '';
  emailError.textContent    = '';
  passwordError.textContent = '';
  confirmError.textContent  = '';
  messageBox.className      = 'message-box hidden';
}

function validateForm(username, email, password, confirmPassword) {
  let valid = true;

  if (!username || username.trim().length < 3) {
    usernameError.textContent = 'Username must be at least 3 characters.';
    valid = false;
  }

  if (!email) {
    emailError.textContent = 'Email is required.';
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailError.textContent = 'Enter a valid email address.';
    valid = false;
  }

  if (!password || password.length < 8) {
    passwordError.textContent = 'Password must be at least 8 characters.';
    valid = false;
  }

  if (password !== confirmPassword) {
    confirmError.textContent = 'Passwords do not match.';
    valid = false;
  }

  return valid;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const username        = form.username.value.trim();
  const email           = form.email.value.trim();
  const password        = form.password.value;
  const confirmPassword = form['confirmPassword'].value;

  if (!validateForm(username, email, password, confirmPassword)) return;

  submitBtn.disabled    = true;
  submitBtn.textContent = 'Creating account…';

  try {
    const res  = await fetch('/api/register', {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body:        JSON.stringify({ username, email, password, confirmPassword }),
    });

    const data = await res.json();

    if (res.ok) {
      showMessage(data.message + ' Redirecting to login…', 'success');
      form.reset();
      setTimeout(() => { window.location.href = '/login.html'; }, 1500);
    } else {
      showMessage(data.error || 'Registration failed.', 'error');
    }
  } catch (err) {
    showMessage('Network error. Please try again.', 'error');
  } finally {
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Create Account';
  }
});
