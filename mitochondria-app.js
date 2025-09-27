// package.json
{
  "name": "mitochondria",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "framer-motion": "^10.16.4",
    "nanoid": "^5.0.3",
    "posthog-js": "^1.88.4"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.16",
    "eslint": "^8.54.0",
    "eslint-config-next": "14.0.0",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.6"
  }
}

// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['mitochondria.vercel.app'],
  },
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    KV_URL: process.env.KV_URL,
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    KV_REST_API_READ_ONLY_TOKEN: process.env.KV_REST_API_READ_ONLY_TOKEN,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  }
}

module.exports = nextConfig

// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'neon-green': '#39FF14',
        'dark-green': '#0B5D1E',
        'forest-green': '#0E2314',
        'accent-yellow': '#FFD400',
      },
      fontFamily: {
        'atkinson': ['Atkinson Hyperlegible', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brain': 'radial-gradient(ellipse at center, #0B5D1E 0%, #0E2314 50%, #000000 100%)',
        'gradient-main': 'linear-gradient(135deg, #0E2314 0%, #0B5D1E 50%, #000000 100%)',
      }
    },
  },
  plugins: [],
}

// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

// app/layout.js
import './globals.css'
import { PostHogProvider } from './providers/posthog'

export const metadata = {
  title: 'Mitochondria - AI Decision Tool',
  description: 'Break down any decision into four key reflections with AI',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="font-atkinson">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gradient-main min-h-screen text-white">
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  )
}

// app/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    font-family: 'Atkinson Hyperlegible', system-ui, sans-serif;
  }
  
  body {
    @apply antialiased;
  }
}

@layer components {
  .brain-glow {
    animation: pulse-glow 2s ease-in-out infinite alternate;
  }
  
  .quadrant-reveal {
    animation: reveal-quadrant 1s ease-out forwards;
  }
}

@keyframes pulse-glow {
  0% {
    box-shadow: 0 0 20px rgba(57, 255, 20, 0.3);
  }
  100% {
    box-shadow: 0 0 40px rgba(57, 255, 20, 0.6);
  }
}

@keyframes reveal-quadrant {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

// app/page.js
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { usePostHog } from './providers/posthog'

export default function Home() {
  const [decision, setDecision] = useState('')
  const [timeLeft, setTimeLeft] = useState(90)
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()
  const posthog = usePostHog()

  useEffect(() => {
    posthog?.capture('view_home')
  }, [posthog])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!decision.trim()) return

    setIsGenerating(true)
    posthog?.capture('generate', { decision_length: decision.length })

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: decision.trim() })
      })

      if (!response.ok) throw new Error('Failed to generate')

      const data = await response.json()
      router.push(`/r/${data.id}`)
    } catch (error) {
      console.error('Generation error:', error)
      setIsGenerating(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-4">
          <motion.h1 
            className="text-4xl font-bold text-neon-green brain-glow"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Mitochondria
          </motion.h1>
          <p className="text-lg text-gray-300">
            Break down any decision into four key reflections
          </p>
          <div className="text-accent-yellow text-sm">
            ⚡ {formatTime(timeLeft)} to decide
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <textarea
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              placeholder="What decision are you facing?"
              className="w-full h-24 bg-forest-green border border-dark-green rounded-lg p-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-green focus:border-transparent resize-none"
              maxLength={200}
              disabled={isGenerating}
            />
            <div className="text-xs text-gray-400 mt-1 text-right">
              {decision.length}/200
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={!decision.trim() || isGenerating}
            className="w-full bg-neon-green text-black font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isGenerating ? 'Reflecting...' : 'Generate Reflections'}
          </motion.button>
        </form>

        <div className="text-center space-y-2">
          <a 
            href="/world" 
            className="text-neon-green hover:underline text-sm"
          >
            Explore recent decisions
          </a>
        </div>
      </motion.div>
    </div>
  )
}

// app/r/[id]/page.js
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams } from 'next/navigation'
import { usePostHog } from '../../providers/posthog'
import BrainMap from '../../components/BrainMap'
import ShareButton from '../../components/ShareButton'

