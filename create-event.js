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

  const dateInput = document.getElementById('event-date');
  const now = new Date();
  const targetDate = new Date();
  targetDate.setHours(19, 0, 0, 0);
  if (now.getTime() > targetDate.getTime()) {
    targetDate.setTime(now.getTime() + 60 * 60 * 1000);
  }

const year = targetDate.getFullYear();
const month = String(targetDate.getMonth() + 1).padStart(2, '0');
const day = String(targetDate.getDate()).padStart(2, '0');
const hours = String(targetDate.getHours()).padStart(2, '0');
const minutes = String(targetDate.getMinutes()).padStart(2, '0');
const localDatetimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
  dateInput.value = localDatetimeString;
  dateInput.min = localDatetimeString;

  document.getElementById('create-event-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const eventName = document.getElementById('event-name').value;
    const eventDate = document.getElementById('event-date').value;
    const location = document.getElementById('event-location').value;
    const playersPerTable = parseInt(document.getElementById('min-players-per-table').value);
    const maxRSVP = document.getElementById('max-rsvp').value ? parseInt(document.getElementById('max-rsvp').value) : null;
    const notes = document.getElementById('event-notes').value;

    if (isNaN(playersPerTable) || playersPerTable < 1) {
      alert('Min players per table must be valid.');
      return;
    }

    db.collection('events').add({
  name: eventName.trim(),
  date: new Date(eventDate),
  location: location.trim(),
  playersPerTable: playersPerTable,
  maxRSVP: maxRSVP,
  notes: notes.trim(),
  finalized: false, // ✅ set by default
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
})
.then(() => {
  document.getElementById('event-message').innerText = '✅ Event created! Redirecting...';
  setTimeout(() => {
    window.location.href = 'dashboard.html'; // change this if your dashboard filename is different
  }, 1000); // waits 1 second before redirecting
})

.catch(err => {
  console.error(err);
  document.getElementById('event-message').innerText = '❌ Failed to create event.';
});

  });
// ✅ Logout button handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.signOut().then(() => {
        window.location.href = 'index.html';
      });
    });
  }
};
