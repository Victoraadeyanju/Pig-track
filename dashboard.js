import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const TABS = ['Inventory', 'Feeding', 'Breeding', 'Sales']
const BREED_OPTIONS = ['Yorkshire', 'Duroc', 'Landrace', 'Berkshire', 'Hampshire', 'Mixed']
const STATUS_OPTIONS = ['Healthy', 'Sick', 'Quarantine', 'Sold']
const FEED_TYPES = ['Starter', 'Grower Pellets', 'Finisher', 'Sow Ration', 'Boar Ration', 'Other']
const BREEDING_STATUS = ['Gestating', 'Farrowed', 'Failed', 'Weaned']
const STATUS_COLORS = { Healthy:'#4caf50', Sick:'#f44336', Quarantine:'#ff9800', Sold:'#9e9e9e' }

function Badge({ label, color }) {
  return <span style={{ background:color+'22', color, border:`1px solid ${color}55`, borderRadius:4, padding:'2px 8px', fontSize:12, fontWeight:600 }}>{label}</span>
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(30,20,10,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:12 }}>
      <div style={{ background:'#fff8f0', borderRadius:12, padding:24, width:420, maxWidth:'100%', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 8px 40px rgba(0,0,0,0.18)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <span style={{ fontWeight:700, fontSize:16, color:'#3d1f00' }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#a0764a' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:12 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#7a4a1a', marginBottom:4 }}>{label}</label>
      {children}
    </div>
  )
}

const inp = { width:'100%', padding:'8px 10px', borderRadius:6, border:'1px solid #d4a97a', background:'#fffdf8', fontSize:14, color:'#3d1f00', boxSizing:'border-box', fontFamily:'Georgia,serif' }
const btnPrimary = { background:'#7c3d00', color:'#ffe4b5', border:'none', borderRadius:7, padding:'9px 20px', cursor:'pointer', fontWeight:600, fontSize:14, fontFamily:'Georgia,serif' }
const btnSmall = (bg) => ({ background:bg, color:'#fff', border:'none', borderRadius:5, padding:'4px 10px', cursor:'pointer', fontSize:12, fontFamily:'Georgia,serif' })

export default function Dashboard({ session }) {
  const [tab, setTab] = useState('Inventory')
  const [pigs, setPigs] = useState([])
  const [feedLogs, setFeedLogs] = useState([])
  const [breedingLogs, setBreedingLogs] = useState([])
  const [salesLogs, setSalesLogs] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) { window.location.href = '/'; return }
    fetchAll()
  }, [session])

  async function fetchAll() {
    setLoading(true)
    const [p, f, b, s] = await Promise.all([
      supabase.from('pigs').select('*').order('created_at', { ascending: false }),
      supabase.from('feed_logs').select('*').order('date', { ascending: false }),
      supabase.from('breeding_logs').select('*').order('service_date', { ascending: false }),
      supabase.from('sales_logs').select('*').order('date', { ascending: false }),
    ])
    setPigs(p.data || [])
    setFeedLogs(f.data || [])
    setBreedingLogs(b.data || [])
    setSalesLogs(s.data || [])
    setLoading(false)
  }

  const closeModal = () => { setModal(null); setForm({}) }
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function addPig() {
    await supabase.from('pigs').insert([{
      tag_id: form.tag_id || '', name: form.name || '', breed: form.breed || 'Yorkshire',
      dob: form.dob || null, weight_kg: Number(form.weight_kg) || 0,
      status: form.status || 'Healthy', pen: form.pen || '', notes: form.notes || ''
    }])
    closeModal(); fetchAll()
  }

  async function editPig() {
    await supabase.from('pigs').update({
      name: form.name, breed: form.breed, dob: form.dob || null,
      weight_kg: Number(form.weight_kg), status: form.status, pen: form.pen, notes: form.notes
    }).eq('id', form.id)
    closeModal(); fetchAll()
  }

  async function deletePig(id) {
    if (!confirm('Delete this pig record?')) return
    await supabase.from('pigs').delete().eq('id', id)
    fetchAll()
  }

  async function addFeed() {
    await supabase.from('feed_logs').insert([{
      date: form.date || new Date().toISOString().slice(0,10),
      pig_id: form.pig_id || null, feed_type: form.feed_type || 'Grower Pellets',
      amount: Number(form.amount) || 0, unit: form.unit || 'kg', notes: form.notes || ''
    }])
    closeModal(); fetchAll()
  }

  async function addBreeding() {
    await supabase.from('breeding_logs').insert([{
      sow_id: form.sow_id || null, boar_id: form.boar_id || null,
      service_date: form.service_date || null, expected_farrow: form.expected_farrow || null,
      status: form.status || 'Gestating', piglets_born: Number(form.piglets_born) || null,
      notes: form.notes || ''
    }])
    closeModal(); fetchAll()
  }

  async function addSale() {
    const total = (Number(form.weight_kg) * Number(form.price_per_kg)).toFixed(2)
    await supabase.from('sales_logs').insert([{
      date: form.date || new Date().toISOString().slice(0,10),
      pig_id: form.pig_id || null, buyer: form.buyer || '',
      weight_kg: Number(form.weight_kg) || 0, price_per_kg: Number(form.price_per_kg) || 0,
      total: Number(total), notes: form.notes || ''
    }])
    closeModal(); fetchAll()
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (!session) return null

  const totalPigs = pigs.filter(p => p.status !== 'Sold').length
  const sickPigs = pigs.filter(p => p.status === 'Sick' || p.status === 'Quarantine').length
  const gestating = breedingLogs.filter(b => b.status === 'Gestating').length
  const totalRevenue = salesLogs.reduce((s, l) => s + Number(l.total), 0)
  const pigOptions = pigs.map(p => <option key={p.id} value={p.id}>{p.tag_id} – {p.name}</option>)
  const filteredPigs = pigs.filter(p =>
    (p.name||'').toLowerCase().includes(search.toLowerCase()) ||
    (p.tag_id||'').toLowerCase().includes(search.toLowerCase()) ||
    (p.breed||'').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ fontFamily:'Georgia,serif', background:'#f5ede0', minHeight:'100vh', color:'#3d1f00' }}>

      {/* Header */}
      <div style={{ background:'#7c3d00', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:28 }}>🐷</span>
          <div>
            <div style={{ color:'#ffe4b5', fontSize:20, fontWeight:700 }}>PigTrack</div>
            <div style={{ color:'#d4a97a', fontSize:11 }}>Farm Record Management</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ color:'#d4a97a', fontSize:12 }}>{session.user.email}</span>
          <button onClick={signOut} style={{ background:'#5a2d00', color:'#ffe4b5', border:'none', borderRadius:6, padding:'6px 14px', cursor:'pointer', fontSize:12, fontFamily:'Georgia,serif' }}>Log Out</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'flex', gap:10, padding:'14px 16px', background:'#f0dfc4', borderBottom:'1px solid #d4a97a', flexWrap:'wrap' }}>
        {[
          { label:'Active Pigs', value:totalPigs, icon:'🐖' },
          { label:'Needs Attention', value:sickPigs, icon:'🩺', warn:sickPigs > 0 },
          { label:'Gestating Sows', value:gestating, icon:'🍼' },
          { label:'Total Revenue', value:`$${totalRevenue.toFixed(2)}`, icon:'💰' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff8f0', borderRadius:10, padding:'10px 16px', border: s.warn ? '1.5px solid #f44336' : '1px solid #d4a97a', flex:'1 1 130px' }}>
            <div style={{ fontSize:11, color:'#a0764a', fontStyle:'italic' }}>{s.icon} {s.label}</div>
            <div style={{ fontSize:22, fontWeight:700, color: s.warn ? '#f44336' : '#7c3d00' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'2px solid #d4a97a', background:'#f0dfc4', overflowX:'auto' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:'10px 18px', border:'none', cursor:'pointer', fontSize:14, fontWeight:600, background: tab===t ? '#7c3d00' : 'transparent', color: tab===t ? '#ffe4b5' : '#7a4a1a', whiteSpace:'nowrap', fontFamily:'Georgia,serif' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding:16, maxWidth:960, margin:'0 auto' }}>
        {loading && <div style={{ textAlign:'center', padding:40, color:'#a0764a' }}>Loading records…</div>}

        {/* INVENTORY */}
        {!loading && tab === 'Inventory' && (
          <div>
            <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
              <input placeholder="Search pigs…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, flex:'1 1 180px', maxWidth:280 }} />
              <button onClick={() => setModal('addPig')} style={btnPrimary}>+ Add Pig</button>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', background:'#fff8f0', borderRadius:10, overflow:'hidden', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#7c3d00', color:'#ffe4b5' }}>
                    {['Tag ID','Name','Breed','DOB','Weight (kg)','Pen','Status','Actions'].map(h => (
                      <th key={h} style={{ padding:'10px 10px', textAlign:'left', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPigs.map((p, i) => (
                    <tr key={p.id} style={{ background: i%2===0 ? '#fff8f0' : '#fdf0e0', borderBottom:'1px solid #f0dfc4' }}>
                      <td style={{ padding:'8px 10px', fontWeight:600 }}>{p.tag_id}</td>
                      <td style={{ padding:'8px 10px' }}>{p.name}</td>
                      <td style={{ padding:'8px 10px' }}>{p.breed}</td>
                      <td style={{ padding:'8px 10px' }}>{p.dob}</td>
                      <td style={{ padding:'8px 10px' }}>{p.weight_kg}</td>
                      <td style={{ padding:'8px 10px' }}>{p.pen}</td>
                      <td style={{ padding:'8px 10px' }}><Badge label={p.status} color={STATUS_COLORS[p.status]||'#7c3d00'} /></td>
                      <td style={{ padding:'8px 10px', whiteSpace:'nowrap' }}>
                        <button onClick={() => { setForm({...p}); setModal('editPig') }} style={btnSmall('#a0764a')}>Edit</button>
                        {' '}
                        <button onClick={() => deletePig(p.id)} style={btnSmall('#c0392b')}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {filteredPigs.length === 0 && <tr><td colSpan={8} style={{ textAlign:'center', padding:24, color:'#a0764a' }}>No pigs found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FEEDING */}
        {!loading && tab === 'Feeding' && (
          <div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
              <button onClick={() => setModal('addFeed')} style={btnPrimary}>+ Log Feeding</button>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', background:'#fff8f0', borderRadius:10, overflow:'hidden', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#7c3d00', color:'#ffe4b5' }}>
                    {['Date','Pig / Group','Feed Type','Amount','Notes'].map(h => <th key={h} style={{ padding:'10px 10px', textAlign:'left' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {feedLogs.map((l, i) => (
                    <tr key={l.id} style={{ background: i%2===0 ? '#fff8f0' : '#fdf0e0', borderBottom:'1px solid #f0dfc4' }}>
                      <td style={{ padding:'8px 10px' }}>{l.date}</td>
                      <td style={{ padding:'8px 10px' }}>{l.pig_id ? pigs.find(p=>p.id===l.pig_id)?.name || l.pig_id : 'All Pigs'}</td>
                      <td style={{ padding:'8px 10px' }}>{l.feed_type}</td>
                      <td style={{ padding:'8px 10px' }}>{l.amount} {l.unit}</td>
                      <td style={{ padding:'8px 10px', color:'#a0764a', fontStyle:'italic' }}>{l.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BREEDING */}
        {!loading && tab === 'Breeding' && (
          <div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
              <button onClick={() => setModal('addBreeding')} style={btnPrimary}>+ Log Breeding</button>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', background:'#fff8f0', borderRadius:10, overflow:'hidden', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#7c3d00', color:'#ffe4b5' }}>
                    {['Sow','Boar','Service Date','Expected Farrow','Status','Piglets Born','Notes'].map(h => <th key={h} style={{ padding:'10px 10px', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {breedingLogs.map((l, i) => (
                    <tr key={l.id} style={{ background: i%2===0 ? '#fff8f0' : '#fdf0e0', borderBottom:'1px solid #f0dfc4' }}>
                      <td style={{ padding:'8px 10px' }}>{pigs.find(p=>p.id===l.sow_id)?.name || l.sow_id}</td>
                      <td style={{ padding:'8px 10px' }}>{pigs.find(p=>p.id===l.boar_id)?.name || l.boar_id}</td>
                      <td style={{ padding:'8px 10px' }}>{l.service_date}</td>
                      <td style={{ padding:'8px 10px' }}>{l.expected_farrow}</td>
                      <td style={{ padding:'8px 10px' }}><Badge label={l.status} color={l.status==='Farrowed'?'#4caf50':l.status==='Failed'?'#f44336':'#ff9800'} /></td>
                      <td style={{ padding:'8px 10px' }}>{l.piglets_born || '—'}</td>
                      <td style={{ padding:'8px 10px', color:'#a0764a', fontStyle:'italic' }}>{l.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SALES */}
        {!loading && tab === 'Sales' && (
          <div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
              <button onClick={() => setModal('addSale')} style={btnPrimary}>+ Record Sale</button>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', background:'#fff8f0', borderRadius:10, overflow:'hidden', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#7c3d00', color:'#ffe4b5' }}>
                    {['Date','Pig','Buyer','Weight (kg)','Price/kg','Total','Notes'].map(h => <th key={h} style={{ padding:'10px 10px', textAlign:'left' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {salesLogs.map((l, i) => (
                    <tr key={l.id} style={{ background: i%2===0 ? '#fff8f0' : '#fdf0e0', borderBottom:'1px solid #f0dfc4' }}>
                      <td style={{ padding:'8px 10px' }}>{l.date}</td>
                      <td style={{ padding:'8px 10px' }}>{pigs.find(p=>p.id===l.pig_id)?.name || '—'}</td>
                      <td style={{ padding:'8px 10px' }}>{l.buyer}</td>
                      <td style={{ padding:'8px 10px' }}>{l.weight_kg}</td>
                      <td style={{ padding:'8px 10px' }}>${l.price_per_kg}</td>
                      <td style={{ padding:'8px 10px', fontWeight:700, color:'#3a7d00' }}>${Number(l.total).toFixed(2)}</td>
                      <td style={{ padding:'8px 10px', color:'#a0764a', fontStyle:'italic' }}>{l.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop:14, textAlign:'right', fontSize:16, fontWeight:700, color:'#3a7d00' }}>
              Total Revenue: ${totalRevenue.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {modal === 'addPig' && (
        <Modal title="Add New Pig" onClose={closeModal}>
          <Field label="Tag / ID"><input style={inp} value={form.tag_id||''} onChange={set('tag_id')} placeholder="e.g. P003" /></Field>
          <Field label="Name"><input style={inp} value={form.name||''} onChange={set('name')} placeholder="Pig name" /></Field>
          <div style={{ display:'flex', gap:10 }}>
            <Field label="Breed"><select style={inp} value={form.breed||'Yorkshire'} onChange={set('breed')}>{BREED_OPTIONS.map(b=><option key={b}>{b}</option>)}</select></Field>
            <Field label="Status"><select style={inp} value={form.status||'Healthy'} onChange={set('status')}>{STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}</select></Field>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <Field label="Date of Birth"><input type="date" style={inp} value={form.dob||''} onChange={set('dob')} /></Field>
            <Field label="Weight (kg)"><input type="number" style={inp} value={form.weight_kg||''} onChange={set('weight_kg')} /></Field>
          </div>
          <Field label="Pen / Location"><input style={inp} value={form.pen||''} onChange={set('pen')} placeholder="e.g. A3" /></Field>
          <Field label="Notes"><input style={inp} value={form.notes||''} onChange={set('notes')} /></Field>
          <button onClick={addPig} style={{ ...btnPrimary, width:'100%', marginTop:4 }}>Add Pig</button>
        </Modal>
      )}

      {modal === 'editPig' && (
        <Modal title={`Edit Pig – ${form.tag_id}`} onClose={closeModal}>
          <Field label="Name"><input style={inp} value={form.name||''} onChange={set('name')} /></Field>
          <div style={{ display:'flex', gap:10 }}>
            <Field label="Breed"><select style={inp} value={form.breed||''} onChange={set('breed')}>{BREED_OPTIONS.map(b=><option key={b}>{b}</option>)}</select></Field>
            <Field label="Status"><select style={inp} value={form.status||''} onChange={set('status')}>{STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}</select></Field>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <Field label="Date of Birth"><input type="date" style={inp} value={form.dob||''} onChange={set('dob')} /></Field>
            <Field label="Weight (kg)"><input type="number" style={inp} value={form.weight_kg||''} onChange={set('weight_kg')} /></Field>
          </div>
          <Field label="Pen"><input style={inp} value={form.pen||''} onChange={set('pen')} /></Field>
          <Field label="Notes"><input style={inp} value={form.notes||''} onChange={set('notes')} /></Field>
          <button onClick={editPig} style={{ ...btnPrimary, width:'100%', marginTop:4 }}>Save Changes</button>
        </Modal>
      )}

      {modal === 'addFeed' && (
        <Modal title="Log Feeding" onClose={closeModal}>
          <Field label="Date"><input type="date" style={inp} value={form.date||new Date().toISOString().slice(0,10)} onChange={set('date')} /></Field>
          <Field label="Pig (leave blank for All)"><select style={inp} value={form.pig_id||''} onChange={set('pig_id')}><option value="">All Pigs</option>{pigOptions}</select></Field>
          <Field label="Feed Type"><select style={inp} value={form.feed_type||'Grower Pellets'} onChange={set('feed_type')}>{FEED_TYPES.map(f=><option key={f}>{f}</option>)}</select></Field>
          <div style={{ display:'flex', gap:10 }}>
            <Field label="Amount"><input type="number" style={inp} value={form.amount||''} onChange={set('amount')} /></Field>
            <Field label="Unit"><select style={inp} value={form.unit||'kg'} onChange={set('unit')}>{['kg','lbs','bags','liters'].map(u=><option key={u}>{u}</option>)}</select></Field>
          </div>
          <Field label="Notes"><input style={inp} value={form.notes||''} onChange={set('notes')} /></Field>
          <button onClick={addFeed} style={{ ...btnPrimary, width:'100%', marginTop:4 }}>Save Log</button>
        </Modal>
      )}

      {modal === 'addBreeding' && (
        <Modal title="Log Breeding Event" onClose={closeModal}>
          <Field label="Sow"><select style={inp} value={form.sow_id||''} onChange={set('sow_id')}><option value="">Select sow…</option>{pigOptions}</select></Field>
          <Field label="Boar"><select style={inp} value={form.boar_id||''} onChange={set('boar_id')}><option value="">Select boar…</option>{pigOptions}</select></Field>
          <div style={{ display:'flex', gap:10 }}>
            <Field label="Service Date"><input type="date" style={inp} value={form.service_date||''} onChange={set('service_date')} /></Field>
            <Field label="Expected Farrow"><input type="date" style={inp} value={form.expected_farrow||''} onChange={set('expected_farrow')} /></Field>
          </div>
          <Field label="Status"><select style={inp} value={form.status||'Gestating'} onChange={set('status')}>{BREEDING_STATUS.map(s=><option key={s}>{s}</option>)}</select></Field>
          <Field label="Piglets Born"><input type="number" style={inp} value={form.piglets_born||''} onChange={set('piglets_born')} /></Field>
          <Field label="Notes"><input style={inp} value={form.notes||''} onChange={set('notes')} /></Field>
          <button onClick={addBreeding} style={{ ...btnPrimary, width:'100%', marginTop:4 }}>Save Record</button>
        </Modal>
      )}

      {modal === 'addSale' && (
        <Modal title="Record Sale" onClose={closeModal}>
          <Field label="Date"><input type="date" style={inp} value={form.date||new Date().toISOString().slice(0,10)} onChange={set('date')} /></Field>
          <Field label="Pig Sold"><select style={inp} value={form.pig_id||''} onChange={set('pig_id')}><option value="">Select pig…</option>{pigOptions}</select></Field>
          <Field label="Buyer / Market"><input style={inp} value={form.buyer||''} onChange={set('buyer')} placeholder="Buyer name" /></Field>
          <div style={{ display:'flex', gap:10 }}>
            <Field label="Weight (kg)"><input type="number" style={inp} value={form.weight_kg||''} onChange={set('weight_kg')} /></Field>
            <Field label="Price per kg ($)"><input type="number" style={inp} value={form.price_per_kg||''} onChange={set('price_per_kg')} /></Field>
          </div>
          {form.weight_kg && form.price_per_kg && (
            <div style={{ background:'#f0ffe0', border:'1px solid #4caf50', borderRadius:6, padding:'8px 12px', marginBottom:8, fontWeight:700, color:'#3a7d00' }}>
              Total: ${(Number(form.weight_kg)*Number(form.price_per_kg)).toFixed(2)}
            </div>
          )}
          <Field label="Notes"><input style={inp} value={form.notes||''} onChange={set('notes')} /></Field>
          <button onClick={addSale} style={{ ...btnPrimary, width:'100%', marginTop:4 }}>Record Sale</button>
        </Modal>
      )}
    </div>
  )
}
