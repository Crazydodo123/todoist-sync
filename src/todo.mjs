import { TodoistApi } from "@doist/todoist-api-typescript"
import { configDotenv } from "dotenv"

configDotenv({ path: '../.env'})

const api = new TodoistApi(process.env.API_KEY)

const getProjects = async () => {
    return await api.getProjects()
}

const addProject = async (name) => {
    return await api.addProject({ name })
}

const deleteProject = async (project) => {
    const response = api.deleteProject(project.id)
    return response.data
}

const getAllTasks = async () => {
    const projects = await getProjects()
    let taskList = {}

    for (const project of projects) {
        taskList[project.name] = []

        const tasks = getTasksFromProjectId(project.id)
        tasks.forEach(task => {
            taskList[project.name].push(task.content)
        })
    }

    return taskList
}

const findTaskByTaskName = async (taskName, projectId, projects) => {
    const project = projects.find(project => project.id === projectId)
    if (!project) return undefined
    
    const task = project.tasks.find(task => task.content === taskName)

    return task
}

const getTasksFromProjectId = async (projectId) => {
    const tasks = await api.getTasks()
    return tasks.filter(task => task.projectId == projectId)
}

const getTasksFromProjectName = async (projectName) => {
    const todoProjects = await getProjects()
    const todoProject = todoProjects.filter(todoProject => todoProject.name === projectName)[0]
    return await getTasksFromProjectId(todoProject.id)
}

const checkCompleted = async (task) => {
    try {
        await api.reopenTask(task.id); await api.closeTask(task.id)
        return true
    } catch {
        return false
    }
}

const addTaskToProject = async (task, projectId) => {
    const response = api.addTask({ ...task, projectId })
    return response.data
}

const completeTask = async (task) => {
    const response = api.closeTask(task.id)
    return response.data
}

const updateTask = async (updatedTask) => {
    const response = api.updateTask(updatedTask.id, updatedTask)
    return response.data
}

const deleteTask = async (task) => {
    const response = api.deleteTask(task.id)
    return response.data
}


export default { getProjects, addProject, deleteProject, getTasksFromProjectId, getTasksFromProjectName, getAllTasks, completeTask, checkCompleted, updateTask, deleteTask, addTaskToProject, findTaskByTaskName }