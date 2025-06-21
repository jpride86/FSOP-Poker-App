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

  const logoutBtn = document.getElementById('logout-btn');
  const welcomeMsg = document.getElementById('welcome-msg');
  const eventsList = document.getElementById('events-list');

  auth.onAuthStateChanged(user => {
    if (user && user.emailVerified) {
      const userId = user.uid;

      db.collection('users').doc(userId).get().then(doc => {
        const data = doc.data();
        welcomeMsg.textContent = `Welcome ${data.firstName || "Player"}!`;
      });

      db.collection('events')
        .orderBy('date', 'asc')
        .limit(10)
        .onSnapshot(snapshot => {
          eventsList.innerHTML = '';

          if (snapshot.empty) {
            eventsList.innerHTML = '<p>No events found.</p>';
          } else {
            snapshot.forEach(doc => {
              const data = doc.data();
              const isFinalized = data.finalized === true;
              const eventId = doc.id;
              const date = data.date.toDate().toLocaleString('en-US', {
                dateStyle: 'long',
                timeStyle: 'short'
              });

              const div = document.createElement('div');
              div.style.padding = "12px";
              div.style.border = "1px solid #ccc";
              div.style.borderRadius = "8px";
              div.style.marginBottom = "15px";
              div.style.backgroundColor = "#f9f9f9";

              const rsvpBtn = document.createElement('button');
              rsvpBtn.className = 'rsvp-btn';
              rsvpBtn.dataset.id = eventId;

              // Listen to the individual RSVP status
              db.collection('events').doc(eventId).collection('rsvps').doc(userId)
                .onSnapshot(rsvpDoc => {
                  const isRSVPed = rsvpDoc.exists;
                  rsvpBtn.textContent = isRSVPed ? 'Cancel RSVP' : 'RSVP';
                });

              div.innerHTML = `
  <strong>${data.name}</strong> ${isFinalized ? '✔️ <span style="color:green">(Finalized)</span>' : ''}<br/>
  <p><strong>When:</strong> ${date}</p>
  <p><strong>Where:</strong> ${data.location}</p>
  <p><strong>Min Players per Table:</strong> ${data.playersPerTable}</p>
  <p><strong>Max RSVP:</strong> ${data.maxRSVP || 'N/A'}</p>
  <p><strong>Notes:</strong> ${data.notes || '—'}</p>
`;


              const actions = document.createElement('div');
              actions.className = 'event-actions';
              actions.style.marginTop = "8px";
              actions.style.display = "flex";
              actions.style.flexWrap = "wrap";
              actions.style.gap = "8px";
              actions.style.rowGap = "16px";

              const inviteBtn = document.createElement('button');
              inviteBtn.textContent = "Invite";
              inviteBtn.dataset.id = eventId;

              const viewRsvpsBtn = document.createElement('button');
              viewRsvpsBtn.textContent = "View RSVPs";
              viewRsvpsBtn.dataset.id = eventId;

              const detailsBtn = document.createElement('button');
              detailsBtn.textContent = "Event Details";
              detailsBtn.dataset.id = eventId;

              const editBtn = document.createElement('button');
              editBtn.textContent = "Edit";
              editBtn.dataset.id = eventId;

              const deleteBtn = document.createElement('button');
              deleteBtn.textContent = "Delete";
              deleteBtn.dataset.id = eventId;

              const finalizeBtn = document.createElement('button');
finalizeBtn.textContent = "Finalize Points";
finalizeBtn.dataset.id = eventId;

if (isFinalized) {
  finalizeBtn.disabled = true;
  finalizeBtn.style.opacity = 0.5;
  finalizeBtn.style.cursor = 'not-allowed';
}

              actions.appendChild(inviteBtn);
              actions.appendChild(rsvpBtn);
              actions.appendChild(viewRsvpsBtn);
              actions.appendChild(detailsBtn);
              actions.appendChild(editBtn);
              actions.appendChild(deleteBtn);
              actions.appendChild(finalizeBtn);
              div.appendChild(actions);

              const rsvpListDiv = document.createElement('div');
              rsvpListDiv.className = 'rsvp-list';
              rsvpListDiv.style.display = 'none';
              rsvpListDiv.style.marginTop = '10px';
              div.appendChild(rsvpListDiv);

              eventsList.appendChild(div);

              // RSVP button logic
              rsvpBtn.addEventListener('click', async () => {
  const rsvpRef = db.collection('events').doc(eventId).collection('rsvps').doc(userId);

  try {
    const rsvpDoc = await rsvpRef.get();

    if (rsvpDoc.exists) {
      await rsvpRef.delete();
      alert('RSVP cancelled.');
    } else {
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      await rsvpRef.set({
        userId: userId,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        paid: false,
        dealer: false,
        rebuys: 0,
        knockedOut: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      alert('RSVP confirmed.');
    }
  } catch (err) {
    console.error('RSVP toggle failed:', err);
    alert('Could not update RSVP.');
  }
});


              inviteBtn.addEventListener('click', () => {
                const url = `${window.location.origin}/event-details.html?id=${eventId}`;
                navigator.clipboard.writeText(url)
                  .then(() => alert('Event link copied to clipboard!'))
                  .catch(err => {
                    console.error('Failed to copy link:', err);
                    alert('Could not copy event link.');
                  });
              });

              editBtn.addEventListener('click', () => {
                window.location.href = `edit-event.html?id=${eventId}`;
              });

              detailsBtn.addEventListener('click', () => {
                window.location.href = `event-details.html?id=${eventId}`;
              });

              deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this event?')) {
                  db.collection('events').doc(eventId).delete()
                    .then(() => alert('Event deleted.'))
                    .catch(err => {
                      console.error('Error deleting event:', err);
                      alert('Failed to delete event.');
                    });
                }
              });

              finalizeBtn.addEventListener('click', () => {
                if (confirm('Finalize league points for this event? This action cannot be undone.')) {
                  finalizeEventPoints(eventId);
                }
              });

              viewRsvpsBtn.addEventListener('click', () => {
                const rsvpRef = db.collection('events').doc(eventId).collection('rsvps');

                if (rsvpListDiv.style.display === 'none') {
                  rsvpRef.get().then(snapshot => {
                    if (snapshot.empty) {
                      rsvpListDiv.innerHTML = '<em>No RSVPs yet.</em>';
                    } else {
                      const promises = snapshot.docs.map(doc =>
                        db.collection('users').doc(doc.id).get().then(userDoc => {
                          const u = userDoc.data();
                          return `${u?.firstName || 'Unknown'} ${u?.lastName || ''}`;
                        })
                      );

                      Promise.all(promises).then(names => {
                        const playersPerTable = data.playersPerTable || 7;
                        const confirmedCount = Math.floor(names.length / playersPerTable) * playersPerTable;

                        let html = '<strong>RSVP List:</strong><ul style="padding-left: 20px;">';
                        names.forEach((name, i) => {
                          const confirmed = i < confirmedCount;
                          html += `<li>${name} ${confirmed ? '✅' : '⏳'} ${confirmed ? '(Confirmed)' : '(Waitlist)'}</li>`;
                        });
                        html += '</ul>';
                        rsvpListDiv.innerHTML = html;
                      });
                    }
                    rsvpListDiv.style.display = 'block';
                  });
                } else {
                  rsvpListDiv.style.display = 'none';
                }
              });
            });
          }
        });
    } else {
      window.location.href = "index.html";
    }
  });

  logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => window.location.href = "index.html");
  });
};

