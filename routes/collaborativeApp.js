import { Server } from "socket.io";
import { NoteModel } from "../models/noteModel.js";
import { UserModel } from "../models/userModel.js";
import jwt from "jsonwebtoken";


const notes = [];
let nextId = 1;

export function initCollaborativeApp(app, server) {
  const io = new Server(server, { cors: { origin: "*" } });

  // --- Socket.IO : connexion client ---
  io.on("connection", (socket) => {
    console.log(`[Collaborative App] Client connecté : ${socket.id}`);
  });

  // --- Routes REST ---
  app.get("/collaborativeApp/api/notes", (req, res) => {
    res.json(NoteModel.getAll());
  });

  app.post("/collaborativeApp/api/notes", (req, res) => {
    const { content } = req.body;
    const note = NoteModel.add(content);
    notes.push(note);
    io.emit("notes_updated", notes);
    res.status(201).json(note);
  });

  app.put("/collaborativeApp/api/notes/:id", (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const note = NoteModel.update(Number(id), content);
    if (!note) return res.status(404).json({ error: "Note non trouvée" });
    note.content = content;
    io.emit("notes_updated", notes);
    res.json(note);
  });

  app.delete("/collaborativeApp/api/notes/:id", (req, res) => {
    const id = parseInt(req.params.id);
    NoteModel.delete(id);
    io.emit("notes_updated", NoteModel.getAll());
    res.status(204).end();
  });

  // --- Authentification (inscription et connexion) ---
  app.post("/collaborativeApp/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await UserModel.register(username, password);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
  });

  app.post("/collaborativeApp/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await UserModel.login(username, password);
      const token = jwt.sign({ id: user.id }, "secret123", { expiresIn: "1h" });
      res.json({ token });
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  });
}
