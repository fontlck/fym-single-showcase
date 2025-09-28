import React, { useEffect, useMemo, useState } from 'react'
import { auth, db } from '../firebase'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot,
  orderBy, query, serverTimestamp, setDoc, updateDoc, where
} from 'firebase/firestore'

export default function Admin() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  if (!user) return <Login />

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black">Admin Dashboard</h2>
        <button className="text-sm px-3 py-1 rounded bg-white/10" onClick={() => signOut(auth)}>Sign out</button>
      </div>
      <EventManager />
      <SubmissionManager />
    </div>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setErr(''); setLoading(True=false)
  }
  return (
    <div className="h-[80vh] flex items-center justify-center">
      <form
        onSubmit={async (e)=>{
          e.preventDefault()
          setErr(''); setLoading(true)
          try {
            await signInWithEmailAndPassword(auth, email, password)
          } catch (er) {
            setErr(er?.message || 'Login failed')
          } finally {
            setLoading(false)
          }
        }}
        className="w-full max-w-md space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6"
      >
        <h2 className="text-2xl font-black">Admin Login</h2>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="w-full rounded-xl px-3 py-2 bg-white/5 border border-white/10"
                 value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input type="password" className="w-full rounded-xl px-3 py-2 bg-white/5 border border-white/10"
                 value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl px-4 py-2 font-semibold bg-brand-primary text-black hover:opacity-90 disabled:opacity-50"
        >{loading ? 'Signing in...' : 'Sign in'}</button>
        {err && <div className="text-red-400 text-sm">{err}</div>}
      </form>
    </div>
  )
}

