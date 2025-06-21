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

  let firsts = 0;
  let seconds = 0;
  let thirds = 0;

  // 🔄 Fetch events played
  const eventsSnap = await db.collection('users').doc(doc.id).collection('eventsPlayed').get();
  const eventsPlayed = eventsSnap.size;

  eventsSnap.forEach(eventDoc => {
    const placement = eventDoc.data().placement;
    if (placement === 1) firsts++;
    else if (placement === 2) seconds++;
    else if (placement === 3) thirds++;
  });

  const row = document.createElement('tr');
  let medal = '';
  if (rank === 1) medal = '🥇 ';
  else if (rank === 2) medal = '🥈 ';
  else if (rank === 3) medal = '🥉 ';

  row.innerHTML = `
    <td>${rank}</td>
    <td>${medal}${fullName}</td>
    <td>${points}</td>
    <td>${eventsPlayed}</td>
    <td>${firsts}</td>
    <td>${seconds}</td>
    <td>${thirds}</td>
  `;
  rank++;
  tbody.appendChild(row);
}


      })
      .catch(err => {
        console.error("Error loading league data:", err);
        alert("Could not load league table.");
      });
  });
};
