const wrapper = document.querySelector('.wrapper');
const loginLink = document.querySelector('.login-link');
const registerLink = document.querySelector('.register-link');

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

const formType = getQueryParam('form');
if (formType === 'register') {
  wrapper.classList.add('active');
} else if (formType === 'login') {
  wrapper.classList.remove('active');
}
registerLink.addEventListener('click', (e) => {
  wrapper.classList.add('active');
});

loginLink.addEventListener('click', (e) => {
  wrapper.classList.remove('active');
});

document
  .getElementById('loginForm')
  .addEventListener('submit', async function (event) {
    event.preventDefault(); // Previi trimiterea standard a formularului

    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach((error) => error.remove());
    // Preiei datele din formular
    const email = document.querySelector('input[name="email"]').value;
    const password = document.querySelector('input[name="password"]').value;

    try {
      // Trimiți datele la server
      const response = await fetch('/login100', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Dacă autentificarea reușește, redirecționează utilizatorul
        window.location.href = '/myPlaylist.html';
      } else {
        // Dacă există o eroare, afișează mesajul în pagină
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('error-message'); // Stilizează acest element în CSS
        errorDiv.textContent = data.message;
        document.querySelector('.form-box.login').appendChild(errorDiv);
      }
    } catch (err) {
      console.error('Eroare la trimiterea datelor:', err);
    }
  });
