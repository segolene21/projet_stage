// Transition au clic Login
document.addEventListener('DOMContentLoaded', function() {
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', function() {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      if (!email || !password) {
        alert('Veuillez remplir tous les champs.');
        return;
      }

      document.getElementById('transition').classList.add('active');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
    });
  }
});// Transition au clic Login
document.addEventListener('DOMContentLoaded', function() {
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', function() {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      if (!email || !password) {
        alert('Veuillez remplir tous les champs.');
        return;
      }

      document.getElementById('transition').classList.add('active');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
    });
  }
});