const readline = require('readline');
const bcrypt = require('bcryptjs');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Contraseña: ', async (password) => {
  try {
    console.log(await bcrypt.hash(password, 12));
  } finally {
    rl.close();
  }
});
