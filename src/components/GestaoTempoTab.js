import React, { useState } from 'react';
import HorasExtrasTab from './HorasExtrasTab';
import FeriasTab from './FeriasTab';
import FolgaTab from './FolgaTab';

const GestaoTempoTab = () => {
  const [activeSubTab, setActiveSubTab] = useState('horasExtras');

  return (
    <div>
      <div className="bg-purple-900 bg-opacity-60 shadow-lg p-4 mb-4">
        <h2 className="text-xl font-bold">Gestão de Tempo</h2>
        <div className="flex space-x-4 mt-3">
        </div>
      </div>
      <div className="p-4 bg-purple-800 rounded shadow-inner">
        {activeSubTab === 'horasExtras' && <HorasExtrasTab />}
        {activeSubTab === 'ferias' && <FeriasTab />}
        {activeSubTab === 'folgas' && <FolgaTab />}
      </div>
    </div>
  );
};

export default GestaoTempoTab;
