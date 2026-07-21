#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDir, '..')
const entryPath = join(projectRoot, 'src', 'story', 'ink', 'main.ink')
const generatedDir = join(projectRoot, 'src', 'story', 'generated')
const storyOutputPath = join(generatedDir, 'story.json')
const buildOutputPath = join(generatedDir, 'story-build.json')
const compilerPath = join(projectRoot, 'node_modules', 'inkjs', 'bin', 'inkjs-compiler.js')

function fail(message) {
  throw new Error(`[story:build] ${message}`)
}

function normalizedJson(path) {
  const source = readFileSync(path, 'utf8').replace(/^\uFEFF/, '')
  return `${JSON.stringify(JSON.parse(source))}\n`
}

function writeIfChanged(path, content) {
  if (existsSync(path) && readFileSync(path, 'utf8') === content) {
    return false
  }

  writeFileSync(path, content, 'utf8')
  return true
}

export function compileStory({ checkOnly = false } = {}) {
  if (!existsSync(entryPath)) fail(`Missing Ink entrypoint: ${entryPath}`)
  if (!existsSync(compilerPath)) fail('inkjs compiler is unavailable. Install dependencies first.')

  const temporaryOutput = join(tmpdir(), `narrative-story-${process.pid}-${Date.now()}.json`)
  const result = spawnSync(process.execPath, [compilerPath, entryPath, '-o', temporaryOutput], {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: 'pipe',
  })

  if (result.status !== 0) {
    rmSync(temporaryOutput, { force: true })
    fail((result.stderr || result.stdout || 'Ink compilation failed.').trim())
  }

  const storyContent = normalizedJson(temporaryOutput)
  rmSync(temporaryOutput, { force: true })

  const storyHash = createHash('sha256').update(storyContent).digest('hex')
  const buildContent = `${JSON.stringify({ schemaVersion: 1, storyHash }, null, 2)}\n`

  if (checkOnly) {
    const storyCurrent = existsSync(storyOutputPath)
      ? readFileSync(storyOutputPath, 'utf8') === storyContent
      : false
    const buildCurrent = existsSync(buildOutputPath)
      ? readFileSync(buildOutputPath, 'utf8') === buildContent
      : false

    if (!storyCurrent || !buildCurrent) {
      fail('Generated story files are stale. Run `bun run story:build`.')
    }

    console.log(`[story:check] OK ${storyHash.slice(0, 12)}`)
    return { storyHash, changed: false }
  }

  mkdirSync(generatedDir, { recursive: true })
  const storyChanged = writeIfChanged(storyOutputPath, storyContent)
  const buildChanged = writeIfChanged(buildOutputPath, buildContent)
  const changed = storyChanged || buildChanged
  console.log(`[story:build] ${changed ? 'updated' : 'current'} ${storyHash.slice(0, 12)}`)
  return { storyHash, changed: Boolean(changed) }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    compileStory({ checkOnly: process.argv.includes('--check') })
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
