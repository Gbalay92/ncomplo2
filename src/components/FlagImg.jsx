import { useState } from 'react'

export function FlagImg({ src, alt = '', width, height, className }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <img
        src="/pirate-flag.png"
        alt="unknown flag"
        width={width}
        height={height}
        className={className}
      />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
