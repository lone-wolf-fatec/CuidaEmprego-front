// components/ListaFuncionarios.jsx
import React, { useState } from 'react';
import { useFuncionarios } from '../hooks/useFuncionarios';

const ListaFuncionarios = () => {
  const { funcionarios, nomes, loading, error, filtrarFuncionarios, total } = useFuncionarios();
  const [filtro, setFiltro] = useState('');
  const [exibirApenas, setExibirApenas] = useState('todos'); // 'todos', 'nomes', 'completo'

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Carregando funcionários...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Erro:</strong> {error}
      </div>
    );
  }

  const funcionariosFiltrados = filtro 
    ? filtrarFuncionarios(filtro) 
    : funcionarios;

  const renderizarConteudo = () => {
    switch (exibirApenas) {
      case 'nomes':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {funcionariosFiltrados.map((funcionario, index) => (
              <div key={funcionario.id || index} className="bg-gray-50 p-2 rounded">
                <span className="font-medium">{funcionario.nome || funcionario.name}</span>
              </div>
            ))}
          </div>
        );
      
      case 'completo':
        return (
          <div className="space-y-4">
            {funcionariosFiltrados.map((funcionario, index) => (
              <div key={funcionario.id || index} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{funcionario.nome || funcionario.name}</h3>
                    <p className="text-gray-600">{funcionario.email}</p>
                    {funcionario.cargo && (
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Cargo:</span> {funcionario.cargo}
                      </p>
                    )}
                    {funcionario.departamento && (
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Departamento:</span> {funcionario.departamento}
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    ID: {funcionario.id}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      
      default:
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {funcionariosFiltrados.map((funcionario, index) => (
                  <tr key={funcionario.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {funcionario.nome || funcionario.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">{funcionario.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">{funcionario.cargo || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        funcionario.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {funcionario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Funcionários Cadastrados
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          {/* Campo de busca */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Selector de visualização */}
          <div>
            <select
              value={exibirApenas}
              onChange={(e) => setExibirApenas(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Tabela Completa</option>
              <option value="nomes">Apenas Nomes</option>
              <option value="completo">Cartões Completos</option>
            </select>
          </div>
        </div>

        {/* Contador */}
        <div className="text-sm text-gray-600 mb-4">
          {filtro ? (
            <>Mostrando {funcionariosFiltrados.length} de {total} funcionários</>
          ) : (
            <>Total: {total} funcionários cadastrados</>
          )}
        </div>
      </div>

      {funcionariosFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            {filtro ? 'Nenhum funcionário encontrado com esse filtro' : 'Nenhum funcionário cadastrado'}
          </div>
        </div>
      ) : (
        renderizarConteudo()
      )}
    </div>
  );
};

export default ListaFuncionarios;