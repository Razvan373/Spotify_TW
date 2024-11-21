import express from 'express';
import mongoose from 'mongoose';

import path from 'path';
import { fileURLToPath } from 'url';

// Setează __dirname pentru modulele ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static('src'));

mongoose
  .connect('mongodb://localhost:27017/loginDB')
  .then(() => console.log('Conexiunea la MongoDB a reușit!'))
  .catch((err) => console.error('Eroare la conectarea cu MongoDB:', err));

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

// Ruta pentru afișarea formularului de login

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'SignIn.html'));
});

// Ruta pentru a primi datele de login și a le stoca în baza de date
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);
    // Verifică dacă utilizatorul există deja
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).send('Email-ul este deja folosit.');
    }

    // Creează și salvează utilizatorul
    const newUser = new User({
      email: email,
      password: password, // Ideal, ar trebui să criptezi parola folosind bcrypt
    });

    await newUser.save();
    res.status(201).send('Cont creat cu succes!');
    console.log('Utilizator nou înregistrat:', email);
  } catch (err) {
    console.error(err);
    res.status(500).send('Eroare la înregistrare.');
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Găsește utilizatorul în baza de date
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).send('Utilizatorul nu există.');
    }

    // Verifică dacă parola este corectă
    if (user.password !== password) {
      // Într-un mediu real, folosește bcrypt pentru a verifica parola criptată
      return res.status(401).send('Parola este greșită.');
    }

    res.send('Autentificare reușită!');
    console.log('Utilizator autentificat:', email);
  } catch (err) {
    console.error(err);
    res.status(500).send('Eroare la autentificare.');
  }
});

app.listen(3000, () => {
  console.log('Server started on port 3000!');
});
