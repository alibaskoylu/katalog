import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const CATS = ['Katı Ürünler','Sıvı Ürünler','Damlama Ürünleri'];

export default function Home(){
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState({open:false, p:null});
  const [adminOpen, setAdminOpen] = useState(false);
  const [form, setForm] = useState({id:'', name:'', description:'', price:100, image_url:'', category:''});

  useEffect(()=>{ load(); },[]);
  async function load(){
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending:false });
    if(error){ console.error(error); return; }
    setProducts(data || []);
  }

  const filtered = useMemo(()=>{
    const t = q.toLowerCase().trim();
    if(!t) return products;
    return products.filter(p =>
      p.name?.toLowerCase().includes(t) ||
      p.category?.toLowerCase().includes(t) ||
      p.description?.toLowerCase().includes(t)
    );
  }, [products, q]);

  const grouped = useMemo(()=>{
    const map = new Map();
    CATS.forEach(c=>map.set(c, []));
    filtered.forEach(p => {
      const key = CATS.includes(p.category) ? p.category : 'Diğer';
      const list = map.get(key) || [];
      list.push(p);
      map.set(key, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  async function createProduct(e){
    e.preventDefault();
    const payload = {
      name: form.name, description: form.description,
      price: Number(form.price||0), image_url: form.image_url, category: form.category
    };
    const { error } = await supabase.from('products').insert([payload]);
    if(error) return alert(error.message);
    setForm({id:'', name:'', description:'', price:100, image_url:'', category:''});
    load();
  }
  async function updateProduct(e){
    e.preventDefault();
    if(!form.id) return alert('Düzenlemek için ürün seçin');
    const { error } = await supabase.from('products')
      .update({
        name: form.name, description: form.description,
        price: Number(form.price||0), image_url: form.image_url, category: form.category
      }).eq('id', form.id);
    if(error) return alert(error.message);
    setForm({id:'', name:'', description:'', price:100, image_url:'', category:''});
    load();
  }
  async function removeProduct(id){
    if(!confirm('Silinsin mi?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if(error) return alert(error.message);
    load();
  }
  function startEdit(p){
    setForm({ id:p.id, name:p.name, description:p.description, price:p.price, image_url:p.image_url, category:p.category });
    setAdminOpen(true);
  }

  return (
    <div className="page">
      <header className="header">
        <div className="logo-wrap">
          <img src="/logo.png" alt="Logo" className="logo" />
        </div>
        <input
          id="searchInput"
          className="search-box"
          placeholder="Ürün ara..."
          value={q}
          onChange={(e)=>setQ(e.target.value)}
        />
        <button className="admin-toggle" onClick={()=>setAdminOpen(s=>!s)}>⚙️ Yönetici</button>
      </header>

      <main className="main">
        {grouped.map(([cat, items]) => (
          <section className="kategori" key={cat}>
            <div className="kategori-header">
              <span>{cat}</span>
              <span className="count">({items.length})</span>
            </div>
            <div className="urunler">
              {items.map(p => (
                <div className="urun" key={p.id} onClick={()=>setModal({open:true, p})}>
                  <img src={p.image_url || '/logo.png'} alt={p.name} />
                  <p className="urun-isim">{p.name}</p>
                </div>
              ))}
              {items.length === 0 && (
                <div className="bos">Bu kategoride ürün yok.</div>
              )}
            </div>
          </section>
        ))}
      </main>

      {modal.open && modal.p && (
        <div id="urunModal" className="modal" onClick={()=>setModal({open:false,p:null})}>
          <div className="modal-icerik" onClick={(e)=>e.stopPropagation()}>
            <span className="kapat" onClick={()=>setModal({open:false,p:null})}>&times;</span>
            <img id="modalResim" src={modal.p.image_url || '/logo.png'} alt="Ürün Görseli" />
            <h3 id="modalBaslik">{modal.p.name}</h3>
            <p id="modalFiyat" className="fiyat-badge">Fiyat: {modal.p.price} ₺</p>
            <p id="modalAltBaslik" style={{fontWeight:'bold', color:'#444'}}>{modal.p.category}</p>
            <p id="modalAciklama">{modal.p.description}</p>
          </div>
        </div>
      )}

      {adminOpen && (
        <aside className="admin">
          <h3>Ürün Yönetimi</h3>
          <form onSubmit={form.id?updateProduct:createProduct} className="admin-form">
            <label>İsim<input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required/></label>
            <label>Açıklama<textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})}/></label>
            <label>Fiyat<input type="number" value={form.price} onChange={e=>setForm({...form, price:e.target.value})} required/></label>
            <label>Görsel URL<input value={form.image_url} onChange={e=>setForm({...form, image_url:e.target.value})}/></label>
            <label>Kategori
              <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} required>
                <option value="">--Seç--</option>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <div className="admin-actions">
              <button type="submit" className="btn primary">{form.id? 'Güncelle':'Ekle'}</button>
              {form.id && <button type="button" className="btn danger" onClick={()=>{removeProduct(form.id); setForm({id:'', name:'', description:'', price:100, image_url:'', category:''});}}>Sil</button>}
              <button type="button" className="btn" onClick={()=>setAdminOpen(false)}>Kapat</button>
            </div>
          </form>

          <div className="admin-list">
            <h4>Mevcut Ürünler</h4>
            {products.map(p => (
              <div className="admin-item" key={p.id}>
                <div className="admin-item-info">
                  <strong>{p.name}</strong>
                  <small>{p.category} • {p.price} ₺</small>
                </div>
                <div className="admin-item-actions">
                  <button onClick={()=>startEdit(p)} className="btn">Düzenle</button>
                  <button onClick={()=>removeProduct(p.id)} className="btn danger">Sil</button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
