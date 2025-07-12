const firebase = require('firebase-admin');

const firebaseConfig = require('./firebaseConfig.json');
firebase.initializeApp({
    credential: firebase.credential.cert(firebaseConfig),
});

module.exports = { firebase };