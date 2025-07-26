import { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [documents, setDocuments] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    axios.get("http://localhost:3000/documents")
      .then(res => setDocuments(res.data))
      .catch(err => console.error(err));
  }, []);

  const addDocument = async () => {
    if (input.trim()) {
      const res = await axios.post("http://localhost:3000/documents", { title: input });
      setDocuments([...documents, res.data]);
      setInput("");
    }
  };

  const deleteDocument = async (id) => {
    await axios.delete(`http://localhost:3000/documents/${id}`);
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">DocuTrack</h1>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border p-2 w-full rounded"
          placeholder="Enter document title"
        />
        <button onClick={addDocument} className="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
      </div>
      <ul>
        {documents.map(doc => (
          <li key={doc.id} className="flex justify-between items-center border-b py-2">
            {doc.title}
            <button onClick={() => deleteDocument(doc.id)} className="text-red-500 hover:underline">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