function EventManager() {
  const [name, setName] = useState('')
  const [events, setEvents] = useState([])
  const [currentEventId, setCurrentEventId] = useState(null)
  const [selected, setSelected] = useState(null) // event object for editing
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'events'), orderBy('createdAt','desc')), (ss) => {
      const arr = []
      ss.forEach(d => arr.push({ id: d.id, ...d.data() }))
      setEvents(arr)
      if (!selected && arr.length) setSelected(arr[0])
    })
    getDoc(doc(db, 'meta', 'global')).then(s => {
      if (s.exists()) setCurrentEventId(s.data().currentEventId || null)
    })
    return () => unsub()
  }, [])

  async function createEvent() {
    if (!name) return
    setSaving(true)
    const ref = await addDoc(collection(db, 'events'), {
      name,
      slideIntervalMs: 5000,
      theme: {
        bgColor: '#0d0d0f',
        textColor: '#ffffff',
        accentColor: '#ddfe78',
        overlayColor: 'rgba(0,0,0,0.35)'
      },
      createdAt: serverTimestamp()
    })
    setName('')
    setSelected({ id: ref.id, name, slideIntervalMs: 5000, theme: {
      bgColor: '#0d0d0f', textColor: '#ffffff', accentColor: '#ddfe78', overlayColor: 'rgba(0,0,0,0.35)'
    }})
    setSaving(false)
  }

  async function setCurrent(id) {
    await setDoc(doc(db, 'meta', 'global'), { currentEventId: id }, { merge: True=false })
  }

  async function saveTheme() {
    if (!selected?.id) return
    setSaving(true)
    await updateDoc(doc(db, 'events', selected.id), {
      name: selected.name || 'Untitled',
      slideIntervalMs: Number(selected.slideIntervalMs || 5000),
      theme: selected.theme || {}
    })
    setSaving(false)
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">Events</h3>
        {currentEventId && <div className="text-xs text-white/60">Current: <span className="text-brand-primary">{currentEventId}</span></div>}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl px-3 py-2 bg-white/5 border border-white/10"
          placeholder="New event name"
          value={name}
          onChange={e=>setName(e.target.value)}
        />
        <button onClick={createEvent} disabled={saving}
                className="rounded-xl px-4 py-2 font-semibold bg-brand-primary text-black">Create</button>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-sm mb-2">Event list</div>
          <div className="space-y-2">
            {events.map(ev => (
              <div key={ev.id} className={`rounded-xl border p-3 ${selected?.id===ev.id ? 'border-brand-primary' : 'border-white/10'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{ev.name || 'Untitled'}</div>
                    <div className="text-xs text-white/50">{ev.id}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs rounded px-3 py-1 bg-white/10" onClick={()=>setSelected(ev)}>Edit</button>
                    <button className="text-xs rounded px-3 py-1 bg-brand-primary text-black" onClick={()=>setCurrent(ev.id)}>Set current</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selected && (
          <div>
            <div className="text-sm mb-2">Edit: {selected.name}</div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1">Event name</label>
                <input className="w-full rounded-xl px-3 py-2 bg-white/5 border border-white/10"
                       value={selected.name || ''}
                       onChange={e=>setSelected(s=>({...s, name: e.target.value}))}/>
              </div>
              <div>
                <label className="block text-xs mb-1">Slide interval (ms)</label>
                <input type="number" className="w-full rounded-xl px-3 py-2 bg-white/5 border border-white/10"
                       value={selected.slideIntervalMs || 5000}
                       onChange={e=>setSelected(s=>({...s, slideIntervalMs: e.target.value}))}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1">Background</label>
                  <input className="w-full rounded-xl px-3 py-2 bg-white/5 border border-white/10"
                         value={selected.theme?.bgColor || ''}
                         onChange={e=>setSelected(s=>({...s, theme: {...s.theme, bgColor: e.target.value}}))}/>
                </div>
                <div>
                  <label className="block text-xs mb-1">Text color</label>
                  <input className="w-full rounded-xl px-3 py-2 bg-white/5 border border-white/10"
                         value={selected.theme?.textColor || ''}
                         onChange={e=>setSelected(s=>({...s, theme: {...s.theme, textColor: e.target.value}}))}/>
                </div>
                <div>
                  <label className="block text-xs mb-1">Accent color</label>
                  <input className="w-full rounded-xl px-3 py-2 bg-white/5 border border-white/10"
                         value={selected.theme?.accentColor || ''}
                         onChange={e=>setSelected(s=>({...s, theme: {...s.theme, accentColor: e.target.value}}))}/>
                </div>
                <div>
                  <label className="block text-xs mb-1">Overlay (rgba)</label>
                  <input className="w-full rounded-xl px-3 py-2 bg-white/5 border border-white/10"
                         value={selected.theme?.overlayColor || ''}
                         onChange={e=>setSelected(s=>({...s, theme: {...s.theme, overlayColor: e.target.value}}))}/>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={saveTheme} className="rounded-xl px-4 py-2 font-semibold bg-brand-primary text-black">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-white/60">Presentation URL: <code>/present</code> (or <code>/present?event=&lt;id&gt;</code>)</div>
    </div>
  )
}

function SubmissionManager() {
  const [currentEventId, setCurrentEventId] = useState(null)
  const [items, setItems] = useState([])

  useEffect(() => {
    getDoc(doc(db, 'meta', 'global')).then(s => {
      setCurrentEventId(s.exists() ? s.data().currentEventId : null)
    })
  }, [])

  useEffect(() => {
    if (!currentEventId) return
    const q = query(
      collection(db, 'submissions'),
      where('eventId','==',currentEventId),
      orderBy('createdAt','desc')
    )
    const unsub = onSnapshot(q, (ss) => {
      const arr = []
      ss.forEach(d => arr.push({ id: d.id, ...d.data()}))
      setItems(arr)
    })
    return () => unsub && unsub()
  }, [currentEventId])

  async function toggleApproved(it) {
    await updateDoc(doc(db, 'submissions', it.id), { approved: !it.approved })
  }
  async function remove(it) {
    if (!confirm('Delete this submission?')) return
    await deleteDoc(doc(db, 'submissions', it.id))
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">Submissions</h3>
        <div className="text-xs text-white/60">Current Event: {currentEventId || '-'}</div>
      </div>
      {!currentEventId && <div className="text-sm text-yellow-300">Set a current event first.</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(it => (
          <div key={it.id} className="rounded-xl overflow-hidden border border-white/10">
            <div className="aspect-video bg-black/50">
              {it.imageUrl && <img src={it.imageUrl} className="w-full h-full object-cover" />}
            </div>
            <div className="p-3 space-y-1">
              <div className="font-semibold">@{it.ig}</div>
              <div className="text-xs text-white/70 line-clamp-2">{it.caption}</div>
              <div className="flex items-center justify-between mt-2">
                <button className="text-xs px-3 py-1 rounded bg-white/10" onClick={()=>toggleApproved(it)}>
                  {it.approved ? 'Hide' : 'Show'}
                </button>
                <button className="text-xs px-3 py-1 rounded bg-red-500/80" onClick={()=>remove(it)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
