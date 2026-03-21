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
    
    const quantity = Number(currentProduct.quantity);
    if (isNaN(quantity) || quantity <= 0) return alert('Insira uma quantidade válida.');

    if (Number(product.stock_quantity) < quantity) {
      return alert(`Estoque de produto insuficiente. Disponível: ${product.stock_quantity}`);
    }

    const existingItem = cart.find(item => item.product_id === currentProduct.product_id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.product_id === currentProduct.product_id 
          ? { ...item, quantity: Number(item.quantity) + quantity }
          : item
      ));
    } else {
      setCart([...cart, { 
        product_id: product.id,
        quantity: quantity,
        name: product.name, 
        price: Number(product.price) 
      }]);
    }
    setCurrentProduct({ product_id: '', quantity: 1 });
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Cálculo do valor total garantindo tipos numéricos
  const totalValue = cart.reduce((sum, item) => {
    const itemPrice = Number(item.price) || 0;
    const itemQty = Number(item.quantity) || 0;
    return sum + (itemPrice * itemQty);
  }, 0);

  const handleSale = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return alert('Selecione um cliente.');
    if (cart.length === 0) return alert('O carrinho está vazio.');

    try {
      setLoading(true);

      // Validar estoque atualizado no servidor antes de processar
      for (const item of cart) {
        const prodRes = await api.get(`/products/${item.product_id}`);
        const currentStock = Number(prodRes.data.stock_quantity);
        if (currentStock < Number(item.quantity)) {
          setLoading(false);
          return alert(`Estoque insuficiente para ${item.name}. Disponível: ${currentStock}, Necessário: ${item.quantity}`);
        }
      }

      if (isEditing) {
        // Se estiver editando, excluímos a venda antiga e estornamos estoque silenciosamente
        await deleteSale(editingSale.id, false); 
      }

      const saleId = String(Date.now());
      
      // 1. Criar a venda principal
      await api.post('/sales', {
        id: saleId,
        customer_id: selectedCustomer,
        sale_date: new Date().toISOString(),
        total_value: Number(totalValue)
      });

      // 2. Processar cada item do carrinho
      for (const item of cart) {
        const itemQty = Number(item.quantity);
        const itemPrice = Number(item.price);

        // Registrar item da venda
        await api.post('/sale-items', {
          id: String(Date.now() + Math.random()),
          sale_id: saleId,
          product_id: item.product_id,
          quantity: itemQty,
          unit_price: itemPrice
        });

        // Baixar estoque do produto buscando valor real no servidor
        const prodRes = await api.get(`/products/${item.product_id}`);
        const currentProductData = prodRes.data;
        const newStock = Math.max(0, Number(currentProductData.stock_quantity) - itemQty);
        
        await api.patch(`/products/${item.product_id}`, {
          stock_quantity: newStock
        });

        // Registrar movimentação de estoque
        await api.post('/stock-movements', {
          id: String(Date.now() + Math.random()),
          type: 'venda (produto)',
          product_id: item.product_id,
          quantity: -itemQty,
          date: new Date().toISOString()
        });
      }

      alert(isEditing ? 'Venda atualizada com sucesso!' : 'Venda realizada com sucesso!');
      resetForm();
      await fetchData(); // Atualiza histórico e estoque na tela
    } catch (error) {
      console.error('Erro ao processar venda:', error);
      alert('Erro crítico ao processar venda. Verifique os logs.');
      await fetchData();
    } finally {
      setLoading(false);
    }
  };

  const deleteSale = async (saleId, showAlert = true) => {
    if (showAlert && !window.confirm('Tem certeza que deseja excluir esta venda? O estoque será estornado.')) return;

    try {
      if (showAlert) setLoading(true);

      // 1. Buscar os itens específicos desta venda antes de deletar
      const itemsRes = await api.get('/sale-items');
      const saleItems = itemsRes.data.filter(item => String(item.sale_id) === String(saleId));

      // 2. Deletar a venda principal (impede processamento duplicado)
      await api.delete(`/sales/${saleId}`);

      // 3. Estornar estoque para cada item encontrado
      for (const item of saleItems) {
        try {
          const itemQty = Number(item.quantity);
          const prodRes = await api.get(`/products/${item.product_id}`);
          const currentProductData = prodRes.data;
          
          if (currentProductData) {
            const newStock = Number(currentProductData.stock_quantity) + itemQty;
            await api.patch(`/products/${item.product_id}`, {
              stock_quantity: newStock
            });

            // Registrar movimentação de estorno
            await api.post('/stock-movements', {
              id: String(Date.now() + Math.random()),
              type: 'estorno de venda',
              product_id: item.product_id,
              quantity: itemQty,
              date: new Date().toISOString()
            });
          }
          
          // Deletar o item da venda após o estorno
          await api.delete(`/sale-items/${item.id}`);
        } catch (itemErr) {
          console.error(`Erro ao estornar item ${item.id}:`, itemErr);
        }
      }
      
      if (showAlert) {
        alert('Venda excluída e estoque estornado com sucesso!');
        await fetchData();
      }
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
      if (showAlert) alert('Erro ao excluir venda. O histórico pode estar desatualizado.');
      await fetchData();
    } finally {
      if (showAlert) setLoading(false);
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
                onChange={(e) => setCurrentProduct({...currentProduct, quantity: e.target.value})}
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
                    <td>R$ {Number(item.price).toFixed(2)}</td>
                    <td>{item.quantity}</td>
                    <td>R$ {(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
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
