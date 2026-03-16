import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

const RawMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    unit: 'kg',
    quantity_in_stock: 0,
    unit_cost: 0
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await api.get('/raw-materials');
      setMaterials(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar matérias-primas:', error);
      alert('Erro ao carregar dados.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity_in_stock' || name === 'unit_cost' ? parseFloat(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/raw-materials/${editingId}`, {
          ...formData,
          updated_at: new Date().toISOString()
        });
      } else {
        await api.post('/raw-materials', {
          ...formData,
          id: String(Date.now()),
          created_at: new Date().toISOString()
        });
      }
      resetForm();
      fetchMaterials();
    } catch (error) {
      console.error('Erro ao salvar matéria-prima:', error);
    }
  };

  const handleEdit = (material) => {
    setFormData({
      name: material.name,
      unit: material.unit,
      quantity_in_stock: material.quantity_in_stock,
      unit_cost: material.unit_cost
    });
    setEditingId(material.id);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta matéria-prima?')) {
      try {
        await api.delete(`/raw-materials/${id}`);
        fetchMaterials();
      } catch (error) {
        console.error('Erro ao excluir matéria-prima:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', unit: 'kg', quantity_in_stock: 0, unit_cost: 0 });
    setIsEditing(false);
    setEditingId(null);
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <div className="card">
        <h2>{isEditing ? 'Editar Matéria-Prima' : 'Nova Matéria-Prima'}</h2>
        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label>Nome</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Unidade</label>
            <select name="unit" value={formData.unit} onChange={handleInputChange}>
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="unidade">unidade</option>
              <option value="litro">litro</option>
            </select>
          </div>
          <div className="form-group">
            <label>Quantidade em Estoque</label>
            <input 
              type="number" 
              step="0.01" 
              name="quantity_in_stock" 
              value={formData.quantity_in_stock} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Custo Unitário (R$)</label>
            <input 
              type="number" 
              step="0.01" 
              name="unit_cost" 
              value={formData.unit_cost} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={18} /> {isEditing ? 'Atualizar' : 'Salvar'}
            </button>
            {isEditing && (
              <button type="button" className="btn btn-warning" onClick={resetForm}>
                <X size={18} /> Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Lista de Matérias-Primas</h2>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Unidade</th>
                <th>Estoque</th>
                <th>Custo Unit.</th>
                <th>Total</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {materials.map(material => (
                <tr key={material.id}>
                  <td>{material.name}</td>
                  <td>{material.unit}</td>
                  <td>{material.quantity_in_stock}</td>
                  <td>R$ {material.unit_cost.toFixed(2)}</td>
                  <td>R$ {(material.quantity_in_stock * material.unit_cost).toFixed(2)}</td>
                  <td>
                    <button className="btn btn-warning" onClick={() => handleEdit(material)} style={{ marginRight: '5px', padding: '5px' }}>
                      <Edit size={16} />
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(material.id)} style={{ padding: '5px' }}>
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

export default RawMaterials;
