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

// ১. রাউটার লজিক (YouTube-এর মতো স্মুথ পেজ চেঞ্জ)
window.router = {
    async navigate(page) {
        const outlet = document.getElementById('app-outlet');
        const loader = document.getElementById('router-loader');
        
        // লোডার দেখানো
        if(loader) {
            loader.style.display = 'flex';
            loader.style.opacity = '1';
        }

        try {
            const response = await fetch(`${page}.html`);
            if (!response.ok) throw new Error('Page not found');
            const html = await response.text();
            
            // মাঝখানের কন্টেন্ট বদলে দেওয়া
            outlet.innerHTML = html;

            // কন্টেন্টের ভেতরের স্ক্রিপ্টগুলো চালানো (যেমন কার্ড রেন্ডারিং)
            const scripts = outlet.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                newScript.textContent = oldScript.textContent;
                document.body.appendChild(newScript).parentNode.removeChild(newScript);
            });

            // ন্যাভবার আইকন হাইলাইট করা (Active State)
            document.querySelectorAll('nav button').forEach(btn => {
                btn.style.opacity = btn.getAttribute('onclick').includes(page) ? '1' : '0.5';
            });

        } catch (err) {
            outlet.innerHTML = `<div style="text-align:center; padding-top:50px;"><h2>Page not found!</h2></div>`;
            console.error(err);
        }

        // লোডার বন্ধ করা
        setTimeout(() => {
            if(loader) {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 300);
            }
        }, 500);
    }
};

// ২. টাইম ফরম্যাট ফাংশন
window.formatMatchTime = function(timestamp) {
    if (!timestamp) return "TBA";
    let date = (timestamp && timestamp.seconds) ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return `${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} ${date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}`;
};

// ৩. ফায়ারবেস অটো-সিঙ্ক (Wallet & Profile)
onAuthStateChanged(auth, user => {
    if (user) {
        onSnapshot(doc(db, "users", user.uid), docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const total = (data.deposit || 0) + (data.winnings || 0);
                const walletText = document.getElementById("nav-wallet-amount");
                if(walletText) walletText.textContent = total;
                if(data.profilePic) {
                    const profileImg = document.getElementById("nav-profile-img");
                    if(profileImg) profileImg.src = data.profilePic;
                }
            }
        });

        // প্রথমবার ওপেন করলে অটোমেটিক হোম লোড হবে
        if(document.getElementById('app-outlet') && !document.getElementById('app-outlet').innerHTML.trim()) {
            window.router.navigate('home');
        }
    } else {
        if(!window.location.pathname.includes("login.html")) {
            window.location.href = "login.html";
        }
    }
});
