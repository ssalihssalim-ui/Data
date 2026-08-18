(function() {
  'use strict';

  // ===== TOAST SYSTEM =====
  function showToast(msg, isError = false) {
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
      background: isError ? '#c0392b' : '#1a1a1a',
      color: '#f0ede8',
      padding: '0.9rem 2.2rem',
      borderRadius: '0',
      letterSpacing: '0.15em',
      fontSize: '0.7rem',
      textTransform: 'uppercase',
      boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
      zIndex: '99999',
      borderLeft: isError ? '4px solid #e74c3c' : '4px solid #e8a87c',
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
    }, 3000);
  }

  // ===== AUTH STATE =====
  function updateUI(user) {
    const userStatus = document.getElementById('userStatus');
    const userIcon = document.getElementById('userIcon');
    
    if (user) {
      const displayName = user.displayName || user.email || 'Utilisateur';
      userStatus.textContent = '👤 ' + displayName.split('@')[0];
      userStatus.className = 'user-status logged-in';
      userIcon.style.color = '#4caf50';
    } else {
      userStatus.textContent = '';
      userStatus.className = 'user-status';
      userIcon.style.color = '';
    }
  }

  // ===== MODAL AUTH =====
  const authOverlay = document.getElementById('authOverlay');
  const userIcon = document.getElementById('userIcon');
  const authClose = document.getElementById('authClose');

  function openAuthModal() {
    authOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeAuthModal() {
    authOverlay.classList.remove('active');
    document.body.style.overflow = '';
    // Reset errors
    document.getElementById('loginError').classList.add('hidden');
    document.getElementById('registerError').classList.add('hidden');
  }

  if (userIcon) {
    userIcon.addEventListener('click', function() {
      const user = firebase.auth().currentUser;
      if (user) {
        // Si déjà connecté, on affiche un toast ou on permet de se déconnecter
        if (confirm('Vous êtes connecté en tant que ' + (user.displayName || user.email) + '. Voulez-vous vous déconnecter ?')) {
          firebase.auth().signOut();
          showToast('👋 Déconnexion réussie');
        }
      } else {
        openAuthModal();
      }
    });
  }

  if (authClose) {
    authClose.addEventListener('click', closeAuthModal);
  }

  authOverlay.addEventListener('click', function(e) {
    if (e.target === authOverlay) {
      closeAuthModal();
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && authOverlay.classList.contains('active')) {
      closeAuthModal();
    }
  });

  // ===== TABS =====
  const tabs = document.querySelectorAll('.auth-tab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      const tabName = this.dataset.tab;
      if (tabName === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
      } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
      }
      // Reset errors
      document.getElementById('loginError').classList.add('hidden');
      document.getElementById('registerError').classList.add('hidden');
    });
  });

  // ===== FIREBASE AUTH =====
  const auth = firebase.auth();

  // ===== LOGIN =====
  const loginBtn = document.getElementById('loginBtn');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const errorDiv = document.getElementById('loginError');

      errorDiv.classList.add('hidden');
      loginBtn.disabled = true;
      loginBtn.textContent = 'Connexion...';

      auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          showToast('✅ Bienvenue ' + (user.displayName || user.email) + ' !');
          closeAuthModal();
          loginForm.reset();
        })
        .catch((error) => {
          errorDiv.classList.remove('hidden');
          let message = 'Erreur de connexion';
          switch (error.code) {
            case 'auth/user-not-found':
              message = 'Aucun compte trouvé avec cet email';
              break;
            case 'auth/wrong-password':
              message = 'Mot de passe incorrect';
              break;
            case 'auth/invalid-email':
              message = 'Email invalide';
              break;
            case 'auth/too-many-requests':
              message = 'Trop de tentatives, réessayez plus tard';
              break;
            default:
              message = error.message;
          }
          errorDiv.textContent = '⚠️ ' + message;
          showToast('⚠️ ' + message, true);
        })
        .finally(() => {
          loginBtn.disabled = false;
          loginBtn.textContent = 'Se connecter';
        });
    });
  }

  // ===== REGISTER =====
  const registerBtn = document.getElementById('registerBtn');
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById('registerName').value.trim();
      const email = document.getElementById('registerEmail').value.trim();
      const password = document.getElementById('registerPassword').value;
      const confirm = document.getElementById('registerConfirm').value;
      const errorDiv = document.getElementById('registerError');

      errorDiv.classList.add('hidden');

      if (!name || !email || !password || !confirm) {
        errorDiv.classList.remove('hidden');
        errorDiv.textContent = '⚠️ Veuillez remplir tous les champs';
        showToast('⚠️ Veuillez remplir tous les champs', true);
        return;
      }

      if (password !== confirm) {
        errorDiv.classList.remove('hidden');
        errorDiv.textContent = '⚠️ Les mots de passe ne correspondent pas';
        showToast('⚠️ Les mots de passe ne correspondent pas', true);
        return;
      }

      if (password.length < 6) {
        errorDiv.classList.remove('hidden');
        errorDiv.textContent = '⚠️ Le mot de passe doit faire au moins 6 caractères';
        showToast('⚠️ Mot de passe trop court (min 6 caractères)', true);
        return;
      }

      registerBtn.disabled = true;
      registerBtn.textContent = 'Création...';

      auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          // Mettre à jour le profil avec le nom
          return userCredential.user.updateProfile({
            displayName: name
          }).then(() => {
            return userCredential.user;
          });
        })
        .then((user) => {
          showToast('🎉 Bienvenue ' + name + ' ! Votre compte est créé');
          closeAuthModal();
          registerForm.reset();
        })
        .catch((error) => {
          errorDiv.classList.remove('hidden');
          let message = 'Erreur d\'inscription';
          switch (error.code) {
            case 'auth/email-already-in-use':
              message = 'Cet email est déjà utilisé';
              break;
            case 'auth/invalid-email':
              message = 'Email invalide';
              break;
            case 'auth/weak-password':
              message = 'Mot de passe trop faible (min 6 caractères)';
              break;
            default:
              message = error.message;
          }
          errorDiv.textContent = '⚠️ ' + message;
          showToast('⚠️ ' + message, true);
        })
        .finally(() => {
          registerBtn.disabled = false;
          registerBtn.textContent = 'Créer mon compte';
        });
    });
  }

  // ===== RESET PASSWORD =====
  document.getElementById('resetPasswordLink').addEventListener('click', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    
    if (!email) {
      showToast('⚠️ Veuillez entrer votre email', true);
      document.getElementById('loginEmail').focus();
      return;
    }

    auth.sendPasswordResetEmail(email)
      .then(() => {
        showToast('📧 Email de réinitialisation envoyé à ' + email);
      })
      .catch((error) => {
        let message = 'Erreur';
        if (error.code === 'auth/user-not-found') {
          message = 'Aucun compte trouvé avec cet email';
        } else {
          message = error.message;
        }
        showToast('⚠️ ' + message, true);
      });
  });

  // ===== SURVEILLANCE DE L'ÉTAT AUTH =====
  auth.onAuthStateChanged((user) => {
    updateUI(user);
    if (user) {
      // Si la modale est ouverte et qu'on est connecté, on la ferme
      if (authOverlay.classList.contains('active')) {
        closeAuthModal();
      }
    }
  });

  // ===== 1. BOUTON SHOP NOW =====
  const shopBtn = document.getElementById('shopNowBtn');
  if (shopBtn) {
    shopBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const user = auth.currentUser;
      if (!user) {
        showToast('🔐 Connectez-vous pour commander', true);
        openAuthModal();
        return;
      }
      const originalText = this.textContent;
      this.textContent = '✓ Ajouté';
      this.style.background = '#e8a87c';
      this.style.color = '#111';
      setTimeout(() => {
        this.textContent = originalText;
        this.style.background = '#1a1a1a';
        this.style.color = '#f5f2ec';
      }, 1200);
      showToast('✨ Produit ajouté au panier');
    });
  }

  // ===== 2. BOUTON DÉCOUVRIR =====
  const silverBtn = document.getElementById('silverBtn');
  if (silverBtn) {
    silverBtn.addEventListener('click', function() {
      const user = auth.currentUser;
      if (!user) {
        showToast('🔐 Connectez-vous pour découvrir', true);
        openAuthModal();
        return;
      }
      const originalText = this.textContent;
      this.textContent = '✓ Exploré';
      this.style.borderColor = '#e8a87c';
      this.style.background = '#e8a87c';
      this.style.color = 'white';
      setTimeout(() => {
        this.textContent = originalText;
        this.style.background = 'white';
        this.style.color = '#1a1a1a';
        this.style.borderColor = '#e8a87c';
      }, 1000);
      showToast('🌿 Collection Wellness — découvrez nos produits');
    });
  }

  // ===== 3. CATÉGORIES =====
  document.querySelectorAll('.cat-item').forEach((el) => {
    el.addEventListener('click', function() {
      const category = this.dataset.category || this.textContent.trim();
      const user = auth.currentUser;
      if (!user) {
        showToast('🔐 Connectez-vous pour voir les ' + category, true);
        openAuthModal();
        return;
      }
      showToast(`🔍 ${category} — découvrez notre sélection`);
    });
  });

  // ===== 4. LUNCH BADGE =====
  const lunchBadge = document.getElementById('lunchBadge');
  if (lunchBadge) {
    lunchBadge.addEventListener('click', function() {
      showToast('🌿 Wellness & Bien-être — MANORA');
    });
  }

  // ===== 5. LOGO =====
  const logo = document.getElementById('logoLink');
  if (logo) {
    logo.addEventListener('click', function(e) {
      e.preventDefault();
      showToast('🌿 MANORA — Beauty & Wellness');
    });
  }

  // ===== 6. ICÔNES HEADER =====
  document.querySelectorAll('.header-icons i').forEach(icon => {
    if (icon.id === 'userIcon') return;
    icon.addEventListener('click', function() {
      const user = auth.currentUser;
      if (!user && this.dataset.icon !== 'search') {
        showToast('🔐 Connectez-vous pour accéder à cette fonction', true);
        openAuthModal();
        return;
      }
      const iconType = this.dataset.icon || '';
      let label = 'Action';
      if (iconType === 'search') label = 'Recherche';
      else if (iconType === 'bag') label = 'Panier';
      showToast(`🛍️ ${label} — bientôt disponible`);
    });
  });

  // ===== 7. FOOTER LINKS =====
  document.querySelectorAll('.footer-links a').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const page = this.dataset.footer || this.textContent.trim();
      showToast(`📄 ${page} — page en construction`);
    });
  });

  // ===== 8. SOCIAL ICONS =====
  document.querySelectorAll('.footer-social i').forEach(icon => {
    icon.addEventListener('click', function() {
      const social = this.dataset.social || 'réseau social';
      showToast(`📱 ${social} — bientôt disponible`);
    });
  });

  console.log('🌿 MANORA · Beauty & Wellness — Firebase Auth intégré');
})();