async function finalizeEventPoints(eventId) {
  const db = firebase.firestore();
  const eventRef = db.collection('events').doc(eventId);
  const rsvpsRef = eventRef.collection('rsvps');
  const snapshot = await rsvpsRef.get();

  let players = [];

  // Step 1: Reset fields and collect paid players
  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Wipe placement and pointsEarned
    await rsvpsRef.doc(doc.id).update({
      placement: firebase.firestore.FieldValue.delete(),
      pointsEarned: firebase.firestore.FieldValue.delete()
    });

    if (data.paid) {
      players.push({
        id: doc.id,
        knockedOut: data.knockedOut || false,
        knockedOutAt: data.knockedOutAt || 0
      });
    }
  }
console.log(players.map(p => ({ id: p.id, knockedOut: p.knockedOut, knockedOutAt: p.knockedOutAt })));

  // Step 2: Sort players by knockout time (winner last)
  players.sort((a, b) => {
    if (!a.knockedOut && b.knockedOut) return 1;
    if (a.knockedOut && !b.knockedOut) return -1;
    return b.knockedOutAt - a.knockedOutAt;
  });

  // Step 3: Assign points based on final formula
  const numPlayers = players.length;
  for (let i = 0; i < numPlayers; i++) {
    const place = numPlayers - i;
    const raw = 10 * Math.sqrt(numPlayers) / Math.sqrt(place);
    const rounded = Math.round(raw * 100) / 100;
    const points = Math.max(Math.round(3 * (rounded - 9) + 10), 1);

    const userId = players[i].id;

    await db.collection('users').doc(userId).set({
  leaguePoints: firebase.firestore.FieldValue.increment(points)
}, { merge: true });

await rsvpsRef.doc(userId).set({
  placement: place,
  pointsEarned: points
}, { merge: true });

// ✅ ADD this: track event played
await db.collection('users').doc(userId)
  .collection('eventsPlayed')
  .doc(eventId)
  .set({
    eventId,
    points: points,
    placement: place,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });

  }

  await eventRef.set({ finalized: true }, { merge: true });
  alert('League points and placements reset and finalized.');
}
