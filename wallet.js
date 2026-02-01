<style>
    .glass-card { 
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .btn-click:active { transform: scale(0.96); }
    input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { 
      -webkit-appearance: none; margin: 0; 
    }
</style>

<main class="max-w-md mx-auto px-4 space-y-6 py-4">
    <section class="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2rem] shadow-2xl p-8 text-center border border-white/20">
      <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
      <p class="text-emerald-100/80 mb-1 font-bold text-[10px] uppercase tracking-[0.2em]">Total Balance</p>
      <h2 id="walletTotal_page" class="text-white font-black text-5xl flex items-center justify-center gap-3">
        <img src="https://i.postimg.cc/3R7QM12R/wallet-filled-money-tool.png" class="w-10 h-10 drop-shadow-lg">
        ₹0
      </h2>
    </section>

    <section class="grid grid-cols-2 gap-4">
      <div class="glass-card rounded-2xl p-5 text-center shadow-lg">
        <p class="text-gray-400 mb-1 text-[10px] font-bold uppercase tracking-wider">Deposit</p>
        <h2 id="depositAmount_page" class="text-emerald-400 font-black text-2xl">₹0</h2>
      </div>
      <div class="glass-card rounded-2xl p-5 text-center shadow-lg">
        <p class="text-gray-400 mb-1 text-[10px] font-bold uppercase tracking-wider">Winnings</p>
        <h2 id="winningsAmount_page" class="text-yellow-400 font-black text-2xl">₹0</h2>
      </div>
    </section>

    <section class="glass-card rounded-[1.5rem] p-6 space-y-4 shadow-xl">
      <h3 class="text-base font-bold text-emerald-400 flex items-center gap-2">
        <div class="p-1.5 bg-emerald-500/20 rounded-lg">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"></path></svg>
        </div>
        Add Money to Wallet
      </h3>
      <div class="relative">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
        <input id="amountInput" type="number" min="10" placeholder="Min ₹10" class="w-full pl-8 pr-4 py-3.5 rounded-xl bg-black/40 border border-white/10 text-white font-bold focus:border-emerald-500 outline-none transition-all">
      </div>
      <button id="addBtn" class="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg btn-click">Add to Deposit</button>

      <div id="qrWrap" class="mt-5 space-y-4 hidden text-center border-t border-white/5 pt-4">
        <div class="bg-white p-3 rounded-2xl inline-block shadow-inner">
          <img src="https://i.postimg.cc/T1S1SX3t/1769503340588.png" class="w-44 h-44 rounded-lg">
        </div>
        <div class="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 text-emerald-100 text-xs">
          <p class="font-bold text-yellow-400 text-sm mb-1 uppercase tracking-tighter">Scan to Pay</p>
          <p class="opacity-80">Amount: <span class="font-bold text-white text-sm">₹<span id="qrAmount"></span></span></p>
        </div>
        <input type="file" id="proofFile" accept="image/*" class="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-xs text-gray-400">
        <button id="paidBtn" class="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg btn-click transition-all">SUBMIT REQUEST</button>
      </div>
    </section>

    <section class="glass-card rounded-[1.5rem] p-6 space-y-4 shadow-xl">
      <h3 class="text-base font-bold text-yellow-500 flex items-center gap-2">
        <div class="p-1.5 bg-yellow-500/20 rounded-lg">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M4 12h16"></path></svg>
        </div>
        Withdraw Winnings
      </h3>
      <input id="withdrawAmount" type="number" placeholder="Min Amount ₹15" class="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 text-white font-bold focus:border-yellow-500 outline-none transition-all text-sm">
      <input id="withdrawUPI" type="text" placeholder="UPI ID (e.g. name@upi)" class="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 text-white font-bold focus:border-yellow-500 outline-none transition-all text-sm">
      <button id="withdrawBtn" class="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg btn-click">Withdraw Request</button>
    </section>
</main>

<script type="module">
    // Firebase Imports (SPA-friendly)
    import { getFirestore, doc, onSnapshot, collection, addDoc, serverTimestamp, runTransaction } 
    from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
    import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

    const db = getFirestore();
    const auth = getAuth();

    async function startWallet() {
        const user = auth.currentUser;
        if (!user) return;

        // ১. ব্যালেন্স আপডেট
        const userDocRef = doc(db, "users", user.uid);
        onSnapshot(userDocRef, (snap) => {
            if (snap.exists() && document.getElementById('walletTotal_page')) {
                const data = snap.data();
                const dep = Number(data.deposit || 0);
                const win = Number(data.winnings || 0);
                document.getElementById("walletTotal_page").innerHTML = `<img src="https://i.postimg.cc/3R7QM12R/wallet-filled-money-tool.png" class="w-10 h-10"> ₹${dep + win}`;
                document.getElementById("depositAmount_page").textContent = `₹${dep}`;
                document.getElementById("winningsAmount_page").textContent = `₹${win}`;
            }
        });

        // ২. Add Money (QR Show) Logic
        const addBtn = document.getElementById("addBtn");
        const qrWrap = document.getElementById("qrWrap");
        if (addBtn) {
            addBtn.onclick = () => {
                const amt = parseInt(document.getElementById("amountInput").value);
                if (amt < 10 || isNaN(amt)) return alert("Minimum ₹10 required");
                document.getElementById("qrAmount").textContent = amt;
                qrWrap.classList.remove("hidden");
                addBtn.classList.add("hidden");
            };
        }

        // ৩. Cloudinary Upload & Firestore Submit
        const paidBtn = document.getElementById("paidBtn");
        if (paidBtn) {
            paidBtn.onclick = async () => {
                const file = document.getElementById("proofFile").files[0];
                const amt = parseInt(document.getElementById("amountInput").value);
                if (!file) return alert("Please upload screenshot");

                paidBtn.disabled = true;
                paidBtn.textContent = "UPLOADING...";

                try {
                    const fd = new FormData();
                    fd.append("file", file);
                    fd.append("upload_preset", "screenshots");

                    const res = await fetch("https://api.cloudinary.com/v1_1/dey1abl9g/image/upload", { 
                        method: "POST", body: fd 
                    });
                    const data = await res.json();

                    if (!data.secure_url) throw new Error("Upload failed");

                    await addDoc(collection(db, "addMoneyRequests"), {
                        uid: user.uid,
                        amount: amt,
                        proofUrl: data.secure_url,
                        status: "pending",
                        requestTime: serverTimestamp()
                    });

                    alert("✅ Success! Wait for verification.");
                    window.router.navigate('home');
                } catch (e) {
                    alert("Error: " + e.message);
                } finally {
                    paidBtn.disabled = false;
                    paidBtn.textContent = "SUBMIT REQUEST";
                }
            };
        }

        // ৪. Withdraw Logic
        const withdrawBtn = document.getElementById("withdrawBtn");
        if(withdrawBtn) {
            withdrawBtn.onclick = async () => {
                const amt = parseInt(document.getElementById("withdrawAmount").value);
                const upi = document.getElementById("withdrawUPI").value.trim();
                if (amt < 15 || isNaN(amt)) return alert("Min ₹15 withdrawal");
                if (!upi.includes("@")) return alert("Invalid UPI");

                withdrawBtn.disabled = true;
                withdrawBtn.textContent = "Wait...";

                try {
                    await runTransaction(db, async (tx) => {
                        const s = await tx.get(userDocRef);
                        const win = Number(s.data().winnings || 0);
                        if (win < amt) throw "Insufficient balance!";
                        tx.update(userDocRef, { winnings: win - amt });
                    });

                    await addDoc(collection(db, "withdrawalRequests"), {
                        uid: user.uid,
                        amount: amt,
                        upi: upi,
                        status: "pending",
                        requestTime: serverTimestamp()
                    });

                    alert("✅ Withdrawal Request Sent!");
                    window.router.navigate('home');
                } catch (e) {
                    alert("Error: " + e);
                } finally {
                    withdrawBtn.disabled = false;
                    withdrawBtn.textContent = "Withdraw Request";
                }
            };
        }
    }

    // SPA-র জন্য ২ বার ট্রাই করা (তাৎক্ষণিক এবং অল্প বিরতিতে)
    setTimeout(startWallet, 100);
    setTimeout(startWallet, 1000); 
</script>
