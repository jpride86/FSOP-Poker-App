
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

const params = new URLSearchParams(window.location.search);
const eventId = params.get('id'); // ✅ Moved here — global
let currentLevelIndex = 0;
let timerInterval = null;
let timeRemaining = 0;
let isPaused = true;
let alarmPlayed = false;

const alarmSound = new Audio('alarm_mixkit.mp3');

const standardBlinds = [
  { level: 1, small: 5, big: 10, duration: 30, type: 'blind' },
  { level: 2, small: 10, big: 20, duration: 30, type: 'blind' },
  { level: 3, small: 15, big: 30, duration: 30, type: 'blind' },
  { level: 'Break 1 - Last Re-buy, $5 color-up', small: 0, big: 0, duration: 5, type: 'break' },
  { level: 4, small: 25, big: 50, duration: 30, type: 'blind' },
  { level: 5, small: 50, big: 100, duration: 30, type: 'blind' },
  { level: 6, small: 100, big: 200, duration: 30, type: 'blind' },
  { level: 'Break 2 - $25 color-up', small: 0, big: 0, duration: 5, type: 'break' },
  { level: 7, small: 200, big: 400, duration: 30, type: 'blind' },
  { level: 8, small: 400, big: 800, duration: 30, type: 'blind' },
  { level: 9, small: 500, big: 1000, duration: 30, type: 'blind' }
];
timeRemaining = standardBlinds[currentLevelIndex].duration * 60;
function logout() {
  auth.signOut().then(() => window.location.href = 'index.html');
}
let wakeLock = null;

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('✅ Wake lock is active');

      wakeLock.addEventListener('release', () => {
        console.log('⚠️ Wake lock was released');
      });
    } else {
      console.warn('Wake Lock API not supported in this browser.');
    }
  } catch (err) {
    console.error(`❌ Wake lock failed: ${err.name}, ${err.message}`);
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && wakeLock === null) {
    requestWakeLock();
  }
});
function startIOSWakeLockFallback() {
  const video = document.getElementById('wake-video');
  if (video) {
    video.play().then(() => {
      console.log('🎬 iOS fallback wake lock video playing.');
    }).catch(err => {
      console.warn('iOS fallback video failed to play:', err);
    });
  }
}

function nextLevel() {
  if (currentLevelIndex < standardBlinds.length - 1) {
    document.getElementById('next-btn').disabled = true;
    setTimeout(() => {
      document.getElementById('next-btn').disabled = false;
    }, 300);

        currentLevelIndex += 1;
    const lvl = standardBlinds[currentLevelIndex];
    timeRemaining = lvl.duration * 60;
    alarmPlayed = false;
    document.body.classList.remove('flash-red');
    
    updateBlindDisplay(); // ✅ ADD THIS LINE

    console.log("Next level:", currentLevelIndex);
syncTimerStateToFirestore(); // ✅ after updating level

  }
}


function previousLevel() {
  if (currentLevelIndex > 0) {
    document.getElementById('previous-btn').disabled = true;
    setTimeout(() => {
      document.getElementById('previous-btn').disabled = false;
    }, 300);

    currentLevelIndex -= 1;
    const lvl = standardBlinds[currentLevelIndex];
    timeRemaining = lvl.duration * 60;
    alarmPlayed = false;
    document.body.classList.remove('flash-red');
    updateBlindDisplay();
    console.log("Previous level:", currentLevelIndex);
syncTimerStateToFirestore(); // ✅ after updating level

  }
}


