import React, { useEffect, useMemo, useRef, useState } from 'react'
import { db } from '../firebase'
import { collection, doc, getDoc, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import Slide from '../components/Slide'

export default function Presentation() {
  const [eventId, setEventId] = useState(null)
  const [theme, setTheme] = useState({})
  const [items, setItems] = useState([])
  const [intervalMs, setIntervalMs] = useState(5000)
  const [idx, setIdx] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    async function init() {
      const params = new URLSearchParams(window.location.search)
      const manualId = params.get('event')
      if (manualId) {
        setEventId(manualId)
        return
      }
      const metaRef = doc(db, 'meta', 'global')
      const snap = await getDoc(metaRef)
      const id = snap.exists() ? snap.data().currentEventId : null
      setEventId(id)
    }
    init()
  }, [])

  useEffect(() => {
    if (!eventId) return
    const evRef = doc(db, 'events', eventId)
    getDoc(evRef).then(snap => {
      if (snap.exists()) {
        const d = snap.data()
        setTheme(d?.theme || {})
        setIntervalMs(d?.slideIntervalMs || 5000)
      }
    })
    const q = query(
      collection(db, 'submissions'),
      where('eventId','==',eventId),
      where('approved','==',true),
      orderBy('createdAt','desc')
    )
    const unsub = onSnapshot(q, (ss) => {
      const arr = []
      ss.forEach(d => arr.push({ id: d.id, ...d.data() }))
      setItems(arr)
      setIdx(0)
    })
    return () => unsub()
  }, [eventId])

  useEffect(() => {
    if (!items.length) return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setIdx(i => (i + 1) % items.length)
    }, intervalMs)
    return () => clearInterval(timerRef.current)
  }, [items, intervalMs])

  if (!eventId) {
    return <div className="h-screen flex items-center justify-center">No active event id.</div>
  }

  if (!items.length) {
    return <div className="h-screen flex items-center justify-center">Waiting for submissions...</div>
  }

  const current = items[idx]
  return <Slide item={current} theme={theme} />
}
