// ১. ফায়ারবেস ইমপোর্টস
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// তোমার নতুন ফায়ারবেস কনফিগ (Project: ffth01)
const firebaseConfig = {
  apiKey: "AIzaSyB1vzDj_3-tymzU-EomjCIlbMhsoSnDiTU",
  authDomain: "ffth01.firebaseapp.com",
  projectId: "ffth01",
  storageBucket: "ffth01.firebasestorage.app",
  messagingSenderId: "879174774047",
  appId: "1:879174774047:web:386e99dd5c947381c4142a"
};

// ইনিশিয়ালাইজ ফায়ারবেস
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// ২. রাউটার লজিক (SPA - No Refresh)
window.router = {
    async navigate(page) {
        const outlet = document.getElementById('app-outlet');
        const loader = document.getElementById('router-loader');
        
        if(loader) {
            loader.style.display = 'flex';
            loader.style.opacity = '1';
        }

        try {
            const response = await fetch(`${page}.html`);
            if (!response.ok) throw new Error('Page not found');
            const html = await response.text();
            
            outlet.innerHTML = html;

            // কন্টেন্টের ভেতরের স্ক্রিপ্টগুলো রান করানো
            const scripts = outlet.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                newScript.textContent = oldScript.textContent;
                document.body.appendChild(newScript).parentNode.removeChild(newScript);
            });

            // ন্যাভবার আইকন হাইলাইট করা
            document.querySelectorAll('nav button').forEach(btn => {
                const clickAttr = btn.getAttribute('onclick') || "";
                btn.style.opacity = clickAttr.includes(page) ? '1' : '0.5';
            });

        } catch (err) {
            outlet.innerHTML = `<div style="text-align:center; padding-top:50px;"><h2>Oops! Page not found.</h2></div>`;
            console.error(err);
        }

        setTimeout(() => {
            if(loader) {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 300);
            }
        }, 500);
    }
};

// ৩. টাইম ফরম্যাট ফাংশন
window.formatMatchTime = function(timestamp) {
    if (!timestamp) return "TBA";
    let date = (timestamp && timestamp.seconds) ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return `${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} ${date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}`;
};

// ৪. নতুন ফায়ারবেস অটো-সিঙ্ক (Auth & Data)
onAuthStateChanged(auth, user => {
    if (user) {
        // রিয়েল-টাইম ডাটা সিঙ্ক
        onSnapshot(doc(db, "users", user.uid), docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const total = (data.deposit || 0) + (data.winnings || 0);
                
                const walletText = document.getElementById("nav-wallet-amount");
                if(walletText) walletText.textContent = total;
                
                const profileImg = document.getElementById("nav-profile-img");
                if(profileImg && data.profilePic) profileImg.src = data.profilePic;
            }
        });

        // ডিফল্ট পেজ লোড (যদি আউটলেট খালি থাকে)
        const outlet = document.getElementById('app-outlet');
        if(outlet && !outlet.innerHTML.trim()) {
            window.router.navigate('home');
        }
    } else {
        // লগইন না থাকলে রিডাইরেক্ট (SPA ফ্রেমের বাইরে যাওয়ার জন্য)
        if(!window.location.pathname.includes("login.html") && !window.location.pathname.includes("register.html")) {
            window.location.href = "login.html";
        }
    }
});