window.onload = function () {
  (async () => {
    await requestWakeLock();
    startIOSWakeLockFallback(); // Optional: add iOS fallback if needed

    const eventInfo = document.getElementById('event-info');
const rsvpSection = document.getElementById('rsvp-section');

// ✅ Add this block to handle "Return to Dashboard"
const dashboardBtn = document.getElementById('dashboard-btn');
if (dashboardBtn) {
  dashboardBtn.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });
}

 
  if (!eventId) {
    eventInfo.textContent = 'Event ID not found in URL.';
    return;
  }

  const doc = await db.collection('events').doc(eventId).get();
  if (!doc.exists) {
    eventInfo.textContent = 'Event not found.';
    return;
  }

  const data = doc.data();
  document.getElementById('buy-in').value = data.buyIn || 50;
document.getElementById('dealer-fee').value = data.dealerFee || 0;
document.getElementById('starting-chips').value = data.startingChips || 2000;



  document.getElementById('save-settings').addEventListener('click', () => {
    const buyIn = parseFloat(document.getElementById('buy-in').value);
const dealerFee = parseFloat(document.getElementById('dealer-fee').value);
const startingChips = parseFloat(document.getElementById('starting-chips').value);
db.collection('events').doc(eventId).update({ buyIn, dealerFee, startingChips }).then(() => {
  alert('Settings updated.');
});
  });

  const rsvpSnapshot = await db.collection('events').doc(eventId).collection('rsvps').get();
  if (rsvpSnapshot.empty) return;

  const players = await Promise.all(rsvpSnapshot.docs.map(async rsvpDoc => {
    const userDoc = await db.collection('users').doc(rsvpDoc.id).get();
    return {
      id: rsvpDoc.id,
      ...userDoc.data(),
      ...rsvpDoc.data()
    };
  }));

  let html = "<strong>RSVP'd Players:</strong><ul>";
players.forEach((p, i) => {
  html += `
  <li class="${p.knockedOut ? 'knocked-out' : ''}" style="margin-bottom: 20px;">
    <div style="font-weight: bold; margin-bottom: 5px;">
      ${p.firstName || 'Unknown'} ${p.lastName || ''}
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
      <button onclick="togglePaid('${eventId}', '${p.id}', this)">
        ${p.paid ? '✅ Paid' : '❌ Not Paid'}
      </button>
      <button onclick="toggleDealer('${eventId}', '${p.id}', this)">
        ${p.dealer ? '🃏 Dealer' : 'Assign Dealer'}
      </button>
      <button class="rebuy-btn" onclick="addRebuy('${eventId}', '${p.id}', this)">
        Rebuy (${p.rebuys || 0})
      </button>
      <button onclick="addRebuy('${eventId}', '${p.id}', this, 'down')">
        Undo Rebuy
      </button>
      <button onclick="toggleKnockout('${eventId}', '${p.id}', this)">
        ${p.knockedOut ? '🔁 Undo Knockout' : '💀 Knockout'}
      </button>
    </div>
  </li>
`;

});

  html += '</ul><br/><button onclick="markAllPaid()">Mark All Paid</button>';

const buyIn = parseFloat(document.getElementById('buy-in').value) || 50;
const dealerFee = parseFloat(document.getElementById('dealer-fee').value) || 0;

const paidPlayers = players.filter(p => p.paid);
const nonDealerCount = paidPlayers.filter(p => !p.dealer).length;
const totalRebuys = players.reduce((sum, p) => sum + (p.rebuys || 0), 0);
const pot = buyIn * (paidPlayers.length + totalRebuys);
const dealerCut = dealerFee * nonDealerCount;

rsvpSection.innerHTML = html;

updatePotAndPayouts();  // Initial rendering of totals
updateDealerPayoutSection();
document.getElementById('pot-info').style.display = 'block';
  rsvpSection.style.display = 'block';

  // ✅ Knockout List Rendering
const knockedOutPlayers = players
  .filter(p => p.knockedOut && p.knockedOutAt)
  .sort((a, b) => a.knockedOutAt - b.knockedOutAt);
  console.log("Knocked out players:", knockedOutPlayers);


if (knockedOutPlayers.length > 0) {
  const knockoutSection = document.getElementById('knockout-section');
  const knockoutList = document.getElementById('knockout-list');
  knockoutList.innerHTML = '';

  knockedOutPlayers.forEach((p, i) => {
    const li = document.createElement('li');
    li.textContent = `${p.firstName || 'Unknown'} ${p.lastName || ''} (Place: ${players.length - i})`;
    knockoutList.appendChild(li);
  });

  knockoutSection.style.display = 'block';
}
document.getElementById('next-btn')?.addEventListener('click', nextLevel);
document.getElementById('previous-btn')?.addEventListener('click', previousLevel);

// ✅ Final call to update display — place at end of window.onload:
updateBlindDisplay();

})(); // ✅ Closes the async IIFE
};      // ✅ Closes window.onload

