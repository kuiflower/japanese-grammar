import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import './App.css'

const GrammarHome = lazy(() => import('./pages/GrammarHome'))
const GrammarList = lazy(() => import('./pages/GrammarList'))
const Practice = lazy(() => import('./pages/Practice'))
const PracticeSession = lazy(() => import('./pages/PracticeSession'))
const WrongReviewSession = lazy(() => import('./pages/WrongReviewSession'))

const VocabularyHome = lazy(() => import('./pages/VocabularyHome'))
const VocabularyList = lazy(() => import('./pages/VocabularyList'))
const VocabularyPractice = lazy(() => import('./pages/VocabularyPractice'))
const VocabularyPracticeSession = lazy(() => import('./pages/VocabularyPracticeSession'))
const VocabularyWrongReviewSession = lazy(
  () => import('./pages/VocabularyWrongReviewSession'),
)

function RouteFallback() {
  return (
    <div className="page empty-state">
      <p>加载中…</p>
    </div>
  )
}

function App() {
  return (
    <Layout>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/learn/grammar" element={<GrammarHome />} />
          <Route path="/learn/vocabulary" element={<VocabularyHome />} />
          <Route
            path="/learn/vocabulary/:track"
            element={<Navigate to="/learn/vocabulary" replace />}
          />
          <Route path="/vocabulary/:track" element={<VocabularyList />} />
          <Route path="/vocabulary/:track/:id" element={<VocabularyList />} />
          <Route path="/vocab-practice" element={<VocabularyPractice />} />
          <Route
            path="/vocab-practice/:track/:level"
            element={<VocabularyPracticeSession />}
          />
          <Route
            path="/vocab-wrong/:track/:level"
            element={<VocabularyWrongReviewSession />}
          />
          <Route path="/vocabulary" element={<Navigate to="/vocabulary/exam" replace />} />
          <Route
            path="/vocab-practice/:track"
            element={<Navigate to="/vocab-practice" replace />}
          />
          <Route path="/grammar" element={<GrammarList />} />
          <Route path="/grammar/:id" element={<GrammarList />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/practice/:level" element={<PracticeSession mode="practice" />} />
          <Route path="/wrong/:level" element={<WrongReviewSession />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default App
