import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';

import path from 'path';
import { fileURLToPath } from 'url';

// Setează __dirname pentru modulele ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('src'));
app.use(express.json());
app.set('view engine', 'ejs');

app.use(
  session({
    secret: 'secrectKey123', // schimbă cu cheia ta secretă
    resave: false,
    saveUninitialized: true,
  }),
);

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
  res.sendFile(path.join(__dirname, 'Bau.html'));
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
    res.redirect('/myPlaylist.html');
    //res.status(201).send('Cont creat cu succes!');
    console.log('Utilizator nou înregistrat:', email);
  } catch (err) {
    console.error(err);
    res.status(500).send('Eroare la înregistrare.');
  }
});

app.post('/login100', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(email, password);

    // Caută utilizatorul în baza de date folosind email-ul din formular
    const user = await User.findOne({ email: email });

    console.log('salut');

    // Dacă utilizatorul nu există
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'Utilizatorul nu există.' });
    } else {
      console.log('salut');
      // Verifică dacă parola este corectă
      if (user.password !== password) {
        console.log('Parola greșită');
        return res.status(400).json({
          success: false,
          message: 'Parola este greșită. Reîncercați!',
        });
      }
    }

    // Dacă autentificarea reușește
    req.session.email = email;
    console.log('Autentificare reușită!');
    console.log(user.email);
    res.status(200).json({ success: true, message: 'Autentificare reușită!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Eroare la autentificare. Încercați din nou.',
    });
  }
});

app.listen(3000, () => {
  console.log('Server started on port 3000!');
});