function togglePaid(eventId, userId, btn) {
  const ref = firebase.firestore().collection('events').doc(eventId).collection('rsvps').doc(userId);
  ref.get().then(doc => {
    const paid = !doc.data().paid;
    ref.update({ paid }).then(() => {
      btn.textContent = paid ? '✅ Paid' : '❌ Not Paid';
      updatePotAndPayouts(); // ✅ Refresh pot/payout display
    });
  });
}


function toggleDealer(eventId, userId, btn) {
  const ref = firebase.firestore().collection('events').doc(eventId).collection('rsvps').doc(userId);
  ref.get().then(doc => {
    const dealer = !doc.data().dealer;
    ref.update({ dealer }).then(() => {
      btn.textContent = dealer ? '🃏 Dealer' : 'Assign Dealer';
      updatePotAndPayouts();  // ✅ Add this to refresh dealer fee calculation
    });
  });
}


function addRebuy(eventId, userId, btn, direction = 'up') {
  const ref = firebase.firestore().collection('events').doc(eventId).collection('rsvps').doc(userId);
  ref.get().then(doc => {
    let rebuys = doc.data().rebuys || 0;

    if (direction === 'down') {
      if (rebuys === 0) return; // Prevent negative rebuys
      rebuys -= 1;
    } else {
      rebuys += 1;
    }

    ref.update({ rebuys }).then(() => {
      // Update all buttons within the same <li>
      const li = btn.closest('li');
      if (li) {
        const rebuyBtn = li.querySelector('.rebuy-btn');
        if (rebuyBtn) rebuyBtn.textContent = `Rebuy (${rebuys})`;
      }
      updatePotAndPayouts();
    });
  });
}

function markAllPaid() {
  if (!confirm("Mark all players as paid?")) return;

  db.collection('events').doc(eventId).collection('rsvps').get().then(snapshot => {
    const batch = db.batch();

    snapshot.forEach(doc => {
      const ref = db.collection('events').doc(eventId).collection('rsvps').doc(doc.id);
      batch.update(ref, { paid: true });
    });

    batch.commit().then(() => {
      alert('All players marked as paid.');

      // Update button text
      document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.includes('Not Paid')) {
          btn.textContent = '✅ Paid';
        }
      });

      updatePotAndPayouts(); // ✅ Refresh UI
    });
  });
}




function generatePayoutTable(playerCount, pot) {
  let structure;

  if (playerCount <= 10) {
    structure = [
      { place: '1st', percent: 50 },
      { place: '2nd', percent: 30 },
      { place: '3rd', percent: 20 },
    ];
  } else if (playerCount <= 20) {
    structure = [
      { place: '1st', percent: 50 },
      { place: '2nd', percent: 25 },
      { place: '3rd', percent: 15 },
      { place: '4th', percent: 10 },
    ];
  } else {
    structure = [
      { place: '1st', percent: 40 },
      { place: '2nd', percent: 25 },
      { place: '3rd', percent: 20 },
      { place: '4th', percent: 10 },
      { place: '5th', percent: 5 },
    ];
  }

  // Step 1: Raw payout amounts
  let payouts = structure.map(s => ({
    ...s,
    rawAmount: (s.percent / 100) * pot
  }));

  // Step 2: Round each down to nearest $5
  payouts = payouts.map(s => ({
    ...s,
    roundedAmount: Math.floor(s.rawAmount / 5) * 5
  }));

  // Step 3: Calculate leftover and assign to 1st place
  const totalRounded = payouts.reduce((sum, s) => sum + s.roundedAmount, 0);
  let leftover = Math.floor(pot - totalRounded); // Never overpay

  // Add leftover to 1st place without exceeding their original raw amount
  if (leftover > 0) {
    let first = payouts[0];
    const maxTopUp = Math.floor(first.rawAmount - first.roundedAmount);
    const bonus = Math.min(leftover, Math.floor(maxTopUp / 5) * 5);
    payouts[0].roundedAmount += bonus;
    leftover -= bonus;
  }

  // Display
  let html = '<br/><strong>Payout Structure (rounded down to nearest $5):</strong><ul>';
  payouts.forEach(s => {
    html += `<li>${s.place}: ${s.percent}% → $${s.roundedAmount.toFixed(2)}</li>`;
  });
  html += '</ul>';

  return html;
}
function updateDealerPayoutSection() {
  const dealerFee = parseFloat(document.getElementById('dealer-fee').value || 0);

  db.collection('events').doc(eventId).collection('rsvps').get().then(async snapshot => {
    const players = await Promise.all(snapshot.docs.map(async rsvpDoc => {
      const userDoc = await db.collection('users').doc(rsvpDoc.id).get();
      return {
        id: rsvpDoc.id,
        ...userDoc.data(),
        ...rsvpDoc.data()
      };
    }));

    const dealers = players.filter(p => p.dealer);
    const payingPlayers = players.filter(p => p.paid && !p.dealer).length;

    const totalCollected = payingPlayers * dealerFee;
    const payoutPerDealer = dealers.length > 0 ? (totalCollected / dealers.length).toFixed(2) : 0;

    const dealerSection = document.getElementById('dealer-payout-section');
    if (dealerSection) {
      dealerSection.innerHTML = `
<h3>💰 Dealer Payout</h3>        <p><strong>Total Collected:</strong> $${totalCollected.toFixed(2)}</p>
        <p><strong>Number of Dealers:</strong> ${dealers.length}</p>
        <p><strong>Payout Per Dealer:</strong> $${payoutPerDealer}</p>
        <ul>
          ${dealers.map(d => `<li>${d.firstName || 'Unknown'} ${d.lastName || ''} → $${payoutPerDealer}</li>`).join('')}
        </ul>
      `;
    }
  });
}



