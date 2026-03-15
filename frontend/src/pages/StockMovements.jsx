import React, { useState, useEffect } from 'react';
import api from '../services/api';

const StockMovements = () => {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [movRes, prodRes, matRes] = await Promise.all([
        api.get('/stock-movements?_sort=-date'),
        api.get('/products'),
        api.get('/raw-materials')
      ]);
      setMovements(movRes.data);
      setProducts(prodRes.data);
      setMaterials(matRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error);
    }
  };

  const getItemName = (mov) => {
    if (mov.product_id) {
      const p = products.find(prod => prod.id === mov.product_id);
      return p ? `Produto: ${p.name}` : 'Produto desconhecido';
    } else if (mov.raw_material_id) {
      const m = materials.find(mat => mat.id === mov.raw_material_id);
      return m ? `Materia-Prima: ${m.name}` : 'Materia-Prima desconhecida';
    }
    return 'Item desconhecido';
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <div className="card">
        <h2>Histórico de Movimentações de Estoque</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Item</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {movements.map(mov => (
              <tr key={mov.id}>
                <td>{new Date(mov.date).toLocaleString()}</td>
                <td>
                  <span className={`badge ${mov.type.includes('entrada') || mov.type === 'ajuste (+)' ? 'text-success' : 'text-danger'}`}>
                    {mov.type.toUpperCase()}
                  </span>
                </td>
                <td>{getItemName(mov)}</td>
                <td style={{ color: mov.quantity > 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                  {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                </td>
              </tr>
            ))}
            {movements.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center' }}>Nenhuma movimentação registrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockMovements;
