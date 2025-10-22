import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const CATS = ['Katı Ürünler','Sıvı Ürünler','Damlama Ürünleri'];

export default function Home(){
  const [products,setProducts]=useState([]);
  const [q,setQ]=useState('');
  const [modal,setModal]=useState({open:false,p:null});
  const [adminOpen,setAdminOpen]=useState(false);
  const [form,setForm]=useState({id:'',name:'',description:'',price:100,image_url:'',category:''});

  useEffect(()=>{ load(); },[]);
  async function load(){
    const {data,error}=await supabase.from('products').select('*').order('created_at',{ascending:false});
    if(error){ console.error(error); return; }
    setProducts(data||[]);
  }

  const filtered = useMemo(()=>{
    const t=q.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(t) ||
      (p.category||'').toLowerCase().includes(t) ||
      (p.description||'').toLowerCase().includes(t)
    );
  },[products,q]);

  const grouped = useMemo(()=>{
    const map = new Map();
    CATS.forEach(c=>map.set(c,[]));
    filtered.forEach(p=>{
      map.set(p.category||'Diğer', [...(map.get(p.category||'Diğer')||[]), p]);
    });
    return Array.from(map.entries());
  },[filtered]);

  async function createProduct(e){
    e.preventDefault();
    const payload={name:form.name,description:form.description,price:Number(form.price||0),image_url:form.image_url,category:form.category};
    const {error}=await supabase.from('products').insert([payload]);
    if(error) return alert(error.message);
    setForm({id:'',name:'',description:'',price:100,image_url:'',category:''});
    load();
  }
  async function updateProduct(e){
    e.preventDefault();
    if(!form.id) return alert('Düzenlemek için ürün seçin');
    const {error}=await supabase.from('products').update({
      name:form.name,description:form.description,price:Number(form.price||0),image_url:form.image_url,category:form.category
    }).eq('id',form.id);
    if(error) return alert(error.message);
    setForm({id:'',name:'',description:'',price:100,image_url:'',category:''});
    load();
  }
  async function remove(id){
    if(!confirm('Silinsin mi?')) return;
    const {error}=await supabase.from('products').delete().eq('id',id);
    if(error) return alert(error.message);
    load();
  }
  function startEdit(p){
    setForm({id:p.id,name:p.name,description:p.description,price:p.price,image_url:p.image_url,category:p.category});
    setAdminOpen(true);
  }

  return (
    <div>
      <header style={styles.header}>
        <img src="/logo.png" alt="Bila Tarım" style={styles.logo}/>
        <div style={styles.searchWrap}>
          <input placeholder="Ara..." value={q} onChange={e=>setQ(e.target.value)} style={styles.search}/>
        </div>
        <button onClick={()=>setAdminOpen(s=>!s)} style={styles.adminBtn}>⚙️ Yönetici</button>
      </header>

      <main style={styles.main}>
        {grouped.map(([cat,items])=>(
          <section key={cat} style={{margin:"24px 0"}}>
            <div style={styles.catHeader}>
              <span>{cat}</span>
              <span style={{marginLeft:'auto'}}>({items.length})</span>
            </div>
            <div style={styles.grid}>
              {items.map(p=>(
                <article key={p.id} style={styles.card} onClick={()=>setModal({open:true,p})}>
                  <img src={p.image_url || '/logo.png'} alt={p.name} style={styles.cardImg}/>
                  <h3 style={styles.cardTitle}>{p.name}</h3>
                </article>
              ))}
              {items.length===0 && <div style={{padding:'16px',color:'#666'}}>Bu kategoride ürün yok.</div>}
            </div>
          </section>
        ))}
      </main>

      {modal.open && modal.p && (
        <div style={styles.modalBg} onClick={()=>setModal({open:false,p:null})}>
          <div style={styles.modal} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setModal({open:false,p:null})} style={styles.close}>✕</button>
            <img src={modal.p.image_url || '/logo.png'} alt="" style={{width:'260px',maxWidth:'40%',borderRadius:12,objectFit:'cover',marginRight:16}}/>
            <div>
              <h2 style={{margin:'4px 0 8px 0',color:'#1b5e20'}}>{modal.p.name}</h2>
              <p id="modalFiyat" style={styles.priceBadge}>Fiyat: {modal.p.price} ₺</p>
              <p style={{marginTop:10, color:'#333'}}>{modal.p.description}</p>
            </div>
          </div>
        </div>
      )}

      {adminOpen && (
        <aside style={styles.admin}>
          <h3 style={{margin:'0 0 8px 0'}}>Ürün Yönetimi</h3>
          <form onSubmit={form.id?updateProduct:createProduct} style={styles.form}>
            <label>İsim<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label>
            <label>Açıklama<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
            <label>Fiyat<input type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required/></label>
            <label>Görsel URL<input value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})}/></label>
            <label>Kategori
              <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                <option value="">--Seç--</option>
                {CATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </label>
            <div style={{display:'flex',gap:8}}>
              <button type="submit" style={styles.primary}>{form.id?'Güncelle':'Ekle'}</button>
              {form.id && <button type="button" onClick={()=>{remove(form.id); setForm({id:'',name:'',description:'',price:100,image_url:'',category:''});}} style={styles.danger}>Sil</button>}
              <button type="button" onClick={()=>setAdminOpen(false)}>Kapat</button>
            </div>
          </form>
          <hr/>
          <div style={{maxHeight:260,overflow:'auto'}}>
            {products.map(p=>(
              <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px dashed #eee'}}>
                <div><strong>{p.name}</strong><br/><small>{p.category} • {p.price} ₺</small></div>
                <div style={{display:'flex',gap:6}}>
                  <button onClick={()=>startEdit(p)}>Düzenle</button>
                  <button onClick={()=>remove(p.id)} style={styles.danger}>Sil</button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  )
}

const styles = {
  header:{
    position:'sticky', top:0, zIndex:10,
    display:'grid', gridTemplateColumns:'auto 1fr auto', alignItems:'center',
    padding:'14px 18px', background:'linear-gradient(135deg,#1b5e20,#388e3c)', color:'#fff',
    boxShadow:'0 6px 16px rgba(0,0,0,0.35)'
  },
  logo:{ height:48, borderRadius:8, background:'#fff', padding:6 },
  searchWrap:{ display:'flex', justifyContent:'center' },
  search:{ width:'min(560px, 70vw)', padding:'10px 14px', borderRadius:24, border:'1px solid rgba(255,255,255,0.3)' },
  adminBtn:{ marginLeft:12, background:'#fff', color:'#1b5e20', border:'0', padding:'8px 12px', borderRadius:10, cursor:'pointer' },
  main:{ maxWidth:1200, margin:'18px auto', padding:'0 16px' },
  catHeader:{
    display:'flex', alignItems:'center', gap:12, color:'#fff', fontWeight:700,
    padding:'16px 28px', borderRadius:12,
    background:'linear-gradient(135deg,#1b5e20,#43a047)', boxShadow:'0 6px 18px rgba(0,0,0,0.25)'
  },
  grid:{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:18, padding:'16px 6px' },
  card:{ background:'#fff', borderRadius:12, boxShadow:'0 6px 18px rgba(0,0,0,0.08)', cursor:'pointer', padding:12, textAlign:'center', transition:'transform .2s' },
  cardImg:{ width:'100%', height:160, objectFit:'cover', borderRadius:10, background:'#f4f4f4' },
  cardTitle:{ margin:'10px 0 0', fontSize:16 },
  modalBg:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 },
  modal:{ width:'min(92%,800px)', background:'#fff', padding:18, borderRadius:14, boxShadow:'0 20px 50px rgba(0,0,0,0.35)', display:'flex', alignItems:'flex-start', position:'relative' },
  close:{ position:'absolute', right:16, top:12, border:0, background:'#f2f2f2', borderRadius:8, padding:'6px 10px', cursor:'pointer' },
  priceBadge:{ display:'inline-block', background:'linear-gradient(90deg,#d8fcd8,#ffffff)', color:'#111', padding:'8px 18px', borderRadius:25, fontWeight:700, boxShadow:'0 2px 8px rgba(0,0,0,0.1)' },
  admin:{ position:'fixed', right:18, top:78, width:380, maxWidth:'92%', background:'#fff', borderRadius:12, boxShadow:'0 12px 30px rgba(0,0,0,0.2)', padding:14, zIndex:10000 },
  form:{ display:'grid', gap:8 },
  primary:{ background:'#1b5e20', color:'#fff', border:0, padding:'8px 12px', borderRadius:8, cursor:'pointer' },
  danger:{ background:'#e53935', color:'#fff', border:0, padding:'8px 12px', borderRadius:8, cursor:'pointer' }
}