function updatePotAndPayouts() {
  const buyIn = parseFloat(document.getElementById('buy-in').value) || 50;
  const dealerFee = parseFloat(document.getElementById('dealer-fee').value) || 0;

  db.collection('events').doc(eventId).collection('rsvps').get().then(async snapshot => {
    const players = await Promise.all(snapshot.docs.map(async rsvpDoc => {
      const userDoc = await db.collection('users').doc(rsvpDoc.id).get();
      return {
        ...userDoc.data(),
        ...rsvpDoc.data()
      };
    }));

    const paidPlayers = players.filter(p => p.paid);
    const nonDealerCount = paidPlayers.filter(p => !p.dealer).length;
    const totalRebuys = players.reduce((sum, p) => sum + (p.rebuys || 0), 0);
    const pot = buyIn * (paidPlayers.length + totalRebuys);
    const dealerCut = dealerFee * nonDealerCount;

    const potSection = document.getElementById('pot-info');
    if (potSection) {
      const startingChips = parseFloat(document.getElementById('starting-chips').value) || 1500;
const totalChips = startingChips * (paidPlayers.length + totalRebuys);
const avgChips = totalChips / players.length;

document.getElementById('total-chips-text').innerHTML = `<strong>Total Chips in Play:</strong> ${totalChips.toLocaleString()}`;
document.getElementById('average-stack-text').innerHTML = `<strong>Average Stack:</strong> ${Math.round(avgChips).toLocaleString()}`;

potSection.innerHTML =
  `<h3>💰 Payout Structure</h3>` +
  `<strong>Total Pot (Buy-ins + Rebuys):</strong> $${pot.toFixed(2)}<br/>` +
  generatePayoutTable(players.length, pot);

  updateDealerPayoutSection();


    }
  });
}

function toggleKnockout(eventId, userId, btn) {
  const ref = firebase.firestore().collection('events').doc(eventId).collection('rsvps').doc(userId);
  ref.get().then(doc => {
    const current = doc.data();
    const knockedOut = !current.knockedOut;
    const update = knockedOut
      ? { knockedOut, knockedOutAt: Date.now() }
      : { knockedOut, knockedOutAt: firebase.firestore.FieldValue.delete() };

    ref.update(update).then(() => {
      // Update button text
      btn.textContent = knockedOut ? '🔁 Undo Knockout' : '💀 Knockout';

      // Update LI class (line-through if knocked out)
      const li = btn.closest('li');
      if (li) {
        if (knockedOut) {
          li.classList.add('knocked-out');
        } else {
          li.classList.remove('knocked-out');
        }
      }

      // Re-render knockout list
      updateKnockoutList(eventId);
    });
  });
}
function getPoints(place, totalPlayers) {
  // Example: WSOP-style point system
  if (place === 1) return totalPlayers * 10;
  if (place === 2) return Math.floor(totalPlayers * 7);
  if (place === 3) return Math.floor(totalPlayers * 5);
  return Math.max(totalPlayers - place + 1, 1);
}


