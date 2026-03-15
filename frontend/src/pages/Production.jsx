import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Factory, History } from 'lucide-react';

const Production = () => {
  const [products, setProducts] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    product_id: '',
    quantity_produced: 1
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, recRes, matRes, productionRes] = await Promise.all([
        api.get('/products'),
        api.get('/recipes'),
        api.get('/raw-materials'),
        api.get('/production?_sort=-production_date')
      ]);
      setProducts(prodRes.data);
      setRecipes(recRes.data);
      setMaterials(matRes.data);
      setProductions(productionRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity_produced' ? parseFloat(value) : value
    });
  };

  const handleProduction = async (e) => {
    e.preventDefault();
    const { product_id, quantity_produced } = formData;
    
    if (!product_id) return alert('Selecione um produto.');
    
    // 1. Buscar receita do produto
    const productRecipes = recipes.filter(r => r.product_id === product_id);
    if (productRecipes.length === 0) return alert('Este produto não tem receita cadastrada.');

    // 2. Verificar estoque das matérias-primas
    for (const item of productRecipes) {
      const material = materials.find(m => m.id === item.raw_material_id);
      const needed = item.quantity_required * quantity_produced;
      if (material.quantity_in_stock < needed) {
        return alert(`Estoque insuficiente de ${material.name}. Necessário: ${needed}, Disponível: ${material.quantity_in_stock}`);
      }
    }

    try {
      // 3. Baixar estoque das matérias-primas e registrar movimentação
      for (const item of productRecipes) {
        const material = materials.find(m => m.id === item.raw_material_id);
        const needed = item.quantity_required * quantity_produced;
        
        await api.patch(`/raw-materials/${material.id}`, {
          quantity_in_stock: material.quantity_in_stock - needed
        });

        // Registrar movimentação de matéria-prima (opcional, mas bom para histórico)
        await api.post('/stock-movements', {
          id: String(Date.now() + Math.random()),
          type: 'produção (saída)',
          raw_material_id: material.id,
          quantity: -needed,
          date: new Date().toISOString()
        });
      }

      // 4. Aumentar estoque do produto final
      const product = products.find(p => p.id === product_id);
      await api.patch(`/products/${product_id}`, {
        stock_quantity: product.stock_quantity + quantity_produced
      });

      // 5. Registrar a produção
      await api.post('/production', {
        id: String(Date.now()),
        product_id,
        quantity_produced,
        production_date: new Date().toISOString()
      });

      // 6. Registrar movimentação do produto
      await api.post('/stock-movements', {
        id: String(Date.now() + Math.random()),
        type: 'produção (entrada)',
        product_id,
        quantity: quantity_produced,
        date: new Date().toISOString()
      });

      alert('Produção registrada com sucesso!');
      setFormData({ product_id: '', quantity_produced: 1 });
      fetchData();
    } catch (error) {
      console.error('Erro ao processar produção:', error);
      alert('Erro ao registrar produção.');
    }
  };

  const getProductName = (id) => {
    const p = products.find(prod => prod.id === id);
    return p ? p.name : 'Desconhecido';
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <div className="card">
        <h2>Registrar Nova Produção</h2>
        <form onSubmit={handleProduction} style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label>Produto a Produzir</label>
            <select 
              name="product_id" 
              value={formData.product_id} 
              onChange={handleInputChange}
              required
            >
              <option value="">Selecione um produto...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Estoque atual: {p.stock_quantity})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Quantidade Produzida (lote)</label>
            <input 
              type="number" 
              name="quantity_produced" 
              value={formData.quantity_produced} 
              onChange={handleInputChange} 
              min="1"
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary">
            <Factory size={18} /> Iniciar Produção
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Últimas Produções</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Produto</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {productions.slice(0, 10).map(p => (
              <tr key={p.id}>
                <td>{new Date(p.production_date).toLocaleString()}</td>
                <td>{getProductName(p.product_id)}</td>
                <td>{p.quantity_produced}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Production;
