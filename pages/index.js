import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState({open:false, product:null});
  const [showAdmin, setShowAdmin] = useState(false);
  const [form, setForm] = useState({id:'', name:'', description:'', price:100, image_url:'', category:''});

  useEffect(()=>{ fetchProducts(); }, []);

  async function fetchProducts(){
    const { data, error } = await supabase.from('products').select('*').order('created_at',{ascending:false});
    if(error) { console.error(error); return; }
    setProducts(data || []);
  }

  async function createProduct(e){
    e.preventDefault();
    const payload = { name: form.name, description: form.description, price: Number(form.price||0), image_url: form.image_url, category: form.category };
    const { data, error } = await supabase.from('products').insert([payload]).select().single();
    if(error){ alert('Hata: '+error.message); return; }
    setForm({id:'', name:'', description:'', price:100, image_url:'', category:''});
    fetchProducts();
  }

  async function updateProduct(e){
    e.preventDefault();
    const { id, name, description, price, image_url, category } = form;
    if(!id){ alert('Düzenleme için ürün seçin'); return; }
    const { data, error } = await supabase.from('products').update({ name, description, price:Number(price), image_url, category }).eq('id', id).select().single();
    if(error){ alert('Hata: '+error.message); return; }
    setForm({id:'', name:'', description:'', price:100, image_url:'', category:''});
    fetchProducts();
  }

  async function deleteProduct(id){
    if(!confirm('Silinsin mi?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if(error){ alert('Hata: '+error.message); return; }
    fetchProducts();
  }

  function openEdit(p){
    setForm({ id:p.id, name:p.name, description:p.description, price:p.price, image_url:p.image_url, category:p.category });
    setShowAdmin(true);
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.category?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className='page'>
      <header className='topbar'>
        <h1>Ürün Kataloğu</h1>
        <div className='right-controls'>
          <input placeholder='Ara...' value={q} onChange={e=>setQ(e.target.value)} className='search' />
          <button className='admin-btn' onClick={()=>setShowAdmin(s=>!s)}>⚙️ Yönetici</button>
        </div>
      </header>

      <main className='container'>
        {filtered.map(p=>(
          <article key={p.id} className='card' onClick={()=>setModal({open:true, product:p})}>
            <img src={p.image_url || '/placeholder.png'} alt={p.name} />
            <h3>{p.name}</h3>
            <p className='cat'>{p.category}</p>
          </article>
        ))}
      </main>

      {modal.open && modal.product && (
        <div className='modal' onClick={()=>setModal({open:false, product:null})}>
          <div className='modal-inner' onClick={e=>e.stopPropagation()}>
            <button className='close' onClick={()=>setModal({open:false, product:null})}>✕</button>
            <img src={modal.product.image_url || '/placeholder.png'} alt='' />
            <h2>{modal.product.name}</h2>
            <p style={{fontWeight:700}}>Fiyat: {modal.product.price} ₺</p>
            <p>{modal.product.description}</p>
          </div>
        </div>
      )}

      {showAdmin && (
        <aside className='admin'>
          <h3>Ürün Yönetimi</h3>
          <form onSubmit={form.id?updateProduct:createProduct}>
            <label>İsim<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label>
            <label>Açıklama<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}></textarea></label>
            <label>Fiyat<input type='number' value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required/></label>
            <label>Görsel URL<input value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})}/></label>
            <label>Kategori
              <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                <option value=''>--Seç--</option>
                <option>Katı Ürünler</option>
                <option>Sıvı Ürünler</option>
                <option>Damlama Ürünleri</option>
              </select>
            </label>
            <div className='form-actions'>
              <button type='submit'>{form.id?'Güncelle':'Ekle'}</button>
              {form.id && <button type='button' onClick={()=>{ deleteProduct(form.id); setForm({id:'',name:'',description:'',price:100,image_url:'',category:''}); }}>Sil</button>}
              <button type='button' onClick={()=>setShowAdmin(false)}>Kapat</button>
            </div>
          </form>
          <hr/>
          <div className='admin-list'>
            <h4>Mevcut Ürünler</h4>
            {products.map(p=>(
              <div className='admin-item' key={p.id}>
                <div>
                  <strong>{p.name}</strong><br/>
                  <small>{p.category} • {p.price}₺</small>
                </div>
                <div className='admin-actions'>
                  <button onClick={()=>openEdit(p)}>Düzenle</button>
                  <button onClick={()=>deleteProduct(p.id)}>Sil</button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}

      <style jsx global>{`
        :root{ --bg:#f7f7f7; --accent:#2e7d32; --card:#fff; }
        body{ margin:0; font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background:var(--bg); color:#111; }
        .topbar{ display:flex; align-items:center; justify-content:space-between; padding:18px 24px; background:linear-gradient(135deg,#1b5e20,#388e3c); color:#fff; }
        .topbar h1{ margin:0; font-size:20px; }
        .right-controls{ display:flex; gap:12px; align-items:center; }
        .search{ padding:8px 12px; border-radius:12px; border:0; width:220px; max-width:40vw; }
        .admin-btn{ background:#fff;border:0;padding:8px 12px;border-radius:10px;cursor:pointer; }
        .container{ display:grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap:18px; padding:20px; max-width:1200px; margin:18px auto; }
        .card{ background:var(--card); border-radius:12px; padding:12px; box-shadow:0 6px 20px rgba(0,0,0,0.06); cursor:pointer; text-align:center; }
        .card img{ width:100%; height:150px; object-fit:cover; border-radius:8px; }
        .card h3{ margin:10px 0 6px; font-size:16px; }
        .card p.cat{ margin:0; color:#666; font-size:13px; }

        .modal{ position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.6); z-index:9999; }
        .modal-inner{ width:min(92%,720px); background:#fff; padding:18px; border-radius:14px; box-shadow:0 20px 50px rgba(0,0,0,0.3); position:relative; }
        .modal-inner img{ width:240px; max-width:40%; height:auto; border-radius:10px; float:left; margin-right:14px; object-fit:cover; }
        .modal-inner h2{ margin-top:0; }
        .modal-inner .close{ position:absolute; top:10px; right:10px; border:0; background:#f2f2f2; border-radius:8px; padding:6px 10px; cursor:pointer; }

        .admin{ position:fixed; right:18px; top:68px; width:360px; max-width:92%; background:#fff; border-radius:10px; box-shadow:0 8px 24px rgba(0,0,0,0.15); padding:14px; z-index:999; }
        .admin h3{ margin:0 0 8px 0; }
        .admin form label{ display:block; margin-bottom:8px; font-size:13px; }
        .admin form input, .admin form textarea, .admin form select{ width:100%; padding:8px; border-radius:8px; border:1px solid #e6e6e6; box-sizing:border-box; }
        .form-actions{ display:flex; gap:8px; margin-top:8px; }
        .admin-list{ max-height:260px; overflow:auto; margin-top:10px; }
        .admin-item{ display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px dashed #eee; }
        .admin-actions button{ margin-left:6px; }

        @media (max-width:600px){
          .modal-inner img{ width:100%; float:none; margin:0 0 12px; max-width:none; }
          .admin{ position:fixed; right:8px; left:8px; top:68px; width:auto; }
          .right-controls .search{ width:120px; }
        }
      `}</style>
    </div>
  )
}
