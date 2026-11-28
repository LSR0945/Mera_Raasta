import axios from 'axios';
import fs from 'fs';
import path from 'path';

const body = {
  name: 'Fast OTP Test',
  email: 'test+fast+1234567890@gmail.com',
  password: 'Test@1234567890',
  role: 'student'
};

const start = Date.now();
axios.post('http://localhost:5000/api/v1/auth/register', body, { 
  headers: { 'Content-Type': 'application/json' }
})
.then(res => {
  const end = Date.now();
  console.log('Registration time:', (end - start) / 1000, 's');
  console.log('Response:', res.data);
  // Check if email sent - backend logs should show
  // We'll also check console log in backend-test2.log
})
.catch(err => {
  const end = Date.now();
  console.log('Registration error after', (end - start) / 1000, 's');
  console.error('Error:', err.response?.data || err.message);
});