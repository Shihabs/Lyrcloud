import { isLoggedIn, redirectToLogin } from './auth.js';

const next = new URLSearchParams(location.search).get('next');
const destination = next && next.startsWith('/dash/') ? next : '/dash/';

if (isLoggedIn()) location.replace(destination);

for (const button of document.querySelectorAll('[data-login]')) {
  button.addEventListener('click', () => {
    button.disabled = true;
    redirectToLogin(destination);
  });
}
