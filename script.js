// Fonction pour gérer l'inscription
document.getElementById('signupForm')?.addEventListener('submit', function (event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Vérifier si l'utilisateur existe déjà
    if (localStorage.getItem(username)) {
        document.getElementById('signupMessage').innerText = "Cet utilisateur existe déjà.";
    } else {
        localStorage.setItem(username, password);
        document.getElementById('signupMessage').innerText = "Inscription réussie ! Vous pouvez maintenant vous connecter.";
    }
});

// Fonction pour gérer la connexion
document.getElementById('loginForm')?.addEventListener('submit', function (event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    // Vérifier les informations d'identification
    if (localStorage.getItem(username) === password) {
        localStorage.setItem('loggedInUser', username);
        window.location.href = 'profile.html';
    } else {
        document.getElementById('loginMessage').innerText = "Nom d'utilisateur ou mot de passe incorrect.";
    }
});

// Fonction pour afficher les informations du profil
window.onload = function () {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        document.getElementById('userButtons').innerHTML = `
            <span>${loggedInUser}</span>
            <a href="profile.html">Profil</a>
        `;
        document.getElementById('profileInfo').innerText = `Bienvenue, ${loggedInUser}!`;
    } else {
        document.getElementById('userButtons').innerHTML = `
            <a href="login.html">Connexion</a>
        `;
    }

    // Fonction de déconnexion
    document.getElementById('logoutButton')?.addEventListener('click', function () {
        localStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
    });
};
