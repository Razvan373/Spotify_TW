document.addEventListener('DOMContentLoaded', () => {
  const profileBtn = document.querySelector('.profile-btn');
  const dropdownMenu = document.querySelector('.dropdown-menu');

  // Toggle afișarea meniului când apeși pe buton
  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Previne propagarea evenimentului
    dropdownMenu.style.display =
      dropdownMenu.style.display === 'block' ? 'none' : 'block';
  });

  // Previne închiderea meniului când clickezi în interiorul lui
  dropdownMenu.addEventListener('click', (e) => {
    e.stopPropagation(); // Previne propagarea click-ului către document
  });

  // Închide meniul când clickezi în afara lui
  document.addEventListener('click', () => {
    dropdownMenu.style.display = 'none';
  });
});
