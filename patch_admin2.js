const fs = require('fs');
const path = require('path');

const dir = 'views/admin';
const files = fs.readdirSync(dir)
  .filter(f => f.endsWith('.ejs') && f !== 'login.ejs')
  .map(f => path.join(dir, f));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Insert HTML Toggle
  if (!content.includes('class="mobile-nav-toggle"')) {
    content = content.replace(
      '<main class="admin-main">',
      '<main class="admin-main">\n    <div class="mobile-nav-toggle" onclick="document.querySelector(\'.admin-sidebar\').classList.toggle(\'active\')"><i class="fas fa-bars"></i></div>'
    );
  }

  // Insert Desktop CSS
  if (!content.includes('.mobile-nav-toggle { display: none; }')) {
    content = content.replace(
      '.admin-main {',
      '.mobile-nav-toggle { display: none; }\n    .admin-main {'
    );
  }

  // Insert Mobile CSS
  if (!content.includes('position: fixed; top: 20px;')) {
    content = content.replace(
      '@media (max-width: 768px) {',
      `@media (max-width: 768px) {\n      .mobile-nav-toggle { display: flex; position: fixed; top: 20px; right: 20px; z-index: 1000; background: var(--sage-green); color: white; width: 45px; height: 45px; border-radius: 50%; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }\n      .admin-main { padding-top: 80px; }`
    );
  }

  fs.writeFileSync(file, content);
}
console.log('Admin views patched.');
