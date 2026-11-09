import React from 'react'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export function Textarea({ className = '', ...props }: TextareaProps) {
  return <textarea {...props} className={`ds-textarea ${className}`} />
}
