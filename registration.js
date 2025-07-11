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
  console.log("Origin:", window.location.origin); 
  const auth = firebase.auth();
  const db = firebase.firestore();

  document.getElementById('resend-verification-btn').addEventListener('click', () => {
    const user = auth.currentUser;
    if (user) {
      if (!user.emailVerified) {
        user.sendEmailVerification()
          .then(() => alert('Verification email resent!'))
          .catch(err => alert('Error: ' + err.message));
      } else {
        alert('Email is already verified.');
      }
    } else {
      alert('You must be logged in to resend the email.');
    }
  });

  document.getElementById('register-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    auth.createUserWithEmailAndPassword(email, password)
      .then(cred => {
        return db.collection('users').doc(cred.user.uid).set({
          firstName,
          lastName,
          email
        }).then(() => cred.user.sendEmailVerification());
      })
      .then(() => alert('Registered! Verification email sent.'))
      .catch(error => {
        alert('Error: ' + error.message);
        console.error('Registration error:', error);
      });
  });

  document.getElementById('login-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
      .then(cred => {
        if (!cred.user.emailVerified) {
          alert('Email not verified. Click "Resend Email".');
          auth.signOut();
        } else {
          window.location.href = "dashboard.html";
        }
      })
      .catch(error => {
        alert('Error: ' + error.message);
        console.error('Login error:', error);
      });
  });

  document.getElementById('forgot-password-link').addEventListener('click', function (e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;

  if (!email) {
    const manualEmail = prompt("Enter your email address:");
    if (!manualEmail) return;
    sendReset(manualEmail);
  } else {
    sendReset(email);
  }
});

// ✅ Now outside the event listener
function sendReset(targetEmail) {
  auth.sendPasswordResetEmail(targetEmail)
    .then(() => alert('Password reset email sent. Please check your inbox.'))
    .catch((error) => {
      console.error('Error sending password reset email:', error);
      alert('Failed to send reset email. Please double-check your email.');
    });
}

