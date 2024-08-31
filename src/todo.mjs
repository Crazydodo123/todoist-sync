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

const getTasksFromProjectId = async (projectId) => {
    const tasks = await api.getTasks()
    return tasks.filter(task => task.projectId == projectId)
}

const getTasksFromProjectName = async (projectName) => {
    const todoProjects = await getProjects()
    const todoProject = todoProjects.filter(todoProject => todoProject.name === projectName)[0]
    return await getTasksFromProjectId(todoProject.id)
}

const addTaskToProject = async (task, projectId) => {
    const response = api.addTask({ ...task, projectId })
    return response.data
}

const completeTask = async (task) => {
    const response = api.closeTask(task.id)
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


export default { getProjects, addProject, deleteProject, getTasksFromProjectId, getTasksFromProjectName, getAllTasks, completeTask, addTaskToProject }