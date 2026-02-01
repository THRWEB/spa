import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB1vzDj_3-tymzU-EomjCIlbMhsoSnDiTU",
  authDomain: "ffth01.firebaseapp.com",
  projectId: "ffth01",
  storageBucket: "ffth01.firebasestorage.app",
  messagingSenderId: "879174774047",
  appId: "1:879174774047:web:386e99dd5c947381c4142a"
};

const app = initializeApp(firebaseConfig);

// ✅ এগুলোকে window অবজেক্টে দিচ্ছি যাতে অন্য ফাইল (যেমন match-list.html) সরাসরি ব্যবহার করতে পারে
window.auth = getAuth(app);
window.db = getFirestore(app);



window.router = {
    async navigate(page) {
        const outlet = document.getElementById('app-outlet');
        const loader = document.getElementById('router-loader');
        
        if(loader) {
            loader.style.display = 'flex';
            loader.style.opacity = '1';
        }

        try {
            // পেজ লোড করার সময় পুরনো ক্যাশ ক্লিয়ার করতে একটু ট্রিক ব্যবহার করা হলো
            const response = await fetch(`${page}.html?v=${Date.now()}`);
            if (!response.ok) throw new Error('Page not found');
            const html = await response.text();
            
            outlet.innerHTML = html;

            const scripts = outlet.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                // মডিউল স্ক্রিপ্ট সাপোর্ট করার জন্য
                if (oldScript.type === 'module') newScript.type = 'module';
                newScript.textContent = oldScript.textContent;
                document.body.appendChild(newScript).parentNode.removeChild(newScript);
            });

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

window.formatMatchTime = function(timestamp) {
    if (!timestamp) return "TBA";
    let date = (timestamp && timestamp.seconds) ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return `${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} ${date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}`;
};

onAuthStateChanged(window.auth, user => {
    if (user) {
        onSnapshot(doc(window.db, "users", user.uid), docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const total = (data.deposit || 0) + (data.winnings || 0);
                
                const walletText = document.getElementById("nav-wallet-amount");
                if(walletText) walletText.textContent = total;
                
                const profileImg = document.getElementById("nav-profile-img");
                if(profileImg && data.profilePic) profileImg.src = data.profilePic;
            }
        });

        const outlet = document.getElementById('app-outlet');
        if(outlet && !outlet.innerHTML.trim()) {
            window.router.navigate('home');
        }
    } else {
        if(!window.location.pathname.includes("login.html") && !window.location.pathname.includes("register.html")) {
            window.location.href = "login.html";
        }
    }
});
