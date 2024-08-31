import todo from "./todo.mjs"
import google from "./google.mjs"
import { configDotenv } from "dotenv"

configDotenv({ path: '../.env'})

let PAST_TODO_PROJECTS = await todo.getProjects()
let PAST_GOOGLE_PROJECTS = await google.getProjects()


const isCreated = (project, pastProjects) => {
    const pastProjectIds = pastProjects.map(pastProject => pastProject.id)
    return !(pastProjectIds.includes(project.id))
}

const syncProjects = async () => {
    const todoProjects = await todo.getProjects()
    const todoProjectNames = todoProjects.map(todoProject => todoProject.name)
    
    const googleProjects = await google.getProjects()
    const googleProjectNames = googleProjects.map(googleProject => googleProject.title)
    
    // Updating Google Projects
    for (const todoProject of todoProjects) {
        if (!googleProjectNames.includes(todoProject.name)) {

            if (isCreated(todoProject, PAST_TODO_PROJECTS)) {
                await google.addProject(todoProject.name)
            } else {
                await todo.deleteProject(todoProject)
            }

        }
    }
    
    // Updating Todoist Projects
    for (const googleProject of googleProjects) {
        if (!todoProjectNames.includes(googleProject.title)) {
            await todo.addProject(googleProject.title)
        }
    }

    process.env.TODO_PROJECTS = await todo.getProjects()
    process.env.GOOGLE_PROJECTS = await google.getProjects()

    return await todo.getProjects()
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
            await google.addTaskToProject({
                title: todoTask.content,
                notes: todoTask.description,
                status: todoTask.isCompleted ? "completed" : "needsAction",
                due: todoTask.due ? new Date(todoTask.due.date).toISOString() : null
            }, googleProject.id)
        }
    }

    for (const googleTask of googleTasks) {
        if (!todoTasksNames.includes(googleTask.title)) {
            await todo.addTaskToProject({
                content: googleTask.title,
                description: googleTask.notes,
                isCompleted: googleTask.status === "completed",
                due_date: String(googleTask.due).slice(0, 10)
            }, todoProject.id)
        }
    }
}

const syncAllTasks = async () => {
    const projects = await syncProjects()
    const projectNames = projects.map(project => project.name)

    for (const projectName of projectNames) {
        await syncTasksForProject(projectName)
    }
}

await syncProjects()
