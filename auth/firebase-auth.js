// 🔐 Firebase Config (PASTE YOURS)
const firebaseConfig = {
    apiKey: "AIzaSyBBZlDnqUvgs0FypnlrmrLzXvzlNTqSQB0",
    authDomain: "nova-editings.firebaseapp.com",
    projectId: "nova-editings",
    appId: "1:951695956594:web:2dca790f249ec09a97c0eb"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ================= GOOGLE LOGIN =================
function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(() => {
            window.location.href = "dashboard.html";
        })
        .catch(err => alert(err.message));
}

// ================= PHONE LOGIN =================
window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
    'recaptcha',
    { size: 'normal' }
);

function sendOTP() {
    const phone = document.getElementById("phone").value;

    auth.signInWithPhoneNumber(phone, window.recaptchaVerifier)
        .then(confirmationResult => {
            window.confirmationResult = confirmationResult;
            document.getElementById("otp").style.display = "block";
            document.getElementById("verifyBtn").style.display = "block";
        })
        .catch(err => alert(err.message));
}

function verifyOTP() {
    const otp = document.getElementById("otp").value;

    window.confirmationResult.confirm(otp)
        .then(() => {
            window.location.href = "dashboard.html";
        })
        .catch(() => alert("Invalid OTP"));
}
