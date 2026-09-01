import { useState, useRef, useCallback, useEffect } from 'react'

const FIELD_PATTERNS = [
  { field: 'Age', patterns: [/age\s*(\d+)/i, /(\d+)\s*years?\s*old/i] },
  { field: 'Cholesterol', patterns: [/cholesterol\s*(\d+)/i, /(\d+)\s*cholesterol/i] },
  { field: 'RestingBP', patterns: [/blood\s*pressure\s*(\d+)/i, /bp\s*(\d+)/i, /resting\s*bp\s*(\d+)/i] },
  { field: 'MaxHR', patterns: [/max\s*heart\s*rate\s*(\d+)/i, /heart\s*rate\s*(\d+)/i, /max\s*hr\s*(\d+)/i] },
  { field: 'Oldpeak', patterns: [/old\s*peak\s*([\d.]+)/i, /oldpeak\s*([\d.]+)/i] },
  { field: 'Sex', patterns: [/\b(male|man|m)\b/i], value: 'M' },
  { field: 'Sex', patterns: [/\b(female|woman|f)\b/i], value: 'F' },
  { field: 'FastingBS', patterns: [/\b(yes|high)\b.*(?:sugar|fasting|glucose)/i, /fasting.*\byes\b/i], value: 'Yes' },
  { field: 'FastingBS', patterns: [/\bno\b.*(?:sugar|fasting|glucose)/i, /fasting.*\bno\b/i], value: 'No' },
  { field: 'ExerciseAngina', patterns: [/exercise\s*angina\s*yes/i, /angina\s*yes/i], value: 'Yes' },
  { field: 'ExerciseAngina', patterns: [/exercise\s*angina\s*no/i, /angina\s*no/i], value: 'No' },
]

export const parseVoiceTranscript = (transcript) => {
  const updates = {}
  const text = transcript.toLowerCase()

  for (const { field, patterns, value } of FIELD_PATTERNS) {
    if (value) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          updates[field] = value
          break
        }
      }
    } else {
      for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match) {
          updates[field] = match[1]
          break
        }
      }
    }
  }

  return updates
}

export const useVoiceInput = (onFieldsUpdate) => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setSupported(!!SpeechRecognition)

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        let full = ''
        for (let i = 0; i < event.results.length; i++) {
          full += event.results[i][0].transcript + ' '
        }
        setTranscript(full.trim())
        const updates = parseVoiceTranscript(full)
        if (Object.keys(updates).length > 0 && onFieldsUpdate) {
          onFieldsUpdate(updates)
        }
      }

      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)
      recognitionRef.current = recognition
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [onFieldsUpdate])

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('')
      recognitionRef.current.start()
      setIsListening(true)
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [isListening])

  return { isListening, transcript, supported, startListening, stopListening }
}
