import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShoppingCart, Plus, Trash2, Edit, Save, X } from 'lucide-react';

const Sales = () => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [cart, setCart] = useState([]);
  const [currentProduct, setCurrentProduct] = useState({
    product_id: '',
    quantity: 1
  });

  // Estado para edição de venda
  const [isEditing, setIsEditing] = useState(false);
  const [editingSale, setEditingSale] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [custRes, prodRes, saleRes, recRes, matRes] = await Promise.all([
        api.get('/customers'),
        api.get('/products'),
        api.get('/sales?_sort=-sale_date'),
        api.get('/recipes'),
        api.get('/raw-materials')
      ]);
      setCustomers(custRes.data);
      setProducts(prodRes.data);
      setSales(saleRes.data);
      setRecipes(recRes.data);
      setMaterials(matRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  const addToCart = () => {
    if (!currentProduct.product_id) return alert('Selecione um produto.');
    const product = products.find(p => p.id === currentProduct.product_id);
    
    if (product.stock_quantity < currentProduct.quantity) {
      return alert(`Estoque de produto insuficiente. Disponível: ${product.stock_quantity}`);
    }

    const existingItem = cart.find(item => item.product_id === currentProduct.product_id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.product_id === currentProduct.product_id 
          ? { ...item, quantity: item.quantity + currentProduct.quantity }
          : item
      ));
    } else {
      setCart([...cart, { 
        ...currentProduct, 
        name: product.name, 
        price: product.price 
      }]);
    }
    setCurrentProduct({ product_id: '', quantity: 1 });
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const totalValue = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSale = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return alert('Selecione um cliente.');
    if (cart.length === 0) return alert('O carrinho está vazio.');

    try {
      if (isEditing) {
        // Se estiver editando, primeiro excluímos a venda antiga (e estornamos estoque)
        await deleteSale(editingSale.id, false); // false para não dar o alert de sucesso
      }

      const saleId = String(Date.now());
      
      // 1. Criar a venda
      await api.post('/sales', {
        id: saleId,
        customer_id: selectedCustomer,
        sale_date: new Date().toISOString(),
        total_value: totalValue
      });

      // 2. Processar cada item
      for (const item of cart) {
        // Registrar item da venda
        await api.post('/sale-items', {
          id: String(Date.now() + Math.random()),
          sale_id: saleId,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.price
        });

        // Baixar estoque do produto (Busca o valor mais atualizado do servidor)
        const prodRes = await api.get(`/products/${item.product_id}`);
        const currentProductData = prodRes.data;
        await api.patch(`/products/${item.product_id}`, {
          stock_quantity: currentProductData.stock_quantity - item.quantity
        });

        // Registrar movimentação de estoque (produto)
        await api.post('/stock-movements', {
          id: String(Date.now() + Math.random()),
          type: 'venda (produto)',
          product_id: item.product_id,
          quantity: -item.quantity,
          date: new Date().toISOString()
        });
      }

      alert(isEditing ? 'Venda atualizada com sucesso!' : 'Venda realizada com sucesso!');
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Erro ao processar venda:', error);
      alert('Erro ao processar venda.');
    }
  };

  const deleteSale = async (saleId, showAlert = true) => {
    if (showAlert && !window.confirm('Tem certeza que deseja excluir esta venda? O estoque será estornado.')) return;

    try {
      // 1. Buscar TODOS os itens de venda e filtrar manualmente para garantir precisão
      const itemsRes = await api.get('/sale-items');
      const allSaleItems = itemsRes.data;
      const saleItems = allSaleItems.filter(item => String(item.sale_id) === String(saleId));

      console.log(`Estornando ${saleItems.length} itens da venda ${saleId}`);

      for (const item of saleItems) {
        // Estornar estoque do produto (Busca o valor atualizado do servidor)
        try {
          const prodRes = await api.get(`/products/${item.product_id}`);
          const currentProductData = prodRes.data;
          
          if (currentProductData) {
            const newStock = Number(currentProductData.stock_quantity) + Number(item.quantity);
            await api.patch(`/products/${item.product_id}`, {
              stock_quantity: newStock
            });

            // Registrar movimentação de estorno
            await api.post('/stock-movements', {
              id: String(Date.now() + Math.random()),
              type: 'estorno de venda',
              product_id: item.product_id,
              quantity: Number(item.quantity),
              date: new Date().toISOString()
            });
          }
        } catch (prodErr) {
          console.error(`Erro ao estornar produto ${item.product_id}:`, prodErr);
        }

        // Deletar o item da venda
        await api.delete(`/sale-items/${item.id}`);
      }

      // 2. Deletar a venda principal
      await api.delete(`/sales/${saleId}`);
      
      if (showAlert) {
        alert('Venda excluída e estoque estornado com sucesso!');
        fetchData(); // Atualiza a lista e os estoques na tela
      }
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
      if (showAlert) alert('Erro ao excluir venda. Verifique o console.');
    }
  };

  const editSale = async (sale) => {
    try {
      // Carregar os itens da venda para o carrinho
      const itemsRes = await api.get(`/sale-items?sale_id=${sale.id}`);
      const saleItems = itemsRes.data;

      const itemsForCart = saleItems.map(item => {
        const prod = products.find(p => p.id === item.product_id);
        return {
          product_id: item.product_id,
          quantity: item.quantity,
          name: prod ? prod.name : 'Produto Desconhecido',
          price: item.unit_price
        };
      });

      setCart(itemsForCart);
      setSelectedCustomer(sale.customer_id);
      setEditingSale(sale);
      setIsEditing(true);
      
      // Scroll para o topo para facilitar a visualização da edição
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Erro ao carregar dados para edição:', error);
    }
  };

  const resetForm = () => {
    setCart([]);
    setSelectedCustomer('');
    setIsEditing(false);
    setEditingSale(null);
  };

  const getCustomerName = (id) => {
    const c = customers.find(cust => cust.id === id);
    return c ? c.name : 'Desconhecido';
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <div className="card">
        <h2>{isEditing ? 'Editar Venda' : 'Nova Venda'}</h2>
        {isEditing && (
          <div className="alert-info" style={{ marginBottom: '15px', padding: '10px', background: '#e3f2fd', borderRadius: '4px', fontSize: '14px' }}>
            <strong>Modo de Edição:</strong> Ao salvar, a venda anterior será substituída e o estoque será recalculado.
          </div>
        )}
        <div className="form-group" style={{ marginTop: '20px' }}>
          <label>Cliente</label>
          <select 
            value={selectedCustomer} 
            onChange={(e) => setSelectedCustomer(e.target.value)}
          >
            <option value="">Selecione um cliente...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <h3>Adicionar Produtos</h3>
          <div className="flex-row-mobile-stack" style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2 }}>
              <label>Produto</label>
              <select 
                value={currentProduct.product_id} 
                onChange={(e) => setCurrentProduct({...currentProduct, product_id: e.target.value})}
              >
                <option value="">Selecione...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (R$ {p.price.toFixed(2)}) - Estoque: {p.stock_quantity}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Qtd</label>
              <input 
                type="number" 
                value={currentProduct.quantity} 
                onChange={(e) => setCurrentProduct({...currentProduct, quantity: parseInt(e.target.value)})}
                min="1"
              />
            </div>
            <button className="btn btn-success" onClick={addToCart} style={{ height: '40px' }}>
              <Plus size={18} /> Add
            </button>
          </div>
        </div>

        {cart.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h4>Itens no Carrinho</h4>
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Preço</th>
                  <th>Qtd</th>
                  <th>Subtotal</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>R$ {item.price.toFixed(2)}</td>
                    <td>{item.quantity}</td>
                    <td>R$ {(item.price * item.quantity).toFixed(2)}</td>
                    <td>
                      <button className="btn btn-danger" onClick={() => removeFromCart(index)} style={{ padding: '5px' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan="3" style={{ textAlign: 'right' }}>Total:</th>
                  <th colSpan="2">R$ {totalValue.toFixed(2)}</th>
                </tr>
              </tfoot>
            </table>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                className="btn btn-primary" 
                onClick={handleSale} 
                style={{ flex: 1 }}
              >
                {isEditing ? <><Save size={18} /> Atualizar Venda</> : <><ShoppingCart size={18} /> Finalizar Venda</>}
              </button>
              {isEditing && (
                <button className="btn btn-warning" onClick={resetForm}>
                  <X size={18} /> Cancelar Edição
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Histórico de Vendas</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Cliente</th>
              <th>Valor Total</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(s => (
              <tr key={s.id}>
                <td>{new Date(s.sale_date).toLocaleString()}</td>
                <td>{getCustomerName(s.customer_id)}</td>
                <td>R$ {s.total_value.toFixed(2)}</td>
                <td>
                  <button className="btn btn-warning" onClick={() => editSale(s)} style={{ marginRight: '5px', padding: '5px' }}>
                    <Edit size={16} />
                  </button>
                  <button className="btn btn-danger" onClick={() => deleteSale(s.id)} style={{ padding: '5px' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sales;
