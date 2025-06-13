window.onload = function () {
  const firebaseConfig = {
    apiKey: "AIzaSyBwBEYhxIcAxkgJnMNz9fcJ-xWvnUDVUnU",
    authDomain: "new-poker-app-fsop.firebaseapp.com",
    projectId: "new-poker-app-fsop",
    storageBucket: "new-poker-app-fsop.appspot.com",
    messagingSenderId: "942419692077",
    appId: "1:942419692077:web:eb08756b57ceefb7a786a4"
  };

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  const registrationSection = document.getElementById('registration-section');
  const resendBtn = document.getElementById('resend-verification-btn');

  document.getElementById('register-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    auth.createUserWithEmailAndPassword(email, password)
      .then(cred => {
        return db.collection('users').doc(cred.user.uid).set({
          firstName, lastName, email
        }).then(() => cred.user.sendEmailVerification());
      })
      .then(() => {
        alert('Registered! Check your email to verify your account.');
        resendBtn.style.display = 'inline-block';
      })
      .catch(err => alert('Error: ' + err.message));
  });

  resendBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    if (user && !user.emailVerified) {
      user.sendEmailVerification().then(() => {
        alert("Verification email resent.");
      }).catch(err => alert("Error: " + err.message));
    } else {
      alert("You must be logged in and unverified.");
    }
  });

  document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
      .then(cred => {
        if (!cred.user.emailVerified) {
          alert("Email not verified. Click 'Resend Verification Email'.");
          resendBtn.style.display = 'inline-block';
          auth.signOut();
        } else {
          window.location.href = "dashboard.html";
        }
      })
      .catch(err => alert("Login error: " + err.message));
  });

  auth.onAuthStateChanged(user => {
    if (user && user.emailVerified) {
      window.location.href = "dashboard.html";
    }
  });
};