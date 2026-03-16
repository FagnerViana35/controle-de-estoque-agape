import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Trash2, Save, X, BookOpen } from 'lucide-react';

const Recipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({
    product_id: '',
    raw_material_id: '',
    quantity_required: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recipesRes, productsRes, materialsRes] = await Promise.all([
        api.get('/recipes'),
        api.get('/products'),
        api.get('/raw-materials')
      ]);
      setRecipes(recipesRes.data);
      setProducts(productsRes.data);
      setMaterials(materialsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity_required' ? parseFloat(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/recipes', {
        ...formData,
        id: String(Date.now())
      });
      setFormData({ product_id: '', raw_material_id: '', quantity_required: 0 });
      setIsAdding(false);
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar receita:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Remover este ingrediente da receita?')) {
      try {
        await api.delete(`/recipes/${id}`);
        fetchData();
      } catch (error) {
        console.error('Erro ao excluir ingrediente:', error);
      }
    }
  };

  const getProductName = (id) => products.find(p => p.id === id)?.name || 'N/A';
  const getMaterialName = (id) => materials.find(m => m.id === id)?.name || 'N/A';
  const getMaterialUnit = (id) => materials.find(m => m.id === id)?.unit || '';

  if (loading) return <div>Carregando...</div>;

  // Agrupar receitas por produto
  const groupedRecipes = products.map(product => {
    return {
      ...product,
      ingredients: recipes.filter(r => r.product_id === product.id)
    };
  }).filter(p => p.ingredients.length > 0);

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Gestão de Receitas</h2>
          <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>
            {isAdding ? <X size={18} /> : <Plus size={18} />}
            {isAdding ? 'Cancelar' : 'Adicionar Ingrediente'}
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleSubmit} style={{ marginTop: '20px', border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
            <div className="form-group">
              <label>Produto</label>
              <select name="product_id" value={formData.product_id} onChange={handleInputChange} required>
                <option value="">Selecione um produto</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Matéria-Prima</label>
              <select name="raw_material_id" value={formData.raw_material_id} onChange={handleInputChange} required>
                <option value="">Selecione um ingrediente</option>
                {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Quantidade Necessária</label>
              <input 
                type="number" 
                step="0.0001" 
                name="quantity_required" 
                value={formData.quantity_required} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <button type="submit" className="btn btn-success">
              <Save size={18} /> Salvar no Produto
            </button>
          </form>
        )}
      </div>

      {groupedRecipes.map(group => (
        <div key={group.id} className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)' }}>
            <BookOpen size={20} /> {group.name}
          </h3>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Ingrediente</th>
                  <th>Quantidade</th>
                  <th>Unidade</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {group.ingredients.map(ing => (
                  <tr key={ing.id}>
                    <td>{getMaterialName(ing.raw_material_id)}</td>
                    <td>{ing.quantity_required}</td>
                    <td>{getMaterialUnit(ing.raw_material_id)}</td>
                    <td>
                      <button className="btn btn-danger" onClick={() => handleDelete(ing.id)} style={{ padding: '5px' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Recipes;
