(function() {
  'use strict';

  // ===== TOAST SYSTEM =====
  function showToast(msg) {
    const existing = document.querySelector('.toast-luna');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-luna';
    toast.textContent = msg;
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#1a1a1a',
      color: '#f0ede8',
      padding: '0.9rem 2.2rem',
      borderRadius: '0',
      letterSpacing: '0.15em',
      fontSize: '0.7rem',
      textTransform: 'uppercase',
      boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
      zIndex: '9999',
      borderLeft: '4px solid #b4946a',
      opacity: '0',
      transition: 'opacity 0.4s ease, transform 0.3s ease',
      fontFamily: "'Montserrat', sans-serif",
      pointerEvents: 'none',
    });
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => toast.remove(), 400);
    }, 2200);
  }

  // ===== 1. BOUTON SHOP NOW =====
  const shopBtn = document.getElementById('shopNowBtn');
  if (shopBtn) {
    shopBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const originalText = this.textContent;
      this.textContent = '✓ Ajouté';
      this.style.background = '#b4946a';
      this.style.color = '#111';
      setTimeout(() => {
        this.textContent = originalText;
        this.style.background = '#1a1a1a';
        this.style.color = '#f5f2ec';
      }, 1200);
      showToast('✨ 18K Solid Gold — Collection prestige');
    });
  }

  // ===== 2. BOUTON SILVER =====
  const silverBtn = document.getElementById('silverBtn');
  if (silverBtn) {
    silverBtn.addEventListener('click', function() {
      const originalText = this.textContent;
      this.textContent = '✓ Exploré';
      this.style.borderColor = '#b4946a';
      this.style.background = '#b4946a';
      this.style.color = 'white';
      setTimeout(() => {
        this.textContent = originalText;
        this.style.background = 'white';
        this.style.color = '#1a1a1a';
        this.style.borderColor = '#b4946a';
      }, 1000);
      showToast('🥈 Silver Plated — élégance accessible');
    });
  }

  // ===== 3. CATÉGORIES =====
  document.querySelectorAll('.cat-item').forEach((el) => {
    el.addEventListener('click', function() {
      const category = this.dataset.category || this.textContent.trim();
      showToast(`🔍 ${category} — collection LUNA`);
    });
  });

  // ===== 4. LUNCH BADGE =====
  const lunchBadge = document.getElementById('lunchBadge');
  if (lunchBadge) {
    lunchBadge.addEventListener('click', function() {
      showToast('🍽️ “Lunch” — Une touche d’humour dans le mockup originel ✨');
    });
  }

  // ===== 5. LOGO =====
  const logo = document.getElementById('logoLink');
  if (logo) {
    logo.addEventListener('click', function(e) {
      e.preventDefault();
      showToast('🌙 LUNA — Joaillerie fine depuis 2026');
    });
  }

  // ===== 6. NAVIGATION LINKS =====
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const page = this.dataset.page || this.textContent.trim();
      showToast(`📍 ${page} — page en construction`);
    });
  });

  // ===== 7. ICÔNES HEADER =====
  document.querySelectorAll('.header-icons i').forEach(icon => {
    icon.addEventListener('click', function() {
      const iconType = this.dataset.icon || '';
      let label = 'Action';
      if (iconType === 'search') label = 'Recherche';
      else if (iconType === 'user') label = 'Compte';
      else if (iconType === 'bag') label = 'Panier';
      showToast(`🛍️ ${label} — bientôt disponible`);
    });
  });

  // ===== 8. FOOTER LINKS =====
  document.querySelectorAll('.footer-links a').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const page = this.dataset.footer || this.textContent.trim();
      showToast(`📄 ${page} — page en construction`);
    });
  });

  // ===== 9. SOCIAL ICONS =====
  document.querySelectorAll('.footer-social i').forEach(icon => {
    icon.addEventListener('click', function() {
      const social = this.dataset.social || 'réseau social';
      showToast(`📱 ${social} — bientôt disponible`);
    });
  });

  console.log('✨ LUNA · design luxe minimaliste actif');
})();
