import bcrypt from "bcrypt";

let users = [];
let nextId = 1;

export const UserModel = {
  async register(username, password) {
    const existing = users.find(u => u.username === username);
    if (existing) throw new Error("Nom d'utilisateur déjà pris.");

    const hashed = await bcrypt.hash(password, 10);
    const user = { id: nextId++, username, password: hashed };
    users.push(user);
    return { id: user.id, username: user.username }; // pas de mdp
  },

  async login(username, password) {
    const user = users.find(u => u.username === username);
    if (!user) throw new Error("Utilisateur non trouvé");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Mot de passe incorrect");

    return { id: user.id, username: user.username };
  }
};
