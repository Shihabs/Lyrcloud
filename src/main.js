import { isLoggedIn, logout } from './auth.js';
import { getSession } from './session.js';
import './lyrbot.js';

const menuButton = document.querySelector('.menu-button');
const header = document.querySelector('.site-header');

menuButton?.addEventListener('click', () => {
  const isOpen = header.classList.toggle('nav-open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.textContent = isOpen ? '×' : '☰';
});

const loginLink = document.getElementById('login-link');
if (loginLink && isLoggedIn()) {
  const session = getSession();
  const pill = document.createElement('div');
  pill.className = 'user-pill';
  if (session.picture) {
    const avatar = document.createElement('img');
    avatar.className = 'user-avatar';
    avatar.src = session.picture;
    avatar.alt = '';
    pill.append(avatar);
  }
  const dashboard = document.createElement('a');
  dashboard.className = 'link-button';
  dashboard.href = '/dash/';
  dashboard.textContent = 'Dashboard';
  const logoutButton = document.createElement('button');
  logoutButton.className = 'link-button';
  logoutButton.type = 'button';
  logoutButton.textContent = 'Log out';
  logoutButton.addEventListener('click', logout);
  pill.append(dashboard, logoutButton);
  loginLink.replaceWith(pill);
}
