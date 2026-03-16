import { fileURLToPath } from 'url'
import { build } from 'vite'
import strip from '@rollup/plugin-strip'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const buildList = [
  {
    name: 'MindElixir',
    entry: __dirname + './src/index.ts',
    // 输出单独的 ESM 文件
    esFileName: 'MindElixir.esm',
  },
  {
    name: 'MindElixirLite',
    entry: __dirname + './src/index.ts',
    mode: 'lite',
    esFileName: 'MindElixirLite.esm',
  },
  {
    name: 'example',
    entry: __dirname + './src/exampleData/1.ts',
    esFileName: 'example.esm',
  },
  {
    name: 'LayoutSsr',
    entry: __dirname + './src/utils/layout-ssr.ts',
    esFileName: 'LayoutSsr.esm',
  },
]
for (let i = 0; i < buildList.length; i++) {
  const info = buildList[i]
  console.log(`\n\nBuilding ${info.name}...\n\n`)

  // 首先构建 ESM 格式
  await build({
    build: {
      emptyOutDir: i === 0,
      lib: {
        entry: info.entry,
        fileName: info.esFileName,
        name: info.name,
        formats: ['es'],
      },
      rollupOptions: {
        plugins: [
          strip({
            include: ['**/*.ts', '**/*.js'],
          }),
        ],
        output: {
          // 确保 ESM 输出到单独文件
          entryFileNames: info.esFileName + '.js',
        },
      },
    },
    mode: info.mode,
  })

  // 然后构建 UMD 格式
  await build({
    build: {
      emptyOutDir: false,
      lib: {
        entry: info.entry,
        fileName: info.name,
        name: info.name,
        formats: ['iife'],
      },
      rollupOptions: {
        plugins: [
          strip({
            include: ['**/*.ts', '**/*.js'],
          }),
        ],
      },
    },
    mode: info.mode,
  })
}
