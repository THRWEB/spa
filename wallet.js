// wallet.js - Optimized for Single Page Application
import { 
  getFirestore, doc, onSnapshot, collection, addDoc, serverTimestamp, runTransaction, 
  getDoc, setDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

// ১. হেল্পার ফাংশন
const $ = id => document.getElementById(id);
let withdrawing = false;

// ২. মেইন ইনিশিয়ালাইজেশন ফাংশন (SPA লোড হওয়ার সময় কল হবে)
window.initWalletPage = async function() {
    const user = auth.currentUser;
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);

    // রিয়েল-টাইম ব্যালেন্স লিসেনার (ওয়ালেট পেজের জন্য)
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (!docSnap.exists() || !$('walletTotal_page')) {
            unsubscribe(); // যদি ইউজার পেজ থেকে চলে যায়, লিসেনার বন্ধ হবে
            return;
        }

        const data = docSnap.data();
        const dep = Number(data.deposit || 0);
        const win = Number(data.winnings || 0);
        const total = dep + win;

        // ওয়ালেট পেজের UI আপডেট
        if ($('walletTotal_page')) $('walletTotal_page').innerHTML = `<img src="https://i.postimg.cc/3R7QM12R/wallet-filled-money-tool.png" class="w-10 h-10"> ₹${total}`;
        if ($('depositAmount_page')) $('depositAmount_page').textContent = `₹${dep}`;
        if ($('winningsAmount_page')) $('winningsAmount_page').textContent = `₹${win}`;
    });

    // ৩. Add Money Logic (Cloudinary)
    const addBtn = $("addBtn");
    if (addBtn) {
        addBtn.onclick = () => {
            const amount = parseInt($("amountInput").value);
            if (isNaN(amount) || amount < 10) return alert("Minimum ₹10 required");
            
            $("qrAmount").textContent = amount;
            $("qrWrap").classList.remove("hidden");
            addBtn.classList.add("hidden");
        };
    }

    const paidBtn = $("paidBtn");
    if (paidBtn) {
        paidBtn.onclick = async () => {
            const file = $("proofFile").files[0];
            const amount = parseInt($("amountInput").value);

            if (!file) return alert("Please upload payment screenshot");

            paidBtn.disabled = true;
            paidBtn.textContent = "Uploading...";

            try {
                const fd = new FormData();
                fd.append("file", file);
                fd.append("upload_preset", "screenshots");

                const res = await fetch(`https://api.cloudinary.com/v1_1/dey1abl9g/image/upload`, { method: "POST", body: fd });
                const data = await res.json();

                if (!data.secure_url) throw new Error("Upload failed");

                await addDoc(collection(db, "addMoneyRequests"), {
                    uid: user.uid,
                    email: user.email,
                    amount: amount,
                    proofUrl: data.secure_url,
                    status: "pending",
                    requestTime: serverTimestamp()
                });

                alert("✅ Deposit request submitted!");
                window.router.navigate('home'); // সফল হলে হোমে পাঠিয়ে দাও
            } catch (e) {
                alert("Error: " + e.message);
                paidBtn.disabled = false;
                paidBtn.textContent = "SUBMIT REQUEST";
            }
        };
    }

    // ৪. Withdraw Logic
    const withdrawBtn = $("withdrawBtn");
    if (withdrawBtn) {
        withdrawBtn.onclick = async () => {
            if (withdrawing) return;
            const amt = parseInt($("withdrawAmount").value);
            const upi = $("withdrawUPI").value.trim();

            if (isNaN(amt) || amt < 15) return alert("Minimum ₹15 withdrawal required");
            if (!upi.includes("@")) return alert("Please enter a valid UPI ID");

            withdrawing = true;
            withdrawBtn.textContent = "Processing...";

            try {
                await runTransaction(db, async (transaction) => {
                    const s = await transaction.get(userDocRef);
                    const currentWinnings = Number(s.data().winnings || 0);
                    if (currentWinnings < amt) throw "Insufficient winnings balance!";
                    transaction.update(userDocRef, { winnings: currentWinnings - amt });
                });

                await addDoc(collection(db, "withdrawalRequests"), {
                    uid: user.uid,
                    email: user.email,
                    amount: amt,
                    upi: upi,
                    status: "pending",
                    requestTime: serverTimestamp()
                });

                alert("✅ Withdrawal request submitted!");
                $("withdrawAmount").value = "";
                $("withdrawUPI").value = "";
            } catch (e) {
                alert("❌ " + e);
            } finally {
                withdrawing = false;
                withdrawBtn.textContent = "Withdraw Request";
            }
        };
    }
};

// অটো-রান যখন পেজ লোড হবে
initWalletPage();
