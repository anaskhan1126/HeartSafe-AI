import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Mic, MicOff } from 'lucide-react'
import { useVoiceInput } from '../../hooks/useVoiceInput'

const VoiceInput = ({ onFieldsUpdate }) => {
  const { t } = useTranslation()
  const handleUpdate = useCallback((updates) => {
    onFieldsUpdate(prev => ({ ...prev, ...updates }))
  }, [onFieldsUpdate])

  const { isListening, transcript, supported, startListening, stopListening } = useVoiceInput(handleUpdate)

  if (!supported) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 italic">{t('voice.notSupported')}</p>
    )
  }

  return (
    <div className="space-y-3 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200 dark:border-violet-800">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : 'bg-violet-600 hover:bg-violet-700 text-white'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {isListening ? t('voice.stopListening') : t('voice.startListening')}
        </button>
      </div>
      {transcript && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('voice.transcript')}</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 rounded-lg p-2">
            {transcript}
          </p>
        </div>
      )}
    </div>
  )
}

export default VoiceInput
