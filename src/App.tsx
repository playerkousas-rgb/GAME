/**
 * Scout System — 集會遊戲平台（路由總入口）
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './components/Home'
import BackToHub from './components/BackToHub'
import KimsApp from './apps/kims/KimsApp'
import PhotoApp from './apps/photo/PhotoApp'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/kims"
        element={
          <>
            <KimsApp />
            <BackToHub />
          </>
        }
      />
      <Route
        path="/photo"
        element={
          <>
            <PhotoApp />
            <BackToHub />
          </>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
