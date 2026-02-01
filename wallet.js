// wallet.js - app-ui.js এর সাথে সামঞ্জস্যপূর্ণ সংস্করণ

// Firebase SDK imports (ইম্পোর্টগুলো আগের মতোই থাকবে)
import { 
  getFirestore, doc, onSnapshot, collection, addDoc, serverTimestamp, runTransaction, 
  getDoc, setDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// এখানে আর firebaseConfig বা initializeApp এর দরকার নেই, কারণ app-ui.js সেটি করে ফেলেছে।
const db = getFirestore();
const auth = getAuth();

// Helpers/state (আপনার অরিজিনাল কোড)
const $ = id => document.getElementById(id);
let currentUser = null, userDocRef = null, enteredAmount = 0, withdrawing = false;
let totalsUnsub = null;

const spinner = $("loadingSpinner");
const pageLoadingSpinner = $("pageLoadingSpinner");
function showSpinner() { if (spinner) spinner.classList.remove("hidden"); }
function hideSpinner() { if (spinner) spinner.classList.add("hidden"); }

// ১. ওয়ালেট নিশ্চিত করার লজিক (অপরিবর্তিত)
async function ensureUserWalletDoc() {
  if (!currentUser) return;
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    await setDoc(userDocRef, { deposit: 0, winnings: 0, email: currentUser.email }, { merge: true });
  } else {
    const d = snap.data() || {};
    const patch = {};
    if (typeof d.deposit !== "number") patch.deposit = Number(d.deposit || 0);
    if (typeof d.winnings !== "number") patch.winnings = Number(d.winnings || 0);
    if (Object.keys(patch).length) await updateDoc(userDocRef, patch);
  }
}

// ২. Auth এবং রিয়েল-টাইম ব্যালেন্স লজিক (app-ui.js এর সাথে সিঙ্ক করা)
onAuthStateChanged(auth, async (u) => {
  try {
    if (!u) {
      if (totalsUnsub) { try { totalsUnsub(); } catch(_){} totalsUnsub = null; }
      currentUser = null;
      if (pageLoadingSpinner) pageLoadingSpinner.classList.add("hidden");
      return location.href = "login.html";
    }

    currentUser = u;
    userDocRef = doc(db, "users", u.uid);

    try { await ensureUserWalletDoc(); } catch (_) {}

    if (totalsUnsub) { try { totalsUnsub(); } catch(_){} }
    
    // রিয়েল-টাইম ব্যালেন্স আপডেট
    totalsUnsub = onSnapshot(userDocRef, {
      next: s => {
        if (!s.exists()) return;
        const d = s.data() || {};
        const deposit = Number(d.deposit || 0);
        const winnings = Number(d.winnings || 0);
        const wallet = deposit + winnings;
        
        // ওয়ালেট পেজের মেইন কার্ড আপডেট
        const depositEl = $("depositAmount"), winningsEl = $("winningsAmount"), walletEl = $("walletTotal");
        if (depositEl) depositEl.textContent = "₹" + deposit;
        if (winningsEl) winningsEl.textContent = "₹" + winnings;
        if (walletEl) walletEl.textContent = "₹" + wallet;
        
        // app-ui.js এর হেডারের ব্যালেন্সও আপডেট রাখা
        const navWallet = document.getElementById("nav-wallet-amount");
        if(navWallet) navWallet.textContent = "₹" + wallet;
      },
      error: err => console.warn("User totals listener error:", err)
    });
  } finally {
    if (pageLoadingSpinner) pageLoadingSpinner.classList.add("hidden");
  }
});

// ৩. Add Money Logic (আপনার অরিজিনাল Cloudinary আপলোড লজিক)
const addBtn = $("addBtn"), amountInput = $("amountInput"), paidBtn = $("paidBtn"), proofFile = $("proofFile");
if (addBtn && amountInput) {
  addBtn.onclick = () => {
    enteredAmount = parseInt(amountInput.value);
    if (isNaN(enteredAmount) || enteredAmount < 10) return alert("Minimum ₹10 required");
    const qrAmount = $("qrAmount"), qrWrap = $("qrWrap");
    if (qrAmount) qrAmount.textContent = enteredAmount;
    if (qrWrap) qrWrap.classList.remove("hidden");
    toggleBtn(paidBtn, true);
  };
}

if (paidBtn) {
  paidBtn.onclick = async () => {
    if (!currentUser || !proofFile.files.length || enteredAmount < 10) return alert("Fill all data.");
    
    toggleBtn(paidBtn, false);
    paidBtn.textContent = "Uploading...";
    showSpinner();
    
    try {
      const fd = new FormData();
      fd.append("file", proofFile.files[0]);
      fd.append("upload_preset", "screenshots");
      
      const r = await (await fetch(`https://api.cloudinary.com/v1_1/dey1abl9g/image/upload`, { method: "POST", body: fd })).json();
      if (!r.secure_url) throw Error("Upload failed");

      // অ্যাডমিন রিকোয়েস্ট জমা দেওয়া (Firestore)
      await addDoc(collection(db, "addMoneyRequests"), {
        uid: currentUser.uid,
        email: currentUser.email,
        amount: enteredAmount,
        proofUrl: r.secure_url,
        status: "pending",
        requestTime: serverTimestamp()
      });

      alert("✅ Request submitted!");
      $("qrWrap").classList.add("hidden");
      amountInput.value = "";
      proofFile.value = "";
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      paidBtn.textContent = "Upload";
      hideSpinner();
    }
  };
}

// ৪. Withdraw Logic (আপনার অরিজিনাল Transaction লজিক)
const withdrawBtn = $("withdrawBtn");
if (withdrawBtn) {
  withdrawBtn.onclick = async () => {
    if (withdrawing) return;
    const amt = parseInt($("withdrawAmount").value);
    const upi = $("withdrawUPI").value.trim();
    
    if (isNaN(amt) || amt < 15) return alert("Min ₹15 withdrawal");
    if (!upi.includes("@")) return alert("Invalid UPI ID");
    
    withdrawing = true;
    showSpinner();
    
    try {
      await runTransaction(db, async tx => {
        const s = await tx.get(userDocRef);
        const w = Number(s.data()?.winnings || 0);
        if (w < amt) throw Error("Insufficient winnings balance");
        tx.update(userDocRef, { winnings: w - amt });
      });

      await addDoc(collection(db, "withdrawalRequests"), {
        uid: currentUser.uid,
        email: currentUser.email,
        amount: amt,
        upi,
        status: "pending",
        requestTime: serverTimestamp()
      });

      alert("✅ Withdraw request submitted!");
      $("withdrawAmount").value = "";
      $("withdrawUPI").value = "";
    } catch (e) {
      alert("❌ " + e.message);
    } finally {
      withdrawing = false;
      hideSpinner();
    }
  };
}

// ৫. UI Helpers (অপরিবর্তিত)
function toggleBtn(btn, en) {
  if (!btn) return;
  btn.disabled = !en;
  btn.style.opacity = en ? "1" : "0.3";
  btn.style.cursor = en ? "pointer" : "not-allowed";
}
