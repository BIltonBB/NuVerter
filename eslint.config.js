import globals from 'globals';

export default [
  {
    ignores: ['node_modules/**', 'tauri/**', 'web/vendor/**', 'web/ffmpeg*/**']
  },
  {
    files: ['web/assets/js/app.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.worker,
        // Vendor globals loaded by index.html before app.js.
        FFmpeg: 'readonly',
        FFmpegUtil: 'readonly',
        ffmpeg: 'readonly',
        pdfjsLib: 'readonly',
        Tesseract: 'readonly',
        Chart: 'readonly',
        Sortable: 'readonly',
        mammoth: 'readonly',
        XLSX: 'readonly',
        JSZip: 'readonly',
        ePub: 'readonly',
        jsmediatags: 'readonly',
        fflate: 'readonly',
        qrcode: 'readonly',
    },
  },
    rules: {
      'no-undef': 'error',
      'no-redeclare': 'error',
      'no-unreachable': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-duplicate-case': 'error',
      'no-cond-assign': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-fallthrough': 'error',
      'no-self-assign': 'error',
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }]
    }
  },
  {
    files: ['web/server.cjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node }
    },
    rules: {
      'no-undef': 'error',
      'no-redeclare': 'error',
      'no-unreachable': 'error',
      'no-unused-vars': ['warn', { args: 'none' }]
    }
  },
  {
    files: ['test/**/*.mjs', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node }
    },
    rules: {
      'no-undef': 'error',
      'no-unreachable': 'error'
    }
  }
];
