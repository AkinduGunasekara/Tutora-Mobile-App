// Admin helper (prototype): mark a tutor account as verified so it appears in student search
// and shows "Verified Tutor" on its profile.
//   Usage: node scripts/verify-tutor.js <email> [--undo]
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/modules/auth/User');

const [email, flag] = process.argv.slice(2);
if (!email) {
  console.log('Usage: node scripts/verify-tutor.js <email> [--undo]');
  process.exit(1);
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase(), role: 'tutor' },
    { isVerified: flag !== '--undo' },
    { returnDocument: 'after' }
  );
  console.log(user ? `${user.name} <${user.email}> isVerified = ${user.isVerified}` : 'No tutor found with that email');
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
