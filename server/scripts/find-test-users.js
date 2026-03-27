const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/';

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    let users = await User.find({}).limit(2);
    
    if (users.length < 2) {
      console.log('Creating dummy second user...');
      const dummy = new User({
        name: 'Second User',
        email: 'second@example.com',
        password: 'password123'
      });
      await dummy.save();
      users.push(dummy);
    }

    console.log('---TEST_USERS---');
    users.forEach(u => console.log(u.email));
    console.log('---END_TEST_USERS---');

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
