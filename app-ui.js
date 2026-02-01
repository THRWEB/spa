// app-ui.js - Structure & Data Sync Only
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBtRBspf78RSBv6UhS7YG8BjdM3UcCReT8",
  authDomain: "fir-dc7ff.firebaseapp.com",
  projectId: "fir-dc7ff",
  storageBucket: "fir-dc7ff.firebasestorage.app",
  messagingSenderId: "993356367302",
  appId: "1:993356367302:web:726c91c76dc030df73dec7",
  measurementId: "G-9KS20RLBXJ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// ১. টাইম ফরম্যাট ফাংশন
window.formatMatchTime = function(timestamp) {
    if (!timestamp) return "TBA";
    let date = (timestamp && timestamp.seconds) ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    if (isNaN(date.getTime())) return "TBA";
    return `${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} ${date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}`;
};

function initAppUI() {
    // ২. হেডার HTML (ডিজাইন আসবে style.css থেকে)
    const headerHTML = `
    <header>
      <div class="header-container" style="width: 100%; max-width: 80rem; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 0 1rem;">
        <img src="https://i.postimg.cc/c6yPFcLK/IMG-20260113-003634-287.jpg" id="nav-profile-img" style="width: 38px; height: 38px; border-radius: 50%; border: 2px solid white; object-fit: cover;">
        <h1 style="font-size: 18px; font-weight: 800; color: white; margin: 0; letter-spacing: 2px; text-transform: uppercase;">FFTW</h1>
        <button id="walletDisplay" onclick="window.location.href='wallet.html'" style="background: rgba(255, 255, 255, 0.2); padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.4); color: white; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 13px;">
          <img src="https://i.postimg.cc/3R7QM12R/wallet-filled-money-tool.png" style="width:18px; filter: brightness(0) invert(1);">
          <span id="nav-wallet-amount">₹...</span>
        </button>
      </div>
    </header>`;

    // ৩. ন্যাভবার HTML
    const bottomNavHTML = `
    <nav class="bottom-nav">
      <a href="index.html" class="nav-item" id="nav-home"><img src="https://cdn-icons-png.flaticon.com/512/1946/1946436.png"><span>Home</span></a>
      <a href="mymatches.html" class="nav-item" id="nav-matches"><img src="https://cdn-icons-png.flaticon.com/512/13/13973.png"><span>Matches</span></a>
      <a href="refer.html" class="nav-item" id="nav-refer"><img src="https://cdn-icons-png.flaticon.com/512/6537/6537740.png"><span>Refer</span></a>
      <a href="profile.html" class="nav-item" id="nav-profile"><img src="https://cdn-icons-png.flaticon.com/512/1144/1144760.png"><span>Profile</span></a>
    </nav>`;

    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    document.body.insertAdjacentHTML('beforeend', bottomNavHTML);

    // ৪. অ্যাক্টিভ স্টেট লজিক (উন্নত "Includes" মেথড)
    const currentPath = window.location.pathname.toLowerCase();
    
    const navLinks = {
        "index": "nav-home",
        "main": "nav-home",
        "mymatches": "nav-matches",
        "refer": "nav-refer",
        "profile": "nav-profile"
    };

    // লুপ চালিয়ে পাথ চেক করা হচ্ছে
    Object.keys(navLinks).forEach(key => {
        if (currentPath.includes(key)) {
            const targetId = navLinks[key];
            document.getElementById(targetId)?.classList.add("active");
        }
    });

    // একদম হোম ডিরেক্টরিতে থাকলে (/)
    if (currentPath === "/" || currentPath.endsWith("/")) {
        document.getElementById("nav-home")?.classList.add("active");
    }

    // ৫. ফায়ারবেস অটো-সিঙ্ক (Wallet & Profile)
    onAuthStateChanged(auth, user => {
        if (user) {
            onSnapshot(doc(db, "users", user.uid), docSnap => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const total = (data.deposit || 0) + (data.winnings || 0);
                    const walletText = document.getElementById("nav-wallet-amount");
                    if(walletText) walletText.textContent = "₹" + total;
                    if(data.profilePic && document.getElementById("nav-profile-img")) {
                        document.getElementById("nav-profile-img").src = data.profilePic;
                    }
                }
            });
        } else {
            if(!currentPath.includes("login.html") && !currentPath.includes("register.html")) {
                window.location.href = "login.html";
            }
        }
    });
}

// লোডিং স্টেট চেক
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppUI);
} else {
    initAppUI();
}