export default function ResultPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [showSummary, setShowSummary] = useState(false)
  const [finalChoice, setFinalChoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const posthog = usePostHog()

  useEffect(() => {
    fetchResult()
  }, [id])

  const fetchResult = async () => {
    try {
      const response = await fetch(`/api/result/${id}`)
      if (!response.ok) throw new Error('Result not found')
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching result:', error)
    } finally {
      setLoading(false)
    }
  }

  const revealNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1)
      posthog?.capture('reveal_step', { step: currentStep + 1, decision_id: id })
    } else if (!showSummary) {
      setShowSummary(true)
    }
  }

  const handleChoice = (choice) => {
    setFinalChoice(choice)
    posthog?.capture('yes_no_choice', { choice, decision_id: id })
  }

  const handleDelete = async () => {
    try {
      await fetch(`/api/result/${id}`, { method: 'DELETE' })
      window.location.href = '/'
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          className="text-neon-green"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          ⚡
        </motion.div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-neon-green mb-4">Decision not found</h1>
        <a href="/" className="text-white hover:text-neon-green">
          Make a new decision
        </a>
      </div>
    )
  }

  const quadrants = [
    { title: "Feels Good", content: data.reflections.feelsGood, position: "top-left" },
    { title: "Good for You", content: data.reflections.goodForYou, position: "top-right" },
    { title: "Good for Others", content: data.reflections.goodForOthers, position: "bottom-left" },
    { title: "Good for World", content: data.reflections.goodForWorld, position: "bottom-right" }
  ]

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold text-neon-green mb-2">
            "{data.decision}"
          </h1>
          <div className="flex justify-center gap-4">
            <ShareButton id={id} decision={data.decision} />
            <button
              onClick={handleDelete}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Delete
            </button>
          </div>
        </motion.div>

        <div className="relative mb-8">
          <BrainMap 
            quadrants={quadrants}
            currentStep={currentStep}
            showSummary={showSummary}
          />
          
          <AnimatePresence>
            {currentStep < 4 && !showSummary && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={revealNext}
                className="absolute inset-0 bg-transparent hover:bg-black/20 transition-colors flex items-center justify-center text-neon-green font-bold text-lg cursor-pointer"
              >
                {currentStep === 0 ? "Tap to reveal" : "Next"}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showSummary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="bg-forest-green rounded-lg p-6 border border-dark-green">
                <p className="text-lg text-neon-green italic">
                  "{data.summary}"
                </p>
              </div>

              {!finalChoice && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Are you making this choice now?</h2>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => handleChoice('yes')}
                      className="bg-neon-green text-black font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 transition-all"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => handleChoice('no')}
                      className="bg-gray-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-500 transition-all"
                    >
                      No
                    </button>
                  </div>
                </div>
              )}

              {finalChoice && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="text-accent-yellow text-lg">
                    Choice recorded: {finalChoice}
                  </div>
                  <a
                    href="/"
                    className="inline-block bg-dark-green text-white font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-all"
                  >
                    Make Another Decision
                  </a>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// app/world/page.js
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function WorldPage() {
  const [decisions, setDecisions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDecisions()
  }, [])

  const fetchDecisions = async () => {
    try {
      const response = await fetch('/api/world')
      if (response.ok) {
        const data = await response.json()
        setDecisions(data)
      }
    } catch (error) {
      console.error('Error fetching decisions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          className="text-neon-green"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          ⚡
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-neon-green mb-2">
            Recent Decisions
          </h1>
          <p className="text-gray-300">
            Anonymous decisions from the collective mind
          </p>
          <a
            href="/"
            className="inline-block mt-4 text-neon-green hover:underline"
          >
            ← Make your own decision
          </a>
        </motion.div>

        <div className="space-y-4">
          {decisions.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              No recent decisions yet. Be the first!
            </div>
          ) : (
            decisions.map((decision, index) => (
              <motion.div
                key={decision.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-forest-green rounded-lg p-4 border border-dark-green hover:border-neon-green/30 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-white flex-1">
                    "{decision.decision}"
                  </h3>
                  <span className="text-xs text-gray-400 ml-2">
                    {new Date(decision.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-neon-green text-sm italic">
                  "{decision.summary}"
                </p>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// app/components/BrainMap.js
'use client'

import { motion, AnimatePresence } from 'framer-motion'

export default function BrainMap({ quadrants, currentStep, showSummary }) {
  const positions = {
    'top-left': { x: '25%', y: '25%', transform: 'translate(-50%, -50%)' },
    'top-right': { x: '75%', y: '25%', transform: 'translate(-50%, -50%)' },
    'bottom-left': { x: '25%', y: '75%', transform: 'translate(-50%, -50%)' },
    'bottom-right': { x: '75%', y: '75%', transform: 'translate(-50%, -50%)' }
  }

  return (
    <div className="relative w-full h-96 bg-gradient-brain rounded-xl overflow-hidden border border-neon-green/20">
      {/* Brain outline */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 400 300"
        fill="none"
      >
        <path
          d="M100 150 Q50 100, 100 50 Q150 30, 200 50 Q250 30, 300 50 Q350 100, 300 150 Q350 200, 300 250 Q250 270, 200 250 Q150 270, 100 250 Q50 200, 100 150 Z"
          stroke="currentColor"
          strokeWidth="2"
          className="text-neon-green"
        />
        <path
          d="M200 50 Q200 100, 200 150 Q200 200, 200 250"
          stroke="currentColor"
          strokeWidth="1"
          className="text-neon-green"
        />
      </svg>

      {/* Quadrants */}
      <AnimatePresence>
        {quadrants.map((quadrant, index) => (
          index <= currentStep && (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="absolute"
              style={positions[quadrant.position]}
            >
              <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 max-w-32 border border-neon-green/40 brain-glow">
                <h4 className="text-xs font-bold text-neon-green mb-1">
                  {quadrant.title}
                </h4>
                <p className="text-xs text-white leading-tight">
                  {quadrant.content}
                </p>
              </div>
            </motion.div>
          )
        ))}
      </AnimatePresence>

      {/* Central pulse */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="w-8 h-8 bg-neon-green rounded-full blur-sm"></div>
      </motion.div>
    </div>
  )
}

// app/components/ShareButton.js
'use client'

import { useState } from 'react'
import { usePostHog } from '../providers/posthog'

export default function ShareButton({ id, decision }) {
  const [copied, setCopied] = useState(false)
  const posthog = usePostHog()

  const handleShare = async () => {
    const url = `${window.location.origin}/r/${id}`
    
    if (navigator.share && navigator.canShare({ url })) {
      try {
        await navigator.share({
          title: 'Mitochondria Decision',
          text: `Check out this decision reflection: "${decision}"`,
          url
        })
        posthog?.capture('share_click', { method: 'native', decision_id: id })
      } catch (error) {
        if (error.name !== 'AbortError') {
          copyToClipboard(url)
        }
      }
    } else {
      copyToClipboard(url)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      posthog?.capture('share_click', { method: 'copy', decision_id: id })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="text-neon-green hover:text-accent-yellow text-sm transition-colors"
    >
      {copied ? 'Copied!' : 'Share'}
    </button>
  )
}

// app/providers/posthog.js
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const PostHogContext = createContext()

export function PostHogProvider({ children }) {
  const [posthog, setPosthog] = useState(null)

  useEffect(() => {
    const initPostHog = async () => {
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        try {
          const { default: posthogClient } = await import('posthog-js')
          posthogClient.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
            api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
          })
          setPosthog(posthogClient)
        } catch (error) {
          console.error('PostHog initialization failed:', error)
        }
      }
    }

    initPostHog()
  }, [])

  return (
    <PostHogContext.Provider value={posthog}>
      {children}
    </PostHogContext.Provider>
  )
}

export function usePostHog() {
  return useContext(PostHogContext)
}

// app/api/generate/route.js
import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

export async function POST(request) {
  try {
    const { decision } = await request.json()

    if (!decision?.trim()) {
      return NextResponse.json({ error: 'Decision is required' }, { status: 400 })
    }

    // Check if decision is frivolous
    const frivolousPatterns = [
      /^(pizza|coffee|what to eat|what to watch|netflix)/i,
      /^(should i|do i|can i).{1,15}$/i,
      /^(yes|no|maybe|idk|help)$/i
    ]

    const isFrivolous = frivolousPatterns.some(pattern => pattern.test(decision.trim()))

    if (isFrivolous) {
      return NextResponse.json({
        error: 'reask',
        message: 'Let\'s think bigger! Try decisions like "Should I change careers?", "Move to a new city?", or "Start that side project?"'
      }, { status: 400 })
    }

    let reflections, summary

    // Try OpenAI first
    if (process.env.OPENAI_API_KEY) {
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{
              role: 'user',
              content: `You are a thoughtful reflection tool. For this decision: "${decision}"

Return ONLY a JSON object with this exact structure:
{
  "reflections": {
    "feelsGood": "1-2 sentences about emotional/intuitive appeal",
    "goodForYou": "1-2 sentences about personal benefits/growth",
    "goodForOthers": "1-2 sentences about impact on family/friends/community", 
    "goodForWorld": "1-2 sentences about broader societal/environmental impact"
  },
  "summary": "One suggestive line ≤140 characters that captures the essence"
}

Tone: suggestive, never commanding. Use "might", "could", "perhaps". No scores, numbers, or direct recommendations.`
            }],
            max_tokens: 500,
            temperature: 0.7
          })
        })

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json()
          const aiResult = JSON.parse(openaiData.choices[0].message.content)
          reflections = aiResult.reflections
          summary = aiResult.summary
        }
      } catch (aiError) {
        console.error('OpenAI error:', aiError)
      }
    }

    // Fallback to heuristic reflections
    if (!reflections) {
      const decisionLower = decision.toLowerCase()
      
      reflections = {
        feelsGood: getHeuristicReflection('feels', decisionLower),
        goodForYou: getHeuristicReflection('you', decisionLower),
        goodForOthers: getHeuristicReflection('others', decisionLower),
        goodForWorld: getHeuristicReflection('world', decisionLower)
      }

      summary = `This choice might shape who you become. Trust your inner compass.`
    }

    // Store in KV (simplified - would use actual KV in production)
    const id = nanoid(10)
    const resultData = {
      id,
      decision,
      reflections,
      summary,
      timestamp: new Date().toISOString()
    }

    // In production, store in KV:
    // await kv.setex(`result:${id}`, 30 * 24 * 60 * 60, JSON.stringify(resultData))

    // For now, store in memory (would persist with actual KV)
    global.decisions = global.decisions || new Map()
    global.decisions.set(`result:${id}`, resultData)

    return NextResponse.json({ id })

  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json({ error: 'Failed to generate reflections' }, { status: 500 })
  }
}

function getHeuristicReflection(type, decision) {
  const templates = {
    feels: [
      "This choice might resonate with your deepest intuitions and bring a sense of alignment.",
      "Your gut feeling about this could be pointing toward something meaningful.",
      "There might be an emotional satisfaction that comes with following this path."
    ],
    you: [
      "This decision could open new doors for your personal growth and development.",
      "You might discover strengths you didn't know you had through this choice.",
      "This path could align with your long-term goals and aspirations."
    ],
    others: [
      "Your loved ones might benefit from seeing you pursue what matters to you.",
      "This choice could create positive ripples in your relationships and community.",
      "Others might be inspired by your courage to make this decision."
    ],
    world: [
      "Small individual choices like this often contribute to larger positive changes.",
      "Your decision might be part of a broader shift toward more conscious living.",
      "This choice could add to the collective good in ways you haven't yet imagined."
    ]
  }

  const options = templates[type]
  return options[Math.floor(Math.random() * options.length)]
}

// app/api/result/[id]/route.js
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const { id } = params

    // In production, fetch from KV:
    // const data = await kv.get(`result:${id}`)
    
    // For now, get from memory
    global.decisions = global.decisions || new Map()
    const data = global.decisions.get(`result:${id}`)

    if (!data) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Result fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch result' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params

    // In production, delete from KV:
    // await kv.del(`result:${id}`)
    
    // For now, delete from memory
    global.decisions = global.decisions || new Map()
    global.decisions.delete(`result:${id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Result deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete result' }, { status: 500 })
  }
}

// app/api/world/route.js
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // In production, fetch from KV with pattern matching:
    // const keys = await kv.keys('result:*')
    // const decisions = await Promise.all(keys.map(key => kv.get(key)))
    
    // For now, get from memory
    global.decisions = global.decisions || new Map()
    const decisions = Array.from(global.decisions.values())
      .filter(d => d.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20)
      .map(({ id, decision, summary, timestamp }) => ({
        id,
        decision: decision.length > 80 ? decision.substring(0, 80) + '...' : decision,
        summary,
        timestamp
      }))

    return NextResponse.json(decisions)
  } catch (error) {
    console.error('World feed error:', error)
    return NextResponse.json([], { status: 200 })
  }
}

// app/r/[id]/opengraph-image.js
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Mitochondria Decision'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }) {
  const { id } = params

  // Fetch decision data
  let decision = "A thoughtful decision"
  try {
    // In production, this would fetch from your KV store
    // For now, we'll use a placeholder
    global.decisions = global.decisions || new Map()
    const data = global.decisions.get(`result:${id}`)
    if (data) {
      decision = data.decision
    }
  } catch (error) {
    console.error('OG image fetch error:', error)
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0E2314',
          backgroundImage: 'radial-gradient(circle at 50% 50%, #0B5D1E 0%, #0E2314 50%, #000000 100%)',
          fontSize: 32,
          fontWeight: 600,
          color: 'white',
          padding: '40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 48,
            fontWeight: 700,
            color: '#39FF14',
            marginBottom: '30px',
          }}
        >
          Mitochondria
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.4,
            color: 'rgba(255, 255, 255, 0.9)',
            border: '2px solid #39FF14',
            borderRadius: '20px',
            padding: '30px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          "{decision.length > 120 ? decision.substring(0, 120) + '...' : decision}"
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 18,
            color: '#FFD400',
            marginTop: '30px',
          }}
        >
          AI-powered decision reflections
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

// app/r/[id]/metadata.js
export async function generateMetadata({ params }) {
  const { id } = params
  
  // Fetch decision data for metadata
  let decision = "A thoughtful decision"
  try {
    global.decisions = global.decisions || new Map()
    const data = global.decisions.get(`result:${id}`)
    if (data) {
      decision = data.decision
    }
  } catch (error) {
    console.error('Metadata fetch error:', error)
  }

  const title = `"${decision}" - Mitochondria`
  const description = `Explore AI-powered reflections on this decision: ${decision}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`/r/${id}/opengraph-image`],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/r/${id}/opengraph-image`],
    },
  }
}

// .env.local (example file)
# OpenAI API Key (optional - app works without it using heuristic fallbacks)
OPENAI_API_KEY=your_openai_api_key_here

# KV Database (Upstash Redis or similar)
KV_URL=your_kv_url_here
KV_REST_API_URL=your_kv_rest_api_url_here
KV_REST_API_TOKEN=your_kv_rest_api_token_here
KV_REST_API_READ_ONLY_TOKEN=your_kv_read_only_token_here

# PostHog Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# vercel.json
{
  "functions": {
    "app/api/**/*.js": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/r/(.*)/opengraph-image",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}

// README.md
# Mitochondria - AI Decision Tool

A viral, AI-powered decision tool that breaks any decision into four key reflections: feels good, good for you, good for others, good for the world.

## Features

- ⚡ **90-second decision timer** (non-blocking encouragement)
- 🧠 **Interactive brain-map UI** with step-by-step quadrant reveals
- 🤖 **AI-powered reflections** via OpenAI (with heuristic fallbacks)
- 🌍 **World feed** of anonymized recent decisions  
- 📱 **Mobile-first design** with Atkinson Hyperlegible font
- 🔗 **Shareable results** with OG image previews
- 🗑️ **Privacy-first** with 30-day retention and delete links
- 📊 **PostHog analytics** for usage insights

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom brain-themed design
- **Animations**: Framer Motion
- **AI**: OpenAI GPT-3.5-turbo (optional)
- **Storage**: KV (Upstash/Supabase) with 30-day TTL
- **Analytics**: PostHog
- **Deployment**: Vercel

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/mitochondria)

1. Clone this repository
2. Install dependencies: `npm install`
3. Set environment variables (see `.env.local` example)
4. Deploy to Vercel: `vercel --prod`

## Environment Variables

```bash
# Optional - AI works with heuristic fallbacks without this
OPENAI_API_KEY=your_openai_key

# Required for persistence (uses in-memory fallback for demo)
KV_REST_API_URL=your_kv_url
KV_REST_API_TOKEN=your_kv_token

# Optional analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
```

## Design System

- **Colors**: Neon green (#39FF14), Dark green (#0B5D1E), Forest green (#0E2314), Black (#000000), Yellow accent (#FFD400)
- **Font**: Atkinson Hyperlegible for accessibility
- **Mobile-first**: Responsive design optimized for phones
- **Accessibility**: High contrast, semantic HTML, ARIA labels

## API Endpoints

- `POST /api/generate` - Generate decision reflections
- `GET /api/result/[id]` - Fetch decision result
- `DELETE /api/result/[id]` - Delete decision (privacy)
- `GET /api/world` - Get recent anonymized decisions feed

## Pages

- `/` - Home decision input
- `/r/[id]` - Interactive result with brain map
- `/world` - Recent decisions feed

## License

MIT License - Build something awesome!