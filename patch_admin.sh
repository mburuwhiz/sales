for file in views/admin/*.ejs; do
  if [ "$file" != "views/admin/login.ejs" ]; then
    # Inject mobile menu toggle button and responsive overlay logic
    sed -i 's/<main class="admin-main">/<main class="admin-main">\n    <div class="mobile-nav-toggle" onclick="document.querySelector(\x27.admin-sidebar\x27).classList.toggle(\x27active\x27)"><i class="fas fa-bars"><\/i><\/div>/g' "$file"

    # Add CSS for mobile toggle
    sed -i '/@media (max-width: 768px) {/a\      .mobile-nav-toggle { display: block; position: fixed; top: 20px; right: 20px; z-index: 1000; background: var(--sage-green); color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }\n      .admin-main { padding-top: 80px; }' "$file"

    # ensure default state of toggle is hidden on desktop
    sed -i '/\.admin-main {/i\    .mobile-nav-toggle { display: none; }' "$file"
  fi
done
