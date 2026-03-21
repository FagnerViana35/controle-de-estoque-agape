import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Factory, History, Edit, Trash2, X, Save } from 'lucide-react';

const Production = () => {
  const [products, setProducts] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
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
      
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data.data || []));
      setRecipes(Array.isArray(recRes.data) ? recRes.data : (recRes.data.data || []));
      setMaterials(Array.isArray(matRes.data) ? matRes.data : (matRes.data.data || []));
      setProductions(Array.isArray(productionRes.data) ? productionRes.data : (productionRes.data.data || []));
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
      setLoading(true);

      if (isEditing) {
        // Se estiver editando, primeiro estornamos a produção anterior
        await deleteProduction(editingId, false);
      }

      // 3. Baixar estoque das matérias-primas e registrar movimentação
      for (const item of productRecipes) {
        const materialRes = await api.get(`/raw-materials/${item.raw_material_id}`);
        const currentMaterial = materialRes.data;
        const needed = Number(item.quantity_required) * Number(quantity_produced);
        
        await api.patch(`/raw-materials/${currentMaterial.id}`, {
          quantity_in_stock: Math.max(0, Number(currentMaterial.quantity_in_stock) - needed)
        });

        // Registrar movimentação de matéria-prima
        await api.post('/stock-movements', {
          id: String(Date.now() + Math.random()),
          type: 'produção (saída)',
          raw_material_id: currentMaterial.id,
          quantity: -needed,
          date: new Date().toISOString()
        });
      }

      // 4. Aumentar estoque do produto final
      const prodRes = await api.get(`/products/${product_id}`);
      const currentProduct = prodRes.data;
      const newStock = Number(currentProduct.stock_quantity) + Number(quantity_produced);
      
      await api.patch(`/products/${product_id}`, {
        stock_quantity: newStock
      });

      // 5. Registrar a produção (O backend agora cuida do acúmulo se o registro já existir)
      await api.post('/production', {
        id: isEditing ? editingId : String(Date.now()),
        product_id,
        quantity_produced: Number(quantity_produced),
        production_date: new Date().toISOString()
      });

      // 6. Registrar movimentação do produto
      await api.post('/stock-movements', {
        id: String(Date.now() + Math.random()),
        type: 'produção (entrada)',
        product_id,
        quantity: Number(quantity_produced),
        date: new Date().toISOString()
      });

      alert(isEditing ? 'Produção atualizada com sucesso!' : 'Produção registrada com sucesso!');
      resetForm();
      await fetchData();
    } catch (error) {
      console.error('Erro ao processar produção:', error);
      alert('Erro ao registrar produção.');
      await fetchData();
    } finally {
      setLoading(false);
    }
  };

  const deleteProduction = async (id, showAlert = true) => {
    if (showAlert && !window.confirm('Tem certeza que deseja excluir este lote? O estoque será estornado.')) return;

    try {
      if (showAlert) setLoading(true);

      const production = productions.find(p => p.id === id);
      if (!production) return;

      // 1. Estornar estoque do produto final
      const prodRes = await api.get(`/products/${production.product_id}`);
      const currentProduct = prodRes.data;
      await api.patch(`/products/${production.product_id}`, {
        stock_quantity: Math.max(0, Number(currentProduct.stock_quantity) - Number(production.quantity_produced))
      });

      // 2. Estornar estoque das matérias-primas
      const productRecipes = recipes.filter(r => r.product_id === production.product_id);
      for (const item of productRecipes) {
        const materialRes = await api.get(`/raw-materials/${item.raw_material_id}`);
        const currentMaterial = materialRes.data;
        const returned = Number(item.quantity_required) * Number(production.quantity_produced);
        
        await api.patch(`/raw-materials/${currentMaterial.id}`, {
          quantity_in_stock: Number(currentMaterial.quantity_in_stock) + returned
        });

        // Registrar movimentação de estorno
        await api.post('/stock-movements', {
          id: String(Date.now() + Math.random()),
          type: 'estorno produção',
          raw_material_id: currentMaterial.id,
          quantity: returned,
          date: new Date().toISOString()
        });
      }

      // 3. Deletar a produção
      await api.delete(`/production/${id}`);

      if (showAlert) {
        alert('Produção excluída e estoque estornado com sucesso!');
        await fetchData();
      }
    } catch (error) {
      console.error('Erro ao excluir produção:', error);
      if (showAlert) alert('Erro ao excluir produção.');
    } finally {
      if (showAlert) setLoading(false);
    }
  };

  const handleEdit = (production) => {
    setFormData({
      product_id: production.product_id,
      quantity_produced: production.quantity_produced
    });
    setIsEditing(true);
    setEditingId(production.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({ product_id: '', quantity_produced: 1 });
    setIsEditing(false);
    setEditingId(null);
  };

  const getProductName = (id) => {
    const p = products.find(prod => prod.id === id);
    return p ? p.name : 'Desconhecido';
  };

  if (loading) return <div>Carregando...</div>;

  // Agrupar produções por produto para exibir o acumulado por sabor
  const productionSummary = products.map(product => {
    const totalProduced = productions
      .filter(p => p.product_id === product.id)
      .reduce((sum, p) => sum + Number(p.quantity_produced), 0);
    
    return {
      id: product.id,
      name: product.name,
      total: totalProduced
    };
  }).filter(p => p.total > 0);

  return (
    <div>
      <div className="card">
        <h2>{isEditing ? 'Editar Produção' : 'Registrar Nova Produção'}</h2>
        <form onSubmit={handleProduction} style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label>Produto a Produzir</label>
            <select 
              name="product_id" 
              value={formData.product_id} 
              onChange={handleInputChange}
              required
              disabled={isEditing}
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
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className={`btn ${isEditing ? 'btn-warning' : 'btn-primary'}`} disabled={loading}>
              {isEditing ? <Save size={18} /> : <Factory size={18} />} 
              {loading ? 'Processando...' : (isEditing ? 'Salvar Alterações' : 'Iniciar Produção')}
            </button>
            {isEditing && (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                <X size={18} /> Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Produção Acumulada por Sabor</h2>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Produto / Sabor</th>
                <th>Total Produzido (Acumulado)</th>
              </tr>
            </thead>
            <tbody>
              {productionSummary.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{p.name}</td>
                  <td>{p.total} unidades</td>
                </tr>
              ))}
              {productionSummary.length === 0 && (
                <tr>
                  <td colSpan="2" style={{ textAlign: 'center' }}>Nenhuma produção registrada ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h2>Histórico Recente de Lotes</h2>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {productions.slice(0, 10).map(p => (
                <tr key={p.id}>
                  <td>{new Date(p.production_date).toLocaleString()}</td>
                  <td>{getProductName(p.product_id)}</td>
                  <td>{p.quantity_produced}</td>
                  <td>
                    <button className="btn btn-warning" onClick={() => handleEdit(p)} style={{ marginRight: '5px', padding: '5px' }}>
                      <Edit size={16} />
                    </button>
                    <button className="btn btn-danger" onClick={() => deleteProduction(p.id)} style={{ padding: '5px' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Production;
