window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
  'recaptcha-container',
  {
    size: 'normal',
    callback: () => {
      console.log("reCAPTCHA solved");
    }
  }
);

const recaptchaVerifier = window.recaptchaVerifier;

// SEND OTP
function sendOTP() {
  const phoneNumber = document.getElementById("phone").value;

  auth.signInWithPhoneNumber(phoneNumber, recaptchaVerifier)
    .then((confirmationResult) => {
      window.confirmationResult = confirmationResult;
      alert("OTP sent");
    })
    .catch((error) => {
      console.error(error);
      alert(error.message);
    });
}

// VERIFY OTP
function verifyOTP() {
  const code = document.getElementById("otp").value;

  confirmationResult.confirm(code)
    .then(async (result) => {
      const user = result.user;

      // 🔥 CREATE USER DOC IF NOT EXISTS
      const userRef = db.collection("users").doc(user.uid);
      const snap = await userRef.get();

      if (!snap.exists) {
        await userRef.set({
          phone: user.phoneNumber,
          role: null,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      // REDIRECT
      window.location.href = "role-selection.html";
    })
    .catch((error) => {
      alert("Invalid OTP");
    });
}
