import React from 'react';
import PinkGlassApp from './App';
import { GlobalProvider } from './context/GlobalContext';

const PinkGlassPage = () => (
  <GlobalProvider>
    <PinkGlassApp />
  </GlobalProvider>
);

export default PinkGlassPage;
