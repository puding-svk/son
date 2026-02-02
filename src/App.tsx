import React from 'react';
import './i18n/config'; // Initialize i18n
import AccidentForm from './components/AccidentForm';
import './App.css';

function App() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <AccidentForm />
    </React.Suspense>
  );
}

export default App;
