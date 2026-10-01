// eslint.config.js
import antfu from '@antfu/eslint-config'

export default antfu({
  astro: true,
  react: true,
  ignores: [
    'dist/',
    'config/',
    'coverage/',
    'styles/',
    // Sample editions: generated data, not source.
    'static/',
  ],
  rules: {
    'react/prefer-destructuring-assignment': ['off'],
  },
})
