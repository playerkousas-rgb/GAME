/**
 * Scout System — 集會遊戲平台（路由總入口）
 * 各遊戲延遲載入（lazy），手機上首屏更快
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './components/Home'
import BackToHub from './components/BackToHub'

const KimsApp = lazy(() => import('./apps/kims/KimsApp'))
const PhotoApp = lazy(() => import('./apps/photo/PhotoApp'))
const DrawApp = lazy(() => import('./apps/draw/DrawApp'))
const ActApp = lazy(() => import('./apps/act/ActApp'))
const EmojiApp = lazy(() => import('./apps/emoji/EmojiApp'))
const UndercoverApp = lazy(() => import('./apps/undercover/UndercoverApp'))
const PlayerCard = lazy(() => import('./apps/undercover/PlayerCard'))
const DrawCard = lazy(() => import('./apps/draw/DrawCard'))

const GAME_ROUTES = [
  { path: '/kims', element: <KimsApp /> },
  { path: '/photo', element: <PhotoApp /> },
  { path: '/draw', element: <DrawApp /> },
  { path: '/act', element: <ActApp /> },
  { path: '/emoji', element: <EmojiApp /> },
  { path: '/undercover', element: <UndercoverApp /> },
]

function PageLoader() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-[#02133e]">
      <div className="text-center">
        <div className="animate-float text-4xl">⚜</div>
        <p className="mt-3 text-xs text-white/60">載入中…</p>
      </div>
    </div>
  )
}

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
              <Suspense fallback={<PageLoader />}>{r.element}</Suspense>
              <BackToHub />
            </>
          }
        />
      ))}
      <Route
        path="/undercover/card"
        element={
          <Suspense fallback={<PageLoader />}>
            <PlayerCard />
          </Suspense>
        }
      />
      <Route
        path="/draw/card"
        element={
          <Suspense fallback={<PageLoader />}>
            <DrawCard />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
