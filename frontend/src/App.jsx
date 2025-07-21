import { useEffect, useState } from 'react';

function App() {
  const [turnos, setTurnos] = useState([]);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;

    fetch(`${apiUrl}/turnos`)
      .then(res => res.json())
      .then(data => setTurnos(data))
      .catch(err => console.error('Error fetching turnos:', err));
  }, []);

  return (
    <div>
      <h1>Turnos</h1>
      <ul>
        {turnos.map(turno => (
          <li key={turno.id}>
            {turno.descripcion} - {turno.hora_inicio} a {turno.hora_fin}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
