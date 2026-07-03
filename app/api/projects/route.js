export const maxDuration = 60

import { listProjects, getProject, saveProject, deleteProject } from '../../../lib/supabase'

// Project library:
//   GET            -> { projects: [{id, name, created_at}] }  (light list)
//   GET ?id=...    -> { project: full row incl. data }        (load one)
//   POST           -> { name, data } saves a build            (returns row meta)
//   DELETE         -> { id }

export async function GET(request) {
  try {
    const id = new URL(request.url).searchParams.get('id')
    if (id) {
      const project = await getProject(id)
      return Response.json({ project })
    }
    const projects = await listProjects()
    return Response.json({ projects })
  } catch (err) {
    console.error('projects GET error:', err)
    return Response.json({ error: `Could not load: ${err.message}. If this mentions a missing table, run the projects SQL from lib/supabase.js in the Supabase SQL editor.` }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { name, data } = await request.json()
    if (!name?.trim() || !data) {
      return Response.json({ error: 'A project needs a name and build data.' }, { status: 400 })
    }
    const row = await saveProject(name.trim(), data)
    return Response.json({ project: row })
  } catch (err) {
    console.error('projects POST error:', err)
    return Response.json({ error: `Could not save: ${err.message}. If this mentions a missing table, run the projects SQL from lib/supabase.js in the Supabase SQL editor.` }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json()
    if (!id) return Response.json({ error: 'Missing project id.' }, { status: 400 })
    await deleteProject(id)
    return Response.json({ success: true })
  } catch (err) {
    console.error('projects DELETE error:', err)
    return Response.json({ error: `Could not delete: ${err.message}` }, { status: 500 })
  }
}
