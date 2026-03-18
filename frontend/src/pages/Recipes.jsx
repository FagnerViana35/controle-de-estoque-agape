import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Trash2, Save, Edit, X } from 'lucide-react';

const Recipes = () => {
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [formData, setFormData] = useState({
    raw_material_id: '',
    quantity_required: 0
  });
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    raw_material_id: '',
    quantity_required: 0
  });

  useEffect(() => {
    fetchData();
  }, []);
  

  const fetchData = async () => {
    try {
      const [prodRes, matRes, recRes] = await Promise.all([
        api.get('/products'),
        api.get('/raw-materials'),
        api.get('/recipes')
      ]);
      setProducts(prodRes.data);
      setMaterials(matRes.data);
      setRecipes(recRes.data);
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

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: name === 'quantity_required' ? parseFloat(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert('Selecione um produto primeiro!');
      return;
    }
    try {
      await api.post('/recipes', {
        ...formData,
        product_id: selectedProduct,
        id: String(Date.now())
      });
      setFormData({ raw_material_id: '', quantity_required: 0 });
      fetchData();
    } catch (error) {
      console.error('Erro ao adicionar ingrediente:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/recipes/${id}`);
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir ingrediente:', error);
    }
  };

  const startEdit = (recipe) => {
    setEditingId(recipe.id);
    setEditFormData({
      raw_material_id: recipe.raw_material_id,
      quantity_required: recipe.quantity_required
    });
  };

  const handleEdit = async (id) => {
    try {
      await api.put(`/recipes/${id}`, editFormData);
      setEditingId(null);
      setEditFormData({ raw_material_id: '', quantity_required: 0 });
      fetchData();
    } catch (error) {
      console.error('Erro ao editar ingrediente:', error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData({ raw_material_id: '', quantity_required: 0 });
  };

  const getMaterialName = (id) => {
    const mat = materials.find(m => m.id === id);
    return mat ? `${mat.name} (${mat.unit})` : 'Desconhecido';
  };

  const filteredRecipes = recipes.filter(r => r.product_id === selectedProduct);

  return (
    <div>
      <div className="card">
        <h2>Gestão de Receitas</h2>
        <div className="form-group" style={{ marginTop: '20px' }}>
          <label>Selecione o Produto</label>
          <select 
            value={selectedProduct} 
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option value="">Selecione um produto...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {selectedProduct && (
          <form onSubmit={handleSubmit} style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <h3>Adicionar Ingrediente</h3>
            <div className="form-group">
              <label>Matéria-Prima</label>
              <select 
                name="raw_material_id" 
                value={formData.raw_material_id} 
                onChange={handleInputChange}
                required
              >
                <option value="">Selecione...</option>
                {materials.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Quantidade Necessária</label>
              <input 
                type="number" 
                step="0.001" 
                name="quantity_required" 
                value={formData.quantity_required} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <button type="submit" className="btn btn-success">
              <Plus size={18} /> Adicionar à Receita
            </button>
          </form>
        )}
      </div>

      {selectedProduct && (
        <div className="card">
          <h2>Ingredientes da Receita</h2>
          <table>
            <thead>
              <tr>
                <th>Matéria-Prima</th>
                <th>Quantidade Necessária</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecipes.map(recipe => (
                <tr key={recipe.id}>
                  {editingId === recipe.id ? (
                    <>
                      <td>
                        <select 
                          name="raw_material_id"
                          value={editFormData.raw_material_id}
                          onChange={handleEditInputChange}
                          style={{ width: '100%', padding: '5px' }}
                        >
                          <option value="">Selecione...</option>
                          {materials.map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input 
                          type="number"
                          step="0.001"
                          name="quantity_required"
                          value={editFormData.quantity_required}
                          onChange={handleEditInputChange}
                          style={{ width: '100%', padding: '5px' }}
                        />
                      </td>
                      <td style={{ display: 'flex', gap: '5px' }}>
                        <button className="btn btn-success" onClick={() => handleEdit(recipe.id)} style={{ padding: '5px' }}>
                          <Save size={16} />
                        </button>
                        <button className="btn btn-danger" onClick={cancelEdit} style={{ padding: '5px' }}>
                          <X size={16} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{getMaterialName(recipe.raw_material_id)}</td>
                      <td>{recipe.quantity_required}</td>
                      <td style={{ display: 'flex', gap: '5px' }}>
                        <button className="btn btn-warning" onClick={() => startEdit(recipe)} style={{ padding: '5px' }}>
                          <Edit size={16} />
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(recipe.id)} style={{ padding: '5px' }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {filteredRecipes.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center' }}>Nenhum ingrediente cadastrado para este produto.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Recipes;