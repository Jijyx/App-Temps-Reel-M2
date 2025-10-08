let notes = [];
let nextId = 1;

export const NoteModel = {
  getAll: () => notes,
  
  add: (content, authorId = null) => {
    const note = { id: nextId++, content, authorId };
    notes.push(note);
    return note;
  },

  update: (id, content) => {
    const note = notes.find(n => n.id === id);
    if (!note) return null;
    note.content = content;
    return note;
  },

  delete: (id) => {
    const index = notes.findIndex(n => n.id === id);
    if (index !== -1) notes.splice(index, 1);
  }
};
