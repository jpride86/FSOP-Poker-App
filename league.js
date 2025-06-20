const firebaseConfig = {
  apiKey: "AIzaSyBwBEYhxIcAxkgJnMNz9fcJ-xWvnUDVUnU",
  authDomain: "new-poker-app-fsop.firebaseapp.com",
  projectId: "new-poker-app-fsop",
  storageBucket: "new-poker-app-fsop.appspot.com",
  messagingSenderId: "942419692077",
  appId: "1:942419692077:web:eb08756b57ceefb7a786a4"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

window.onload = function () {
  auth.onAuthStateChanged(user => {
    if (!user || !user.emailVerified) {
      window.location.href = "index.html";
      return;
    }

    db.collection('users')
      .orderBy('leaguePoints', 'desc')
      .limit(100)
      .get()
      .then(async snapshot => {

        const tbody = document.getElementById('league-body');
        let rank = 1;

        for (const doc of snapshot.docs) {
  const data = doc.data();
  const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
  const points = data.leaguePoints || 0;
  const lifetimeWinnings = data.lifetimeWinnings || 0;

  // 🔄 Count number of events played from subcollection
  const eventsSnap = await db.collection('users').doc(doc.id).collection('eventsPlayed').get();
  const eventsPlayed = eventsSnap.size;

  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${rank++}</td>
    <td>${fullName}</td>
    <td>${points}</td>
    <td>${eventsPlayed}</td>
    <td>$${lifetimeWinnings.toLocaleString()}</td>
  `;

  tbody.appendChild(row);
}

      })
      .catch(err => {
        console.error("Error loading league data:", err);
        alert("Could not load league table.");
      });
  });
};
// 🔁 Rebuild League Table Button handler
document.getElementById('rebuild-league-btn').addEventListener('click', async () => {
  if (!confirm("This will reset all league points and recalculate from finalized events. Continue?")) return;

  try {
    // Step 1: Reset all users
    const usersSnap = await db.collection('users').get();
    for (const doc of usersSnap.docs) {
      await db.collection('users').doc(doc.id).set({
        leaguePoints: 0,
        eventsPlayed: 0
      }, { merge: true });

      const eventsPlayedRef = db.collection('users').doc(doc.id).collection('eventsPlayed');
      const events = await eventsPlayedRef.get();
      for (const eventDoc of events.docs) {
        await eventDoc.ref.delete();
      }
    }

    // Step 2: Loop through finalized events
    const eventsSnap = await db.collection('events').where('finalized', '==', true).get();
    for (const eventDoc of eventsSnap.docs) {
      const eventId = eventDoc.id;
      const rsvpsSnap = await db.collection('events').doc(eventId).collection('rsvps').get();

      for (const rsvp of rsvpsSnap.docs) {
        const data = rsvp.data();
        if (!data.pointsEarned || !data.placement || !data.paid) continue;

        const userRef = db.collection('users').doc(data.userId);
        await userRef.set({
          leaguePoints: firebase.firestore.FieldValue.increment(data.pointsEarned),
          eventsPlayed: firebase.firestore.FieldValue.increment(1)
        }, { merge: true });

        await userRef.collection('eventsPlayed').doc(eventId).set({
          eventId,
          points: data.pointsEarned,
          placement: data.placement,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    alert("✅ League table has been rebuilt.");
    location.reload();
  } catch (error) {
    console.error("Error rebuilding league:", error);
    alert("⚠️ Failed to rebuild league table.");
  }
});