async function updateKnockoutList(eventId) {
  const rsvpSnapshot = await db.collection('events').doc(eventId).collection('rsvps').get();
  const players = await Promise.all(rsvpSnapshot.docs.map(async rsvpDoc => {
    const userDoc = await db.collection('users').doc(rsvpDoc.id).get();
    return {
      id: rsvpDoc.id,
      ...userDoc.data(),
      ...rsvpDoc.data()
    };
  }));

  const knockoutSection = document.getElementById('knockout-section');
  const knockoutList = document.getElementById('knockout-list');
  knockoutList.innerHTML = '';

  const knockedOutPlayers = players
    .filter(p => p.knockedOut && p.knockedOutAt)
    .sort((a, b) => a.knockedOutAt - b.knockedOutAt);

  if (knockedOutPlayers.length > 0) {
  knockedOutPlayers.forEach((p, i) => {
    const place = players.length - i;
    const points = getPoints(place, players.length);
    const li = document.createElement('li');
    li.textContent = `${p.firstName || 'Unknown'} ${p.lastName || ''} (Place: ${place}, Points: ${points})`;
    knockoutList.appendChild(li);
  });

  // 🏆 Add winner (last standing player)
  const knockedOutIds = new Set(knockedOutPlayers.map(p => p.id));
  const winner = players.find(p => !knockedOutIds.has(p.id));
  if (winner) {
    const li = document.createElement('li');
    li.innerHTML = `🏆 ${winner.firstName || 'Unknown'} ${winner.lastName || ''} <strong>(1st Place, Points: ${getPoints(1, players.length)})</strong>`;
    knockoutList.insertBefore(li, knockoutList.firstChild);
  }

  knockoutSection.style.display = 'block';
} else {
  knockoutSection.style.display = 'none';
}



function updateBlindDisplay() {
  const lvl = standardBlinds[currentLevelIndex];
  const elLevel = document.getElementById('current-level');
  const elBlinds = document.getElementById('blinds');

  if (lvl.type === 'break') {
    elLevel.textContent = lvl.level;
    elLevel.style.color = 'red';
    elBlinds.textContent = '';
  } else {
    elLevel.innerHTML = `<strong>Level ${lvl.level}</strong>`;
    elBlinds.innerHTML = `<strong>Blinds:</strong> ${lvl.small} (S) / ${lvl.big} (B)`;
  }

  // ✅ Always update the timer display
  document.getElementById('timer').innerHTML = `<strong>Duration:</strong> ${formatTime(timeRemaining)}`;
}
function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function flashRed() {
  document.body.classList.add('flash-red');
}

function startTimer() {
  if (!isPaused || timerInterval) return; // ✅ prevent multiple intervals
  isPaused = false;


  timerInterval = setInterval(() => {
  if (timeRemaining > 0) {
    timeRemaining--;
    document.getElementById('timer').innerHTML = `<strong>Duration:</strong> ${formatTime(timeRemaining)}`;
    syncTimerStateToFirestore(); // ✅ sync every second

      if (timeRemaining === 60 && !alarmPlayed) {
        alarmPlayed = true;
        flashRed();
        alarmSound.play();
        setTimeout(() => {
          alarmSound.pause();
          alarmSound.currentTime = 0;
        }, 5000);
      }
    } else {
      pauseTimer(); // Manual advance
    }
  }, 1000);
}

function pauseTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  isPaused = true;
}


function resetTimer() {
  pauseTimer();
  currentLevelIndex = 0;
  timeRemaining = standardBlinds[0].duration * 60;
  alarmPlayed = false;
  document.body.classList.remove('flash-red');
  updateBlindDisplay();
syncTimerStateToFirestore(); // ✅ broadcast reset

}

db.collection('events').doc(eventId).collection('timer').doc('state')
  .onSnapshot(doc => {
    if (doc.exists) {
      const data = doc.data();

      // Only update if something changed
      if (
        data.currentLevelIndex !== currentLevelIndex ||
        data.timeRemaining !== timeRemaining ||
        data.isPaused !== isPaused
      ) {
        currentLevelIndex = data.currentLevelIndex;
        timeRemaining = data.timeRemaining;
        isPaused = data.isPaused;

        if (!isPaused) startTimer();
        else pauseTimer();

        updateBlindDisplay();
      }
    }
  });

