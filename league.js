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
      .then(snapshot => {
        const tbody = document.getElementById('league-body');
        let rank = 1;

        snapshot.forEach(doc => {
          const data = doc.data();
          const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
          const points = data.leaguePoints || 0;
          const eventsPlayed = data.eventsPlayed || 0;
          const lifetimeWinnings = data.lifetimeWinnings || 0;

          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${rank++}</td>
            <td>${fullName}</td>
            <td>${points}</td>
            <td>${eventsPlayed}</td>
            <td>$${lifetimeWinnings.toLocaleString()}</td>
          `;

          tbody.appendChild(row);
        });
      })
      .catch(err => {
        console.error("Error loading league data:", err);
        alert("Could not load league table.");
      });
  });
};
