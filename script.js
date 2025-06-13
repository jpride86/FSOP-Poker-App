// Firebase config and login/registration logic
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

  document.getElementById('resend-verification-btn').addEventListener('click', () => {
    const user = auth.currentUser;
    if (user && !user.emailVerified) {
      user.sendEmailVerification().then(() => alert('Verification email sent!'));
    }
  });

  document.getElementById('register-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;

    auth.createUserWithEmailAndPassword(email, password).then(cred => {
      return db.collection('users').doc(cred.user.uid).set({
        firstName, lastName, email
      }).then(() => cred.user.sendEmailVerification());
    }).then(() => {
      alert('Registered! Please verify your email.');
    }).catch(err => alert(err.message));
  });

  document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password).then(cred => {
      if (!cred.user.emailVerified) {
        alert('Email not verified.');
        auth.signOut();
      } else {
        window.location.href = "dashboard.html";
      }
    }).catch(err => alert(err.message));
  });
};
