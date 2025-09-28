import React, { useEffect, useState } from 'react'
import { db, storage } from '../firebase'
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export default function Submit() {
  const [ig, setIg] = useState('')
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [currentEventId, setCurrentEventId] = useState(null)
  const [error, setError] = useState('')
  const [okMsg, setOkMsg] = useState('')

  useEffect(() => {
    async function load() {
      const metaRef = doc(db, 'meta', 'global')
      const snap = await getDoc(metaRef)
      setCurrentEventId(snap.exists() ? snap.data().currentEventId : null)
    }
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setOkMsg('')
    setError('')
    if (!currentEventId) {
      setError('Event is not set yet. Please ask staff/admin.')
      return
    }
    if (!ig || !file) {
      setError('Please fill IG and choose an image.')
      return
    }
    try {
      setSubmitting(true)
      const fileId = Math.random().toString(36).slice(2)
      const fileRef = ref(storage, `events/${currentEventId}/uploads/${fileId}-${file.name}`)
      await uploadBytes(fileRef, file)
      const url = await getDownloadURL(fileRef)

      await addDoc(collection(db, 'submissions'), {
        ig: ig.replace(/^@/, ''),
        caption,
        imageUrl: url,
        eventId: currentEventId,
        approved: true, // default show; admin can toggle off later
        createdAt: serverTimestamp()
      })
      setOkMsg('Submitted! Thanks.')
      setIg(''); setCaption(''); setFile(null)
      e.target.reset()
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h2 className="text-3xl font-black mb-6">Join the <span className="text-brand-primary">Single Showcase</span></h2>
      {!currentEventId && (
        <div className="mb-4 text-sm text-yellow-300">No active Event configured yet.</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm mb-1">Instagram</label>
          <input
            className="w-full rounded-xl px-3 py-2 bg-white/5 border border-white/10 outline-none"
            placeholder="@your.ig"
            value={ig}
            onChange={e=>setIg(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Upload Picture</label>
          <input
            type="file"
            accept="image/*"
            onChange={e=>setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Caption</label>
          <textarea
            className="w-full rounded-xl px-3 py-2 bg-white/5 border border-white/10 outline-none min-h-[100px]"
            placeholder="Say something fun..."
            value={caption}
            onChange={e=>setCaption(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl px-4 py-2 font-semibold bg-brand-primary text-black hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        {okMsg && <div className="text-green-400 text-sm">{okMsg}</div>}
      </form>
    </div>
  )
}
