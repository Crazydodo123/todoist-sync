import todo from "./todo.mjs"
import google from "./google.mjs"

import { configDotenv } from "dotenv"
import fs from 'fs'
import readline from "readline"

configDotenv({ path: '../.env'})
readline.emitKeypressEvents(process.stdin);

let PAST_TODO_PROJECTS = JSON.parse(fs.readFileSync('todo.json', 'utf8'))
let PAST_GOOGLE_PROJECTS = JSON.parse(fs.readFileSync('google.json', 'utf8'))

const saveLocalProjects = async () => {
    let todoProjects = await todo.getProjects()
    let googleProjects = await google.getProjects()

    for (const todoProject of todoProjects) {
        const todoTasks = await todo.getTasksFromProjectId(todoProject.id)
        todoProject.tasks = todoTasks
    }
    
    for (const googleProject of googleProjects) {
        const googleTasks = await google.getTasksFromProjectId(googleProject.id)
        googleProject.tasks = googleTasks
    }
    
    PAST_TODO_PROJECTS = todoProjects
    PAST_GOOGLE_PROJECTS = googleProjects

    return todoProjects, googleProjects
}

const isCreatedProject = (project, pastProjects) => {
    const pastProjectIds = pastProjects.map(pastProject => pastProject.id)
    return !(pastProjectIds.includes(project.id))
}

const isCreatedTask = (task, pastProjects, projectId) => {
    const pastProject = pastProjects.find(pastProject => pastProject.id === projectId)
    if (!pastProject) return true

    const pastTaskIds = pastProject.tasks.map(pastTask => pastTask.id)
    return !(pastTaskIds.includes(task.id))    
}

const syncProjects = async () => {
    const todoProjects = await todo.getProjects()
    const todoProjectNames = todoProjects.map(todoProject => todoProject.name)
    
    const googleProjects = await google.getProjects()
    const googleProjectNames = googleProjects.map(googleProject => googleProject.title)
    
    // Updating Google Projects
    for (const todoProject of todoProjects) {
        if (!googleProjectNames.includes(todoProject.name)) {

            if (isCreatedProject(todoProject, PAST_TODO_PROJECTS)) {
                await google.addProject(todoProject.name)
            } else {
                await todo.deleteProject(todoProject)
            }

        }
    }
    
    // Updating Todoist Projects
    for (const googleProject of googleProjects) {
        if (!todoProjectNames.includes(googleProject.title)) {
            if (isCreatedProject(googleProject, PAST_GOOGLE_PROJECTS)) {
                await todo.addProject(googleProject.title)
            } else {
                await google.deleteProject(googleProject)
            }
        }
    }

    return await todo.getProjects()
}

const syncTasks = async (todoTask, googleTask, googleProject) => {
    if ((googleTask.notes || "") !== todoTask.description) {
        const pastGoogleTask = await google.findTaskByTaskName(googleTask.title, googleProject.id, PAST_GOOGLE_PROJECTS)
        if (googleTask.notes === pastGoogleTask.notes) {
            const updatedGoogleTask = { ...googleTask, notes: todoTask.description }
            await google.updateTask(updatedGoogleTask, googleProject) 
        } else {
            const updatedTodoTask = { ...todoTask, description: todoTask.notes }
            await todo.updateTask(updatedTodoTask) 
        }
    }

    if (googleTask.due !== (todoTask.due ? new Date(todoTask.due.date).toISOString() : null)) {
        const pastGoogleTask = await google.findTaskByTaskName(googleTask.title, googleProject.id, PAST_GOOGLE_PROJECTS)
        if (googleTask.due === pastGoogleTask.due) {
            const updatedGoogleTask = { ...googleTask, due: todoTask.due ? new Date(todoTask.due.date).toISOString() : null }
            await google.updateTask(updatedGoogleTask, googleProject) 
        } else {
            const updatedTodoTask = { ...todoTask, due: googleTask.due ? String(googleTask.due).slice(0, 10) : null }
            await todo.updateTask(updatedTodoTask)
        }
    }
}


const syncTasksForProject = async (name) => {
    const todoProjects = await todo.getProjects()
    const todoProject = todoProjects.filter(todoProject => todoProject.name === name)[0]
    const todoTasks = await todo.getTasksFromProjectId(todoProject.id)
    const todoTasksNames = todoTasks.map(todoTask => todoTask.content)

    const googleProjects = await google.getProjects()
    const googleProject = googleProjects.filter(googleProject => googleProject.title === name)[0]
    const googleTasks = await google.getTasksFromProjectId(googleProject.id)
    const googleTasksNames = googleTasks.map(googleTask => googleTask.title)

    for (const todoTask of todoTasks) {
        if (!googleTasksNames.includes(todoTask.content)) {
            if (isCreatedTask(todoTask, PAST_TODO_PROJECTS, todoProject.id)) {
                await google.addTaskToProject({
                    title: todoTask.content,
                    notes: todoTask.description,
                    status: todoTask.isCompleted ? "completed" : "needsAction",
                    due: todoTask.due ? new Date(todoTask.due.date).toISOString() : null
                }, googleProject.id)
            } else {
                const pastGoogleTask = await google.findTaskByTaskName(todoTask.content, googleProject.id, PAST_GOOGLE_PROJECTS)
                
                if (pastGoogleTask && await google.checkCompleted(pastGoogleTask, googleProject)) {
                    await todo.completeTask(todoTask)
                } else {
                    await todo.deleteTask(todoTask)
                }
            }
        } else {
            const googleTask = googleTasks.find(task => task.title === todoTask.content)
            if (googleTask.notes !== todoTask.description || googleTask.due !== new Date(todoTask.due.date).toISOString()) {
                await syncTasks(todoTask, googleTask, googleProject)
            }
        }
    }

    for (const googleTask of googleTasks) {
        if (!todoTasksNames.includes(googleTask.title)) {
            if (isCreatedTask(googleTask, PAST_GOOGLE_PROJECTS, googleProject.id)) {
                await todo.addTaskToProject({
                    content: googleTask.title,
                    description: googleTask.notes,
                    isCompleted: googleTask.status === "completed",
                    due_date: googleTask.due ? String(googleTask.due).slice(0, 10) : null
                }, todoProject.id)
            } else {
                const pastTodoTask = await todo.findTaskByTaskName(googleTask.title, todoProject.id, PAST_TODO_PROJECTS)
                if (pastTodoTask && await todo.checkCompleted(pastTodoTask, todoProject)) {
                    await google.completeTask(googleTask, googleProject)
                } else {
                    await google.deleteTask(googleTask, googleProject)
                }
            }

        }
    }

    PAST_TODO_PROJECTS.find(project => project.id === todoProject.id).tasks = await todo.getTasksFromProjectId(todoProject.id)
    PAST_GOOGLE_PROJECTS.find(project => project.id === googleProject.id).tasks = await google.getTasksFromProjectId(googleProject.id)
}

const syncAllTasks = async () => {
    const projects = await syncProjects()
    const projectNames = projects.map(project => project.name)

    for (const projectName of projectNames) {
        await syncTasksForProject(projectName)
    }
}


console.log(`${new Date().toISOString()} Syncing Projects`)
await syncProjects()
console.log(`${new Date().toISOString()} Syncing Tasks`)
await syncAllTasks()
console.log(`${new Date().toISOString()} Saving Projects`)
await saveLocalProjects()

fs.writeFileSync('todo.json', JSON.stringify(PAST_TODO_PROJECTS, null, 2))
fs.writeFileSync('google.json', JSON.stringify(PAST_GOOGLE_PROJECTS, null, 2))