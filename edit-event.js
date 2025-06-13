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

  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('id');

  const form = document.getElementById('edit-event-form');
  const msgDiv = document.getElementById('update-message');

  const nameInput = document.getElementById('event-name');
  const locationInput = document.getElementById('event-location');
  const minPlayersInput = document.getElementById('min-players-per-table');
  const maxRsvpInput = document.getElementById('max-rsvp');
  const notesInput = document.getElementById('event-notes');
  const dateInput = document.getElementById('event-date');

  if (!form || !msgDiv || !nameInput || !locationInput || !minPlayersInput || !maxRsvpInput || !notesInput || !dateInput) {
    console.error("❌ One or more required DOM elements are missing.");
    return;
  }

  if (!eventId) {
    msgDiv.textContent = "❌ Event ID is missing.";
    form.style.display = 'none';
    return;
  }

  db.collection('events').doc(eventId).get().then(doc => {
    if (!doc.exists) {
      msgDiv.textContent = "❌ Event not found.";
      form.style.display = 'none';
      return;
    }
    const data = doc.data();
    nameInput.value = data.name || '';
    locationInput.value = data.location || '';
    minPlayersInput.value = data.playersPerTable || '';
    maxRsvpInput.value = data.maxRSVP || '';
    notesInput.value = data.notes || '';

    const dt = data.date.toDate();
    dateInput.value = dt.toISOString().slice(0, 16);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const updatedEvent = {
      name: nameInput.value,
      date: firebase.firestore.Timestamp.fromDate(new Date(dateInput.value)),
      location: locationInput.value,
      playersPerTable: parseInt(minPlayersInput.value),
      maxRSVP: maxRsvpInput.value ? parseInt(maxRsvpInput.value) : null,
      notes: notesInput.value
    };

    db.collection('events').doc(eventId).update(updatedEvent)
      .then(() => {
        msgDiv.textContent = "✅ Event updated successfully.";
      })
      .catch(err => {
        console.error(err);
        msgDiv.textContent = "❌ Failed to update event.";
      });
  });
};
