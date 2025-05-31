// components/SelectFuncionario.js
import React, { useContext, useEffect, useState } from 'react';
import { FuncionarioContext } from '../context/FuncionarioContext';

const SelectFuncionario = ({ onSelect, value }) => {
  const { buscarTodosFuncionarios } = useContext(FuncionarioContext);
  const [funcionarios, setFuncionarios] = useState([]);

  useEffect(() => {
    const carregarFuncionarios = async () => {
      const dados = await buscarTodosFuncionarios();
      setFuncionarios(dados);
    };

    carregarFuncionarios();
  }, [buscarTodosFuncionarios]);

  return (
    <select value={value} onChange={(e) => onSelect(e.target.value)}>
      <option value="">Selecione um funcionário</option>
      {funcionarios.map((funcionario) => (
        <option key={funcionario.id} value={funcionario.id}>
          {funcionario.nome}
        </option>
      ))}
    </select>
  );
};

export default SelectFuncionario;