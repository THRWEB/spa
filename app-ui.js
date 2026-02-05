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
window.auth = getAuth(app);
window.db = getFirestore(app);

window.router = {
    async navigate(page) {
        // হ্যাশ আপডেট করা (যদি আগে থেকে না থাকে)
        if(window.location.hash !== `#${page}`) {
            window.location.hash = page;
        }

        const outlet = document.getElementById('app-outlet');
        const loader = document.getElementById('router-loader');
        
        // হেডার-ফুটার স্থির রেখে শুধু কন্টেন্ট এরিয়ার লোডার দেখানো
        if(loader) {
            loader.style.display = 'flex';
            loader.style.opacity = '1';
        }

        try {
            const response = await fetch(`${page}.html?v=${Date.now()}`);
            if (!response.ok) throw new Error('Page not found');
            const html = await response.text();
            
            // কন্টেন্ট ইনজেক্ট করা
            outlet.innerHTML = html;

            // স্ক্রিপ্ট এক্সিকিউট করা
            const scripts = outlet.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                if (oldScript.type === 'module') newScript.type = 'module';
                newScript.textContent = oldScript.textContent;
                document.body.appendChild(newScript).parentNode.removeChild(newScript);
            });

            // নেভিগেশন বাটনের একটিভ স্টেট আপডেট (তোমার লজিক ঠিক রাখা হয়েছে)
            document.querySelectorAll('.nav-btn').forEach(btn => {
                const clickAttr = btn.getAttribute('onclick') || "";
                if(clickAttr.includes(`'${page}'`)) {
                    btn.classList.add('active');
                    btn.style.opacity = '1';
                } else {
                    btn.classList.remove('active');
                    btn.style.opacity = '0.5';
                }
            });

        } catch (err) {
            outlet.innerHTML = `<div style="text-align:center; padding-top:50px;"><h2>Page not found.</h2></div>`;
            console.error(err);
        }

        // লোডার সরানো
        setTimeout(() => {
            if(loader) {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 300);
            }
        }, 500);
    }
};

// টাইম ফরম্যাট ফাংশন
window.formatMatchTime = function(timestamp) {
    if (!timestamp) return "TBA";
    let date = (timestamp && timestamp.seconds) ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return `${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} ${date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}`;
};

// 🔥 রিফ্রেশ সমস্যা সমাধানের জন্য এই লজিকটি গুরুত্বপূর্ণ
let isInitialLoad = true;

onAuthStateChanged(window.auth, user => {
    if (user) {
        onSnapshot(doc(window.db, "users", user.uid), docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const total = (data.deposit || 0) + (data.winnings || 0);
                const walletText = document.getElementById("nav-wallet-amount");
                if(walletText) walletText.textContent = total;
            }
        });

        // শুধুমাত্র প্রথমবার লোড হওয়ার সময় বা রিফ্রেশ হলে এটি কল হবে
        if (isInitialLoad) {
            const currentHash = window.location.hash.replace('#', '') || 'home';
            window.router.navigate(currentHash);
            isInitialLoad = false;
        }
        
    } else {
        if(!window.location.pathname.includes("login.html") && !window.location.pathname.includes("register.html")) {
            window.location.href = "login.html";
        }
    }
});

// ব্রাউজারের ব্যাক বাটন বা হ্যাশ চেঞ্জ হ্যান্ডেল করা
window.addEventListener('hashchange', () => {
    const currentHash = window.location.hash.replace('#', '') || 'home';
    // যদি আমরা অলরেডি ওই পেজে না থাকি, তবেই নেভিগেট করবো
    window.router.navigate(currentHash);
});
