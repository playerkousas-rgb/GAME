/**
 * Scout System — 集會遊戲平台（路由總入口）
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './components/Home'
import BackToHub from './components/BackToHub'
import KimsApp from './apps/kims/KimsApp'
import PhotoApp from './apps/photo/PhotoApp'
import DrawApp from './apps/draw/DrawApp'
import ActApp from './apps/act/ActApp'
import EmojiApp from './apps/emoji/EmojiApp'
import UndercoverApp from './apps/undercover/UndercoverApp'
import PlayerCard from './apps/undercover/PlayerCard'
import DrawCard from './apps/draw/DrawCard'

const GAME_ROUTES = [
  { path: '/kims', element: <KimsApp /> },
  { path: '/photo', element: <PhotoApp /> },
  { path: '/draw', element: <DrawApp /> },
  { path: '/act', element: <ActApp /> },
  { path: '/emoji', element: <EmojiApp /> },
  { path: '/undercover', element: <UndercoverApp /> },
]

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {GAME_ROUTES.map((r) => (
        <Route
          key={r.path}
          path={r.path}
          element={
            <>
              {r.element}
              <BackToHub />
            </>
          }
        />
      ))}
      <Route path="/undercover/card" element={<PlayerCard />} />
      <Route path="/draw/card" element={<DrawCard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
